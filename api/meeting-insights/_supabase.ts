import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Thrown when a required environment variable is missing at first access.
 * Handlers should catch this and surface a clean JSON 500 instead of letting
 * it propagate as a Vercel FUNCTION_INVOCATION_FAILED.
 */
export class MissingEnvError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'MissingEnvError';
    }
}

let cached: SupabaseClient | null = null;

function getClient(): SupabaseClient {
    if (cached) return cached;
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        throw new MissingEnvError(
            'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure them in Vercel project env vars.',
        );
    }
    cached = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    return cached;
}

/**
 * Lazy-initialized Supabase service-role client.
 *
 * Importing this module no longer throws when env vars are unset; the env
 * check is deferred to the first property access. Combined with handler-
 * level try/catch on `MissingEnvError`, this turns a Vercel FUNCTION_INVOCATION_FAILED
 * into a debuggable JSON 500 with a clear message.
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
    get(_target, prop, receiver) {
        return Reflect.get(getClient(), prop, receiver);
    },
});
