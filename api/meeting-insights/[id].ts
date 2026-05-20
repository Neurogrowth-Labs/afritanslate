import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkBearer } from '../_lib/auth.js';
import { supabaseAdmin, MissingEnvError } from './_supabase.js';
import { processJob } from './_processor.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };

  if (!id) {
    return res.status(400).json({ error: 'Missing job id' });
  }

  try {
    // ── POST /api/meeting-insights/:id/process (internal processor trigger) ──
    if (req.method === 'POST') {
      const expected = process.env.MEETING_INSIGHTS_WEBHOOK_SECRET;
      if (!expected) {
        console.error('[meeting-insights/:id] MEETING_INSIGHTS_WEBHOOK_SECRET is not set');
        return res.status(500).json({
          error: 'Server is missing MEETING_INSIGHTS_WEBHOOK_SECRET. Configure it in Vercel project env vars.',
        });
      }
      const secret = req.headers['x-webhook-secret'];
      if (secret !== expected) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // F-2: defense-in-depth — even with a valid webhook secret, only act
      // on a job that actually exists and is in a re-processable state.
      // Without this, a leaked secret would let an attacker pump arbitrary
      // job ids into processJob(), which would burn Gemini quota per call.
      const { data: jobRow, error: jobLookupError } = await supabaseAdmin
        .from('meeting_insight_jobs')
        .select('id, status')
        .eq('id', id)
        .maybeSingle();

      if (jobLookupError) {
        console.error(`[meeting-insights/:id] job lookup failed for ${id}:`, jobLookupError);
        return res.status(500).json({ error: 'Job lookup failed' });
      }
      if (!jobRow) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const reprocessableStatuses = new Set(['queued', 'uploading', 'failed']);
      if (!reprocessableStatuses.has(jobRow.status)) {
        return res.status(409).json({
          error: 'Job is not in a re-processable state',
          status: jobRow.status,
        });
      }

      // Acknowledge immediately, process async
      res.status(202).json({ message: 'Processing started' });
      processJob(id).catch((err) =>
        console.error(`Processor failed for job ${id}:`, err)
      );
      return;
    }

    // ── GET /api/meeting-insights/:id (status polling) ──
    if (req.method === 'GET') {
      const userId = await verifyClerkBearer(req, res);
      if (!userId) return; // verifyClerkBearer already wrote the response

      // Fetch job (must belong to this user)
      const { data: job, error: jobError } = await supabaseAdmin
        .from('meeting_insight_jobs')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (jobError || !job) {
        return res.status(404).json({ error: 'Job not found or access denied' });
      }

      // Fetch segments if job succeeded
      let segments: unknown[] = [];
      if (job.status === 'succeeded') {
        const { data: segs } = await supabaseAdmin
          .from('meeting_insight_segments')
          .select('*')
          .eq('job_id', id)
          .order('segment_index', { ascending: true });
        segments = segs ?? [];
      }

      // Fetch export records
      const { data: exports } = await supabaseAdmin
        .from('meeting_insight_exports')
        .select('*')
        .eq('job_id', id);

      return res.status(200).json({
        job,
        segments,
        exports: exports ?? [],
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error('[meeting-insights/:id] missing env:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.error('[meeting-insights/:id] error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
