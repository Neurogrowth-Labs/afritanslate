import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyClerkToken } from './creative/_auth';

/**
 * Single shared server-side Gemini proxy.
 *
 * Phase 1 of restoring the AI features that were hidden by PR #7
 * (security: F-01..F-05). Each client-facing function in
 * `services/geminiService.ts` POSTs `{ functionName, args }` here,
 * we authenticate the caller via Clerk Bearer, fan out to the
 * registered handler, and return `{ result }` or `{ error }`.
 *
 * The Gemini API key is read here (server-side) from
 * `process.env.GEMINI_API_KEY` and is never exposed to the client
 * bundle. New functions are added by registering a handler in
 * `HANDLERS` below — no client wiring beyond the existing fetch
 * helper is needed.
 */

const MODEL_NAME = 'gemini-2.5-flash';

// ── Language code → human-readable name (server-side copy of
//    src/utils/languageMapping.ts so prompts can resolve names without
//    any client-supplied label). Keep in sync if either copy changes.
const LANGUAGE_NAMES: Record<string, string> = {
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

function getLanguageName(code: string): string {
    return LANGUAGE_NAMES[code] ?? code;
}

// ── Shared types mirrored on the client (services/geminiService.ts).
interface TranslationOptions {
    targetLang: string;
    sourceLang?: string;
    dialect?: string;
    tone?: 'Marketing' | 'Legal' | 'Street' | 'Religious' | 'Corporate' | 'Neutral';
    formality?: 'High' | 'Medium' | 'Low';
    includeCulturalNotes?: boolean;
}

interface CulturalTranslationResult {
    translation: string;
    cultural_notes: string[];
    risk_flags: Array<{ phrase: string; reason: string; severity: 'low' | 'medium' | 'high' }>;
    tone_analysis: string;
    risk_score: number;
}

interface TranslationSuggestion {
    text: string;
    rationale: string;
    register: 'formal' | 'neutral' | 'casual';
}

interface DetectedLanguage {
    languageCode: string;
    languageName: string;
    confidence: number;
}

interface CulturalContextResult {
    summary: string;
    keyConcepts: string[];
    sensitivities: string[];
    suggestedAdaptations: string[];
}

// ── Per-function handlers ────────────────────────────────────────────────────
//
// Each handler validates its own `args` shape, builds a prompt + JSON schema,
// calls Gemini, parses the response, and returns the typed payload. Handlers
// throw on validation failure or upstream errors; the dispatcher catches and
// wraps these into the `{ error }` envelope.

function expectString(value: unknown, field: string, max = 8000): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`Field "${field}" must be a non-empty string.`);
    }
    if (value.length > max) {
        throw new Error(`Field "${field}" must be ${max} characters or fewer.`);
    }
    return value;
}

function expectTranslationOptions(value: unknown): TranslationOptions {
    if (!value || typeof value !== 'object') {
        throw new Error('Field "options" must be an object.');
    }
    const o = value as Partial<TranslationOptions>;
    if (typeof o.targetLang !== 'string' || o.targetLang.trim().length === 0) {
        throw new Error('Field "options.targetLang" is required.');
    }
    return {
        targetLang: o.targetLang,
        sourceLang: typeof o.sourceLang === 'string' ? o.sourceLang : undefined,
        dialect: typeof o.dialect === 'string' ? o.dialect : undefined,
        tone: typeof o.tone === 'string'
            ? (o.tone as TranslationOptions['tone'])
            : undefined,
        formality: typeof o.formality === 'string'
            ? (o.formality as TranslationOptions['formality'])
            : undefined,
        includeCulturalNotes: typeof o.includeCulturalNotes === 'boolean'
            ? o.includeCulturalNotes
            : undefined,
    };
}

async function generateJson<T>(
    apiKey: string,
    prompt: string,
    responseSchema: object,
    temperature: number,
): Promise<T> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema,
            temperature,
        },
    });
    const text = response.text;
    if (!text || !text.trim()) {
        throw new Error('Gemini returned an empty response.');
    }
    return JSON.parse(text.trim()) as T;
}

// 1. translateWithCulture ─────────────────────────────────────────────────────
//
// Restores the canonical Translation Studio flow. Same prompt + schema as the
// pre-PR-#7 client-side implementation at `services/geminiService.ts:998`,
// just executed server-side with the key never leaving Vercel.

const TRANSLATE_WITH_CULTURE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        translation: { type: Type.STRING },
        cultural_notes: { type: Type.ARRAY, items: { type: Type.STRING } },
        risk_flags: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    phrase: { type: Type.STRING },
                    reason: { type: Type.STRING },
                    severity: {
                        type: Type.STRING,
                        enum: ['low', 'medium', 'high'],
                    },
                },
                required: ['phrase', 'reason', 'severity'],
            },
        },
        tone_analysis: { type: Type.STRING },
        risk_score: { type: Type.INTEGER },
    },
    required: [
        'translation',
        'cultural_notes',
        'risk_flags',
        'tone_analysis',
        'risk_score',
    ],
};

async function handleTranslateWithCulture(
    apiKey: string,
    args: unknown[],
): Promise<CulturalTranslationResult> {
    const text = expectString(args[0], 'text');
    const options = expectTranslationOptions(args[1]);
    const isNaturalize = args[2] === true;

    const sourceLanguageName = getLanguageName(options.sourceLang || 'en');
    const targetLanguageName = getLanguageName(options.targetLang);

    const prompt = isNaturalize
        ? `
You are an expert African linguist and cultural consultant for AfriTranslate.

Task: Take this translation and rewrite it to sound completely natural, idiomatic and authentic to a native ${targetLanguageName} speaker. Remove any literal or awkward phrasing.

CRITICAL: The output MUST be in ${targetLanguageName}, not any other language.

Naturalization Parameters:
- Target Language: ${targetLanguageName}
- Dialect: ${options.dialect || 'Standard'}
- Tone: ${options.tone || 'Neutral'}
- Formality Level: ${options.formality || 'Medium'}

Output Format (STRICT JSON):
{
  "translation": "the naturalized text here",
  "cultural_notes": ["note explaining the idiomatic changes"],
  "risk_flags": [],
  "tone_analysis": "brief analysis of the naturalized tone",
  "risk_score": 0
}

Text to Naturalize: "${text}"
`
        : `
You are an expert African linguist and cultural consultant for AfriTranslate.

Task: Translate the following text from ${sourceLanguageName} into ${targetLanguageName}.

CRITICAL: The output MUST be in ${targetLanguageName}, not any other language.

Translation Parameters:
- Source Language: ${sourceLanguageName}
- Target Language: ${targetLanguageName}
- Dialect: ${options.dialect || 'Standard'}
- Tone: ${options.tone || 'Neutral'}
- Formality Level: ${options.formality || 'Medium'}

Special Instructions:
1. Adapt all idioms to be culturally natural for ${options.dialect || targetLanguageName}.
2. Flag any phrases that may be culturally risky or offensive.
3. Provide context notes explaining important cultural adaptations.
4. Rate the overall cultural risk on a scale of 0-100.

Output Format (STRICT JSON):
{
  "translation": "the translated text here",
  "cultural_notes": ["note 1", "note 2"],
  "risk_flags": [
    {"phrase": "problematic phrase", "reason": "why it's risky", "severity": "low/medium/high"}
  ],
  "tone_analysis": "brief analysis of tone appropriateness",
  "risk_score": 0-100
}

Source Text: "${text}"
`;

    return generateJson<CulturalTranslationResult>(
        apiKey,
        prompt,
        TRANSLATE_WITH_CULTURE_SCHEMA,
        0.4,
    );
}

// 2. getTranslationSuggestions ────────────────────────────────────────────────

const TRANSLATION_SUGGESTIONS_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        suggestions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING },
                    rationale: { type: Type.STRING },
                    register: {
                        type: Type.STRING,
                        enum: ['formal', 'neutral', 'casual'],
                    },
                },
                required: ['text', 'rationale', 'register'],
            },
        },
    },
    required: ['suggestions'],
};

async function handleGetTranslationSuggestions(
    apiKey: string,
    args: unknown[],
): Promise<{ suggestions: TranslationSuggestion[] }> {
    const sourceText = expectString(args[0], 'sourceText');
    const baseTranslation = expectString(args[1], 'baseTranslation');
    const options = expectTranslationOptions(args[2]);

    const sourceLanguageName = getLanguageName(options.sourceLang || 'en');
    const targetLanguageName = getLanguageName(options.targetLang);

    const prompt = `
You are an expert African linguist for AfriTranslate.

Source text (${sourceLanguageName}): "${sourceText}"
Base translation (${targetLanguageName}, ${options.dialect || 'Standard'}): "${baseTranslation}"

Produce 3 alternative phrasings of the base translation that explore different
registers (one formal, one neutral, one casual). Each alternative MUST:
- Be in ${targetLanguageName} (${options.dialect || 'Standard'} dialect)
- Preserve the meaning of the source text
- Be idiomatic for a native speaker
- Include a one-sentence rationale describing why the alternative works
  (e.g. shifted register, different idiom, more colloquial tone)

Return ONLY JSON matching the schema. No prose outside the JSON.
`;

    return generateJson<{ suggestions: TranslationSuggestion[] }>(
        apiKey,
        prompt,
        TRANSLATION_SUGGESTIONS_SCHEMA,
        0.65,
    );
}

// 3. detectLanguage ───────────────────────────────────────────────────────────

const DETECT_LANGUAGE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        languageCode: {
            type: Type.STRING,
            description:
                'ISO-639-1 (or BCP-47 short form) code of the detected language, e.g. "en", "sw", "zu", "fr", "ar".',
        },
        languageName: {
            type: Type.STRING,
            description: 'Human-readable name of the detected language.',
        },
        confidence: {
            type: Type.NUMBER,
            description: 'Confidence in the detection between 0 and 1.',
        },
    },
    required: ['languageCode', 'languageName', 'confidence'],
};

async function handleDetectLanguage(
    apiKey: string,
    args: unknown[],
): Promise<DetectedLanguage> {
    const text = expectString(args[0], 'text', 4000);

    const prompt = `
You are a language identification engine specialised in African languages.

Identify the language of the following text. Prefer specific African
languages (Swahili, Zulu, Xhosa, Yoruba, Hausa, Igbo, Amharic, Oromo, Somali,
Kinyarwanda, Shona, Sesotho, Setswana, Wolof, Afrikaans, Swati, Ndebele,
Venda) over English/French/Portuguese/Arabic when the text is in one of them.

Return:
- languageCode: ISO-639-1 short code (e.g. "sw" for Swahili)
- languageName: human-readable name
- confidence: 0..1

Return ONLY JSON matching the schema.

Text:
"""${text}"""
`;

    const result = await generateJson<DetectedLanguage>(
        apiKey,
        prompt,
        DETECT_LANGUAGE_SCHEMA,
        0.0,
    );

    // Clamp confidence to [0, 1] in case the model returns out-of-range.
    const confidence = Number.isFinite(result.confidence)
        ? Math.max(0, Math.min(1, result.confidence))
        : 0;

    return {
        languageCode: typeof result.languageCode === 'string'
            ? result.languageCode.toLowerCase()
            : 'en',
        languageName: typeof result.languageName === 'string'
            ? result.languageName
            : 'Unknown',
        confidence,
    };
}

// 4. getCulturalContext ───────────────────────────────────────────────────────

const CULTURAL_CONTEXT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        keyConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
        sensitivities: { type: Type.ARRAY, items: { type: Type.STRING } },
        suggestedAdaptations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
        },
    },
    required: ['summary', 'keyConcepts', 'sensitivities', 'suggestedAdaptations'],
};

async function handleGetCulturalContext(
    apiKey: string,
    args: unknown[],
): Promise<CulturalContextResult> {
    const text = expectString(args[0], 'text');
    const targetLang = expectString(args[1], 'targetLang', 100);
    const dialect = typeof args[2] === 'string' && args[2] ? args[2] : 'Standard';

    const targetLanguageName = getLanguageName(targetLang);

    const prompt = `
You are an African cultural consultant for AfriTranslate.

For the following source text, produce concise cultural context that helps a
translator localising into ${targetLanguageName} (${dialect} dialect).

Return:
- summary: 2-3 sentences explaining the cultural context for this text in ${targetLanguageName}-speaking communities.
- keyConcepts: 3-6 culturally meaningful concepts referenced (or implied) by the text.
- sensitivities: 2-5 cultural sensitivities a translator should be aware of (taboos, gendered language, religious notes, regional norms). Empty array if none apply.
- suggestedAdaptations: 2-5 concrete adaptations the translator should make so the result lands naturally with ${targetLanguageName} speakers.

Return ONLY JSON matching the schema.

Source text:
"""${text}"""
`;

    return generateJson<CulturalContextResult>(
        apiKey,
        prompt,
        CULTURAL_CONTEXT_SCHEMA,
        0.45,
    );
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

type ProxyHandler = (apiKey: string, args: unknown[]) => Promise<unknown>;

const HANDLERS: Record<string, ProxyHandler> = {
    translateWithCulture: handleTranslateWithCulture,
    getTranslationSuggestions: handleGetTranslationSuggestions,
    detectLanguage: handleDetectLanguage,
    getCulturalContext: handleGetCulturalContext,
};

interface ProxyRequestBody {
    functionName: string;
    args: unknown[];
}

function validateBody(body: unknown): ProxyRequestBody | string {
    if (!body || typeof body !== 'object') {
        return 'Request body must be JSON.';
    }
    const b = body as Partial<ProxyRequestBody>;
    if (typeof b.functionName !== 'string' || b.functionName.length === 0) {
        return 'Field "functionName" is required.';
    }
    if (!Array.isArray(b.args)) {
        return 'Field "args" must be an array.';
    }
    return { functionName: b.functionName, args: b.args };
}

export default async function handler(
    req: VercelRequest,
    res: VercelResponse,
) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Gate on Clerk auth before anything that could cost Gemini quota.
    const userId = await verifyClerkToken(req, res);
    if (!userId) return; // verifyClerkToken already wrote the 401 response

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[gemini-proxy] GEMINI_API_KEY is not set');
        return res.status(500).json({
            error: 'Server is missing GEMINI_API_KEY. Configure it in Vercel project env vars.',
        });
    }

    const validated = validateBody(req.body);
    if (typeof validated === 'string') {
        return res.status(400).json({ error: validated });
    }

    const fn = HANDLERS[validated.functionName];
    if (!fn) {
        return res.status(400).json({
            error: `Unknown functionName "${validated.functionName}". Phase 1 supports: ${Object.keys(HANDLERS).join(', ')}.`,
        });
    }

    try {
        const result = await fn(apiKey, validated.args);
        return res.status(200).json({ result });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(
            `[gemini-proxy] handler "${validated.functionName}" failed:`,
            message,
        );
        return res.status(502).json({ error: message });
    }
}
