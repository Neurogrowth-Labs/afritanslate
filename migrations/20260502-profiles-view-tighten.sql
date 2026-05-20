-- ============================================================================
-- F-04 (Phase 4, Option B): tighten public read on public.profiles, expose
-- safe display fields via a view, and move legacy profile bootstrap into
-- a SECURITY DEFINER RPC so the browser no longer needs cross-row read
-- access to find pre-Clerk profiles by email.
-- ============================================================================
--
-- Context:
-- migrations/20260502-clerk-jwt-rls.sql left `profiles_select_public` as
-- `USING (true)` because the existing browser bootstrap flow at
-- src/App.tsx:756-844 needs to look up an existing pre-Clerk profile by
-- email when a user first signs in via Clerk, in order to migrate the
-- profile's primary key from the legacy Supabase Auth UUID to the new
-- Clerk `user_*` id. That lookup required cross-row read access, so the
-- previous migration kept SELECT public.
--
-- That left every profile row's email/plan/role/trial_start_date readable
-- by anyone holding the anon key — a privacy leak.
--
-- Fix shape:
--   1. `public.bootstrap_clerk_profile(p_email, p_display_name)` —
--      SECURITY DEFINER function that performs the lookup-by-email,
--      legacy-id migration, and new-profile-insert atomically. The
--      function reads `auth.jwt() ->> 'sub'` to identify the caller,
--      so the browser only passes the email and display name. RLS is
--      bypassed inside the function (it runs as the owner).
--   2. `public.profiles_public` view exposing only id + name, with
--      `security_invoker = off` so it can read the base table past RLS.
--      Granted SELECT to anon and authenticated. This is the surface
--      future code paths should hit when they need other users' display
--      info (e.g., shared conversation rendering).
--   3. Replace `profiles_select_public` (USING true) with
--      `profiles_select_self_or_admin` — anon and authenticated callers
--      may only SELECT their own row directly on the base table; admins
--      retain full SELECT via the existing `public.is_clerk_admin()`
--      helper.
--
-- Migration ordering note for whoever applies this:
--   Apply AFTER the corresponding App.tsx change is deployed. Reason:
--   the new policy denies the old cross-row "lookup by email" read that
--   the previous browser bootstrap relied on. If this migration lands
--   before the new browser code (which calls the RPC instead), the
--   bootstrap path will fail for users with legacy UUID profile ids
--   until the new code is live. Idempotent — safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Bootstrap RPC — atomic lookup / legacy migration / insert
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.bootstrap_clerk_profile(
  p_email text,
  p_display_name text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clerk_id  text := auth.jwt() ->> 'sub';
  v_profile   public.profiles;
  v_legacy_id text;
BEGIN
  IF v_clerk_id IS NULL OR v_clerk_id = '' THEN
    RAISE EXCEPTION 'bootstrap_clerk_profile: caller has no Clerk session (auth.jwt sub is missing)';
  END IF;

  IF p_email IS NULL OR p_email = '' THEN
    RAISE EXCEPTION 'bootstrap_clerk_profile: p_email is required';
  END IF;

  -- 1) Already migrated — caller's Clerk id is the row id.
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE id = v_clerk_id;

  IF FOUND THEN
    UPDATE public.profiles
    SET email = p_email,
        name  = COALESCE(NULLIF(v_profile.name, ''), p_display_name)
    WHERE id = v_clerk_id
    RETURNING * INTO v_profile;
    RETURN jsonb_build_object(
      'profile',      to_jsonb(v_profile),
      'was_inserted', false
    );
  END IF;

  -- 2) Legacy profile under a UUID-shaped id, found by email.
  --    Legacy is "id does not start with user_"; the live data uses
  --    UUIDv4-style ids from the pre-Clerk Supabase Auth era.
  SELECT * INTO v_profile
  FROM public.profiles
  WHERE email = p_email
  LIMIT 1;

  IF FOUND THEN
    v_legacy_id := v_profile.id;

    IF v_legacy_id LIKE 'user_%' THEN
      -- Email collides with a different Clerk user's profile — refuse.
      RAISE EXCEPTION
        'bootstrap_clerk_profile: a profile already exists for % under a different Clerk user', p_email;
    END IF;

    -- Migrate the row's primary key from the legacy UUID to the Clerk id,
    -- then re-key the foreign tables that scope by user_id.
    UPDATE public.profiles
    SET id    = v_clerk_id,
        email = p_email,
        name  = COALESCE(NULLIF(v_profile.name, ''), p_display_name)
    WHERE id = v_legacy_id
    RETURNING * INTO v_profile;

    UPDATE public.conversations      SET user_id = v_clerk_id WHERE user_id = v_legacy_id;
    UPDATE public.scheduled_meetings SET user_id = v_clerk_id WHERE user_id = v_legacy_id;
    UPDATE public.meeting_summaries  SET user_id = v_clerk_id WHERE user_id = v_legacy_id;
    UPDATE public.brand_glossaries   SET user_id = v_clerk_id WHERE user_id = v_legacy_id;

    RETURN jsonb_build_object(
      'profile',      to_jsonb(v_profile),
      'was_inserted', false
    );
  END IF;

  -- 3) Brand new user — insert a fresh row with Clerk id.
  INSERT INTO public.profiles
    (id, email, name, role, plan, trial_start_date, onboarding_completed)
  VALUES
    (v_clerk_id, p_email, p_display_name, 'user', 'Premium', NOW(), false)
  RETURNING * INTO v_profile;

  RETURN jsonb_build_object(
    'profile',      to_jsonb(v_profile),
    'was_inserted', true
  );
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_clerk_profile(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_clerk_profile(text, text)
  TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. Public-readable view — id + name only
-- ----------------------------------------------------------------------------
--
-- Created with `security_invoker = off` so the view executes with the
-- owner's privileges (postgres / supabase_admin), allowing it to read past
-- the tightened RLS on the base table. Grant SELECT to anon + authenticated.
-- Future code paths that need other users' display info (shared meetings,
-- shared conversations, public glossary attribution, etc.) should query
-- this view, not the base table.

DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker = false)
AS
  SELECT id, name
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Replace public-read policy with self-or-admin
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_select_public"        ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_select_self_or_admin"
  ON public.profiles FOR SELECT
  USING (
    ((auth.jwt() ->> 'sub') = id)
    OR public.is_clerk_admin()
  );

-- ----------------------------------------------------------------------------
-- 4. Restore admin UPDATE — the prior migration tightened the UPDATE policy
--    to self-only, which silently regressed the admin role-change UI at
--    src/App.tsx:393 (`handleUpdateUserRole`). Widening it to "self OR
--    admin" keeps the self-promote attack closed (anon can't be admin)
--    while letting admins legitimately edit other users' rows. Browser
--    writes to plan/role columns by non-admins still fail because the
--    USING/WITH CHECK clauses require either ownership or admin status.
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS "profiles_update_self"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON public.profiles;

CREATE POLICY "profiles_update_self_or_admin"
  ON public.profiles FOR UPDATE
  USING (
    ((auth.jwt() ->> 'sub') = id)
    OR public.is_clerk_admin()
  )
  WITH CHECK (
    ((auth.jwt() ->> 'sub') = id)
    OR public.is_clerk_admin()
  );
