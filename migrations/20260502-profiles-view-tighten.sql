-- ============================================================================
-- F-04 (Phase 4, Option B + hotfix): tighten public read on public.profiles,
-- expose safe display fields via a view, and route legacy profile bootstrap
-- through a server-side endpoint instead of a SECURITY DEFINER RPC.
-- ============================================================================
--
-- History:
--   PR #19 originally added a `bootstrap_clerk_profile(p_email, p_display_name)`
--   SECURITY DEFINER RPC so the browser could finish the
--   lookup / legacy-id migration / new-insert flow without needing
--   cross-row public SELECT on profiles. Devin Review identified that the
--   RPC trusted the client-supplied email — any authenticated Clerk user
--   could call it with a victim's email and steal the victim's pre-Clerk
--   profile + all associated conversations / meetings / glossaries. The
--   migration was reverted before being applied to the live DB.
--
--   This hotfix migration removes the RPC entirely and moves the bootstrap
--   logic to `POST /api/bootstrap-profile`, which fetches the verified
--   primary email server-side via the Clerk Backend API
--   (`clerkClient.users.getUser(sub)`) using `CLERK_SECRET_KEY`. The
--   email is never read from the request body, so the takeover vector
--   is closed at the source.
--
-- What this migration does NOW:
--   1. DROP the dangerous RPC (defense-in-depth — even if an earlier
--      draft was applied, this removes it).
--   2. Create `public.profiles_public` view exposing only id + name,
--      with `security_invoker = off`. Granted SELECT to anon and
--      authenticated. This is the surface future code paths should
--      hit when they need other users' display info.
--   3. Replace `profiles_select_public` (USING true) with
--      `profiles_select_self_or_admin` — anon and authenticated callers
--      may only SELECT their own row on the base table; admins retain
--      full SELECT via the existing `public.is_clerk_admin()` helper.
--   4. Restore admin UPDATE — the prior migration tightened
--      `profiles_update_self` to self-only, which silently regressed
--      the admin role-change UI. Widening to "self OR admin" keeps
--      the self-promote attack closed (anon's auth.jwt sub is NULL).
--
-- Migration ordering note for whoever applies this:
--   Apply AFTER the corresponding App.tsx change is deployed. The new
--   policy denies the old cross-row "lookup by email" read that the
--   prior browser bootstrap relied on. If this migration lands before
--   the new browser code (which calls the /api/bootstrap-profile
--   endpoint instead of doing a cross-row SELECT or RPC), the
--   bootstrap path will fail for users with legacy UUID profile ids
--   until the new code is live.
--
-- Idempotent — safe to run more than once.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Defense-in-depth: drop the dangerous RPC if it ever made it onto
--    the DB. The function is replaced by POST /api/bootstrap-profile.
-- ----------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.bootstrap_clerk_profile(text, text);

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
--    src/App.tsx (`handleUpdateUserRole`). Widening it to "self OR admin"
--    keeps the self-promote attack closed (anon can't be admin) while
--    letting admins legitimately edit other users' rows. Browser writes
--    to plan/role columns by non-admins still fail because the USING /
--    WITH CHECK clauses require either ownership or admin status.
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
