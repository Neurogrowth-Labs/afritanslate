import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkBearer } from '../_lib/auth.js';
import { supabaseAdmin, MissingEnvError } from './_supabase.js';
import type { MeetingSubmitRequest } from '../../src/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await verifyClerkBearer(req, res);
    if (!userId) return; // verifyClerkBearer already wrote the response

    // Validate request body
    const body = req.body as MeetingSubmitRequest;
    if (!body.sourceType || !body.outputLanguageCode || !body.transcriptionStyle || !body.localizationMode) {
      return res.status(400).json({ error: 'Missing required fields: sourceType, outputLanguageCode, transcriptionStyle, localizationMode' });
    }
    if (body.sourceType === 'meeting_link' && !body.sourceUrl) {
      return res.status(400).json({ error: 'sourceUrl is required for meeting_link source type' });
    }

    // Create job record
    const { data: job, error } = await supabaseAdmin
      .from('meeting_insight_jobs')
      .insert({
        user_id: userId,
        source_type: body.sourceType,
        source_url: body.sourceUrl ?? null,
        output_language_code: body.outputLanguageCode,
        transcription_style: body.transcriptionStyle,
        localization_mode: body.localizationMode,
        status: 'queued',
        progress: 0,
      })
      .select('id, status, created_at')
      .single();

    if (error || !job) {
      console.error('[meeting-insights] create error:', error);
      return res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }

    // Kick off async processing (fire and forget)
    const baseUrl = process.env.APP_BASE_URL ?? `https://${req.headers.host}`;
    fetch(`${baseUrl}/api/meeting-insights/${job.id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': process.env.MEETING_INSIGHTS_WEBHOOK_SECRET ?? '',
      },
    }).catch((err) => console.error('Failed to kick off processor:', err));

    return res.status(201).json({ jobId: job.id, status: job.status });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error('[meeting-insights] missing env:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.error('[meeting-insights] create error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
