/**
 * Shared types for the /api/creative routes.
 *
 * The shapes below are also imported by client code through
 * `src/types.ts` re-exports — keep them stable.
 */

export type CulturalRegion =
    | 'Pan-African'
    | 'West Africa'
    | 'East Africa'
    | 'Southern Africa'
    | 'North Africa'
    | 'Central Africa'
    | 'African Diaspora';

export type CulturalTone =
    | 'Inspirational'
    | 'Documentary'
    | 'Dramatic'
    | 'Festive'
    | 'Reflective'
    | 'Promotional';

export interface CulturalSuggestionsRequest {
    prompt: string;
    region: string;
    tone: string;
    /** Optional creative goal / context (e.g. "Promotional", "Storytelling"). */
    goal?: string;
}

export interface CulturalColorSwatch {
    name: string;
    hex: string;
    meaning: string;
}

export type CulturalWarningSeverity = 'high' | 'medium' | 'low';

export interface CulturalWarning {
    issue: string;
    reason: string;
    severity: CulturalWarningSeverity;
}

export interface CulturalSuggestionsResponse {
    /** Free-form notes about the cultural context for this prompt. */
    culturalNotes: string[];
    /** Concrete visual / narrative elements the AI recommends including. */
    suggestedElements: string[];
    /** Colour palette aligned with the region, with cultural meaning per swatch. */
    colorPalette: CulturalColorSwatch[];
    /** Symbolism the user should consider invoking (or avoiding). */
    symbolism: string[];
    /** Anything in the prompt that risks being insensitive or misrepresentative. */
    warningFlags: CulturalWarning[];
}
