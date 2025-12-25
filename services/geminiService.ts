import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { TranslationResult, EmailLocalizationResult, Synopsis, CharacterProfile, CulturalReport, AudienceReception, GeolocationCoordinates, GroundingSource, TranscriptionStyle } from '../types';

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
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [audioPart, { text: prompt }] } });
        return response.text;
    } catch (error) { throw handleApiError(error, "transcribing audio"); }
}

export async function translateScript(scriptText: string, sourceLang: string, targetLang: string, tone: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const prompt = `Translate script from ${sourceLang} to ${targetLang} (${tone}). Keep formatting. Adapt for cultural resonance. Text: ${scriptText}`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { temperature: 0.5 } });
        return response.text;
    } catch (error) { throw handleApiError(error, "translating script"); }
}

export async function translateBook(bookText: string, sourceLang: string, targetLang: string, tone: string, onProgress: (progress: number, chunk: string) => void): Promise<void> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chunks = bookText.split(/\n\s*\n/).filter(c => c.trim() !== '');
    for (let i = 0; i < chunks.length; i++) {
        const prompt = `Translate paragraph: ${chunks[i]} to ${targetLang} (${tone}). Pure translation only.`;
        const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
        onProgress(Math.round(((i + 1) / chunks.length) * 100), response.text + '\n\n');
    }
}

export async function summarizeMeeting(transcript: string, meetingLink?: string, summaryLangName: string = 'English'): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Summarize meeting transcript in ${summaryLangName}. Sections: Discussion, Decisions, Actions. Markdown. Transcript: ${transcript}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
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
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { logline: { type: Type.STRING }, synopsis: { type: Type.STRING } }, required: ["logline", "synopsis"] } } });
    return JSON.parse(response.text) as Synopsis;
}

export async function analyzeCharacters(scriptText: string, targetLang: string): Promise<CharacterProfile[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze up to 3 characters in: ${scriptText} for ${targetLang} audience. JSON array.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, motivation: { type: Type.STRING }, emotionalArc: { type: Type.STRING } }, required: ["name", "description", "motivation", "emotionalArc"] } } } });
    return JSON.parse(response.text) as CharacterProfile[];
}

export async function generateCulturalReport(original: string, translated: string, sourceLang: string, targetLang: string): Promise<CulturalReport> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Compare scripts. Identify cultural adaptations (idioms, jokes, norms). JSON. Original: ${original}. Translated: ${translated}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, adaptations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, adapted: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["original", "adapted", "reason"] } } }, required: ["summary", "adaptations"] } } });
    return JSON.parse(response.text) as CulturalReport;
}

export async function analyzeAudienceReception(scriptText: string, targetLang: string): Promise<AudienceReception> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze audience reception for: ${scriptText} in ${targetLang} region. JSON.`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { targetDemographic: { type: Type.STRING }, keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }, potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING } }, genreAppeal: { type: Type.STRING } }, required: ["targetDemographic", "keyStrengths", "potentialChallenges", "genreAppeal"] } } });
    return JSON.parse(response.text) as AudienceReception;
}