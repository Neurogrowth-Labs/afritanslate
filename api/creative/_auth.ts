import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';

/**
 * Verify the Clerk Bearer token on an incoming /api/creative/* request.
 *
 * Mirrors the pattern used by api/meeting-insights/* — every paid AI endpoint
 * in this repo is gated behind Clerk so that random unauthenticated callers
 * cannot drain Gemini quota or run up cost. Returns the verified user id on
 * success, or null after writing a 401 response on failure.
 */
export async function verifyClerkToken(
    req: VercelRequest,
    res: VercelResponse,
): Promise<string | null> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
        console.error(
            '[creative/_auth] CLERK_SECRET_KEY is not set; refusing to authenticate',
        );
        res.status(500).json({
            error: 'Server is missing CLERK_SECRET_KEY. Configure it in Vercel project env vars.',
        });
        return null;
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' });
        return null;
    }
    const token = authHeader.slice(7);

    try {
        const clerk = createClerkClient({ secretKey });
        const payload = await clerk.verifyToken(token);
        return payload.sub;
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
        return null;
    }
}
