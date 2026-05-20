import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.');
}

type ClerkOnWindow = {
  Clerk?: {
    session?: {
      getToken: (opts?: { template?: string }) => Promise<string | null>;
    };
  };
};

/**
 * Resolve a Clerk-issued JWT to forward to Supabase on every request so that
 * PostgREST sees `auth.jwt() ->> 'sub'` and can enforce row-level security
 * keyed on the Clerk user id.
 *
 * Supports both Clerk → Supabase integration paths:
 *
 *   1) Clerk "Supabase" JWT template: configure in Clerk Dashboard → JWT
 *      Templates. Clerk mints a token signed with the shared secret the
 *      project has configured in Supabase Auth (Settings → API → JWT Settings).
 *      We request that token via `getToken({ template: 'supabase' })`.
 *
 *   2) Supabase third-party auth (Clerk): configure in Supabase Dashboard →
 *      Auth → Third-party auth. Supabase verifies the default Clerk session
 *      token directly against Clerk's JWKS. `getToken()` (no template) is
 *      sufficient.
 *
 * We try the template first because it's the older / wider-deployed path;
 * if Clerk says the template is not configured, we fall back to the default
 * session token. Either way, when the user is signed out we return `null`
 * and the Supabase client behaves as anonymous.
 */
async function getClerkAccessToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  const clerk = (window as unknown as ClerkOnWindow).Clerk;
  const session = clerk?.session;
  if (!session) return null;

  try {
    const token = await session.getToken({ template: 'supabase' });
    if (token) return token;
  } catch {
    // Template not configured — fall through to default token.
  }

  try {
    return await session.getToken();
  } catch {
    return null;
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  accessToken: getClerkAccessToken,
});
