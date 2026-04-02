import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { supabaseAdmin } from './_supabase';
import type { MeetingSubmitRequest } from '../../src/types';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify Clerk JWT
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization header' });
  }
  const token = authHeader.slice(7);

  let userId: string;
  try {
    const payload = await clerk.verifyToken(token);
    userId = payload.sub;
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

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
    console.error('Failed to create meeting job:', error);
    return res.status(500).json({ error: 'Failed to create job' });
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
}
