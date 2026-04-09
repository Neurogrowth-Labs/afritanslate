import { supabaseAdmin } from './_supabase';
import { generateContent } from './_ai-provider';
import {
  buildTXT,
  buildSRT,
  buildPDF,
  buildDOCX,
  uploadExport,
} from './_export-builder';
import type {
  TranscriptSegment,
  MeetingInsightsResult,
  TranscriptionStyle,
  LocalizationMode,
} from '../../src/types';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function updateJobStatus(
  jobId: string,
  status: string,
  stage: string,
  progress: number,
  extra?: Record<string, unknown>
) {
  await supabaseAdmin
    .from('meeting_insight_jobs')
    .update({
      status,
      stage,
      progress,
      updated_at: new Date().toISOString(),
      ...extra,
    })
    .eq('id', jobId);
}

async function failJob(jobId: string, errorCode: string, errorMessage: string) {
  await supabaseAdmin
    .from('meeting_insight_jobs')
    .update({
      status: 'failed',
      error_code: errorCode,
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);
}

// ── Stage 1: Transcription ─────────────────────────────────────────────────────

async function transcribeAudio(
  jobId: string,
  sourceType: string,
  sourceUrl: string | null,
  recordingBucket: string | null,
  recordingPath: string | null,
  transcriptionStyle: TranscriptionStyle
): Promise<TranscriptSegment[]> {

  // For recording_upload: get a signed download URL
  let audioContext = '';
  if (sourceType === 'recording_upload' && recordingBucket && recordingPath) {
    const { data, error } = await supabaseAdmin
      .storage
      .from(recordingBucket)
      .createSignedUrl(recordingPath, 3600);

    if (error || !data?.signedUrl) {
      throw new Error('missing_audio: Could not generate signed URL for recording');
    }
    audioContext = `The audio recording is available at: ${data.signedUrl}`;
  } else if (sourceType === 'meeting_link' && sourceUrl) {
    audioContext = `The meeting recording link is: ${sourceUrl}`;
  } else {
    throw new Error('missing_audio: No audio source available for this job');
  }

  const styleInstruction =
    transcriptionStyle === 'verbatim'
      ? 'Transcribe every word exactly as spoken, including filler words (um, uh, like), false starts, and repetitions.'
      : transcriptionStyle === 'clean_read'
      ? 'Transcribe the speech clearly, removing filler words and false starts, but preserve all substantive content and meaning.'
      : 'Produce a concise executive summary of what was said by each speaker, preserving key points only.';

  const prompt = `
You are an expert multilingual transcription engine for African and global meetings.

${audioContext}

Task: Produce a full transcript of this meeting as a JSON array of transcript segments.

Transcription style: ${styleInstruction}

Rules:
- Assign speaker labels as "Speaker 1", "Speaker 2", etc. (or "Host" / "Participant A" if identifiable from context)
- Include timestamps in milliseconds (startMs, endMs) — estimate if exact values are unavailable
- Detect the language of each segment (use ISO 639-1 codes, e.g. "en", "sw", "zu", "fr", "yo")
- Handle code-switching naturally — if a speaker switches languages mid-turn, split into separate segments
- If audio is unclear or inaudible, set originalText to "[inaudible]" and isInaudible to true
- NEVER fabricate or hallucinate content — mark all unclear audio as [inaudible]
- Preserve regional accents, dialects, and multilingual switching with cultural sensitivity
- Set confidence between 0 and 1 (use 0.95 for clear audio, lower for uncertain sections)

Output format — return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "segmentIndex": 0,
    "startMs": 0,
    "endMs": 5200,
    "speakerLabel": "Speaker 1",
    "languageCode": "en",
    "originalText": "Welcome everyone to today's meeting.",
    "localizedText": null,
    "isInaudible": false,
    "confidence": 0.97
  }
]
`;

  const text = await generateContent(prompt);
  const segments = JSON.parse(text) as TranscriptSegment[];

  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error('transcription_failed: Gemini returned empty or invalid transcript');
  }

  return segments;
}

// ── Stage 2: Localization ──────────────────────────────────────────────────────

async function localizeSegments(
  segments: TranscriptSegment[],
  outputLanguageCode: string,
  localizationMode: LocalizationMode
): Promise<TranscriptSegment[]> {

  // Skip localization if all segments are already in the target language
  const allSameLanguage = segments.every(
    (s) => s.languageCode === outputLanguageCode || s.isInaudible
  );
  if (allSameLanguage && localizationMode === 'direct_translation') {
    return segments.map((s) => ({ ...s, localizedText: s.originalText }));
  }

  const modeInstruction =
    localizationMode === 'deep_localized'
      ? `Apply deep localization:
         - Adapt idioms, proverbs, and expressions to be culturally natural in the target language/region
         - Preserve professional, emotional, and cultural tone
         - Use region-appropriate register and vocabulary
         - Adapt culturally sensitive phrases to be respectful in the target culture`
      : 'Apply direct translation: translate accurately while preserving the original meaning and tone.';

  const transcriptText = segments
    .filter((s) => !s.isInaudible)
    .map((s) => `[${s.segmentIndex}] ${s.originalText}`)
    .join('\n');

  const prompt = `
You are AfriTranslate AI — an expert African multilingual localization engine.

Task: Translate and localize the following transcript segments into ${outputLanguageCode}.

${modeInstruction}

Rules:
- Return ONLY a JSON object mapping segmentIndex to localizedText
- For [inaudible] segments, return "[inaudible]" as the localizedText
- Preserve speaker intent, tone, and meaning — do not add or remove information
- Handle code-switched content naturally in the target language

Segments to localize:
${transcriptText}

Output format — return ONLY valid JSON, no markdown:
{
  "0": "localized text for segment 0",
  "1": "localized text for segment 1"
}
`;

  const text = await generateContent(prompt);
  const localizationMap = JSON.parse(text) as Record<string, string>;

  return segments.map((s) => ({
    ...s,
    localizedText: s.isInaudible
      ? '[inaudible]'
      : (localizationMap[String(s.segmentIndex)] ?? s.originalText),
  }));
}

// ── Stage 3: Insights Extraction ───────────────────────────────────────────────

async function extractInsights(
  segments: TranscriptSegment[],
  outputLanguageCode: string,
  localizationMode: LocalizationMode
): Promise<MeetingInsightsResult> {

  const fullTranscript = segments
    .map((s) => {
      const text = s.localizedText ?? s.originalText;
      const time = s.startMs != null
        ? `[${Math.floor(s.startMs / 60000)}:${String(Math.floor((s.startMs % 60000) / 1000)).padStart(2, '0')}]`
        : '';
      return `${time} ${s.speakerLabel ?? 'Speaker'}: ${text}`;
    })
    .join('\n');

  const detectedLanguages = [...new Set(
    segments
      .filter((s) => !s.isInaudible && s.languageCode)
      .map((s) => s.languageCode!)
  )];

  const prompt = `
You are AfriTranslate AI — Meeting Insights Agent.

You have received a full meeting transcript. Extract structured insights from it.

Transcript:
${fullTranscript}

Output language: ${outputLanguageCode}
Localization applied: ${localizationMode}

Rules:
- Base all insights ONLY on what was actually said in the transcript
- NEVER fabricate decisions, action items, or commitments that were not explicitly stated
- If something is unclear, omit it rather than guess
- Write all output in ${outputLanguageCode}
- Assign action items to specific speakers where the transcript makes it clear who is responsible

Return ONLY valid JSON in exactly this structure, no markdown:
{
  "keyPoints": ["string", "string"],
  "decisions": ["string", "string"],
  "actionItems": [
    { "description": "string", "assignedSpeaker": "Speaker 1 or null" }
  ],
  "highlights": ["string", "string"],
  "executiveSummary": "2-4 sentence overview of the meeting",
  "languageNote": {
    "originalLanguages": ${JSON.stringify(detectedLanguages)},
    "outputLanguage": "${outputLanguageCode}",
    "localizationLevel": "${localizationMode}"
  }
}
`;

  const text = await generateContent(prompt);
  return JSON.parse(text) as MeetingInsightsResult;
}

// ── Main Orchestrator ──────────────────────────────────────────────────────────

export async function processJob(jobId: string): Promise<void> {
  // Fetch job details
  const { data: job, error: jobFetchError } = await supabaseAdmin
    .from('meeting_insight_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (jobFetchError || !job) {
    console.error(`processJob: job ${jobId} not found`);
    return;
  }

  try {
    // ── Stage 1: Transcription ──
    await updateJobStatus(jobId, 'transcribing', 'transcribing', 10, {
      started_at: new Date().toISOString(),
    });

    let segments: TranscriptSegment[];
    try {
      segments = await transcribeAudio(
        jobId,
        job.source_type,
        job.source_url,
        job.recording_bucket,
        job.recording_path,
        job.transcription_style
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown transcription error';
      if (msg.startsWith('missing_audio')) {
        await failJob(jobId, 'missing_audio', 'No accessible audio source found. Please upload a recording file.');
      } else {
        await failJob(jobId, 'transcription_failed', msg);
      }
      return;
    }

    await updateJobStatus(jobId, 'localizing', 'localizing', 40);

    // ── Stage 2: Localization ──
    const localizedSegments = await localizeSegments(
      segments,
      job.output_language_code,
      job.localization_mode
    );

    await updateJobStatus(jobId, 'extracting_insights', 'extracting_insights', 65);

    // ── Stage 3: Insights ──
    const insights = await extractInsights(
      localizedSegments,
      job.output_language_code,
      job.localization_mode
    );

    await updateJobStatus(jobId, 'exporting', 'saving_results', 85);

    // ── Persist segments ──
    const segmentRows = localizedSegments.map((s) => ({
      job_id: jobId,
      segment_index: s.segmentIndex,
      start_ms: s.startMs,
      end_ms: s.endMs,
      speaker_label: s.speakerLabel,
      language_code: s.languageCode,
      original_text: s.originalText,
      localized_text: s.localizedText,
      is_inaudible: s.isInaudible,
      confidence: s.confidence,
    }));

    await supabaseAdmin
      .from('meeting_insight_segments')
      .insert(segmentRows);

    // ── Generate and upload exports ──
    const EXPORT_BUCKET = 'meeting-insights-exports';

    const txtContent = buildTXT(localizedSegments, insights, jobId);
    const srtContent = buildSRT(localizedSegments);

    await Promise.all([
      uploadExport(jobId, 'txt', txtContent, EXPORT_BUCKET),
      uploadExport(jobId, 'srt', srtContent, EXPORT_BUCKET),
    ]);

    const [pdfBuffer, docxBuffer] = await Promise.all([
      buildPDF(localizedSegments, insights, jobId),
      buildDOCX(localizedSegments, insights, jobId),
    ]);

    await Promise.all([
      uploadExport(jobId, 'pdf', pdfBuffer, EXPORT_BUCKET),
      uploadExport(jobId, 'docx', docxBuffer, EXPORT_BUCKET),
    ]);

    // ── Persist final job result ──
    await supabaseAdmin
      .from('meeting_insight_jobs')
      .update({
        status: 'succeeded',
        stage: 'completed',
        progress: 100,
        result_json: insights,
        executive_summary: insights.executiveSummary,
        language_note: JSON.stringify(insights.languageNote),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', jobId);

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unexpected error';
    console.error(`processJob error for ${jobId}:`, msg);
    await failJob(jobId, 'processing_failed', msg);
  }
}
