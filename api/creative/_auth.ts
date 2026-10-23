import type { ApiRequest, ApiResponse } from '../_lib/http.js';
import { verifyClerkBearer } from '../_lib/auth.js';

/**
 * Legacy alias for backwards compatibility with existing import paths.
 * New code should import `verifyClerkBearer` from `api/_lib/auth` directly.
 */
export async function verifyClerkToken(
    req: ApiRequest,
    res: ApiResponse,
): Promise<string | null> {
    return verifyClerkBearer(req, res);
}
