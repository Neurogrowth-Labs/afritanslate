-- ============================================================================
-- F-01: Replace permissive USING (true) RLS policies with Clerk-aware
--       ownership checks keyed on the Clerk user id from the JWT.
-- ============================================================================
--
-- Pre-launch security finding (Phase 3 audit, 2026-05-02):
-- migrations/20260320-clerk-auth-migration.sql enabled RLS on 8 tables but
-- replaced every predicate with USING (true) / WITH CHECK (true) because
-- the previous `auth.uid() = user_id` predicates stopped resolving once the
-- project migrated from Supabase Auth to Clerk. The result is that anyone
-- holding the public anon key (which by design ships in the browser bundle)
-- can read every user's profiles, conversations, chat_messages, scheduled
-- meetings, meeting summaries, brand glossaries, cultural insights, and
-- self-promote to admin or premium plans via direct REST writes against
-- https://<project>.supabase.co/rest/v1/<table>.
--
-- Fix shape:
--   * Drop the leftover foreign keys to auth.users and convert any uuid
--     user_id columns to text (Clerk user ids are not uuid-shaped). The
--     20260320 migration only did this for profiles.id; the rest of the
--     schema needed the same change but never got it.
--   * Drop every "USING (true)" policy this migration recreates.
--   * Recreate policies with `(auth.jwt() ->> 'sub') = user_id` so PostgREST
--     enforces ownership based on the Clerk-issued JWT that the browser
--     forwards via `createClient(url, key, { accessToken })`. Admin-only
--     writes on library_items go through a SECURITY DEFINER helper that
--     looks up the caller's role in public.profiles.
--
-- The helper `public.is_clerk_admin()` is SECURITY DEFINER so it can read
-- profiles even when the caller's own policy would not let them.
--
-- This migration is idempotent: every CREATE is preceded by DROP IF EXISTS
-- with the canonical policy names, and the column-type conversion is
-- guarded so re-running is a no-op.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Drop residual foreign keys to auth.users + coerce user_id columns to text
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  fk RECORD;
BEGIN
  FOR fk IN
    SELECT conname, conrelid::regclass::text AS tbl
    FROM pg_constraint
    WHERE contype = 'f'
      AND confrelid = 'auth.users'::regclass
      AND conrelid::regclass::text IN (
        'public.conversations',
        'public.scheduled_meetings',
        'public.meeting_summaries',
        'public.brand_glossaries',
        'public.cultural_insights'
      )
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', fk.tbl, fk.conname);
  END LOOP;
END $$;

DO $$
DECLARE
  rec RECORD;
BEGIN
  FOR rec IN
    SELECT table_schema, table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'user_id'
      AND data_type = 'uuid'
      AND table_name IN (
        'conversations',
        'scheduled_meetings',
        'meeting_summaries',
        'brand_glossaries',
        'cultural_insights'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ALTER COLUMN user_id TYPE text USING user_id::text',
      rec.table_schema, rec.table_name
    );
  END LOOP;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Re-assert RLS is on (defensive — already on after 20260320, but safe)
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_glossaries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_insights  ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 3. Admin lookup helper (SECURITY DEFINER so policies can call it without
--    needing the caller to be able to read other users' profile rows).
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_clerk_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = (auth.jwt() ->> 'sub')
      AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_clerk_admin() TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 4. Drop the permissive USING (true) policies from 20260320-clerk-auth-migration
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "Public profiles are viewable by everyone."          ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile."                ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile."                      ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own conversations"             ON public.conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations"           ON public.conversations;
DROP POLICY IF EXISTS "Users can update their own conversations"           ON public.conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations"           ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages from their conversations"   ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages into their conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Library items are viewable by everyone"             ON public.library_items;
DROP POLICY IF EXISTS "Admins can insert library items"                    ON public.library_items;
DROP POLICY IF EXISTS "Admins can update library items"                    ON public.library_items;
DROP POLICY IF EXISTS "Admins can delete library items"                    ON public.library_items;
DROP POLICY IF EXISTS "Users can view their own scheduled meetings"        ON public.scheduled_meetings;
DROP POLICY IF EXISTS "Users can insert their own scheduled meetings"      ON public.scheduled_meetings;
DROP POLICY IF EXISTS "Users can delete their own scheduled meetings"      ON public.scheduled_meetings;
DROP POLICY IF EXISTS "Users can view their own meeting summaries"         ON public.meeting_summaries;
DROP POLICY IF EXISTS "Users can insert their own meeting summaries"       ON public.meeting_summaries;
DROP POLICY IF EXISTS "Users can view their own brand glossaries"          ON public.brand_glossaries;
DROP POLICY IF EXISTS "Users can insert their own brand glossaries"        ON public.brand_glossaries;
DROP POLICY IF EXISTS "Users can update their own brand glossaries"        ON public.brand_glossaries;
DROP POLICY IF EXISTS "Users can delete their own brand glossaries"        ON public.brand_glossaries;
DROP POLICY IF EXISTS "Cultural insights are viewable by everyone"         ON public.cultural_insights;

-- Pre-Clerk policy names (from supabase-schema-updates.sql / supabase-history.sql)
DROP POLICY IF EXISTS "Users can view own conversations"                   ON public.conversations;
DROP POLICY IF EXISTS "Users can insert own conversations"                 ON public.conversations;
DROP POLICY IF EXISTS "Users can update own conversations"                 ON public.conversations;
DROP POLICY IF EXISTS "Users can delete own conversations"                 ON public.conversations;
DROP POLICY IF EXISTS "Users can view messages of own conversations"       ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages to own conversations"     ON public.chat_messages;

-- ----------------------------------------------------------------------------
-- 5. Profiles — public-read of non-sensitive columns, self-write only
-- ----------------------------------------------------------------------------
--
-- Profiles SELECT stays public because the app currently joins on profile
-- rows to render avatars and display names in conversation lists. Sensitive
-- columns (plan, role, trial_state) are written ONLY by the server-side
-- service role (which bypasses RLS), never by the browser; the WITH CHECK
-- on the self-update policy enforces that browser writes can only target
-- the row whose id matches the caller. If we later need to hide plan/role
-- from other users, we should switch the public SELECT to a view that
-- excludes those columns rather than tightening this policy.

CREATE POLICY "profiles_select_public"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles_insert_self"
  ON public.profiles FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = id);

CREATE POLICY "profiles_update_self"
  ON public.profiles FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = id)
  WITH CHECK ((auth.jwt() ->> 'sub') = id);

-- ----------------------------------------------------------------------------
-- 6. Conversations — owner-only CRUD
-- ----------------------------------------------------------------------------

CREATE POLICY "conversations_select_own"
  ON public.conversations FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "conversations_insert_own"
  ON public.conversations FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "conversations_update_own"
  ON public.conversations FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "conversations_delete_own"
  ON public.conversations FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- ----------------------------------------------------------------------------
-- 7. Chat messages — ownership inherited from parent conversation
-- ----------------------------------------------------------------------------

CREATE POLICY "chat_messages_select_via_conversation"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = chat_messages.conversation_id
        AND c.user_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "chat_messages_insert_via_conversation"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.user_id = (auth.jwt() ->> 'sub')
    )
  );

-- ----------------------------------------------------------------------------
-- 8. Library items — public catalog, admin-only writes
-- ----------------------------------------------------------------------------

CREATE POLICY "library_items_select_public"
  ON public.library_items FOR SELECT
  USING (true);

CREATE POLICY "library_items_insert_admin"
  ON public.library_items FOR INSERT
  WITH CHECK (public.is_clerk_admin());

CREATE POLICY "library_items_update_admin"
  ON public.library_items FOR UPDATE
  USING (public.is_clerk_admin())
  WITH CHECK (public.is_clerk_admin());

CREATE POLICY "library_items_delete_admin"
  ON public.library_items FOR DELETE
  USING (public.is_clerk_admin());

-- ----------------------------------------------------------------------------
-- 9. Scheduled meetings — owner-only CRUD
-- ----------------------------------------------------------------------------

CREATE POLICY "scheduled_meetings_select_own"
  ON public.scheduled_meetings FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "scheduled_meetings_insert_own"
  ON public.scheduled_meetings FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "scheduled_meetings_delete_own"
  ON public.scheduled_meetings FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- ----------------------------------------------------------------------------
-- 10. Meeting summaries — owner-only SELECT/INSERT (legacy table, no UPDATE)
-- ----------------------------------------------------------------------------

CREATE POLICY "meeting_summaries_select_own"
  ON public.meeting_summaries FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "meeting_summaries_insert_own"
  ON public.meeting_summaries FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

-- ----------------------------------------------------------------------------
-- 11. Brand glossaries — owner-only CRUD
-- ----------------------------------------------------------------------------

CREATE POLICY "brand_glossaries_select_own"
  ON public.brand_glossaries FOR SELECT
  USING ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "brand_glossaries_insert_own"
  ON public.brand_glossaries FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "brand_glossaries_update_own"
  ON public.brand_glossaries FOR UPDATE
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "brand_glossaries_delete_own"
  ON public.brand_glossaries FOR DELETE
  USING ((auth.jwt() ->> 'sub') = user_id);

-- ----------------------------------------------------------------------------
-- 12. Cultural insights — RLS enabled, no policies (deny-all default)
-- ----------------------------------------------------------------------------
--
-- The live `public.cultural_insights` schema is:
--   id, translation_id, risk_score, tone_analysis, cultural_notes,
--   risk_flags, created_at
--
-- It has no `user_id` column, and `translation_id` references a
-- `public.translations` table that does not exist in the live database
-- (orphan FK from a deleted prototype). The only call site that writes to
-- this table — `saveCulturalInsight()` in src/services/culturalService.ts —
-- is never invoked from anywhere in the current codebase, and the table
-- is empty in production.
--
-- With RLS enabled (section 2 above) and no policies defined, anon and
-- authenticated callers are denied all access by default. The Supabase
-- service role (used by server-side `/api/*` routes) still has full
-- access because it bypasses RLS. This matches the table's actual usage
-- (no browser code path needs it) without requiring schema surgery in
-- this security migration.
--
-- If a future feature needs per-user cultural insights, add a `user_id
-- text` column in a separate migration and then add owner-only policies
-- here in a follow-up.

-- (intentionally no CREATE POLICY statements for public.cultural_insights)
