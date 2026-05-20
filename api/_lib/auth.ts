import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyToken } from '@clerk/backend';


/**
 * Verify the Clerk Bearer token on an incoming API request.
 *
 * Returns the verified Clerk userId on success, or null after writing
 * a 401/500 response on failure. Callers should `return;` immediately
 * after receiving null — the response is already written.
 *
 * Failure modes (all return null after writing JSON):
 *   - CLERK_SECRET_KEY not configured     → 500
 *   - missing / non-Bearer auth header    → 401
 *   - empty token after "Bearer "         → 401
 *   - JWT header declares alg=none        → 401  (defense-in-depth)
 *   - invalid signature / expired / etc.  → 401
 *
 * Env-var reads happen lazily inside this function. Importing this
 * module never throws, so a missing CLERK_SECRET_KEY surfaces as a
 * normal JSON 500 instead of FUNCTION_INVOCATION_FAILED.
 */
export async function verifyClerkBearer(
    req: VercelRequest,
    res: VercelResponse,
): Promise<string | null> {
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
        console.error('[auth] CLERK_SECRET_KEY is not set; refusing to authenticate');
        res.status(500).json({
            error: 'Server is missing CLERK_SECRET_KEY. Configure it in Vercel project env vars.',
        });
        return null;
    }

    const authHeader = req.headers.authorization;
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing authorization header' });
        return null;
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        res.status(401).json({ error: 'Empty bearer token' });
        return null;
    }

    if (hasUnsafeAlg(token)) {
        res.status(401).json({ error: 'Unsupported JWT algorithm' });
        return null;
    }

    try {
        const payload = await verifyToken(token, { secretKey });
        if (!payload?.sub) {
            res.status(401).json({ error: 'Invalid or expired token' });
            return null;
        }
        return payload.sub;
    } catch {
        res.status(401).json({ error: 'Invalid or expired token' });
        return null;
    }
}

/**
 * Inspect the JWT header (the first base64url segment before the '.')
 * and return true if it declares an algorithm we explicitly refuse.
 *
 * Today this only flags `alg: "none"` (any case), which is the classic
 * unsigned-JWT bypass. Clerk's verifier already rejects unsigned tokens
 * because they can't match a JWKS key, but parsing the header here means
 * we short-circuit before handing a malformed token to the upstream
 * verifier — and we return a clearer error code to the caller.
 *
 * Returns false on any parse failure so we let the normal verifier path
 * produce the 401 (avoids accidentally letting a malformed-but-signed
 * token through if our parsing is wrong).
 */
function hasUnsafeAlg(token: string): boolean {
    const dot = token.indexOf('.');
    if (dot <= 0) return false;
    const headerB64 = token.slice(0, dot);
    try {
        const padded = headerB64
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(headerB64.length + ((4 - (headerB64.length % 4)) % 4), '=');
        const decoded = Buffer.from(padded, 'base64').toString('utf8');
        const header = JSON.parse(decoded) as { alg?: unknown };
        if (typeof header.alg !== 'string') return false;
        return header.alg.toLowerCase() === 'none';
    } catch {
        return false;
    }
}
