import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { TranslationResult, EmailLocalizationResult, Synopsis, CharacterProfile, CulturalReport, AudienceReception, GeolocationCoordinates, GroundingSource, TranscriptionStyle, BookTranslationConfig, BookAnnotation, TranslationMetrics } from '../types';

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

const translationSchema = {
  type: Type.OBJECT,
  properties: {
    directTranslation: { type: Type.STRING },
    culturallyAwareTranslation: { type: Type.STRING },
    explanation: { type: Type.STRING },
    pronunciation: { type: Type.STRING },
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

async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return { inlineData: { mimeType: file.type, data: await base64EncodedDataPromise } };
}

export async function getNuancedTranslation(text: string, sourceLang: string, targetLang: string, tone: string, attachments: File[] = []): Promise<TranslationResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Translate to ${targetLang} with ${tone} tone. Prioritize cultural idioms, regional dialects, and social norms. JSON output required. Source: "${text}"`;
    const contents: { parts: any[] } = { parts: [{ text: prompt }] };
    for (const file of attachments) contents.parts.unshift(await fileToGenerativePart(file));
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: { parts: contents.parts },
      config: { responseMimeType: "application/json", responseSchema: translationSchema, temperature: 0.7 },
    });
    return JSON.parse(response.text.trim()) as TranslationResult;
  } catch (error) { throw handleApiError(error, "getting translation"); }
}

export async function localizeEmail(subject: string, body: string, targetLang: string, tone: string, context: string): Promise<EmailLocalizationResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Localize this email into ${targetLang} with a ${tone} tone. 
    The context is: ${context}. 
    Please provide a localized subject line, a culturally appropriate body (considering greetings, sign-offs, and social norms), and 2-3 specific cultural etiquette tips for email communication in this target culture. 
    
    Source Subject: "${subject}"
    Source Body: "${body}"
    
    Return as JSON.`;
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: emailLocalizationSchema,
        temperature: 0.5 
      },
    });
    return JSON.parse(response.text.trim()) as EmailLocalizationResult;
  } catch (error) { throw handleApiError(error, "localizing email"); }
}

export async function textToSpeech(text: string, voiceName: string = 'Kore'): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export async function transcribeAudio(audioFile: File, style: TranscriptionStyle = 'normal'): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const audioPart = await fileToGenerativePart(audioFile);
        const prompt = `Transcribe high accuracy, ${style} style. Clean text output.`;
        // FIX: Replaced 'gemini-2.5-flash' with a recommended model for multimodal tasks.
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [audioPart, { text: prompt }] } });
        return response.text;
    } catch (error) { throw handleApiError(error, "transcribing audio"); }
}

export async function translateScript(scriptText: string, sourceLang: string, targetLang: string, tone: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Translate script from ${sourceLang} to ${targetLang} (${tone}). Keep formatting. Adapt for cultural resonance. Text: ${scriptText}`;
        // FIX: Replaced 'gemini-2.5-flash' with a recommended model for text tasks.
        const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { temperature: 0.5 } });
        return response.text;
    } catch (error) { throw handleApiError(error, "translating script"); }
}

// Master AI Prompt for Book Translation implemented as System Instruction
const BOOK_TRANSLATOR_SYSTEM_INSTRUCTION = `
🔹 SYSTEM ROLE
Long-form literary translation
Academic and professional publishing
African, global, and indigenous cultural contexts
Idioms, metaphors, proverbs, oral traditions, and narrative nuance
Cross-chapter semantic memory and narrative continuity
You do not translate words literally unless explicitly instructed.
You translate meaning, intent, emotion, and cultural significance.

🔹 CULTURAL INTELLIGENCE RULES (CRITICAL)
Identify idioms, metaphors, proverbs, and culturally loaded phrases.
If no direct equivalent exists: Adapt the meaning using a culturally appropriate expression. Preserve emotional and symbolic intent.
Never translate idioms word-for-word if it distorts meaning.
Retain cultural references where meaningful. When references may be unfamiliar to the target culture: Subtly localize without erasing the original context.
Add an internal reasoning note (not visible to end readers unless requested).

🔹 QUALITY STANDARDS
Translation must be: Fluent, Natural, Culturally intelligent, Free from machine-translation artifacts, Suitable for professional publication.
The final text should pass as: “Translated by a native-level literary translator with cultural expertise.”

🔹 METRICS EVALUATION
Evaluate your own translation on a scale of 0-100 for:
- Cultural Accuracy
- Idiom Preservation
- Readability
- Localization Depth

🔹 FAILURE CONDITIONS
Do not: Translate idioms literally when meaning is lost. Erase cultural identity. Simplify complex ideas unnecessarily. Change the author’s intent or ideology.

Translate with respect, intelligence, and cultural depth. Your role is not just to translate language — your role is to translate humanity.
`;

export async function translateBook(
    bookText: string, 
    sourceLang: string, 
    targetLang: string, 
    tone: string, 
    config: BookTranslationConfig,
    onProgress: (progress: number, chunk: string, notes: string, annotations: BookAnnotation[], metrics: TranslationMetrics) => void
): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // Chunking strategy: 4000 characters to maintain context but stay within reasonable generation limits
    const chunkSize = 4000;
    const chunks = [];
    for (let i = 0; i < bookText.length; i += chunkSize) {
        chunks.push(bookText.slice(i, i + chunkSize));
    }

    let previousContext = "Start of book.";

    for (let i = 0; i < chunks.length; i++) {
        const prompt = `
        🔹 INPUT PARAMETERS
        Source Language: ${sourceLang}
        Target Language: ${targetLang}
        Target Cultural Context: ${config.culturalContext || 'General Audience'}
        Genre: ${config.genre}
        Tone Preference: ${tone}
        Translation Style: ${config.style}
        Dialect Preference: ${config.dialect}
        Book Section: Chunk ${i + 1} of ${chunks.length}

        🔹 NARRATIVE CONTINUITY CONTEXT
        (Use this to maintain consistency in voice, names, and terminology from previous chunks)
        ${previousContext}

        🔹 SOURCE TEXT TO TRANSLATE
        "${chunks[i]}"

        🔹 OUTPUT REQUIREMENT
        Return valid JSON only. Format:
        {
            "translation": "The full translated text for this chunk...",
            "notes": "Bulleted list of cultural and idiom notes explaining specific adaptations made in this chunk.",
            "annotations": [
                {
                    "originalPhrase": "Exact substring from source text",
                    "type": "idiom" | "cultural" | "proverb" | "entity",
                    "explanation": "Brief explanation of meaning and adaptation"
                }
            ],
            "metrics": {
                "culturalAccuracy": 85,
                "idiomPreservation": 90,
                "readability": 88,
                "localizationDepth": 80
            }
        }
        `;

        try {
            // Using gemini-3-pro-preview for complex literary reasoning as requested
            const response = await ai.models.generateContent({ 
                model: "gemini-3-pro-preview", 
                contents: prompt,
                config: {
                    systemInstruction: BOOK_TRANSLATOR_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    temperature: 0.4 // Balanced for creativity and fidelity
                }
            });

            const result = JSON.parse(response.text.trim());
            
            // Update context for next chunk (keeping it brief to avoid token overflow)
            previousContext = `Last 200 chars of prev chunk: "...${result.translation.slice(-200)}"`;

            onProgress(
                Math.round(((i + 1) / chunks.length) * 100), 
                result.translation + '\n\n',
                result.notes ? `**Chunk ${i+1} Notes:**\n${result.notes}\n\n` : '',
                result.annotations || [],
                result.metrics || { culturalAccuracy: 0, idiomPreservation: 0, readability: 0, localizationDepth: 0 }
            );

        } catch (error) {
            console.error("Chunk translation error", error);
            // Fallback for this chunk to prevent total failure
            onProgress(
                Math.round(((i + 1) / chunks.length) * 100), 
                `[Error translating chunk ${i+1}. Original text retained.]\n${chunks[i]}\n\n`,
                `Error: Failed to process chunk ${i+1} due to AI limits.`,
                [],
                { culturalAccuracy: 0, idiomPreservation: 0, readability: 0, localizationDepth: 0 }
            );
        }
    }
}

export async function summarizeMeeting(transcript: string, meetingLink?: string, summaryLangName: string = 'English'): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Summarize meeting transcript in ${summaryLangName}. Sections: Discussion, Decisions, Actions. Markdown. Transcript: ${transcript}`;
    // FIX: Replaced 'gemini-2.5-flash' with a recommended model for text tasks.
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text;
  } catch (error) { throw handleApiError(error, "summarizing meeting"); }
}

export async function startVideoGeneration(prompt: string, imageFile?: File, config?: { resolution?: '720p' | '1080p', aspectRatio?: '16:9' | '9:16' }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let imagePart = undefined;
    if (imageFile) {
        const part = await fileToGenerativePart(imageFile);
        imagePart = { imageBytes: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
    return await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        image: imagePart,
        config: { numberOfVideos: 1, resolution: config?.resolution || '720p', aspectRatio: config?.aspectRatio || '16:9' }
    });
}

export async function pollVideoOperation(operation: any) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.operations.getVideosOperation({ operation });
}

export async function generateSynopsis(scriptText: string, targetLang: string): Promise<Synopsis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate logline and synopsis for: ${scriptText} in ${targetLang}. JSON.`;
    // FIX: Replaced 'gemini-2.5-flash' with a recommended model for text tasks.
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { logline: { type: Type.STRING }, synopsis: { type: Type.STRING } }, required: ["logline", "synopsis"] } } });
    return JSON.parse(response.text) as Synopsis;
}

export async function analyzeCharacters(scriptText: string, targetLang: string): Promise<CharacterProfile[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze up to 3 characters in: ${scriptText} for ${targetLang} audience. JSON array.`;
    // FIX: Replaced 'gemini-2.5-flash' with a recommended model for text tasks.
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, motivation: { type: Type.STRING }, emotionalArc: { type: Type.STRING } }, required: ["name", "description", "motivation", "emotionalArc"] } } } });
    return JSON.parse(response.text) as CharacterProfile[];
}

export async function generateCulturalReport(original: string, translated: string, sourceLang: string, targetLang: string): Promise<CulturalReport> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Compare scripts. Identify cultural adaptations (idioms, jokes, norms). JSON. Original: ${original}. Translated: ${translated}`;
    // FIX: Replaced 'gemini-2.5-flash' with a recommended model for text tasks.
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, adaptations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, adapted: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["original", "adapted", "reason"] } } }, required: ["summary", "adaptations"] } } });
    return JSON.parse(response.text) as CulturalReport;
}

export async function analyzeAudienceReception(scriptText: string, targetLang: string): Promise<AudienceReception> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze audience reception for: ${scriptText} in ${targetLang} region. JSON.`;
    // FIX: Replaced 'gemini-2.5-flash' with a recommended model for text tasks.
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { targetDemographic: { type: Type.STRING }, keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }, potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING } }, genreAppeal: { type: Type.STRING } }, required: ["targetDemographic", "keyStrengths", "potentialChallenges", "genreAppeal"] } } });
    return JSON.parse(response.text) as AudienceReception;
}