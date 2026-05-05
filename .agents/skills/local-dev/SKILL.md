---
name: afritanslate-local-dev
description: How to boot AfriTranslate locally with Clerk auth and Supabase working. Covers the pk_test_ vs pk_live_ requirement, the placeholder-Supabase trap, the .env.local layout, and the dev-server URL. Use this any time you need to run the app on localhost.
---

# Local development

## Boot

```bash
npm install            # only first time
npm run dev            # Vite on http://localhost:3000
```

Vite reads `.env.local` at start. After editing it, kill and restart Vite — HMR does not re-read env.

## Required env vars in `.env.local`

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

All three are required to reach the signed-in shell. The previous version of this skill claimed Supabase placeholders were fine for unauth surfaces — that's still true for the LandingPage and Clerk SignIn widget themselves, but **`src/App.tsx:780-866` runs a `bootstrapProfile` effect on every successful sign-in** that hits Supabase for a `profiles` row. With placeholder Supabase values the request resolves to `https://placeholder.supabase.co/rest/v1/profiles?...` (DNS doesn't resolve, status 0), the effect throws, and the app renders the **"We could not load your studio profile / Failed to load your profile"** error screen with only a Sign Out button. The signed-in shell is unreachable.

The symptom looks like a code bug; the actual cause is the placeholder Supabase URL.

## Permanent secrets (saved across all future sessions)

Three user-scoped secrets are saved on this user's account:

| Secret | Value | Used by |
|---|---|---|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_test_*` (Clerk Development instance) | `index.tsx` Clerk provider |
| `VITE_SUPABASE_URL` | `https://<project>.supabase.co` | `supabaseClient.ts` |
| `VITE_SUPABASE_ANON_KEY` | anon JWT | `supabaseClient.ts` |

All three are exposed to the shell as env vars by the same names. Plumb all three into `.env.local` like:

```bash
cat > .env.local <<EOF
VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
VITE_SUPABASE_URL=$VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
EOF
```

Then `npm run dev` and you can sign in and reach the signed-in shell on localhost without any further user interaction.

If any of the three are missing in a future session, request them via the secrets tool with `should_save=true`/`save_scope=user` so subsequent sessions inherit them. Devin Secrets Needed: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Clerk: pk_test_ vs pk_live_ — important

`index.tsx` requires `VITE_CLERK_PUBLISHABLE_KEY`. Two key types behave very differently:

- **`pk_test_*` (Clerk Development instance)** — works on **any** domain including `localhost`. Use this for local dev.
- **`pk_live_*` (Clerk Production instance)** — domain-restricted to `studio.afritranslate.co.za` only. On localhost it throws inside `<ClerkProviderBase>` with `Clerk: Production Keys are only allowed for domain "studio.afritranslate.co.za". The Request HTTP Origin header must be equal to or a subdomain of the requesting URL.` and the entire app renders as a blank black page (no error boundary). Symptom = blank screen; fix = swap to a `pk_test_` key.

Get a `pk_test_` key from https://dashboard.clerk.com/last-active?path=api-keys — the top-left dropdown switches between Production and Development; pick Development, then API Keys.

## Clerk new-device 2FA

Fresh sign-ins from this VM trigger Clerk's new-device email-code 2FA ("Check your email — You're signing in from a new device"). The user must forward the 6-digit code from the test account's inbox. It's a one-time per VM identity — once you complete it, subsequent sign-ins on the same VM do not re-prompt.

Clerk also runs HaveIBeenPwned breach-check on every password attempt; previously-breached passwords are rejected with **"Password compromised"**. If this happens, ask the user for a fresh non-breached password (random pass-phrase from a password manager works).

## Common build/lint/test commands

- `npm run build` — Vite production build (typecheck via TS happens here).
- `npm run dev` — Vite dev server.
- `npm run preview` — preview the production build locally.
- No standalone lint/typecheck/test scripts in `package.json`. CI is just Devin Review.

## Live entry point — read this before refactoring

The live entry is `index.tsx` → `./src/App` (`src/App.tsx`). The repo also contains a top-level `App.tsx` and `src/components/Auth.tsx` that look like real code but are **not mounted anywhere** (dead code). Before editing anything related to login/auth or top-level layout, confirm you're working in `src/App.tsx`, not the unused root-level files.

## Bootstrap-profile defaults to study before testing plan-gated UI

The profile insert at `src/App.tsx:812-822` hard-codes `role: 'user'` and `plan: 'Premium'`. Newly bootstrapped accounts will not satisfy plan/role gates that require other values:

- `currentUser.role === 'admin'` (e.g. AdminPortal at `src/App.tsx:444`)
- `user.plan === 'Training'` (e.g. ProfileDashboard team-invite block at `src/components/ProfileDashboard.tsx:241`)

To test those surfaces at runtime, either flip the row in Supabase before signing in, or use the asset-equivalent shell-grep + Tailwind-compile-runtime-proof pattern documented in `testing-the-app/SKILL.md`.
