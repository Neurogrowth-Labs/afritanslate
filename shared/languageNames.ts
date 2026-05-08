/**
 * Shared language-code → human-readable name table.
 *
 * Single source of truth for both client (`src/utils/languageMapping.ts`
 * and consumers thereof) and server (`api/gemini-proxy.ts`). This module
 * is dependency-free so it can be imported from a Vercel serverless
 * function without pulling React, the `LANGUAGES` mega-array, or any of
 * the other client-only payload that lives in `constants.ts`.
 */

export const LANGUAGE_NAMES: Record<string, string> = {
    en: 'English',
    sw: 'Swahili (Kiswahili)',
    zu: 'Zulu (isiZulu)',
    xh: 'Xhosa (isiXhosa)',
    af: 'Afrikaans',
    yo: 'Yoruba',
    ig: 'Igbo',
    ha: 'Hausa',
    am: 'Amharic',
    om: 'Oromo',
    so: 'Somali',
    rw: 'Kinyarwanda',
    sn: 'Shona (chiShona)',
    st: 'Sesotho',
    tn: 'Setswana',
    ts: 'Tsonga',
    wo: 'Wolof',
    fr: 'French',
    pt: 'Portuguese',
    ar: 'Arabic',
    ss: 'Swati',
    nr: 'Ndebele',
    ve: 'Venda',
};

export function getLanguageName(code: string): string {
    return LANGUAGE_NAMES[code] ?? code;
}
