<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1CCDbqTr4f__r60q46vBQI0WZKe5hHULp

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set up `.env.local` with the **client-side** keys only:
   ```
   VITE_CLERK_PUBLISHABLE_KEY=pk_test_...   # development instance, not pk_live_
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ```
   **Do not put `GEMINI_API_KEY` in `.env.local`.** It is a server-only secret
   that must be set as an environment variable on the Vercel project (Production
   + Preview), where the API routes under `/api/*` read it via
   `process.env.GEMINI_API_KEY`. Inlining a server key into the Vite client
   bundle would expose it to anyone who downloads the site (this was security
   finding F-01, fixed in May 2026).
3. Run the app:
   `npm run dev`

## Server-side environment (Vercel)

Set these in **Project Settings → Environment Variables** on Vercel — never in
`.env.local`, since `.env.local` is consumed by the Vite client bundle:

```
GEMINI_API_KEY=...                 # required by every /api/* route
SUPABASE_URL=...                   # not VITE_-prefixed; used by service-role admin
SUPABASE_SERVICE_ROLE_KEY=...      # used only inside /api/*
CLERK_SECRET_KEY=...               # used only inside /api/* for Bearer auth
```
