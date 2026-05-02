import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyClerkToken } from './_auth';
import type {
    GenerateImageRequest,
    GenerateImageSuccess,
    GenerateImageQuotaFallback,
    GeneratedImagePayload,
    ImageGenUseCase,
} from './_types';

// ── Models ───────────────────────────────────────────────────────────────────

const ENRICHMENT_MODEL = 'gemini-2.5-flash';
const IMAGE_MODEL = 'imagen-3.0-generate-001';

const NUMBER_OF_IMAGES = 4;
const FALLBACK_NUMBER_OF_IMAGES = 1;

// ── Prompts / schema ─────────────────────────────────────────────────────────

const ENRICHMENT_SYSTEM_PROMPT = `You are an African visual arts director.

Your job is to take a user's brief and rewrite it into a concrete, culturally
authentic image-generation prompt for Imagen, while flagging anything that
should be avoided.

Rules:
- Be specific to the named culture/region. Never generalise "Africa" as a
  monolithic visual.
- Translate vague briefs into concrete visual nouns: garments, materials,
  setting, lighting, gesture, era, photographic / illustration style.
- Honour the named style and use-case. The use-case tells you where this
  image will live (social, banner, hero, portrait, print) — let it guide
  composition framing.
- If the brief leans on stereotypes or treats sacred regalia / symbols as
  decoration, redirect to a respectful alternative AND list the original
  problem in avoidanceNotes.
- Suggest a small palette (3–5 hex codes) aligned with the culture and tone.

Respond ONLY with JSON matching the schema. No prose outside JSON.`;

const ENRICHMENT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        enrichedPrompt: {
            type: Type.STRING,
            description:
                'The fully-rewritten generation prompt to feed into Imagen. ' +
                'Should be 2–5 sentences, concrete, visual, no preamble.',
        },
        culturalContext: {
            type: Type.STRING,
            description:
                '1–2 sentences summarising the cultural intent of this image — shown in the UI as a muted note under the grid.',
        },
        suggestedColors: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
                '3 to 5 CSS hex colour codes aligned with the culture and tone (e.g. "#C8102E").',
        },
        avoidanceNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
                'Things the prompt should explicitly avoid (sacred symbols used decoratively, stereotypes, anachronisms). Empty array if nothing is concerning.',
        },
    },
    required: [
        'enrichedPrompt',
        'culturalContext',
        'suggestedColors',
        'avoidanceNotes',
    ],
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const VALID_USE_CASES: ImageGenUseCase[] = [
    'social_media',
    'banner',
    'hero',
    'portrait',
    'print',
];

function aspectRatioForUseCase(useCase: string): string {
    switch (useCase) {
        case 'banner':
        case 'hero':
            return '16:9';
        case 'portrait':
        case 'print':
            return '9:16';
        case 'social_media':
        default:
            return '1:1';
    }
}

function buildEnrichmentUserPrompt(body: GenerateImageRequest): string {
    return [
        `Culture / region: ${body.culture}`,
        `Style: ${body.style || '(unspecified)'}`,
        `Use-case: ${body.useCase}`,
        `Audience: ${body.audience || '(unspecified)'}`,
        'Creator brief:',
        `"""${body.prompt.trim()}"""`,
        '',
        'Return enriched prompt + cultural context + palette + avoidance notes following the JSON schema strictly.',
    ].join('\n');
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.trim());
}

function normaliseHex(value: string): string | null {
    const trimmed = value.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`;
    return null;
}

interface EnrichmentResult {
    enrichedPrompt: string;
    culturalContext: string;
    suggestedColors: string[];
    avoidanceNotes: string[];
}

function normaliseEnrichment(
    raw: unknown,
    body: GenerateImageRequest,
): EnrichmentResult {
    const obj = (raw ?? {}) as Record<string, unknown>;

    const enrichedPrompt =
        typeof obj.enrichedPrompt === 'string' && obj.enrichedPrompt.trim()
            ? obj.enrichedPrompt.trim()
            : body.prompt.trim();

    const culturalContext =
        typeof obj.culturalContext === 'string' ? obj.culturalContext.trim() : '';

    const suggestedColors = asStringArray(obj.suggestedColors)
        .map(normaliseHex)
        .filter((v): v is string => v !== null);

    const avoidanceNotes = asStringArray(obj.avoidanceNotes);

    return { enrichedPrompt, culturalContext, suggestedColors, avoidanceNotes };
}

function validateBody(body: unknown): GenerateImageRequest | string {
    if (!body || typeof body !== 'object') return 'Request body must be JSON.';
    const b = body as Partial<GenerateImageRequest>;
    if (typeof b.prompt !== 'string' || b.prompt.trim().length === 0) {
        return 'Field "prompt" is required.';
    }
    if (b.prompt.length > 4000) {
        return 'Field "prompt" must be 4000 characters or fewer.';
    }
    if (typeof b.culture !== 'string' || b.culture.trim().length === 0) {
        return 'Field "culture" is required.';
    }
    if (typeof b.style !== 'string') {
        return 'Field "style" must be a string.';
    }
    if (typeof b.useCase !== 'string' || b.useCase.trim().length === 0) {
        return 'Field "useCase" is required.';
    }
    if (typeof b.audience !== 'string') {
        return 'Field "audience" must be a string.';
    }
    return {
        prompt: b.prompt,
        culture: b.culture,
        style: b.style,
        useCase: VALID_USE_CASES.includes(b.useCase as ImageGenUseCase)
            ? (b.useCase as ImageGenUseCase)
            : b.useCase,
        audience: b.audience,
    };
}

/**
 * Best-effort detection of "this Imagen call failed because of quota /
 * permissions" so we can return the structured fallback the UI wants instead
 * of a 500. We also treat any RAI-filter-only response as quota-equivalent.
 */
function isQuotaOrUnavailableError(err: unknown): boolean {
    if (!err) return false;
    const message =
        err instanceof Error ? err.message : String((err as { toString?: () => string }) ?? '');
    const lower = message.toLowerCase();
    return (
        lower.includes('quota') ||
        lower.includes('rate limit') ||
        lower.includes('429') ||
        lower.includes('resource_exhausted') ||
        lower.includes('permission_denied') ||
        lower.includes('403') ||
        lower.includes('not enabled') ||
        lower.includes('billing')
    );
}

// ── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Auth before anything that costs quota.
    const userId = await verifyClerkToken(req, res);
    if (!userId) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[creative/generate-image] GEMINI_API_KEY missing');
        return res.status(500).json({
            error: 'Server is missing GEMINI_API_KEY. Configure it in Vercel project env vars.',
        });
    }

    const validated = validateBody(req.body);
    if (typeof validated === 'string') {
        return res.status(400).json({ error: validated });
    }

    const ai = new GoogleGenAI({ apiKey });
    const aspectRatio = aspectRatioForUseCase(validated.useCase);

    // ── Step 1: prompt enrichment ────────────────────────────────────────────

    let enrichment: EnrichmentResult;
    try {
        const response = await ai.models.generateContent({
            model: ENRICHMENT_MODEL,
            contents: buildEnrichmentUserPrompt(validated),
            config: {
                systemInstruction: ENRICHMENT_SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: ENRICHMENT_SCHEMA,
                temperature: 0.7,
            },
        });

        let parsed: unknown = {};
        try {
            parsed = JSON.parse(response.text ?? '{}');
        } catch (parseErr) {
            console.error(
                '[creative/generate-image] enrichment JSON parse failed',
                parseErr,
                'raw:',
                response.text,
            );
        }
        enrichment = normaliseEnrichment(parsed, validated);
    } catch (err) {
        console.error('[creative/generate-image] enrichment failed', err);
        return res.status(502).json({
            error: 'Could not enrich the prompt. Please try again.',
        });
    }

    // ── Step 2: image generation ─────────────────────────────────────────────

    async function tryGenerate(
        numberOfImages: number,
    ): Promise<GeneratedImagePayload[]> {
        const response = await ai.models.generateImages({
            model: IMAGE_MODEL,
            prompt: enrichment.enrichedPrompt,
            config: {
                numberOfImages,
                aspectRatio,
            },
        });
        return (response.generatedImages ?? [])
            .map((g): GeneratedImagePayload | null => {
                const bytes = g.image?.imageBytes;
                if (!bytes) return null;
                return {
                    base64: bytes,
                    mimeType: g.image?.mimeType ?? 'image/png',
                };
            })
            .filter((v): v is GeneratedImagePayload => v !== null);
    }

    /**
     * Attempt N=4, then N=1 if the first call either:
     *   - threw a quota / unavailability-style error, OR
     *   - succeeded but returned zero images (RAI filter / empty result).
     *
     * Returns either a list of images or a "quota" outcome. Throws only on
     * non-recoverable, non-quota errors (which the caller maps to 502).
     */
    type GenerateOutcome =
        | { kind: 'images'; images: GeneratedImagePayload[] }
        | { kind: 'quota'; detail: string };

    async function generateWithFallback(): Promise<GenerateOutcome> {
        let firstQuotaErr: unknown = null;

        try {
            const images = await tryGenerate(NUMBER_OF_IMAGES);
            if (images.length > 0) return { kind: 'images', images };
            // Empty array — fall through to the N=1 retry below (RAI filter
            // path: the quota itself is fine, the prompt may have been
            // softened down to nothing).
            console.warn(
                '[creative/generate-image] zero images returned at N=4, retrying at N=1',
            );
        } catch (err) {
            if (!isQuotaOrUnavailableError(err)) {
                // Genuine, non-recoverable failure — propagate so the handler
                // returns 502.
                throw err;
            }
            firstQuotaErr = err;
            console.warn(
                '[creative/generate-image] N=4 rejected with quota-style error, retrying at N=1',
                err,
            );
        }

        // N=1 retry path.
        try {
            const images = await tryGenerate(FALLBACK_NUMBER_OF_IMAGES);
            if (images.length > 0) return { kind: 'images', images };
            return {
                kind: 'quota',
                detail:
                    'Imagen returned no usable images for this prompt (it may have been filtered).',
            };
        } catch (retryErr) {
            // If the original error was a quota error, treat any retry failure
            // as a quota outcome (the UI can still show the cultural context).
            // If the original call had succeeded with zero images, a non-quota
            // retry failure is a real error — surface it as 502.
            if (firstQuotaErr === null && !isQuotaOrUnavailableError(retryErr)) {
                throw retryErr;
            }
            const cause =
                retryErr instanceof Error
                    ? retryErr
                    : firstQuotaErr instanceof Error
                      ? firstQuotaErr
                      : null;
            return {
                kind: 'quota',
                detail:
                    cause?.message ?? 'Image generation is currently unavailable.',
            };
        }
    }

    let outcome: GenerateOutcome;
    try {
        outcome = await generateWithFallback();
    } catch (err) {
        console.error('[creative/generate-image] image generation failed', err);
        return res.status(502).json({
            error: 'Image generation failed. Please try again.',
        });
    }

    if (outcome.kind === 'quota') {
        const fallback: GenerateImageQuotaFallback = {
            error: 'IMAGE_GEN_UNAVAILABLE',
            detail: outcome.detail,
            enrichedPrompt: enrichment.enrichedPrompt,
            culturalContext: enrichment.culturalContext,
            avoidanceNotes: enrichment.avoidanceNotes,
            suggestedColors: enrichment.suggestedColors,
            aspectRatio,
        };
        return res.status(200).json(fallback);
    }

    const success: GenerateImageSuccess = {
        images: outcome.images,
        enrichedPrompt: enrichment.enrichedPrompt,
        culturalContext: enrichment.culturalContext,
        avoidanceNotes: enrichment.avoidanceNotes,
        suggestedColors: enrichment.suggestedColors,
        aspectRatio,
    };
    return res.status(200).json(success);
}
