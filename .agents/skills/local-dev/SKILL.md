---
name: afritanslate-local-dev
description: How to boot AfriTranslate locally with Clerk auth working. Covers the pk_test_ vs pk_live_ requirement, the .env.local layout, and the dev-server URL. Use this any time you need to run the app on localhost.
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
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder...
```

Supabase placeholders are fine for surfaces that don't hit the DB (LandingPage, sign-in, Clerk widget, public info views). Real Supabase creds are only needed for signed-in features.

## Clerk: pk_test_ vs pk_live_ — important

`index.tsx` requires `VITE_CLERK_PUBLISHABLE_KEY`. Two key types behave very differently:

- **`pk_test_*` (Clerk Development instance)** — works on **any** domain including `localhost`. Use this for local dev.
- **`pk_live_*` (Clerk Production instance)** — domain-restricted to `studio.afritranslate.co.za` only. On localhost it throws inside `<ClerkProviderBase>` with `Clerk: Production Keys are only allowed for domain "studio.afritranslate.co.za". The Request HTTP Origin header must be equal to or a subdomain of the requesting URL.` and the entire app renders as a blank black page (no error boundary). Symptom = blank screen; fix = swap to a `pk_test_` key.

Get a `pk_test_` key from https://dashboard.clerk.com/last-active?path=api-keys — the top-left dropdown switches between Production and Development; pick Development, then API Keys.

The key is saved as a user-scoped secret named `VITE_CLERK_PUBLISHABLE_KEY` and is exposed to the shell as `$VITE_CLERK_PUBLISHABLE_KEY`. Plumb it into `.env.local` like:

```bash
cat > .env.local <<EOF
VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder...
EOF
```

## Common build/lint/test commands

- `npm run build` — Vite production build (typecheck via TS happens here).
- `npm run dev` — Vite dev server.
- `npm run preview` — preview the production build locally.
- No standalone lint/typecheck/test scripts in `package.json`. CI is just Devin Review.

## Live entry point — read this before refactoring

The live entry is `index.tsx` → `./src/App` (`src/App.tsx`). The repo also contains a top-level `App.tsx` and `src/components/Auth.tsx` that look like real code but are **not mounted anywhere** (dead code). Before editing anything related to login/auth or top-level layout, confirm you're working in `src/App.tsx`, not the unused root-level files.
