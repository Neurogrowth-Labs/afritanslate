import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { supabaseAdmin } from './_supabase';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
const MAX_FILE_BYTES = 48 * 1024 * 1024; // 48 MB — Supabase free plan cap is 50 MB

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

  const { fileName, contentType, jobId } = req.body as {
    fileName: string;
    contentType: string;
    jobId: string;
  };

  if (!fileName || !contentType || !jobId) {
    return res.status(400).json({ error: 'Missing fileName, contentType, or jobId' });
  }

  const fileSizeHeader = Number(req.headers['content-length'] ?? 0);
  if (fileSizeHeader > MAX_FILE_BYTES) {
    return res.status(413).json({
      error: `File too large. Maximum size is 48 MB. Upgrade your plan for larger recordings.`,
    });
  }

  // Verify the job belongs to this user
  const { data: job, error: jobError } = await supabaseAdmin
    .from('meeting_insight_jobs')
    .select('id, user_id')
    .eq('id', jobId)
    .eq('user_id', userId)
    .single();

  if (jobError || !job) {
    return res.status(404).json({ error: 'Job not found or access denied' });
  }

  const bucket = process.env.MEETING_INSIGHTS_BUCKET ?? 'meeting-recordings';
  const path = `${userId}/${jobId}/${Date.now()}-${fileName}`;

  const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin
    .storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (signedUrlError || !signedUrlData) {
    console.error('Failed to create signed upload URL:', signedUrlError);
    return res.status(500).json({ error: 'Failed to generate upload URL' });
  }

  // Update job with the recording path
  await supabaseAdmin
    .from('meeting_insight_jobs')
    .update({
      recording_bucket: bucket,
      recording_path: path,
      status: 'uploading',
      updated_at: new Date().toISOString(),
    })
    .eq('id', jobId);

  return res.status(200).json({
    signedUrl: signedUrlData.signedUrl,
    path,
    bucket,
  });
}
