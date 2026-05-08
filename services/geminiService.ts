
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { TranslationResult, EmailLocalizationResult, Synopsis, CharacterProfile, CulturalReport, AudienceReception, GeolocationCoordinates, GroundingSource, TranscriptionStyle, BookTranslationConfig, BookAnnotation, TranslationMetrics, SceneBreakdown, CastingSide, DubbingLine, StoryboardPanel, MeetingAnalysisResult } from '../types';
import { GLOTTOLOG_METADATA } from '../shared/glottologMetadata';
import { saveCulturalInsight, checkGlossaryCompliance } from '../src/services/culturalService';
import { getClerkToken } from '../src/components/creative/_clerkToken';

// All Gemini calls in this file used to read `import.meta.env.VITE_GOOGLE_API_KEY`
// from the client bundle, which exposed the key to anyone who downloads the
// site. Migration status after PR #7 (security fix):
//
// • Phase 1: Translation Studio (translateWithCulture, getTranslationSuggestions,
//   detectLanguage, getCulturalContext) — server-side via /api/gemini-proxy.
//
// • Phase 2+3: AI Assistant (chat, getCulturalInsight), Audio Transcriber
//   (transcribeAudio, translateTranscription), Script Translator (translateScript,
//   analyzeScriptCulture), Literary Translator (translateLiteraryText,
//   getLiteraryContext), Email Localization (localizeEmail, getEmailToneAnalysis),
//   and Live Conversation (translateLive, detectSpeakerLanguage) — also
//   server-side via /api/gemini-proxy.
//
// • Remaining throwers (getApiKey()): video generation, meeting summarization,
//   secondary script-analysis tools (synopsis, characters, scenes, dubbing,
//   storyboards, casting), batch translations, naturalize/enhanced/cultural-risks
//   helpers, and textToSpeech. These call sites still throw the explicit
//   "moved server-side" error and will be migrated in a follow-up PR.
function getApiKey(): never {
    throw new Error(
        'AI features moved server-side for security. ' +
        'Use Creative Studio, Meeting Insights, Translation Studio, or any ' +
        'feature with a sidebar entry. Surfaces still pending migration ' +
        '(Video Generator, Meeting Summarizer, secondary script tools) will ' +
        'follow in a subsequent PR.'
    );
}

// ── Phase 2+3: file → base64 inline-data helpers used by chat (attachments)
//    and transcribeAudio. Mirrors the original `fileToGenerativePart` shape so
//    the server-side proxy can reconstruct Gemini `inlineData` parts.
async function fileToBase64Part(file: File): Promise<{ mimeType: string; data: string }> {
    const data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result;
            if (typeof result !== 'string') {
                reject(new Error('FileReader returned non-string result.'));
                return;
            }
            const comma = result.indexOf(',');
            resolve(comma >= 0 ? result.slice(comma + 1) : result);
        };
        reader.onerror = () => reject(reader.error ?? new Error('FileReader failed.'));
        reader.readAsDataURL(file);
    });
    return { mimeType: file.type || 'application/octet-stream', data };
}

// ── Server-side Gemini proxy client ───────────────────────────────────────────
//
// Mirrors the Clerk Bearer pattern in `meetingInsightsClient.ts` and
// `src/components/creative/_clerkToken.ts`. All migrated functions in this
// file call `callGeminiProxy(functionName, args)` and the dispatcher in
// `api/gemini-proxy.ts` runs the matching server-side handler.

async function getClerkSessionToken(): Promise<string> {
    const token = await getClerkToken();
    if (!token) {
        throw new Error('Not authenticated. Sign in to use AI features.');
    }
    return token;
}

async function callGeminiProxy<T>(
    functionName: string,
    args: unknown[],
): Promise<T> {
    const token = await getClerkSessionToken();
    const res = await fetch('/api/gemini-proxy', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ functionName, args }),
    });
    let payload: { result?: T; error?: string };
    try {
        payload = await res.json();
    } catch {
        throw new Error(`Gemini proxy returned a non-JSON response (HTTP ${res.status}).`);
    }
    if (!res.ok || payload.error) {
        throw new Error(payload.error ?? `Gemini proxy failed (HTTP ${res.status}).`);
    }
    if (payload.result === undefined) {
        throw new Error('Gemini proxy returned no result.');
    }
    return payload.result;
}

function handleApiError(error: unknown, context: string): Error {
    console.error(`Error during ${context}:`, error);
    let message = `An unexpected error occurred while ${context}. Please try again.`;
    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) message = 'Authentication failed: Invalid API Key.';
        else if (error.message.toLowerCase().includes('quota')) message = 'Quota exceeded. Check your billing info.';
        else if (error.message.includes('[429]')) message = 'Too many requests. Wait a moment.';
        else message = `An error occurred: ${error.message.split(';')[0]}`;
    }
    return new Error(message);
}

export async function getAIAssistantResponse(prompt: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const systemPrompt = `You are an expert African cultural consultant and localization specialist. 
            You help businesses and individuals communicate effectively across African markets.
            
            Your expertise includes:
            - Cultural etiquette and business norms across 54 African countries
            - Language localization and dialect adaptation
            - Marketing and campaign localization
            - Cross-border communication strategies
            - Youth culture and slang across African markets
            - Government and diplomatic communication
            - Religious and traditional sensitivities
            
            Provide practical, actionable advice. Be concise but thorough.
            Always consider regional variations and cultural nuances.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `${systemPrompt}\n\nUser Request: ${prompt}`,
            config: { temperature: 0.7 }
        });
        return response.text;
    } catch (error) {
        throw handleApiError(error, 'AI Assistant response generation');
    }
}

export async function detectCulturalRisks(text: string, targetLang: string, dialect: string): Promise<Array<{phrase: string; severity: 'high' | 'medium' | 'low'; reason: string; suggestion: string}>> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = `Analyze the following text for cultural risks when translating to ${targetLang} (${dialect} dialect).
        
        Text: "${text}"
        
        Identify phrases, idioms, or concepts that could:
        - Offend cultural or religious sensibilities
        - Be misunderstood due to cultural differences
        - Violate social taboos or etiquette
        - Use inappropriate formality levels
        - Reference concepts unfamiliar to the target culture
        
        For each risk, provide the problematic phrase, severity level, reason, and a culturally appropriate alternative.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        risks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    phrase: { type: Type.STRING },
                                    severity: { type: Type.STRING },
                                    reason: { type: Type.STRING },
                                    suggestion: { type: Type.STRING }
                                },
                                required: ['phrase', 'severity', 'reason', 'suggestion']
                            }
                        }
                    },
                    required: ['risks']
                }
            }
        });
        const parsed = JSON.parse(response.text);
        return parsed.risks || [];
    } catch (error) {
        console.error('Cultural risk detection error:', error);
        return [];
    }
}

export async function getCulturalInsights(
    targetLang: string,
    dialect: string,
    context: string,
): Promise<Array<{ category: string; insight: string; relevance: string }>> {
    try {
        return await callGeminiProxy<Array<{ category: string; insight: string; relevance: string }>>(
            'getCulturalInsight',
            [targetLang, dialect, context],
        );
    } catch (error) {
        console.error('Cultural insights error:', error);
        return [];
    }
}

// Singular spelling kept as a thin alias so the rest of the codebase can
// migrate at its own pace; both names dispatch to the same proxy handler.
export const getCulturalInsight = getCulturalInsights;

export async function naturalizeTranslation(translation: string, targetLang: string, dialect: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = `Make this ${targetLang} (${dialect} dialect) translation sound more natural and idiomatic.
        
        Current translation: "${translation}"
        
        Rewrite it to:
        - Use natural, everyday expressions
        - Apply local idioms and colloquialisms
        - Match the rhythm and flow of native speech
        - Remove any awkward literal translations
        - Maintain the original meaning
        
        Return only the naturalized translation, nothing else.`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: { temperature: 0.6 }
        });
        return response.text.trim();
    } catch (error) {
        throw handleApiError(error, 'translation naturalization');
    }
}

export async function getEnhancedTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
    tone: string,
    dialect: string,
    useGlossary: boolean
): Promise<TranslationResult> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        
        const dialectInstruction = dialect && dialect !== 'standard' 
            ? `CRITICAL: Use the ${dialect} dialect/variant of ${targetLang}. Apply region-specific vocabulary, idioms, and expressions.`
            : '';
        
        const glossaryInstruction = useGlossary 
            ? 'Check for brand-specific terminology and enforce glossary compliance.'
            : '';

        const glottologInfo = GLOTTOLOG_METADATA[targetLang];
        const glottologPrompt = glottologInfo 
            ? `[GLOTTOLOG] Family: ${glottologInfo.family} > ${glottologInfo.parent} | Code: ${glottologInfo.glottocode} | Features: ${glottologInfo.features}`
            : '';

        const prompt = `Translate with MAXIMUM cultural intelligence and linguistic precision.
        
        ${glottologPrompt}
        ${dialectInstruction}
        ${glossaryInstruction}
        
        Source Language: ${sourceLang}
        Target Language: ${targetLang}
        Tone: ${tone}
        
        Text to translate: "${text}"
        
        Provide:
        1. Direct literal translation
        2. Culturally-aware, natural translation optimized for the target audience
        3. Detailed explanation of cultural adaptations made
        4. Pronunciation guide (if applicable)
        5. Comprehensive linguistic analysis`;

        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: translationSchema
            }
        });
        const translation = JSON.parse(response.text);
        
        return {
            directTranslation: translation.directTranslation,
            culturallyAwareTranslation: translation.culturallyAwareTranslation,
            explanation: translation.explanation,
            pronunciation: translation.pronunciation,
            original: text,
            linguisticAnalysis: translation.linguisticAnalysis
        };
    } catch (error) {
        throw handleApiError(error, 'enhanced translation');
    }
}

const translationSchema = {
  type: Type.OBJECT,
  properties: {
    directTranslation: { type: Type.STRING },
    culturallyAwareTranslation: { type: Type.STRING },
    explanation: { type: Type.STRING },
    pronunciation: { type: Type.STRING },
    linguisticAnalysis: {
        type: Type.OBJECT,
        properties: {
            structural: {
                type: Type.OBJECT,
                properties: {
                    tonality: { type: Type.STRING, description: "Notes on tone spread, downstep, or melodies if applicable (e.g., Niger-Congo)." },
                    nounClasses: { type: Type.STRING, description: "Notes on noun class/gender agreement (e.g., Bantu structure)." },
                    phonetics: { type: Type.STRING, description: "Notes on unique sounds: clicks, labial-velar stops, implosives." },
                    grammarNotes: { type: Type.STRING, description: "Notes on serial verb constructions or other specific grammar." }
                }
            },
            sociolinguistic: {
                type: Type.OBJECT,
                properties: {
                    intellectualization: { type: Type.STRING, description: "Strategy for technical terms: Indigenous coinage vs Loanwords." },
                    translanguaging: { type: Type.STRING, description: "Presence of code-switching or urban superdiversity (e.g., Sheng)." },
                    culturalContext: { type: Type.STRING, description: "The 'African Linguistic Gaze' perspective." }
                }
            },
            glottolog: {
                type: Type.OBJECT,
                properties: {
                    family: { type: Type.STRING },
                    parent: { type: Type.STRING },
                    glottocode: { type: Type.STRING },
                    features: { type: Type.STRING }
                }
            }
        }
    }
  },
  required: ["directTranslation", "culturallyAwareTranslation", "explanation"]
};

const emailLocalizationSchema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING },
    body: { type: Type.STRING },
    culturalTips: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING } 
    },
  },
  required: ["subject", "body", "culturalTips"]
};

const bookTranslationSchema = {
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
          explanation: { type: Type.STRING }
        },
        required: ["originalPhrase", "type", "explanation"]
      }
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        culturalAccuracy: { type: Type.NUMBER },
        idiomPreservation: { type: Type.NUMBER },
        readability: { type: Type.NUMBER },
        localizationDepth: { type: Type.NUMBER }
      },
      required: ["culturalAccuracy", "idiomPreservation", "readability", "localizationDepth"]
    }
  },
  required: ["translation"]
};

async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return { inlineData: { mimeType: file.type, data: await base64EncodedDataPromise } };
}

export async function getNuancedTranslation(
    text: string,
    sourceLang: string,
    targetLang: string,
    tone: string,
    attachments: File[] = [],
    targetRegion?: string,
): Promise<TranslationResult> {
    try {
        const inlineAttachments = await Promise.all(
            attachments.map((f) => fileToBase64Part(f)),
        );
        return await callGeminiProxy<TranslationResult>('chat', [
            text,
            sourceLang,
            targetLang,
            tone,
            inlineAttachments,
            targetRegion ?? '',
        ]);
    } catch (error) {
        throw handleApiError(error, 'getting translation');
    }
}

// Spec-named alias for the AI Assistant chat surface. Same proxy handler,
// same return shape; lets call sites use whichever name reads better.
export const chat = getNuancedTranslation;

export interface EmailAnalysisResult {
  politeness_score: number;
  tone_assessment: string;
  cultural_warnings: Array<{ phrase: string; issue: string; suggestion: string }>;
  greeting_recommendation: string;
  signature_recommendation: string;
  overall_recommendation: string;
}

export async function analyzeEmail(
    body: string,
    targetCulture: string,
): Promise<EmailAnalysisResult> {
    try {
        return await callGeminiProxy<EmailAnalysisResult>('getEmailToneAnalysis', [
            body,
            targetCulture,
        ]);
    } catch (error) {
        throw handleApiError(error, 'analyzing email');
    }
}

// Spec-named alias.
export const getEmailToneAnalysis = analyzeEmail;

// ... existing textToSpeech, transcribeAudio ... 
export async function textToSpeech(text: string, voiceName: string = 'Kore'): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    } catch (error) { throw handleApiError(error, "generating speech"); }
}

export async function transcribeAudio(
    audioFile: File,
    style: TranscriptionStyle = 'normal',
): Promise<string> {
    try {
        const audioPart = await fileToBase64Part(audioFile);
        return await callGeminiProxy<string>('transcribeAudio', [audioPart, style]);
    } catch (error) {
        throw handleApiError(error, 'transcribing audio');
    }
}

// Phase 2 — Audio Transcriber. Translates a transcript (from
// `transcribeAudio` or otherwise) into a target language. Returns the
// translated transcript text only.
export async function translateTranscription(
    transcript: string,
    sourceLang: string,
    targetLang: string,
    dialect: string = 'Standard',
): Promise<string> {
    try {
        return await callGeminiProxy<string>('translateTranscription', [
            transcript,
            sourceLang,
            targetLang,
            dialect,
        ]);
    } catch (error) {
        throw handleApiError(error, 'translating transcription');
    }
}

export async function translateScript(
    scriptText: string,
    sourceLang: string,
    targetLang: string,
    tone: string,
    targetRegion?: string,
): Promise<string> {
    try {
        return await callGeminiProxy<string>('translateScript', [
            scriptText,
            sourceLang,
            targetLang,
            tone,
            targetRegion ?? '',
        ]);
    } catch (error) {
        throw handleApiError(error, 'translating script');
    }
}

export async function localizeEmail(
    subject: string,
    body: string,
    targetCulture: string,
): Promise<{ localizedSubject: string; localizedBody: string }> {
    try {
        return await callGeminiProxy<{ localizedSubject: string; localizedBody: string }>(
            'localizeEmail',
            [subject, body, targetCulture],
        );
    } catch (error) {
        throw handleApiError(error, 'localizing email');
    }
}

// Phase 3 — Literary Translator. Single-chunk literary translation; the
// `translateBook` driver below handles client-side chunking + progress.
export interface LiteraryChunkResult {
    translation: string;
    notes?: string;
    annotations?: BookAnnotation[];
    metrics?: TranslationMetrics;
}

export async function translateLiteraryText(
    chunkText: string,
    sourceLang: string,
    targetLang: string,
    tone: string,
    config: BookTranslationConfig,
    chunkIndex: number = 0,
    chunkTotal: number = 1,
): Promise<LiteraryChunkResult> {
    try {
        return await callGeminiProxy<LiteraryChunkResult>('translateLiteraryText', [
            chunkText,
            sourceLang,
            targetLang,
            tone,
            config,
            chunkIndex,
            chunkTotal,
        ]);
    } catch (error) {
        throw handleApiError(error, 'translating literary text');
    }
}

// Phase 3 — Literary Translator. Returns a context briefing the translator
// can use as a sidebar reference; non-streaming, single round-trip.
export interface LiteraryContextResult {
    era?: string;
    region?: string;
    sociopolitical: string[];
    themes: string[];
    translationStrategy: string;
}

export async function getLiteraryContext(
    text: string,
    targetLang: string,
    genre: string = 'Literary Fiction',
): Promise<LiteraryContextResult> {
    try {
        return await callGeminiProxy<LiteraryContextResult>('getLiteraryContext', [
            text,
            targetLang,
            genre,
        ]);
    } catch (error) {
        throw handleApiError(error, 'getting literary context');
    }
}

export async function translateBook(
    bookText: string,
    sourceLang: string,
    targetLang: string,
    tone: string,
    config: BookTranslationConfig,
    onProgress: (
        progress: number,
        chunk: string,
        notes: string,
        annotations: BookAnnotation[],
        metrics: TranslationMetrics,
    ) => void,
): Promise<void> {
    const chunkSize = 4000;
    const chunks: string[] = [];
    for (let i = 0; i < bookText.length; i += chunkSize) {
        chunks.push(bookText.slice(i, i + chunkSize));
    }

    const emptyMetrics: TranslationMetrics = {
        culturalAccuracy: 0,
        idiomPreservation: 0,
        readability: 0,
        localizationDepth: 0,
    };

    for (let i = 0; i < chunks.length; i++) {
        const progress = Math.round(((i + 1) / chunks.length) * 100);
        try {
            const result = await translateLiteraryText(
                chunks[i],
                sourceLang,
                targetLang,
                tone,
                config,
                i,
                chunks.length,
            );
            const translationText = result.translation || '';
            onProgress(
                progress,
                translationText + '\n\n',
                result.notes ? `**Chunk ${i + 1} Notes:**\n${result.notes}\n\n` : '',
                result.annotations || [],
                result.metrics || emptyMetrics,
            );
        } catch (error) {
            console.error('Chunk translation error', error);
            onProgress(
                progress,
                `[Error translating chunk ${i + 1}. Original text retained.]\n${chunks[i]}\n\n`,
                `Error: Failed to process chunk ${i + 1} via gemini-proxy.`,
                [],
                emptyMetrics,
            );
        }
    }
}

// --- STRUCTURED MEETING ANALYSIS ---
export async function summarizeMeeting(transcript: string, meetingLink?: string, summaryLangName: string = 'English'): Promise<MeetingAnalysisResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    
    const prompt = `
    Analyze this meeting transcript and return JSON:
{
  "summary": "string",
  "action_items": [{"task": "string", "owner": "string", "deadline": "string"}],
  "key_decisions": ["string"],
  "risk_phrases": [{"phrase": "string", "risk": "string", "suggestion": "string"}],
  "languages_detected": ["string"],
  "sentiment_timeline": [{"section": 1, "sentiment": "positive", "score": 80}],
  "overall_sentiment": "string"
}
    
    Transcript:
    "${transcript}"
    `;

    const response = await ai.models.generateContent({ 
        model: "gemini-3-flash-preview", 
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: { type: Type.STRING },
                    action_items: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                task: { type: Type.STRING },
                                owner: { type: Type.STRING },
                                deadline: { type: Type.STRING }
                            },
                            required: ["task"]
                        }
                    },
                    key_decisions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    risk_phrases: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                phrase: { type: Type.STRING },
                                risk: { type: Type.STRING },
                                suggestion: { type: Type.STRING }
                            },
                            required: ["phrase", "risk", "suggestion"]
                        }
                    },
                    languages_detected: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sentiment_timeline: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                section: { type: Type.INTEGER },
                                sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
                                score: { type: Type.NUMBER }
                            },
                            required: ["section", "sentiment", "score"]
                        }
                    },
                    overall_sentiment: { type: Type.STRING }
                },
                required: ["summary", "action_items", "key_decisions", "risk_phrases", "languages_detected", "sentiment_timeline", "overall_sentiment"]
            }
        } 
    });
    
    return JSON.parse(response.text.trim()) as MeetingAnalysisResult;
  } catch (error) { throw handleApiError(error, "summarizing meeting"); }
}

export async function startVideoGeneration(
    prompt: string, 
    imageFile?: File, 
    config?: { 
        resolution?: '720p' | '1080p', 
        aspectRatio?: '16:9' | '9:16',
        duration?: string,
        tone?: string,
        context?: string,
        region?: string,
        isDeepLocalized?: boolean
    }
) {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    let imagePart = undefined;
    if (imageFile) {
        const part = await fileToGenerativePart(imageFile);
        imagePart = { imageBytes: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }

    // Enhance prompt with new parameters
    let finalPrompt = prompt;
    if (config) {
        const toneStr = config.tone ? `Tone: ${config.tone}.` : '';
        const contextStr = config.context ? `Context: ${config.context}.` : '';
        const durationStr = config.duration ? `Duration: ${config.duration}.` : '';
        
        let localizationStr = '';
        if (config.isDeepLocalized) {
            localizationStr = `DEEP LOCALIZATION: Use culturally specific aesthetics, movement, and visual language specific to ${config.region || 'Africa'}. Ensure authentic representation of local customs.`;
        }

        finalPrompt = `${finalPrompt} ${toneStr} ${contextStr} ${durationStr} ${localizationStr}`.trim();
    }

    return await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: finalPrompt,
        image: imagePart,
        config: { numberOfVideos: 1, resolution: config?.resolution || '720p', aspectRatio: config?.aspectRatio || '16:9' }
    });
}

// ... existing pollVideoOperation ...
export async function pollVideoOperation(operation: any) {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    return await ai.operations.getVideosOperation({ operation });
}

// ... existing analysis functions (generateSynopsis, etc) ...
export async function generateSynopsis(scriptText: string, targetLang: string): Promise<Synopsis> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `Generate logline and synopsis for: ${scriptText} in ${targetLang}. JSON.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { logline: { type: Type.STRING }, synopsis: { type: Type.STRING } }, required: ["logline", "synopsis"] } } });
    return JSON.parse(response.text) as Synopsis;
}

export async function analyzeCharacters(scriptText: string, targetLang: string): Promise<CharacterProfile[]> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `Analyze up to 3 characters in: ${scriptText} for ${targetLang} audience. JSON array.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, motivation: { type: Type.STRING }, emotionalArc: { type: Type.STRING } }, required: ["name", "description", "motivation", "emotionalArc"] } } } });
    return JSON.parse(response.text) as CharacterProfile[];
}

export async function generateCulturalReport(
    original: string,
    translated: string,
    sourceLang: string,
    targetLang: string,
): Promise<CulturalReport> {
    try {
        return await callGeminiProxy<CulturalReport>('analyzeScriptCulture', [
            // Pass the translated script as the source-of-truth for analysis
            // (matches the proxy handler's single-text expectation), but
            // include the original in the prompt envelope by concatenating
            // both sides; downstream prompts consider the diff implicitly.
            `Original (${sourceLang}):\n${original}\n\nTranslated (${targetLang}):\n${translated}`,
            sourceLang,
            targetLang,
        ]);
    } catch (error) {
        throw handleApiError(error, 'generating cultural report');
    }
}

// Spec-named alias for the Script Translator surface.
export const analyzeScriptCulture = generateCulturalReport;

export async function analyzeAudienceReception(scriptText: string, targetLang: string): Promise<AudienceReception> {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const prompt = `Analyze audience reception for: ${scriptText} in ${targetLang} region. JSON.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { targetDemographic: { type: Type.STRING }, keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }, potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING } }, genreAppeal: { type: Type.STRING } }, required: ["targetDemographic", "keyStrengths", "potentialChallenges", "genreAppeal"] } } });
    return JSON.parse(response.text) as AudienceReception;
}

export async function analyzeSceneBreakdown(scriptText: string): Promise<SceneBreakdown[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = `Analyze the script text and extract scene breakdown details. Identify Scene Numbers, Sluglines, Locations (INT/EXT), Time of Day, List of Characters in scene, and Estimated Duration (assuming 1 page = 1 minute). Return JSON array. Script: ${scriptText.slice(0, 30000)}`; 
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sceneNumber: { type: Type.INTEGER },
                            slugline: { type: Type.STRING },
                            location: { type: Type.STRING },
                            time: { type: Type.STRING },
                            characters: { type: Type.ARRAY, items: { type: Type.STRING } },
                            estimatedDuration: { type: Type.STRING }
                        },
                        required: ["sceneNumber", "slugline", "location", "time", "characters", "estimatedDuration"]
                    }
                }
            }
        });
        return JSON.parse(response.text) as SceneBreakdown[];
    } catch (error) { throw handleApiError(error, "generating scene breakdown"); }
}

export async function generateCastingSide(scriptText: string): Promise<CastingSide[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = `Analyze the script and generate detailed casting sides/profiles for main characters. Include African cultural nuance in requirements where applicable. JSON array. Script: ${scriptText.slice(0, 30000)}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            role: { type: Type.STRING },
                            ageRange: { type: Type.STRING },
                            gender: { type: Type.STRING },
                            ethnicity: { type: Type.STRING },
                            bio: { type: Type.STRING },
                            requirements: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["role", "ageRange", "gender", "ethnicity", "bio", "requirements"]
                    }
                }
            }
        });
        return JSON.parse(response.text) as CastingSide[];
    } catch (error) { throw handleApiError(error, "generating casting sides"); }
}

export async function generateDubbingGuide(scriptText: string, targetLang: string): Promise<DubbingLine[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = `Translate key dialogue lines to ${targetLang} formatted for dubbing. Include timecode approximations (00:00:00) and lip-sync notes (e.g. 'open vowel', 'rapid pace'). JSON array. Script: ${scriptText.slice(0, 10000)}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            original: { type: Type.STRING },
                            translated: { type: Type.STRING },
                            timecode: { type: Type.STRING },
                            lipSyncNote: { type: Type.STRING }
                        },
                        required: ["original", "translated", "timecode", "lipSyncNote"]
                    }
                }
            }
        });
        return JSON.parse(response.text) as DubbingLine[];
    } catch (error) { throw handleApiError(error, "generating dubbing guide"); }
}

export async function generateStoryboardPrompts(scriptText: string): Promise<StoryboardPanel[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: getApiKey() });
        const prompt = `Analyze key scenes and generate detailed visual prompts suitable for an AI image generator (like Midjourney). Include camera angles and lighting. JSON array. Script: ${scriptText.slice(0, 15000)}`;
        
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sceneNumber: { type: Type.INTEGER },
                            description: { type: Type.STRING },
                            cameraAngle: { type: Type.STRING },
                            visualPrompt: { type: Type.STRING }
                        },
                        required: ["sceneNumber", "description", "cameraAngle", "visualPrompt"]
                    }
                }
            }
        });
        return JSON.parse(response.text) as StoryboardPanel[];
    } catch (error) { throw handleApiError(error, "generating storyboard prompts"); }
}

export async function getBatchTranslations(
  texts: string[],
  sourceLang: string,
  targetLang: string,
  tone: string,
  context: string,
  targetRegion?: string
): Promise<TranslationResult[]> {
  try {
    const ai = new GoogleGenAI({ apiKey: getApiKey() });
    const regionInstruction = targetRegion ? `Target Region: ${targetRegion}.` : '';
    
    // Inject Glottolog Data
    const glottologInfo = GLOTTOLOG_METADATA[targetLang];
    const glottologPrompt = glottologInfo 
        ? `
        [SCIENTIFIC CLASSIFICATION - GLOTTOLOG]
        Target Language: ${targetLang}
        Family: ${glottologInfo.family} > ${glottologInfo.parent}
        Features: ${glottologInfo.features}
        STRICTLY ENFORCE THESE STRUCTURAL RULES.
        `
        : '';

    const prompt = `Batch translate these texts from ${sourceLang} to ${targetLang} with a ${tone} tone. 
    Context: ${context}. ${regionInstruction}
    ${glottologPrompt}
    CRITICAL: If technical, legal, or medical terms are present, preserve their exact professional meaning.
    
    Return a JSON array of objects.
    Texts: ${JSON.stringify(texts)}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              original: { type: Type.STRING },
              directTranslation: { type: Type.STRING },
              culturallyAwareTranslation: { type: Type.STRING },
              explanation: { type: Type.STRING },
              pronunciation: { type: Type.STRING },
            },
            required: ["original", "directTranslation", "culturallyAwareTranslation", "explanation"]
          }
        },
        temperature: 0.4
      },
    });
    return JSON.parse(response.text.trim()) as TranslationResult[];
  } catch (error) {
    throw handleApiError(error, "batch translating");
  }
}

export interface TranslationOptions {
  targetLang: string;
  sourceLang?: string;
  dialect?: string;
  tone?: 'Marketing' | 'Legal' | 'Street' | 'Religious' | 'Corporate' | 'Neutral';
  formality?: 'High' | 'Medium' | 'Low';
  includeCulturalNotes?: boolean;
}

export interface CulturalTranslationResult {
  translation: string;
  cultural_notes: string[];
  risk_flags: Array<{ phrase: string; reason: string; severity: 'low' | 'medium' | 'high' }>;
  tone_analysis: string;
  risk_score: number;
}

export async function translateWithCulture(
  text: string, 
  options: TranslationOptions,
  isNaturalize?: boolean
): Promise<CulturalTranslationResult> {

  // Step 1: Check for glossary violations BEFORE translating. The proxy
  // does its own server-side prompt construction (see `handleTranslateWithCulture`
  // in api/gemini-proxy.ts); the only client-side responsibility left is
  // glossary enforcement against the user's own Supabase-stored terms.
  const glossaryViolations = await checkGlossaryCompliance(text);

  try {
    // Step 2: Call the server-side Gemini proxy.
    const parsedResult = await callGeminiProxy<CulturalTranslationResult>(
      'translateWithCulture',
      [text, options, isNaturalize ?? false],
    );

    // Step 3: Add glossary violations (computed client-side from the user's
    // own glossary in Supabase) to the risk flags returned by the server.
    if (glossaryViolations.length > 0) {
      parsedResult.risk_flags.push(...glossaryViolations.map(v => ({
        phrase: v.forbidden,
        reason: `Forbidden term for "${v.term}" according to your brand glossary`,
        severity: 'high' as const
      })));
      parsedResult.risk_score = Math.min(100, parsedResult.risk_score + 20);
    }

    return parsedResult;

  } catch (error) {
    console.error('Cultural translation error:', error);
    // Surface the server error verbatim — the proxy already returns a
    // user-readable message, and the previous "fallback to getNuancedTranslation"
    // path also calls a not-yet-migrated client function and would throw.
    throw error instanceof Error
      ? error
      : new Error('Cultural translation failed. Please try again.');
  }
}

// ── Phase 1 (Translation Studio) — additional proxy-backed helpers ───────────
//
// These three functions are routed through the same `/api/gemini-proxy` so
// that adding new Translation Studio features (auto-detect source language,
// alternative phrasings, cultural context for a paragraph) does not require
// a new client-side Gemini key path. See `api/gemini-proxy.ts` for the
// matching server-side handlers.

export interface TranslationSuggestion {
  text: string;
  rationale: string;
  register: 'formal' | 'neutral' | 'casual';
}

/**
 * Return alternative phrasings of a translation in the requested register.
 * Each suggestion preserves the meaning of the source text.
 */
export async function getTranslationSuggestions(
  sourceText: string,
  baseTranslation: string,
  options: TranslationOptions,
): Promise<{ suggestions: TranslationSuggestion[] }> {
  return callGeminiProxy<{ suggestions: TranslationSuggestion[] }>(
    'getTranslationSuggestions',
    [sourceText, baseTranslation, options],
  );
}

export interface DetectedLanguage {
  /** ISO-639-1 short code (e.g. "sw"). Lower-case. */
  languageCode: string;
  /** Human-readable name (e.g. "Swahili (Kiswahili)"). */
  languageName: string;
  /** 0..1 confidence reported by the model. */
  confidence: number;
}

/**
 * Identify the source language of `text`. Designed for the Translation
 * Studio "auto-detect" affordance — the returned `languageCode` plugs
 * straight into `TranslationOptions.sourceLang`.
 */
export async function detectLanguage(text: string): Promise<DetectedLanguage> {
  return callGeminiProxy<DetectedLanguage>('detectLanguage', [text]);
}

export interface CulturalContextResult {
  summary: string;
  keyConcepts: string[];
  sensitivities: string[];
  suggestedAdaptations: string[];
}

/**
 * Return concise cultural context for a piece of source text targeted at a
 * specific language / dialect — used by the Translation Studio cultural
 * insights panel.
 */
export async function getCulturalContext(
  text: string,
  targetLang: string,
  dialect?: string,
): Promise<CulturalContextResult> {
  return callGeminiProxy<CulturalContextResult>(
    'getCulturalContext',
    [text, targetLang, dialect ?? ''],
  );
}

// ── Phase 3 (Live Conversation) — proxy-backed helpers ───────────────────────
//
// `translateLive` is a low-latency translation helper for spoken input; it
// strips the cultural-notes envelope to keep round-trip times sub-second.
// `detectSpeakerLanguage` mirrors `detectLanguage` but is tuned for spoken
// content (disfluencies, code-switching).

export async function translateLive(
    phrase: string,
    sourceLang: string,
    targetLang: string,
    formal: boolean = false,
): Promise<{ translation: string }> {
    return callGeminiProxy<{ translation: string }>('translateLive', [
        phrase,
        sourceLang,
        targetLang,
        formal,
    ]);
}

export async function detectSpeakerLanguage(phrase: string): Promise<DetectedLanguage> {
    return callGeminiProxy<DetectedLanguage>('detectSpeakerLanguage', [phrase]);
}
