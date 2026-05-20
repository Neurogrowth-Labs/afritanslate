import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyClerkBearer } from '../_lib/auth';

/**
 * Legacy alias for backwards compatibility with existing import paths.
 * New code should import `verifyClerkBearer` from `api/_lib/auth` directly.
 */
export async function verifyClerkToken(
    req: VercelRequest,
    res: VercelResponse,
): Promise<string | null> {
    return verifyClerkBearer(req, res);
}
