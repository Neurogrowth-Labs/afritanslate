import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { supabaseAdmin } from './_supabase';
import { processJob } from './_processor';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string };

  if (!id) {
    return res.status(400).json({ error: 'Missing job id' });
  }

  // ── POST /api/meeting-insights/:id/process (internal processor trigger) ──
  if (req.method === 'POST') {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.MEETING_INSIGHTS_WEBHOOK_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
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
}
