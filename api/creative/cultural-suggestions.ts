import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import type {
    CulturalSuggestionsRequest,
    CulturalSuggestionsResponse,
} from './_types';

const MODEL_NAME = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are an African cultural creative consultant.

You advise filmmakers, designers, and storytellers on how to portray African
cultures with depth, accuracy, and respect. Your guidance must be:

- Specific to the region named (do not generalize "Africa" as monolithic).
- Concrete and visual (clothing, materials, lighting, environment, gesture,
  music cadence, ritual context) — not abstract.
- Honest about risk: if a prompt leans on stereotypes, conflates cultures,
  or treats sacred symbols as decoration, flag it clearly.
- Practical: every suggestion should be usable by someone briefing an
  AI video / image generator.

You will respond ONLY with JSON matching the requested schema. No prose
outside the JSON.`;

const RESPONSE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        culturalNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
                '3 to 6 concise notes about the cultural context relevant to the prompt and region.',
        },
        suggestedElements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
                '4 to 8 concrete visual or narrative elements (e.g. wardrobe, props, environment, sound) that would deepen authenticity.',
        },
        colorPalette: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    hex: {
                        type: Type.STRING,
                        description:
                            'CSS hex colour starting with # (e.g. "#C8102E").',
                    },
                    meaning: { type: Type.STRING },
                },
                required: ['name', 'hex', 'meaning'],
            },
            description:
                '3 to 6 colours aligned with the region. Each entry needs a hex code and the cultural meaning of that colour.',
        },
        symbolism: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description:
                '3 to 6 symbols, motifs, or recurring imagery the creator could invoke (or should explicitly avoid). Mark items the creator should AVOID with the word "Avoid:" at the start.',
        },
        warningFlags: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    issue: {
                        type: Type.STRING,
                        description:
                            'Short label of the cultural risk (e.g. "Sacred regalia used decoratively").',
                    },
                    reason: {
                        type: Type.STRING,
                        description:
                            'Why this is a problem and what the impact would be.',
                    },
                    severity: {
                        type: Type.STRING,
                        description: 'One of "high", "medium", "low".',
                    },
                },
                required: ['issue', 'reason', 'severity'],
            },
            description:
                'Anything in the prompt that risks being culturally insensitive, inaccurate, or misrepresentative. Empty array if nothing is concerning.',
        },
    },
    required: [
        'culturalNotes',
        'suggestedElements',
        'colorPalette',
        'symbolism',
        'warningFlags',
    ],
};

function buildUserPrompt(body: CulturalSuggestionsRequest): string {
    const goal = body.goal?.trim() || 'general creative use';
    return [
        `Region: ${body.region}`,
        `Tone: ${body.tone}`,
        `Creative goal: ${goal}`,
        'Prompt from creator:',
        `"""${body.prompt.trim()}"""`,
        '',
        'Return cultural guidance for this brief, following the JSON schema strictly.',
    ].join('\n');
}

function clampSeverity(value: unknown): 'high' | 'medium' | 'low' {
    const v = typeof value === 'string' ? value.toLowerCase() : '';
    if (v === 'high' || v === 'medium' || v === 'low') return v;
    return 'medium';
}

function normaliseHex(value: unknown): string {
    if (typeof value !== 'string') return '#888888';
    const trimmed = value.trim();
    if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
    if (/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return `#${trimmed}`;
    return '#888888';
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
        .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
        .map((v) => v.trim());
}

function normaliseResponse(raw: unknown): CulturalSuggestionsResponse {
    const obj = (raw ?? {}) as Record<string, unknown>;

    const colorPalette = Array.isArray(obj.colorPalette)
        ? (obj.colorPalette as Array<Record<string, unknown>>)
              .map((entry) => ({
                  name: typeof entry.name === 'string' ? entry.name : 'Unnamed',
                  hex: normaliseHex(entry.hex),
                  meaning:
                      typeof entry.meaning === 'string' ? entry.meaning : '',
              }))
              .filter((entry) => entry.name && entry.meaning)
        : [];

    const warningFlags = Array.isArray(obj.warningFlags)
        ? (obj.warningFlags as Array<Record<string, unknown>>)
              .map((entry) => ({
                  issue: typeof entry.issue === 'string' ? entry.issue : '',
                  reason:
                      typeof entry.reason === 'string' ? entry.reason : '',
                  severity: clampSeverity(entry.severity),
              }))
              .filter((entry) => entry.issue && entry.reason)
        : [];

    return {
        culturalNotes: asStringArray(obj.culturalNotes),
        suggestedElements: asStringArray(obj.suggestedElements),
        colorPalette,
        symbolism: asStringArray(obj.symbolism),
        warningFlags,
    };
}

function validateBody(body: unknown): CulturalSuggestionsRequest | string {
    if (!body || typeof body !== 'object') return 'Request body must be JSON.';
    const b = body as Partial<CulturalSuggestionsRequest>;
    if (typeof b.prompt !== 'string' || b.prompt.trim().length === 0) {
        return 'Field "prompt" is required.';
    }
    if (b.prompt.length > 4000) {
        return 'Field "prompt" must be 4000 characters or fewer.';
    }
    if (typeof b.region !== 'string' || b.region.trim().length === 0) {
        return 'Field "region" is required.';
    }
    if (typeof b.tone !== 'string' || b.tone.trim().length === 0) {
        return 'Field "tone" is required.';
    }
    if (b.goal !== undefined && typeof b.goal !== 'string') {
        return 'Field "goal" must be a string when provided.';
    }
    return {
        prompt: b.prompt,
        region: b.region,
        tone: b.tone,
        goal: b.goal,
    };
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[creative/cultural-suggestions] GEMINI_API_KEY missing');
        return res.status(500).json({
            error: 'Server is missing GEMINI_API_KEY. Configure it in Vercel project env vars.',
        });
    }

    const validated = validateBody(req.body);
    if (typeof validated === 'string') {
        return res.status(400).json({ error: validated });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: buildUserPrompt(validated) }],
                },
            ],
            config: {
                systemInstruction: SYSTEM_PROMPT,
                responseMimeType: 'application/json',
                responseSchema: RESPONSE_SCHEMA,
                temperature: 0.55,
            },
        });

        const text = response.text;
        if (!text || !text.trim()) {
            console.error(
                '[creative/cultural-suggestions] Gemini returned empty text',
            );
            return res.status(502).json({
                error: 'Cultural consultant did not return any guidance. Try again.',
            });
        }

        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch (err) {
            console.error(
                '[creative/cultural-suggestions] JSON parse failed',
                err,
                text.slice(0, 400),
            );
            return res.status(502).json({
                error: 'Cultural consultant returned an unreadable response.',
            });
        }

        const payload = normaliseResponse(parsed);
        return res.status(200).json(payload);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
            '[creative/cultural-suggestions] Gemini call failed:',
            message,
        );
        return res.status(502).json({
            error: 'Failed to generate cultural suggestions. Please retry.',
        });
    }
}
