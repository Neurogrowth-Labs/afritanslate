import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkBearer } from '../_lib/auth.js';
import { supabaseAdmin, MissingEnvError } from './_supabase.js';

// F-3: server-side minted, short-TTL signed download URLs for meeting-insight
// exports. Replaces a former browser code path that called the public
// `/storage/v1/object/sign/...` endpoint with the anon key — which (because
// the storage bucket was open to anon) allowed any party who learned a job
// id to download every export file for that job, regardless of ownership.
//
// This endpoint:
//   1) Verifies the Clerk session bearer.
//   2) Fetches the job and asserts the caller owns it (user_id match).
//   3) Looks up the export row in `meeting_insight_exports` for the
//      requested format and asserts its `job_id` matches the path id
//      (defense-in-depth against an exports row with a mismatched job_id).
//   4) Mints a 5-minute signed URL using the service role and returns it.

const ALLOWED_FORMATS = new Set(['txt', 'srt', 'pdf', 'docx']);
const SIGNED_URL_TTL_SECONDS = 5 * 60;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = await verifyClerkBearer(req, res);
    if (!userId) return; // verifyClerkBearer already wrote the response

    const rawId = req.query.id;
    const rawFormat = req.query.format;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    const format = Array.isArray(rawFormat) ? rawFormat[0] : rawFormat;

    if (!id) {
      return res.status(400).json({ error: 'Missing job id' });
    }
    if (!format || !ALLOWED_FORMATS.has(format)) {
      return res.status(400).json({
        error: `Unsupported export format. Must be one of: ${[...ALLOWED_FORMATS].join(', ')}`,
      });
    }

    // 1. Job ownership check
    const { data: job, error: jobError } = await supabaseAdmin
      .from('meeting_insight_jobs')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (jobError) {
      console.error('[meeting-insights/export] job lookup failed:', jobError);
      return res.status(500).json({ error: 'Job lookup failed' });
    }
    if (!job) {
      return res.status(404).json({ error: 'Job not found or access denied' });
    }

    // 2. Export row lookup (constrained to this job — defense-in-depth)
    const { data: exportRow, error: exportError } = await supabaseAdmin
      .from('meeting_insight_exports')
      .select('bucket, path, file_name, mime_type')
      .eq('job_id', id)
      .eq('format', format)
      .maybeSingle();

    if (exportError) {
      console.error('[meeting-insights/export] export lookup failed:', exportError);
      return res.status(500).json({ error: 'Export lookup failed' });
    }
    if (!exportRow || !exportRow.bucket || !exportRow.path) {
      return res.status(404).json({ error: 'Export not available for this job/format yet' });
    }

    // 3. Mint a short-lived signed URL using the service role.
    const { data: signed, error: signError } = await supabaseAdmin
      .storage
      .from(exportRow.bucket)
      .createSignedUrl(exportRow.path, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed?.signedUrl) {
      console.error('[meeting-insights/export] sign failed:', signError);
      return res.status(500).json({ error: 'Failed to generate signed URL' });
    }

    return res.status(200).json({
      signedUrl: signed.signedUrl,
      fileName: exportRow.file_name,
      mimeType: exportRow.mime_type,
      expiresInSeconds: SIGNED_URL_TTL_SECONDS,
    });
  } catch (error) {
    if (error instanceof MissingEnvError) {
      console.error('[meeting-insights/export] missing env:', error.message);
      return res.status(500).json({ error: error.message });
    }
    console.error('[meeting-insights/export] error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
