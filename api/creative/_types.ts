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

// ── Image generation (Phase B) ───────────────────────────────────────────────

/**
 * Use-cases the client can pick. The server uses these to derive the Imagen
 * aspect ratio:
 *   "social_media" → "1:1"
 *   "banner" | "hero" → "16:9"
 *   "portrait" | "print" → "9:16"
 *   default → "1:1"
 */
export type ImageGenUseCase =
    | 'social_media'
    | 'banner'
    | 'hero'
    | 'portrait'
    | 'print';

export interface GenerateImageRequest {
    prompt: string;
    culture: string;
    style: string;
    useCase: ImageGenUseCase | string;
    audience: string;
}

/** A single image returned by the route. */
export interface GeneratedImagePayload {
    /** Raw base64 (no data: prefix) so the client can choose how to render. */
    base64: string;
    /** e.g. "image/png", "image/jpeg". */
    mimeType: string;
}

export interface GenerateImageSuccess {
    images: GeneratedImagePayload[];
    enrichedPrompt: string;
    culturalContext: string;
    avoidanceNotes: string[];
    suggestedColors: string[];
    aspectRatio: string;
}

/**
 * Returned with HTTP 200 *and* an explicit error code when the prompt
 * enrichment succeeded but the Imagen call failed (most commonly because of
 * quota). The UI uses this to keep showing the cultural context while
 * substituting placeholder tiles for the missing imagery.
 */
export interface GenerateImageQuotaFallback {
    error: 'IMAGE_GEN_UNAVAILABLE';
    /** Human-readable reason from the underlying SDK, surfaced to the user. */
    detail: string;
    enrichedPrompt: string;
    culturalContext: string;
    avoidanceNotes: string[];
    suggestedColors: string[];
    aspectRatio: string;
}

export type GenerateImageResponse =
    | GenerateImageSuccess
    | GenerateImageQuotaFallback;
