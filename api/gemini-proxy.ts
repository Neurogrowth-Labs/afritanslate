import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';
import { verifyClerkToken } from './creative/_auth.js';
import { GLOTTOLOG_METADATA } from '../shared/glottologMetadata.js';
import { getLanguageName } from '../shared/languageNames.js';

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

// `LANGUAGE_NAMES`/`getLanguageName` and `GLOTTOLOG_METADATA` are imported
// from `shared/` above so the same single source of truth is used here and
// in `services/geminiService.ts` / `src/utils/languageMapping.ts`.

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

const TRANSLATION_TONES: ReadonlyArray<NonNullable<TranslationOptions['tone']>> = [
    'Marketing',
    'Legal',
    'Street',
    'Religious',
    'Corporate',
    'Neutral',
];

const TRANSLATION_FORMALITIES: ReadonlyArray<NonNullable<TranslationOptions['formality']>> = [
    'High',
    'Medium',
    'Low',
];

function expectTranslationOptions(value: unknown): TranslationOptions {
    if (!value || typeof value !== 'object') {
        throw new Error('Field "options" must be an object.');
    }
    const o = value as Partial<TranslationOptions>;
    if (typeof o.targetLang !== 'string' || o.targetLang.trim().length === 0) {
        throw new Error('Field "options.targetLang" is required.');
    }
    let tone: TranslationOptions['tone'];
    if (typeof o.tone === 'string') {
        if (!(TRANSLATION_TONES as ReadonlyArray<string>).includes(o.tone)) {
            throw new Error(
                `Field "options.tone" must be one of: ${TRANSLATION_TONES.join(', ')}.`,
            );
        }
        tone = o.tone as TranslationOptions['tone'];
    }
    let formality: TranslationOptions['formality'];
    if (typeof o.formality === 'string') {
        if (!(TRANSLATION_FORMALITIES as ReadonlyArray<string>).includes(o.formality)) {
            throw new Error(
                `Field "options.formality" must be one of: ${TRANSLATION_FORMALITIES.join(', ')}.`,
            );
        }
        formality = o.formality as TranslationOptions['formality'];
    }
    return {
        targetLang: o.targetLang,
        sourceLang: typeof o.sourceLang === 'string' ? o.sourceLang : undefined,
        dialect: typeof o.dialect === 'string' ? o.dialect : undefined,
        tone,
        formality,
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

// ── Phase 2+3 helpers ────────────────────────────────────────────────────────

interface InlineDataPart {
    mimeType: string;
    data: string;
}

function expectInlineDataPart(value: unknown, field: string): InlineDataPart {
    if (!value || typeof value !== 'object') {
        throw new Error(`Field "${field}" must be an object with mimeType and data.`);
    }
    const p = value as Partial<InlineDataPart>;
    if (typeof p.mimeType !== 'string' || p.mimeType.length === 0) {
        throw new Error(`Field "${field}.mimeType" is required.`);
    }
    if (typeof p.data !== 'string' || p.data.length === 0) {
        throw new Error(`Field "${field}.data" must be a non-empty base64 string.`);
    }
    // Vercel's request body cap (~4.5 MB Hobby / ~10 MB Pro) is enforced before
    // this runs, but reject anything wildly oversized so we don't burn quota.
    if (p.data.length > 14_000_000) {
        throw new Error(`Field "${field}.data" exceeds 14MB base64 (~10MB raw).`);
    }
    return { mimeType: p.mimeType, data: p.data };
}

function expectInlineDataPartArray(value: unknown, field: string): InlineDataPart[] {
    if (value === undefined || value === null) return [];
    if (!Array.isArray(value)) {
        throw new Error(`Field "${field}" must be an array.`);
    }
    return value.map((v, i) => expectInlineDataPart(v, `${field}[${i}]`));
}

async function generateText(
    apiKey: string,
    prompt: string,
    temperature: number,
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: { temperature },
    });
    const text = response.text;
    if (text === undefined || text === null) {
        throw new Error('Gemini returned an empty response.');
    }
    return text;
}

async function generateFromParts(
    apiKey: string,
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
    temperature: number,
): Promise<string> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
        config: { temperature },
    });
    const text = response.text;
    if (text === undefined || text === null) {
        throw new Error('Gemini returned an empty response.');
    }
    return text;
}

async function generateJsonFromParts<T>(
    apiKey: string,
    parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>,
    responseSchema: object,
    temperature: number,
): Promise<T> {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: { parts },
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

// ── Phase 2+3 handlers ───────────────────────────────────────────────────────
//
// Each surface (AI Assistant, Audio Transcriber, Script Translator, Literary
// Translator, Email Localization, Live Conversation) gets exactly two
// handlers, matching the spec the user shipped. New handlers reuse the
// shared `generateText` / `generateJson` / `generateJsonFromParts` helpers
// above so each is roughly 30 LOC of prompt + schema.

// 5. chat ─────────────────────────────────────────────────────────────────────
//
// The "AI Assistant" chat surface sends each message through this handler.
// Mirrors the pre-PR-#7 client-side `getNuancedTranslation` so existing call
// sites (App.handleChatSendMessage, Chat.tsx) keep working unchanged.

const CHAT_TRANSLATION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        directTranslation: { type: Type.STRING },
        culturallyAwareTranslation: { type: Type.STRING },
        explanation: { type: Type.STRING },
        pronunciation: { type: Type.STRING },
        original: { type: Type.STRING },
        linguisticAnalysis: {
            type: Type.OBJECT,
            properties: {
                structural: {
                    type: Type.OBJECT,
                    properties: {
                        tonality: { type: Type.STRING },
                        nounClasses: { type: Type.STRING },
                        phonetics: { type: Type.STRING },
                        grammarNotes: { type: Type.STRING },
                    },
                },
                sociolinguistic: {
                    type: Type.OBJECT,
                    properties: {
                        intellectualization: { type: Type.STRING },
                        translanguaging: { type: Type.STRING },
                        culturalContext: { type: Type.STRING },
                    },
                },
                glottolog: {
                    type: Type.OBJECT,
                    properties: {
                        family: { type: Type.STRING },
                        parent: { type: Type.STRING },
                        glottocode: { type: Type.STRING },
                        features: { type: Type.STRING },
                    },
                },
            },
        },
    },
    required: [
        'directTranslation',
        'culturallyAwareTranslation',
        'explanation',
    ],
};

interface ChatLinguisticAnalysis {
    structural?: {
        tonality?: string;
        nounClasses?: string;
        phonetics?: string;
        grammarNotes?: string;
    };
    sociolinguistic?: {
        intellectualization?: string;
        translanguaging?: string;
        culturalContext?: string;
    };
    glottolog?: {
        family?: string;
        parent?: string;
        glottocode?: string;
        features?: string;
    };
}

interface ChatTranslationResult {
    directTranslation: string;
    culturallyAwareTranslation: string;
    explanation: string;
    pronunciation?: string;
    original?: string;
    linguisticAnalysis?: ChatLinguisticAnalysis;
}

async function handleChat(
    apiKey: string,
    args: unknown[],
): Promise<ChatTranslationResult> {
    const text = expectString(args[0], 'text', 16000);
    const sourceLang = expectString(args[1], 'sourceLang', 100);
    const targetLang = expectString(args[2], 'targetLang', 100);
    const tone = typeof args[3] === 'string' && args[3] ? args[3] : 'Neutral';
    const attachments = expectInlineDataPartArray(args[4], 'attachments');
    const targetRegion = typeof args[5] === 'string' && args[5].trim().length > 0
        ? args[5].trim()
        : '';

    const sourceLanguageName = getLanguageName(sourceLang);
    const targetLanguageName = getLanguageName(targetLang);

    // Inject the same Glottolog metadata the original client-side
    // `getNuancedTranslation` did so the LinguisticDeepDive panel in
    // Studio.tsx and the LinguisticInsights section in Message.tsx stay
    // populated.
    const glottologInfo = GLOTTOLOG_METADATA[targetLang];
    const glottologPrompt = glottologInfo
        ? `[SCIENTIFIC CLASSIFICATION - GLOTTOLOG]
Target Language: ${targetLang}
Family: ${glottologInfo.family} > ${glottologInfo.parent}
Glottocode: ${glottologInfo.glottocode}
Typological Features to Enforce: ${glottologInfo.features}

INSTRUCTION: Because this language belongs to the ${glottologInfo.family} family, strictly adhere to its specific structural rules (e.g., if Bantu, enforce noun class concordance; if Afroasiatic/Chadic, ensure gender/number agreement).`
        : '';

    const regionPrompt = targetRegion && targetRegion !== 'General'
        ? `[STRICT REGIONAL LOCALIZATION]
Region: ${targetRegion}
You MUST use the vocabulary, slang, idioms, and conventions specific to ${targetRegion}. Avoid generic ${targetLanguageName} that would feel out-of-place to a speaker from ${targetRegion}.`
        : '';

    const prompt = `
You are an AfriTranslate cultural consultant assisting a user in conversational mode, rooted in decolonial frameworks and the "African Linguistic Gaze".

Translate the user's message from ${sourceLanguageName} into ${targetLanguageName}.
Tone: ${tone}.${targetRegion && targetRegion !== 'General' ? `\nRegion: ${targetRegion}.` : ''}

${regionPrompt}

${glottologPrompt}

Return JSON with:
- directTranslation: a faithful word-level translation.
- culturallyAwareTranslation: the polished culturally-natural rendering for a ${targetLanguageName} speaker.
- explanation: 1-3 sentences on the cultural choices made.
- pronunciation: phonetic guide for the cultural translation (optional, omit if not useful).
- original: the original source text (verbatim).
- linguisticAnalysis: a structured object detailing:
    structural: { tonality, nounClasses, phonetics, grammarNotes } — notes on tone, noun-class agreement, unique phonemes (clicks, labial-velar stops, implosives), and serial verb constructions where applicable.
    sociolinguistic: { intellectualization, translanguaging, culturalContext } — notes on indigenous-coinage vs loanword strategy, code-switching/superdiversity (e.g., Sheng, Naija Pidgin), and the "African Linguistic Gaze" perspective.
    glottolog: { family, parent, glottocode, features } — populate from the scientific classification above when provided.

Source text:
"""${text}"""
`;

    const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
        ...attachments.map((a) => ({ inlineData: a })),
        { text: prompt },
    ];

    return generateJsonFromParts<ChatTranslationResult>(
        apiKey,
        parts,
        CHAT_TRANSLATION_SCHEMA,
        0.4,
    );
}

// 6. getCulturalInsight ───────────────────────────────────────────────────────

const CULTURAL_INSIGHT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        insights: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    category: { type: Type.STRING },
                    insight: { type: Type.STRING },
                    relevance: { type: Type.STRING },
                },
                required: ['category', 'insight', 'relevance'],
            },
        },
    },
    required: ['insights'],
};

async function handleGetCulturalInsight(
    apiKey: string,
    args: unknown[],
): Promise<Array<{ category: string; insight: string; relevance: string }>> {
    const targetLang = expectString(args[0], 'targetLang', 100);
    const dialect = typeof args[1] === 'string' && args[1] ? args[1] : 'Standard';
    const context = typeof args[2] === 'string' ? args[2] : '';

    const targetLanguageName = getLanguageName(targetLang);
    const contextInfo = context ? `\nContext: ${context}` : '';

    const prompt = `Provide cultural intelligence insights for communicating in ${targetLanguageName} (${dialect} dialect).${contextInfo}

Include insights about:
- Greeting customs and etiquette
- Communication style preferences (direct vs indirect)
- Business etiquette and formality expectations
- Common idioms and expressions
- Topics to avoid or handle sensitively
- Regional variations and preferences

Provide 3-5 actionable insights with categories and relevance explanations.

Return JSON: { "insights": [{ "category": string, "insight": string, "relevance": string }] }`;

    const parsed = await generateJson<{ insights: Array<{ category: string; insight: string; relevance: string }> }>(
        apiKey,
        prompt,
        CULTURAL_INSIGHT_SCHEMA,
        0.5,
    );
    return parsed.insights || [];
}

// 7. transcribeAudio ──────────────────────────────────────────────────────────

async function handleTranscribeAudio(
    apiKey: string,
    args: unknown[],
): Promise<string> {
    const audioPart = expectInlineDataPart(args[0], 'audio');
    const styleRaw = typeof args[1] === 'string' ? args[1] : 'normal';
    const style = styleRaw === 'interview' ? 'interview' : 'normal';

    const prompt = `Transcribe audio. Style: ${style}. If technical terms (medical, legal, tech) appear, spell them correctly.`;

    return generateFromParts(
        apiKey,
        [{ inlineData: audioPart }, { text: prompt }],
        0.2,
    );
}

// 8. translateTranscription ───────────────────────────────────────────────────

async function handleTranslateTranscription(
    apiKey: string,
    args: unknown[],
): Promise<string> {
    const transcript = expectString(args[0], 'transcript', 32000);
    const sourceLang = expectString(args[1], 'sourceLang', 100);
    const targetLang = expectString(args[2], 'targetLang', 100);
    const dialect = typeof args[3] === 'string' && args[3] ? args[3] : 'Standard';

    const sourceLanguageName = getLanguageName(sourceLang);
    const targetLanguageName = getLanguageName(targetLang);

    const prompt = `Translate the following transcription from ${sourceLanguageName} to ${targetLanguageName} (${dialect} dialect). Preserve speaker turns, punctuation cues, and disfluency markers ("um", "uh") only when they affect meaning. Output the translated transcript only — no commentary.

Transcript:
"""${transcript}"""`;

    return generateText(apiKey, prompt, 0.4);
}

// 9. translateScript ──────────────────────────────────────────────────────────

async function handleTranslateScript(
    apiKey: string,
    args: unknown[],
): Promise<string> {
    const scriptText = expectString(args[0], 'scriptText', 32000);
    const sourceLang = expectString(args[1], 'sourceLang', 100);
    const targetLang = expectString(args[2], 'targetLang', 100);
    const tone = typeof args[3] === 'string' && args[3] ? args[3] : 'Neutral';
    const targetRegion = typeof args[4] === 'string' && args[4] ? args[4] : '';

    const sourceLanguageName = getLanguageName(sourceLang);
    const targetLanguageName = getLanguageName(targetLang);
    const regionPrompt = targetRegion ? `Localize strictly for ${targetRegion}.` : '';

    const prompt = `Translate script from ${sourceLanguageName} to ${targetLanguageName} (${tone}). ${regionPrompt} Keep formatting (sluglines, character names in caps, parentheticals, dialogue indents). Adapt for specific cultural resonance of the region but preserve technical plot points. Return the translated script text only.

Text:
${scriptText}`;

    return generateText(apiKey, prompt, 0.5);
}

// 10. analyzeScriptCulture ────────────────────────────────────────────────────

const SCRIPT_CULTURE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        summary: { type: Type.STRING },
        adaptations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING },
                    adapted: { type: Type.STRING },
                    reason: { type: Type.STRING },
                },
                required: ['original', 'adapted', 'reason'],
            },
        },
    },
    required: ['summary', 'adaptations'],
};

async function handleAnalyzeScriptCulture(
    apiKey: string,
    args: unknown[],
): Promise<{ summary: string; adaptations: Array<{ original: string; adapted: string; reason: string }> }> {
    const scriptText = expectString(args[0], 'scriptText', 32000);
    const sourceLang = expectString(args[1], 'sourceLang', 100);
    const targetLang = expectString(args[2], 'targetLang', 100);

    const sourceLanguageName = getLanguageName(sourceLang);
    const targetLanguageName = getLanguageName(targetLang);

    const prompt = `Analyze this script for cultural adaptation when localising from ${sourceLanguageName} into ${targetLanguageName}.

Identify the top 5-10 idioms, references, gestures, or social conventions that need cultural adaptation. For each, give the original line, the adapted version, and a one-sentence reason.

Then write a 2-3 sentence summary of the overall cultural translation strategy.

Return ONLY JSON.

Script:
"""${scriptText}"""`;

    return generateJson<{ summary: string; adaptations: Array<{ original: string; adapted: string; reason: string }> }>(
        apiKey,
        prompt,
        SCRIPT_CULTURE_SCHEMA,
        0.4,
    );
}

// 11. translateLiteraryText ───────────────────────────────────────────────────
//
// Single-chunk literary translation. The client (services/geminiService.ts
// `translateBook`) handles chunking and progress callbacks; this handler just
// translates one chunk and returns the structured result. Splits the work
// across multiple proxy calls to stay under serverless function timeout
// limits even on long books.

const LITERARY_TRANSLATION_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        translation: { type: Type.STRING },
        notes: { type: Type.STRING },
        annotations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    originalPhrase: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['idiom', 'cultural', 'proverb', 'entity'] },
                    explanation: { type: Type.STRING },
                },
                required: ['originalPhrase', 'type', 'explanation'],
            },
        },
        metrics: {
            type: Type.OBJECT,
            properties: {
                culturalAccuracy: { type: Type.NUMBER },
                idiomPreservation: { type: Type.NUMBER },
                readability: { type: Type.NUMBER },
                localizationDepth: { type: Type.NUMBER },
            },
            required: ['culturalAccuracy', 'idiomPreservation', 'readability', 'localizationDepth'],
        },
    },
    required: ['translation'],
};

interface LiteraryTranslationResult {
    translation: string;
    notes?: string;
    annotations?: Array<{ originalPhrase: string; type: 'idiom' | 'cultural' | 'proverb' | 'entity'; explanation: string }>;
    metrics?: {
        culturalAccuracy: number;
        idiomPreservation: number;
        readability: number;
        localizationDepth: number;
    };
}

const LITERARY_SYSTEM_INSTRUCTION = `🔹 SYSTEM ROLE
Long-form literary translation.
You do not translate words literally unless explicitly instructed.
You translate meaning, intent, emotion, and cultural significance specific to the target region.

🔹 CULTURAL INTELLIGENCE RULES (CRITICAL)
Identify idioms, metaphors, proverbs, and culturally loaded phrases.
If no direct equivalent exists: Adapt the meaning using a culturally appropriate expression for the target REGION.`;

async function handleTranslateLiteraryText(
    apiKey: string,
    args: unknown[],
): Promise<LiteraryTranslationResult> {
    const chunkText = expectString(args[0], 'chunkText', 16000);
    const sourceLang = expectString(args[1], 'sourceLang', 100);
    const targetLang = expectString(args[2], 'targetLang', 100);
    const tone = typeof args[3] === 'string' && args[3] ? args[3] : 'Neutral';
    const config = (args[4] && typeof args[4] === 'object' ? args[4] : {}) as {
        culturalContext?: string;
        genre?: string;
        style?: string;
        dialect?: string;
    };
    const chunkIndex = typeof args[5] === 'number' ? args[5] : 0;
    const chunkTotal = typeof args[6] === 'number' ? args[6] : 1;

    const sourceLanguageName = getLanguageName(sourceLang);
    const targetLanguageName = getLanguageName(targetLang);

    const prompt = `
${LITERARY_SYSTEM_INSTRUCTION}

🔹 INPUT PARAMETERS
Source Language: ${sourceLanguageName}
Target Language: ${targetLanguageName}
Target Cultural Context: ${config.culturalContext || 'General Audience'}
Genre: ${config.genre || 'Literary Fiction'}
Tone Preference: ${tone}
Translation Style: ${config.style || 'Adaptive'}
Dialect Preference: ${config.dialect || 'Standard'}
Book Section: Chunk ${chunkIndex + 1} of ${chunkTotal}

🔹 SOURCE TEXT TO TRANSLATE
"""${chunkText}"""

🔹 OUTPUT REQUIREMENT
Return valid JSON only with: translation, notes (translator's note for this chunk), annotations (array of culturally significant phrases with type and explanation), metrics (culturalAccuracy, idiomPreservation, readability, localizationDepth — each 0-100).
`;

    return generateJson<LiteraryTranslationResult>(
        apiKey,
        prompt,
        LITERARY_TRANSLATION_SCHEMA,
        0.4,
    );
}

// 12. getLiteraryContext ──────────────────────────────────────────────────────

const LITERARY_CONTEXT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        era: { type: Type.STRING },
        region: { type: Type.STRING },
        sociopolitical: { type: Type.ARRAY, items: { type: Type.STRING } },
        themes: { type: Type.ARRAY, items: { type: Type.STRING } },
        translationStrategy: { type: Type.STRING },
    },
    required: ['sociopolitical', 'themes', 'translationStrategy'],
};

async function handleGetLiteraryContext(
    apiKey: string,
    args: unknown[],
): Promise<{
    era?: string;
    region?: string;
    sociopolitical: string[];
    themes: string[];
    translationStrategy: string;
}> {
    const text = expectString(args[0], 'text', 16000);
    const targetLang = expectString(args[1], 'targetLang', 100);
    const genre = typeof args[2] === 'string' && args[2] ? args[2] : 'Literary Fiction';

    const targetLanguageName = getLanguageName(targetLang);

    const prompt = `Read this literary excerpt and produce a concise context briefing for a translator localising it into ${targetLanguageName}.

Genre: ${genre}.

Return JSON with:
- era: a short period descriptor (e.g. "post-independence East Africa, 1970s") or omit if unclear.
- region: the geographic/cultural setting or omit if unclear.
- sociopolitical: 2-5 bullet points on sociopolitical context the translator should know.
- themes: 3-6 dominant themes/motifs.
- translationStrategy: 2-4 sentences advising the translator on tone, register, and culturally weighted choices.

Excerpt:
"""${text}"""`;

    return generateJson<{
        era?: string;
        region?: string;
        sociopolitical: string[];
        themes: string[];
        translationStrategy: string;
    }>(apiKey, prompt, LITERARY_CONTEXT_SCHEMA, 0.45);
}

// 13. localizeEmail ───────────────────────────────────────────────────────────

const LOCALIZE_EMAIL_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        localizedSubject: { type: Type.STRING },
        localizedBody: { type: Type.STRING },
    },
    required: ['localizedSubject', 'localizedBody'],
};

async function handleLocalizeEmail(
    apiKey: string,
    args: unknown[],
): Promise<{ localizedSubject: string; localizedBody: string }> {
    const subject = typeof args[0] === 'string' ? args[0] : '';
    const body = expectString(args[1], 'body', 16000);
    const targetCulture = expectString(args[2], 'targetCulture', 200);

    const prompt = `Rewrite this email to be culturally appropriate for ${targetCulture} business communication. Preserve the core message but adjust the tone, greetings, and structural norms.
Source Subject: "${subject}"
Source Body: "${body}"
Return JSON: { "localizedSubject": "string", "localizedBody": "string" }`;

    return generateJson<{ localizedSubject: string; localizedBody: string }>(
        apiKey,
        prompt,
        LOCALIZE_EMAIL_SCHEMA,
        0.5,
    );
}

// 14. getEmailToneAnalysis ────────────────────────────────────────────────────

const EMAIL_TONE_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        politeness_score: { type: Type.INTEGER },
        tone_assessment: { type: Type.STRING },
        cultural_warnings: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    phrase: { type: Type.STRING },
                    issue: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                },
                required: ['phrase', 'issue', 'suggestion'],
            },
        },
        greeting_recommendation: { type: Type.STRING },
        signature_recommendation: { type: Type.STRING },
        overall_recommendation: { type: Type.STRING },
    },
    required: [
        'politeness_score',
        'tone_assessment',
        'cultural_warnings',
        'greeting_recommendation',
        'signature_recommendation',
        'overall_recommendation',
    ],
};

interface EmailToneResult {
    politeness_score: number;
    tone_assessment: string;
    cultural_warnings: Array<{ phrase: string; issue: string; suggestion: string }>;
    greeting_recommendation: string;
    signature_recommendation: string;
    overall_recommendation: string;
}

async function handleGetEmailToneAnalysis(
    apiKey: string,
    args: unknown[],
): Promise<EmailToneResult> {
    const body = expectString(args[0], 'body', 16000);
    const targetCulture = expectString(args[1], 'targetCulture', 200);

    const prompt = `Analyze this email for cultural appropriateness for ${targetCulture} business communication. Return JSON:
{
  "politeness_score": 0-100,
  "tone_assessment": "string",
  "cultural_warnings": [{"phrase": "string", "issue": "string", "suggestion": "string"}],
  "greeting_recommendation": "string",
  "signature_recommendation": "string",
  "overall_recommendation": "string"
}

Email Body: "${body}"`;

    return generateJson<EmailToneResult>(
        apiKey,
        prompt,
        EMAIL_TONE_SCHEMA,
        0.4,
    );
}

// 15. translateLive ───────────────────────────────────────────────────────────
//
// Lightweight low-latency translation for the Live Conversation surface.
// Skips schema validation and cultural notes to minimise round-trip time
// (sub-second is the goal). Returns plain text only.

async function handleTranslateLive(
    apiKey: string,
    args: unknown[],
): Promise<{ translation: string }> {
    const phrase = expectString(args[0], 'phrase', 4000);
    const sourceLang = expectString(args[1], 'sourceLang', 100);
    const targetLang = expectString(args[2], 'targetLang', 100);
    const formal = args[3] === true;

    const sourceLanguageName = getLanguageName(sourceLang);
    const targetLanguageName = getLanguageName(targetLang);
    const formalityNote = formal
        ? 'Use formal register.'
        : 'Use neutral conversational register.';

    const prompt = `Live spoken conversation. Translate from ${sourceLanguageName} to ${targetLanguageName}. ${formalityNote} Output the translated phrase ONLY — no quotes, no commentary, no labels.

Phrase: "${phrase}"`;

    const translation = await generateText(apiKey, prompt, 0.3);
    return { translation: translation.trim() };
}

// 16. detectSpeakerLanguage ───────────────────────────────────────────────────

const SPEAKER_LANG_SCHEMA = {
    type: Type.OBJECT,
    properties: {
        languageCode: { type: Type.STRING },
        languageName: { type: Type.STRING },
        confidence: { type: Type.NUMBER },
    },
    required: ['languageCode', 'languageName', 'confidence'],
};

async function handleDetectSpeakerLanguage(
    apiKey: string,
    args: unknown[],
): Promise<DetectedLanguage> {
    const phrase = expectString(args[0], 'phrase', 4000);

    const prompt = `Identify the language of the following spoken-style phrase (which may include disfluencies, slang, or code-switching common in African multilingual contexts).

Return JSON with:
- languageCode: ISO-639-1 code (e.g. "sw", "en", "yo", "zu"). Use the dominant language if mixed.
- languageName: human-readable name.
- confidence: number 0-1.

Phrase:
"""${phrase}"""`;

    const result = await generateJson<DetectedLanguage>(
        apiKey,
        prompt,
        SPEAKER_LANG_SCHEMA,
        0.1,
    );

    // Match the contract enforced by `handleDetectLanguage`: clamp confidence
    // to [0, 1], lowercase the ISO-639-1 code, and provide fallback defaults.
    const confidence = Number.isFinite(result.confidence)
        ? Math.max(0, Math.min(1, result.confidence))
        : 0;

    return {
        languageCode: typeof result.languageCode === 'string' && result.languageCode
            ? result.languageCode.toLowerCase()
            : 'en',
        languageName: typeof result.languageName === 'string' && result.languageName
            ? result.languageName
            : 'Unknown',
        confidence,
    };
}

// ── Dispatcher ───────────────────────────────────────────────────────────────

type ProxyHandler = (apiKey: string, args: unknown[]) => Promise<unknown>;

const HANDLERS: Record<string, ProxyHandler> = {
    // Phase 1
    translateWithCulture: handleTranslateWithCulture,
    getTranslationSuggestions: handleGetTranslationSuggestions,
    detectLanguage: handleDetectLanguage,
    getCulturalContext: handleGetCulturalContext,
    // Phase 2 — AI Assistant
    chat: handleChat,
    getCulturalInsight: handleGetCulturalInsight,
    // Phase 2 — Audio Transcriber
    transcribeAudio: handleTranscribeAudio,
    translateTranscription: handleTranslateTranscription,
    // Phase 3 — Script Translator
    translateScript: handleTranslateScript,
    analyzeScriptCulture: handleAnalyzeScriptCulture,
    // Phase 3 — Literary Translator
    translateLiteraryText: handleTranslateLiteraryText,
    getLiteraryContext: handleGetLiteraryContext,
    // Phase 3 — Email Localization
    localizeEmail: handleLocalizeEmail,
    getEmailToneAnalysis: handleGetEmailToneAnalysis,
    // Phase 3 — Live Conversation
    translateLive: handleTranslateLive,
    detectSpeakerLanguage: handleDetectSpeakerLanguage,
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
            error: `Unknown functionName "${validated.functionName}". Supported: ${Object.keys(HANDLERS).join(', ')}.`,
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
