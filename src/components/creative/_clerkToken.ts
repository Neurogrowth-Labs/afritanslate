/**
 * Read a Clerk session token from the global Clerk client.
 *
 * Mirrors the pattern used by `src/services/meetingInsightsClient.ts` so all
 * paid server-side AI endpoints can use a single mechanism. Returns `null`
 * when no session exists (rather than throwing) so each caller can decide
 * how to surface the unauth state.
 */
export async function getClerkToken(): Promise<string | null> {
    const clerk = (
        window as unknown as {
            Clerk?: {
                session?: { getToken: () => Promise<string | null> };
            };
        }
    ).Clerk;
    try {
        return (await clerk?.session?.getToken()) ?? null;
    } catch {
        return null;
    }
}
