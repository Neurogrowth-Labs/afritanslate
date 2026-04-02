import type {
  MeetingJob,
  MeetingSubmitRequest,
  MeetingExportRecord,
  TranscriptSegment,
} from '../types';

const API_BASE = '/api/meeting-insights';

// ── Auth header helper ─────────────────────────────────────────────────────────

async function authHeaders(): Promise<HeadersInit> {
  // Clerk exposes getToken on the window object after initialization
  // We read it from the Clerk global set up in index.tsx
  const clerk = (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk;
  const token = await clerk?.session?.getToken();
  if (!token) throw new Error('Not authenticated');
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

// ── Submit a new meeting job ───────────────────────────────────────────────────

export async function submitMeetingJob(
  request: MeetingSubmitRequest
): Promise<{ jobId: string; status: string }> {
  const headers = await authHeaders();
  const res = await fetch(API_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Request a signed upload URL for a recording file ──────────────────────────

export async function getUploadUrl(
  jobId: string,
  fileName: string,
  contentType: string
): Promise<{ signedUrl: string; path: string; bucket: string }> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/upload-url`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jobId, fileName, contentType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Upload recording directly to Supabase storage using signed URL ─────────────

export async function uploadRecording(
  signedUrl: string,
  file: File
): Promise<void> {
  const res = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
}

// ── Poll job status ────────────────────────────────────────────────────────────

export interface MeetingJobPollResult {
  job: MeetingJob;
  segments: TranscriptSegment[];
  exports: MeetingExportRecord[];
}

export async function pollMeetingJob(jobId: string): Promise<MeetingJobPollResult> {
  const headers = await authHeaders();
  const res = await fetch(`${API_BASE}/${jobId}`, {
    method: 'GET',
    headers,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  const data = await res.json();

  // Normalize snake_case DB columns to camelCase for the frontend
  const job: MeetingJob = {
    id: data.job.id,
    userId: data.job.user_id,
    sourceType: data.job.source_type,
    sourceUrl: data.job.source_url,
    recordingBucket: data.job.recording_bucket,
    recordingPath: data.job.recording_path,
    outputLanguageCode: data.job.output_language_code,
    transcriptionStyle: data.job.transcription_style,
    localizationMode: data.job.localization_mode,
    status: data.job.status,
    stage: data.job.stage,
    progress: data.job.progress ?? 0,
    segments: [],
    result: data.job.result_json ?? null,
    executiveSummary: data.job.executive_summary,
    languageNote: data.job.language_note,
    retryCount: data.job.retry_count ?? 0,
    errorCode: data.job.error_code,
    errorMessage: data.job.error_message,
    startedAt: data.job.started_at,
    completedAt: data.job.completed_at,
    createdAt: data.job.created_at,
    updatedAt: data.job.updated_at,
  };

  const segments: TranscriptSegment[] = (data.segments ?? []).map((s: Record<string, unknown>) => ({
    segmentIndex: s.segment_index as number,
    startMs: s.start_ms as number | null,
    endMs: s.end_ms as number | null,
    speakerLabel: s.speaker_label as string | null,
    languageCode: s.language_code as string | null,
    originalText: s.original_text as string,
    localizedText: s.localized_text as string | null,
    isInaudible: s.is_inaudible as boolean,
    confidence: s.confidence as number | null,
  }));

  const exports: MeetingExportRecord[] = (data.exports ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    jobId: e.job_id as string,
    format: e.format as MeetingExportRecord['format'],
    bucket: e.bucket as string | null,
    path: e.path as string | null,
    fileName: e.file_name as string | null,
    mimeType: e.mime_type as string | null,
    sizeBytes: e.size_bytes as number | null,
    createdAt: e.created_at as string,
  }));

  return { job, segments, exports };
}

// ── Get a signed download URL for an export file ──────────────────────────────

export async function getExportDownloadUrl(
  bucket: string,
  path: string
): Promise<string> {
  // This uses the Supabase public URL pattern — exports bucket must allow authenticated reads
  // or you can expose a signed-url endpoint later if needed
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
  return `${supabaseUrl}/storage/v1/object/sign/${bucket}/${path}`;
}

// ── Polling loop helper ────────────────────────────────────────────────────────

const TERMINAL_STATUSES = new Set(['succeeded', 'failed']);
const POLL_INTERVAL_MS = 3000;

export async function waitForJob(
  jobId: string,
  onUpdate: (result: MeetingJobPollResult) => void,
  signal?: AbortSignal
): Promise<MeetingJobPollResult> {
  return new Promise((resolve, reject) => {
    const poll = async () => {
      if (signal?.aborted) {
        reject(new Error('Polling aborted'));
        return;
      }
      try {
        const result = await pollMeetingJob(jobId);
        onUpdate(result);
        if (TERMINAL_STATUSES.has(result.job.status)) {
          resolve(result);
        } else {
          setTimeout(poll, POLL_INTERVAL_MS);
        }
      } catch (err) {
        reject(err);
      }
    };
    poll();
  });
}
