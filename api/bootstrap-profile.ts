import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';

import { verifyClerkBearer } from './_lib/auth.js';

/**
 * POST /api/bootstrap-profile
 *
 * Atomic profile bootstrap for a signed-in Clerk user. Replaces the
 * SECURITY DEFINER RPC `public.bootstrap_clerk_profile` from PR #19
 * (which was rolled back before being applied because it trusted the
 * client-supplied email and enabled legacy-profile takeover).
 *
 * Auth model:
 *   - Caller must present a valid Clerk Bearer token. We extract
 *     `sub` via `verifyClerkBearer`.
 *   - The user's verified primary email is fetched from the Clerk
 *     Backend API using `CLERK_SECRET_KEY` — never trusted from the
 *     request body. This is the critical fix; the prior RPC took the
 *     email as an argument, so any signed-in user could pass any
 *     other user's email and steal the legacy profile.
 *
 * Behavior:
 *   1. If a profile already exists with id === clerk sub, update
 *      email/name (in case primary email changed in Clerk) and return
 *      it with was_inserted=false.
 *   2. Else if a legacy profile exists with the verified email and a
 *      non-Clerk id (UUID-shaped, pre-Clerk Supabase Auth era),
 *      migrate the row's id to the Clerk sub and re-key the foreign
 *      tables that scope by user_id. Return with was_inserted=false.
 *   3. Else insert a brand-new profile with id = clerk sub. Return
 *      with was_inserted=true.
 *
 * All Supabase writes are performed with the service-role key, which
 * bypasses RLS. RLS still protects every other code path; this
 * endpoint is the only place outside SQL Editor that can write to
 * arbitrary profiles.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const clerkUserId = await verifyClerkBearer(req, res);
    if (!clerkUserId) return;

    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
        res.status(500).json({
            error: 'Server is missing CLERK_SECRET_KEY. Configure it in Vercel project env vars.',
        });
        return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceRoleKey) {
        res.status(500).json({
            error: 'Server is missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Configure them in Vercel project env vars.',
        });
        return;
    }

    // 1. Fetch the verified primary email from Clerk by sub. We never
    //    trust the request body for the email — the RPC variant that
    //    did was a profile-takeover vector (see PR #19 review).
    let primaryEmail: string;
    let displayName: string;
    try {
        const clerk = createClerkClient({ secretKey });
        const user = await clerk.users.getUser(clerkUserId);
        const primary = user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId);
        if (!primary || primary.verification?.status !== 'verified') {
            res.status(400).json({
                error: 'Your Clerk account is missing a verified primary email address.',
            });
            return;
        }
        primaryEmail = primary.emailAddress;
        displayName =
            user.fullName ||
            [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
            user.username ||
            primaryEmail.split('@')[0] ||
            'AfriTranslate User';
    } catch (err) {
        console.error('[bootstrap-profile] Clerk user lookup failed', err);
        res.status(502).json({ error: 'Failed to fetch user from Clerk' });
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    try {
        // 2. Already migrated — caller's Clerk id is the row id.
        const { data: existing, error: existingErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', clerkUserId)
            .maybeSingle();
        if (existingErr) throw existingErr;

        if (existing) {
            const updates: Record<string, unknown> = {};
            if (existing.email !== primaryEmail) updates.email = primaryEmail;
            if (!existing.name || existing.name === '') updates.name = displayName;

            if (Object.keys(updates).length > 0) {
                const { data: updated, error: updateErr } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', clerkUserId)
                    .select('*')
                    .single();
                if (updateErr) throw updateErr;
                res.status(200).json({ profile: updated, was_inserted: false });
                return;
            }

            res.status(200).json({ profile: existing, was_inserted: false });
            return;
        }

        // 3. Legacy profile — found by verified email, with a non-Clerk id.
        const { data: legacy, error: legacyErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', primaryEmail)
            .maybeSingle();
        if (legacyErr) throw legacyErr;

        if (legacy) {
            if (typeof legacy.id === 'string' && legacy.id.startsWith('user_')) {
                // Same email maps to a different Clerk user — refuse.
                // This shouldn't happen in practice because case 2
                // already handled "caller's Clerk id" and Clerk
                // enforces email uniqueness across accounts.
                res.status(409).json({
                    error: 'A profile already exists for this email under a different Clerk user.',
                });
                return;
            }

            const legacyId = legacy.id as string;
            const { data: migrated, error: migrateErr } = await supabase
                .from('profiles')
                .update({
                    id: clerkUserId,
                    email: primaryEmail,
                    name: legacy.name && legacy.name !== '' ? legacy.name : displayName,
                })
                .eq('id', legacyId)
                .select('*')
                .single();
            if (migrateErr) throw migrateErr;

            // Re-key the foreign tables that scope by user_id. The Supabase
            // client returns { data, error } and does NOT throw on database
            // errors, so each result is inspected and the first error is
            // re-thrown to surface a 500 to the caller. Without this, a
            // partial migration would silently return 200 to the user with
            // their conversations/meetings/glossaries still orphaned under
            // the legacy id.
            const rekeyTables = [
                'conversations',
                'scheduled_meetings',
                'meeting_summaries',
                'brand_glossaries',
            ] as const;
            const rekeyResults = await Promise.all(
                rekeyTables.map((table) =>
                    supabase.from(table).update({ user_id: clerkUserId }).eq('user_id', legacyId),
                ),
            );
            for (let i = 0; i < rekeyResults.length; i++) {
                const { error } = rekeyResults[i];
                if (error) {
                    console.error(
                        `[bootstrap-profile] re-key failed for table ${rekeyTables[i]}`,
                        error,
                    );
                    throw error;
                }
            }

            res.status(200).json({ profile: migrated, was_inserted: false });
            return;
        }

        // 4. Brand-new profile. Matches the defaults the removed
        //    bootstrap_clerk_profile RPC used (`plan='Premium'`,
        //    `trial_start_date=NOW()`) so new users still get the
        //    7-day Pro trial advertised on the landing page. The
        //    trial transitions to Free automatically after 7 days
        //    via src/utils/trialUtils.ts.
        const { data: inserted, error: insertErr } = await supabase
            .from('profiles')
            .insert({
                id: clerkUserId,
                email: primaryEmail,
                name: displayName,
                role: 'user',
                plan: 'Premium',
                trial_start_date: new Date().toISOString(),
                onboarding_completed: false,
            })
            .select('*')
            .single();
        if (insertErr) throw insertErr;

        res.status(200).json({ profile: inserted, was_inserted: true });
    } catch (err) {
        console.error('[bootstrap-profile] supabase write failed', err);
        const message = err instanceof Error ? err.message : 'Profile bootstrap failed.';
        res.status(500).json({ error: message });
    }
}
