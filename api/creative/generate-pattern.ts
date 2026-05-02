import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyClerkToken } from './_auth';
import type {
    GeneratePatternRequest,
    GeneratePatternResponse,
    PatternComplexity,
    PatternType,
} from './_types';

// ── Model + schema ───────────────────────────────────────────────────────────

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are an African textile and pattern design expert.

You generate clean, scalable SVG patterns inspired by specific African design
traditions (Kente, Ndebele, Adinkra, Berber, Ankara, Bògòlanfini, etc.) and
relate the design to its cultural origin honestly.

Hard SVG requirements (the consumer renders this directly via innerHTML):
- The SVG MUST start with "<svg" and end with "</svg>".
- The root <svg> MUST have viewBox="0 0 400 400" and MUST NOT set fixed
  width="..." or height="..." attributes — the host sizes the canvas.
- xmlns="http://www.w3.org/2000/svg" is required on the root.
- Use ONLY the colours given in the request (primary, secondary, optional
  accent). No other named/hex colours, no gradients pulled from elsewhere.
- If tileable=true, define a <pattern> inside <defs> and fill the canvas
  with a single <rect width="400" height="400"> referencing it. Otherwise
  emit shapes directly inside the root <svg>.
- Geometry only: <rect>, <circle>, <ellipse>, <line>, <polyline>, <polygon>,
  <path>, <pattern>, <defs>, <g>, <use>, <symbol>, <linearGradient>,
  <radialGradient>, <stop>. NO <script>, NO <foreignObject>, NO <image>,
  NO <iframe>, NO event handlers, NO external references (no http(s):, no
  data: in attributes other than fill/stroke colour values).
- No comments. No XML declaration. No DOCTYPE.

Cultural rules:
- The pattern name should be descriptive and specific.
- culturalOrigin should attribute the source culture clearly
  (e.g. "Kente — Akan people, Ghana"). If the user-chosen patternType does
  not map to a single people, use a regional attribution and say so.
- colorMeaning should explain what the chosen colours symbolise in the
  named tradition. Be concise.

Respond ONLY with JSON matching the schema. No prose outside JSON.`;

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        svgContent: {
            type: Type.STRING,
            description:
                'Complete, valid SVG markup starting with <svg ...> and ending with </svg>. viewBox="0 0 400 400", no fixed width/height. Uses only the requested colours. No script tags, no event handlers, no external refs.',
        },
        patternName: {
            type: Type.STRING,
            description: 'Short descriptive name for this specific pattern.',
        },
        culturalOrigin: {
            type: Type.STRING,
            description:
                'Origin attribution, e.g. "Kente — Akan people, Ghana".',
        },
        designNotes: {
            type: Type.STRING,
            description:
                '1–2 sentences describing the visual structure of the pattern.',
        },
        colorMeaning: {
            type: Type.STRING,
            description:
                'Cultural significance of the chosen colours in this tradition.',
        },
    },
    required: [
        'svgContent',
        'patternName',
        'culturalOrigin',
        'designNotes',
        'colorMeaning',
    ],
};

// ── Validation ───────────────────────────────────────────────────────────────

const VALID_PATTERN_TYPES: PatternType[] = [
    'tribal',
    'textile',
    'afrofuturistic',
    'geometric',
    'kente',
    'ndebele',
    'adinkra',
];

const VALID_COMPLEXITY: PatternComplexity[] = ['simple', 'medium', 'intricate'];

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

function validateBody(raw: unknown): GeneratePatternRequest | string {
    if (!raw || typeof raw !== 'object') return 'Request body must be JSON.';
    const b = raw as Partial<GeneratePatternRequest>;

    if (
        typeof b.patternType !== 'string' ||
        !VALID_PATTERN_TYPES.includes(b.patternType as PatternType)
    ) {
        return `Field "patternType" must be one of: ${VALID_PATTERN_TYPES.join(', ')}.`;
    }
    if (typeof b.primaryColor !== 'string' || !HEX_RE.test(b.primaryColor)) {
        return 'Field "primaryColor" must be a hex colour like "#E07B39".';
    }
    if (typeof b.secondaryColor !== 'string' || !HEX_RE.test(b.secondaryColor)) {
        return 'Field "secondaryColor" must be a hex colour like "#E07B39".';
    }
    if (typeof b.accentColor !== 'string') {
        return 'Field "accentColor" must be a string ("" if unused).';
    }
    if (b.accentColor !== '' && !HEX_RE.test(b.accentColor)) {
        return 'Field "accentColor" must be a hex colour or an empty string.';
    }
    if (
        typeof b.complexity !== 'string' ||
        !VALID_COMPLEXITY.includes(b.complexity as PatternComplexity)
    ) {
        return `Field "complexity" must be one of: ${VALID_COMPLEXITY.join(', ')}.`;
    }
    if (typeof b.tileable !== 'boolean') {
        return 'Field "tileable" must be a boolean.';
    }
    return {
        patternType: b.patternType as PatternType,
        primaryColor: b.primaryColor,
        secondaryColor: b.secondaryColor,
        accentColor: b.accentColor,
        complexity: b.complexity as PatternComplexity,
        tileable: b.tileable,
    };
}

// ── Prompt assembly ──────────────────────────────────────────────────────────

function buildUserPrompt(body: GeneratePatternRequest): string {
    const accentLine = body.accentColor
        ? `Accent colour: ${body.accentColor}`
        : 'Accent colour: (none — use only primary + secondary)';
    return [
        `Pattern type: ${body.patternType}`,
        `Complexity: ${body.complexity}`,
        `Primary colour: ${body.primaryColor}`,
        `Secondary colour: ${body.secondaryColor}`,
        accentLine,
        `Tileable: ${body.tileable}`,
        '',
        'Generate the pattern per the JSON schema. Respect the colour palette strictly. Make it culturally authentic to the named tradition.',
    ].join('\n');
}

// ── SVG sanitisation ─────────────────────────────────────────────────────────

/**
 * Best-effort server-side strip of dangerous SVG bits before we hand the
 * markup back to the client. The client also runs DOMPurify (defence in
 * depth) — this layer just refuses to forward markup that isn't an SVG and
 * removes the obvious script vectors so the wire response is already safe.
 *
 * Returns the cleaned markup or null if the input doesn't look like an SVG.
 */
function sanitiseSvg(input: string): string | null {
    if (typeof input !== 'string') return null;

    // Pull just the <svg...>...</svg> block. Models sometimes wrap with
    // ```svg ... ``` fences or add stray prose.
    const match = input.match(/<svg[\s\S]*?<\/svg>/i);
    if (!match) return null;
    let svg = match[0];

    // Remove XML processing instructions / DOCTYPE if any leaked in.
    svg = svg
        .replace(/<\?xml[\s\S]*?\?>/gi, '')
        .replace(/<!DOCTYPE[\s\S]*?>/gi, '');

    // Strip <script>...</script> wholesale.
    svg = svg.replace(/<script[\s\S]*?<\/script>/gi, '');
    // Strip <foreignObject>...</foreignObject> (HTML escape hatch).
    svg = svg.replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, '');
    // Strip raster <image> tags entirely (no remote / data refs).
    svg = svg.replace(/<image\b[\s\S]*?(?:\/>|<\/image>)/gi, '');
    // Strip <iframe>, just in case.
    svg = svg.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

    // Remove event handler attributes (on*="..." / on*='...').
    svg = svg.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
    svg = svg.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');

    // Strip javascript: URLs in href / xlink:href.
    svg = svg.replace(
        /\s(?:xlink:)?href\s*=\s*"javascript:[^"]*"/gi,
        '',
    );
    svg = svg.replace(
        /\s(?:xlink:)?href\s*=\s*'javascript:[^']*'/gi,
        '',
    );

    return svg;
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Confirm the SVG only references colours from the requested palette. We
 * scan for hex colours that aren't whitelisted and reject; this guards
 * against the model ignoring the colour constraint and shipping arbitrary
 * palette choices.
 */
function paletteMismatchReason(
    svg: string,
    body: GeneratePatternRequest,
): string | null {
    const palette = new Set<string>();
    palette.add(body.primaryColor.toLowerCase());
    palette.add(body.secondaryColor.toLowerCase());
    if (body.accentColor) palette.add(body.accentColor.toLowerCase());
    // Allow common neutral fallbacks the model may use for stroke="none" /
    // fill="none" / transparency. We don't want to reject these.
    palette.add('none');
    palette.add('transparent');
    palette.add('currentcolor');

    // Pull all hex colours and compare.
    const hexes = svg.match(/#[0-9a-fA-F]{3,6}\b/g) ?? [];
    for (const hex of hexes) {
        if (!palette.has(hex.toLowerCase())) {
            return `Pattern referenced colour "${hex}" outside the chosen palette.`;
        }
    }
    return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function pickString(obj: Record<string, unknown>, key: string): string {
    const v = obj[key];
    return typeof v === 'string' ? v.trim() : '';
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

    const userId = await verifyClerkToken(req, res);
    if (!userId) return;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[creative/generate-pattern] GEMINI_API_KEY missing');
        return res.status(500).json({
            error: 'Server is missing GEMINI_API_KEY. Configure it in Vercel project env vars.',
        });
    }

    const validated = validateBody(req.body);
    if (typeof validated === 'string') {
        return res.status(400).json({ error: validated });
    }

    const ai = new GoogleGenAI({ apiKey });

    let parsed: Record<string, unknown> = {};
    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: buildUserPrompt(validated),
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: RESPONSE_SCHEMA,
                temperature: 0.6,
            },
        });
        try {
            parsed = JSON.parse(response.text ?? '{}') as Record<string, unknown>;
        } catch (parseErr) {
            console.error(
                '[creative/generate-pattern] JSON parse failed',
                parseErr,
                'raw:',
                response.text,
            );
            return res.status(502).json({
                error: 'Pattern generator returned malformed JSON.',
            });
        }
    } catch (err) {
        console.error('[creative/generate-pattern] generation failed', err);
        return res.status(502).json({
            error: 'Pattern generator is currently unavailable. Please try again.',
        });
    }

    const rawSvg = pickString(parsed, 'svgContent');
    const svg = rawSvg ? sanitiseSvg(rawSvg) : null;
    if (!svg) {
        console.error(
            '[creative/generate-pattern] no usable SVG in response',
            rawSvg.slice(0, 200),
        );
        return res.status(502).json({
            error: 'Pattern generator did not return a valid SVG.',
        });
    }

    const paletteIssue = paletteMismatchReason(svg, validated);
    if (paletteIssue) {
        console.warn('[creative/generate-pattern]', paletteIssue);
        // Don't 502 — the caller likely just wants to retry. Surfacing this as
        // a 4xx-style error keeps the contract simple.
        return res.status(502).json({
            error: paletteIssue + ' Please try again.',
        });
    }

    const result: GeneratePatternResponse = {
        svgContent: svg,
        patternName:
            pickString(parsed, 'patternName') || titleForType(validated.patternType),
        culturalOrigin: pickString(parsed, 'culturalOrigin'),
        designNotes: pickString(parsed, 'designNotes'),
        colorMeaning: pickString(parsed, 'colorMeaning'),
    };
    return res.status(200).json(result);
}

function titleForType(t: PatternType): string {
    switch (t) {
        case 'afrofuturistic':
            return 'Afro-futuristic Composition';
        case 'kente':
            return 'Kente Weave';
        case 'ndebele':
            return 'Ndebele Geometry';
        case 'adinkra':
            return 'Adinkra Composition';
        default:
            return `${t.charAt(0).toUpperCase()}${t.slice(1)} Pattern`;
    }
}
