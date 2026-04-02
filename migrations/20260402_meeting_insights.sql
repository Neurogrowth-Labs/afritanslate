create table if not exists public.meeting_insight_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references profiles(id) on delete cascade,
  source_type text not null check (source_type in ('meeting_link', 'recording_upload')),
  source_url text,
  recording_bucket text,
  recording_path text,
  output_language_code text not null,
  transcription_style text not null check (transcription_style in ('verbatim', 'clean_read', 'executive_summary')),
  localization_mode text not null check (localization_mode in ('direct_translation', 'deep_localized')),
  status text not null default 'queued' check (status in ('queued','uploading','transcribing','localizing','extracting_insights','exporting','succeeded','failed')),
  stage text,
  progress integer default 0,
  result_json jsonb,
  executive_summary text,
  language_note text,
  retry_count integer default 0,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.meeting_insight_segments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references meeting_insight_jobs(id) on delete cascade,
  segment_index integer not null,
  start_ms integer,
  end_ms integer,
  speaker_label text,
  language_code text,
  original_text text,
  localized_text text,
  is_inaudible boolean default false,
  confidence numeric,
  unique(job_id, segment_index)
);

create table if not exists public.meeting_insight_exports (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references meeting_insight_jobs(id) on delete cascade,
  format text not null check (format in ('txt','srt','pdf','docx')),
  bucket text,
  path text,
  file_name text,
  mime_type text,
  size_bytes integer,
  created_at timestamptz default now(),
  unique(job_id, format)
);

create index if not exists idx_meeting_insight_jobs_user_id_created_at_desc on public.meeting_insight_jobs (user_id, created_at desc);
create index if not exists idx_meeting_insight_jobs_status on public.meeting_insight_jobs (status);
create index if not exists idx_meeting_insight_segments_job_id on public.meeting_insight_segments (job_id);
create index if not exists idx_meeting_insight_exports_job_id on public.meeting_insight_exports (job_id);
