-- ============================================================================
-- F-02: Enable RLS on the three meeting_insight_* tables
-- ============================================================================
--
-- Pre-launch security finding (2026-05-02): the tables created by
-- migrations/20260402_meeting_insights.sql were shipped without RLS, so any
-- party holding the public Supabase anon key (which is necessarily in the
-- client JS bundle) could read every other user's transcripts, segments,
-- exports, status timelines and source recording paths via the public REST
-- endpoint at https://<project>.supabase.co/rest/v1/meeting_insight_*.
--
-- Mitigation: enable RLS without any permissive policy. With RLS on and no
-- policy, all anon and authenticated-key access is denied. The server-side
-- pipeline at api/meeting-insights/* uses the service-role key (see
-- api/meeting-insights/_supabase.ts) which bypasses RLS, so the working
-- async transcription/insights flow is unaffected.
--
-- This migration is idempotent.
-- ============================================================================

ALTER TABLE public.meeting_insight_jobs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_insight_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_insight_exports  ENABLE ROW LEVEL SECURITY;

-- Defensive: in case any earlier interactive session left a permissive
-- policy on these tables, drop the canonical "*-public" names so this
-- migration converges on the deny-by-default behaviour above.
DROP POLICY IF EXISTS "meeting_insight_jobs are viewable by everyone"     ON public.meeting_insight_jobs;
DROP POLICY IF EXISTS "meeting_insight_segments are viewable by everyone" ON public.meeting_insight_segments;
DROP POLICY IF EXISTS "meeting_insight_exports are viewable by everyone"  ON public.meeting_insight_exports;
