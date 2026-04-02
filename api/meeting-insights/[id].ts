import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuth } from '@clerk/nextjs/server';
import { supabaseAdmin } from './_supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const jobId = req.query.id as string;
  if (!jobId) return res.status(400).json({ error: 'Missing job id' });

  const { data: job, error: jobError } = await supabaseAdmin
    .from('meeting_insight_jobs')
    .select('*')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (jobError || !job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  const { data: segments } = await supabaseAdmin
    .from('meeting_insight_segments')
    .select('*')
    .eq('job_id', jobId)
    .order('segment_index', { ascending: true });

  const { data: exports } = await supabaseAdmin
    .from('meeting_insight_exports')
    .select('*')
    .eq('job_id', jobId);

  return res.status(200).json({
    job,
    segments: segments ?? [],
    exports: exports ?? [],
  });
}
