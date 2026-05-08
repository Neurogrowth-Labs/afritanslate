/**
 * Re-export of the shared language-name table at `shared/languageNames.ts`.
 *
 * The table itself moved to `shared/` so the Vercel serverless function in
 * `api/gemini-proxy.ts` can import it without dragging in any client-only
 * code. This file remains as the canonical client-side import path.
 */
export { LANGUAGE_NAMES, getLanguageName } from '../../shared/languageNames';
