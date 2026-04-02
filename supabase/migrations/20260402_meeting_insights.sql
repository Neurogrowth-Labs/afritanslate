-- Enable UUID extension (usually already enabled)
create extension if not exists "uuid-ossp";

-- ── Jobs table ────────────────────────────────────────────────────────────────
create table if not exists meeting_insight_jobs (
  id                   uuid primary key default uuid_generate_v4(),
  user_id              text not null,
  source_type          text not null check (source_type in ('recording_upload', 'meeting_link')),
  source_url           text,
  recording_bucket     text,
  recording_path       text,
  output_language_code text not null default 'en',
  transcription_style  text not null default 'clean_read'
                         check (transcription_style in ('verbatim', 'clean_read', 'executive_summary')),
  localization_mode    text not null default 'deep_localized'
                         check (localization_mode in ('direct_translation', 'deep_localized')),
  status               text not null default 'queued'
                         check (status in ('queued','uploading','transcribing','localizing',
                                           'extracting_insights','exporting','succeeded','failed')),
  stage                text,
  progress             integer not null default 0 check (progress between 0 and 100),
  result_json          jsonb,
  executive_summary    text,
  language_note        text,
  retry_count          integer not null default 0,
  error_code           text,
  error_message        text,
  started_at           timestamptz,
  completed_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists idx_meeting_jobs_user_id on meeting_insight_jobs(user_id);
create index if not exists idx_meeting_jobs_status  on meeting_insight_jobs(status);

-- ── Segments table ────────────────────────────────────────────────────────────
create table if not exists meeting_insight_segments (
  id             uuid primary key default uuid_generate_v4(),
  job_id         uuid not null references meeting_insight_jobs(id) on delete cascade,
  segment_index  integer not null,
  start_ms       bigint,
  end_ms         bigint,
  speaker_label  text,
  language_code  text,
  original_text  text not null,
  localized_text text,
  is_inaudible   boolean not null default false,
  confidence     numeric(4,3)
);

create index if not exists idx_segments_job_id on meeting_insight_segments(job_id);

-- ── Exports table ─────────────────────────────────────────────────────────────
create table if not exists meeting_insight_exports (
  id          uuid primary key default uuid_generate_v4(),
  job_id      uuid not null references meeting_insight_jobs(id) on delete cascade,
  format      text not null check (format in ('txt', 'srt', 'pdf', 'docx')),
  bucket      text,
  path        text,
  file_name   text,
  mime_type   text,
  size_bytes  bigint,
  created_at  timestamptz not null default now(),
  unique (job_id, format)
);

create index if not exists idx_exports_job_id on meeting_insight_exports(job_id);

-- ── RLS policies ─────────────────────────────────────────────────────────────
alter table meeting_insight_jobs     enable row level security;
alter table meeting_insight_segments enable row level security;
alter table meeting_insight_exports  enable row level security;

-- Jobs: users own their own rows; service role bypasses RLS
create policy "Users can read own jobs"
  on meeting_insight_jobs for select
  using (user_id = auth.uid()::text);

create policy "Users can insert own jobs"
  on meeting_insight_jobs for insert
  with check (user_id = auth.uid()::text);

-- Segments: readable by job owner
create policy "Users can read own segments"
  on meeting_insight_segments for select
  using (
    exists (
      select 1 from meeting_insight_jobs j
      where j.id = job_id and j.user_id = auth.uid()::text
    )
  );

-- Exports: readable by job owner
create policy "Users can read own exports"
  on meeting_insight_exports for select
  using (
    exists (
      select 1 from meeting_insight_jobs j
      where j.id = job_id and j.user_id = auth.uid()::text
    )
  );
