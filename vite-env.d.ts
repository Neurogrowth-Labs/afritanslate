/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  // Gemini keys are intentionally NOT declared here. They are server-only
  // (process.env.GEMINI_API_KEY in Vercel API routes); declaring them on
  // ImportMetaEnv would imply they are available in the client bundle,
  // which they must never be.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
