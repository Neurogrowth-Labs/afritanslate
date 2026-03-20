-- ============================================================================
-- Section 1: Drop the remaining auth.users foreign key on profiles
-- ============================================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_id_fkey;

-- ============================================================================
-- Section 2: Convert profiles.id from uuid to text for Clerk user IDs
-- ============================================================================

ALTER TABLE public.profiles
  ALTER COLUMN id TYPE text USING id::text;

-- ============================================================================
-- Section 3: Enable row level security on all application tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_glossaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cultural_insights ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Section 4: Create permissive policies for the current free-plan setup
-- ============================================================================

CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile."
  ON public.profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own profile."
  ON public.profiles FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own conversations"
  ON public.conversations FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own conversations"
  ON public.conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own conversations"
  ON public.conversations FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own conversations"
  ON public.conversations FOR DELETE
  USING (true);

CREATE POLICY "Users can view messages from their conversations"
  ON public.chat_messages FOR SELECT
  USING (true);

CREATE POLICY "Users can insert messages into their conversations"
  ON public.chat_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Library items are viewable by everyone"
  ON public.library_items FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert library items"
  ON public.library_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update library items"
  ON public.library_items FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can delete library items"
  ON public.library_items FOR DELETE
  USING (true);

CREATE POLICY "Users can view their own scheduled meetings"
  ON public.scheduled_meetings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own scheduled meetings"
  ON public.scheduled_meetings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete their own scheduled meetings"
  ON public.scheduled_meetings FOR DELETE
  USING (true);

CREATE POLICY "Users can view their own meeting summaries"
  ON public.meeting_summaries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own meeting summaries"
  ON public.meeting_summaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own brand glossaries"
  ON public.brand_glossaries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own brand glossaries"
  ON public.brand_glossaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own brand glossaries"
  ON public.brand_glossaries FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete their own brand glossaries"
  ON public.brand_glossaries FOR DELETE
  USING (true);

CREATE POLICY "Cultural insights are viewable by everyone"
  ON public.cultural_insights FOR SELECT
  USING (true);
