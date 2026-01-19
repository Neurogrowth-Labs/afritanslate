
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { TranslationResult, EmailLocalizationResult, Synopsis, CharacterProfile, CulturalReport, AudienceReception, GeolocationCoordinates, GroundingSource, TranscriptionStyle, BookTranslationConfig, BookAnnotation, TranslationMetrics, SceneBreakdown, CastingSide, DubbingLine, StoryboardPanel } from '../types';

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

export async function getNuancedTranslation(
    text: string, 
    sourceLang: string, 
    targetLang: string, 
    tone: string, 
    attachments: File[] = [], 
    targetRegion?: string
): Promise<TranslationResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    // ENHANCED PROMPT FOR TECHNICAL ACCURACY + REGIONAL CULTURAL NUANCE
    const regionInstruction = targetRegion && targetRegion !== 'General' 
        ? `**STRICT REGIONAL LOCALIZATION**: You are translating specifically for ${targetRegion}. You MUST use the vocabulary, slang, idioms, and social etiquette specific to ${targetRegion}. For example, if French (DRC) is selected, use terms like "Sapeur" or "Cadeau" in their local context, different from Metropolitan French.` 
        : `**Standard Localization**: Translate for a general audience of the target language.`;

    const prompt = `
      You are an expert Linguistic AI specialized in African languages and technical localization.
      
      Task: Translate the source text from ${sourceLang} to ${targetLang}.
      Target Tone: ${tone}.
      ${regionInstruction}
      
      CRITICAL INSTRUCTIONS:
      1. **Technical Precision**: If the input contains Medical, Legal, Engineering, or Financial terminology, you MUST preserve the exact technical meaning. Do not use colloquial metaphors that dilute technical accuracy. Use widely accepted loanwords if a native term does not exist for a specific technical concept.
      2. **Cultural Resonance**: For non-technical phrases, greetings, and social connectors, adapt them deeply to match the local culture, idioms, and social hierarchy of the target region (${targetRegion || 'General'}).
      3. **Formal Tone**: If Tone is 'Formal' or 'Business', ensure strict adherence to honorifics and respectful address.
      
      Output Format: JSON with the following fields:
      - directTranslation: A literal translation.
      - culturallyAwareTranslation: The final polished version blending technical accuracy with specific regional nuances.
      - explanation: A brief note explaining 1) any technical terms preserved/adapted and 2) specific regional cultural nuances added (e.g., "Used 'Jambo' typical in Kenya" vs "Habari" elsewhere).
      - pronunciation: A phonetic guide for the culturally aware translation.

      Source Text: "${text}"
    `;

    const contents: { parts: any[] } = { parts: [{ text: prompt }] };
    for (const file of attachments) contents.parts.unshift(await fileToGenerativePart(file));
    
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: { parts: contents.parts },
      config: { responseMimeType: "application/json", responseSchema: translationSchema, temperature: 0.4 }, 
    });
    return JSON.parse(response.text.trim()) as TranslationResult;
  } catch (error) { throw handleApiError(error, "getting translation"); }
}

export async function localizeEmail(subject: string, body: string, targetLang: string, tone: string, context: string, targetRegion?: string): Promise<EmailLocalizationResult> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const regionContext = targetRegion ? `Target Region: ${targetRegion}.` : '';
    
    const prompt = `
    Role: Professional Executive Assistant & Cultural Liaison.
    Task: Localize this email into ${targetLang} with a ${tone} tone.
    Context: ${context}. ${regionContext}
    
    GUIDELINES:
    1. **Business Protocol**: Ensure the greeting and sign-off perfectly match the social hierarchy defined in the context and the specific ${targetRegion || 'General'} culture.
    2. **Deep Localization**: Use phrasing specific to ${targetRegion || targetLang}.
    3. **Cultural Nuance**: Adjust the level of directness.
    
    Source Subject: "${subject}"
    Source Body: "${body}"
    
    Return JSON: { subject, body, culturalTips (array of strings) }.`;
    
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

// ... existing textToSpeech, transcribeAudio ... 
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
        const prompt = `Transcribe audio. Style: ${style}. If technical terms (medical, legal, tech) appear, spell them correctly.`;
        const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [audioPart, { text: prompt }] } });
        return response.text;
    } catch (error) { throw handleApiError(error, "transcribing audio"); }
}

export async function translateScript(scriptText: string, sourceLang: string, targetLang: string, tone: string, targetRegion?: string): Promise<string> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const regionPrompt = targetRegion ? `Localize strictly for ${targetRegion}.` : '';
        const prompt = `Translate script from ${sourceLang} to ${targetLang} (${tone}). ${regionPrompt} Keep formatting. Adapt for specific cultural resonance of the region but preserve technical plot points. Text: ${scriptText}`;
        const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { temperature: 0.5 } });
        return response.text;
    } catch (error) { throw handleApiError(error, "translating script"); }
}

// ... existing translateBook ...
const BOOK_TRANSLATOR_SYSTEM_INSTRUCTION = `
🔹 SYSTEM ROLE
Long-form literary translation.
You do not translate words literally unless explicitly instructed.
You translate meaning, intent, emotion, and cultural significance specific to the target region.

🔹 CULTURAL INTELLIGENCE RULES (CRITICAL)
Identify idioms, metaphors, proverbs, and culturally loaded phrases.
If no direct equivalent exists: Adapt the meaning using a culturally appropriate expression for the target REGION.
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

        🔹 SOURCE TEXT TO TRANSLATE
        "${chunks[i]}"

        🔹 OUTPUT REQUIREMENT
        Return valid JSON only.
        `;

        try {
            const response = await ai.models.generateContent({ 
                model: "gemini-3-pro-preview", 
                contents: prompt,
                config: {
                    systemInstruction: BOOK_TRANSLATOR_SYSTEM_INSTRUCTION,
                    responseMimeType: "application/json",
                    temperature: 0.4
                }
            });

            const result = JSON.parse(response.text.trim());
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

// ... existing summarizeMeeting ...
export async function summarizeMeeting(transcript: string, meetingLink?: string, summaryLangName: string = 'English'): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Summarize meeting transcript in ${summaryLangName}. Sections: Discussion, Decisions, Actions. Identify any technical terms discussed. Markdown. Transcript: ${transcript}`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt });
    return response.text;
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.operations.getVideosOperation({ operation });
}

// ... existing analysis functions (generateSynopsis, etc) ...
export async function generateSynopsis(scriptText: string, targetLang: string): Promise<Synopsis> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Generate logline and synopsis for: ${scriptText} in ${targetLang}. JSON.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { logline: { type: Type.STRING }, synopsis: { type: Type.STRING } }, required: ["logline", "synopsis"] } } });
    return JSON.parse(response.text) as Synopsis;
}

export async function analyzeCharacters(scriptText: string, targetLang: string): Promise<CharacterProfile[]> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze up to 3 characters in: ${scriptText} for ${targetLang} audience. JSON array.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, description: { type: Type.STRING }, motivation: { type: Type.STRING }, emotionalArc: { type: Type.STRING } }, required: ["name", "description", "motivation", "emotionalArc"] } } } });
    return JSON.parse(response.text) as CharacterProfile[];
}

export async function generateCulturalReport(original: string, translated: string, sourceLang: string, targetLang: string): Promise<CulturalReport> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Compare scripts. Identify cultural adaptations (idioms, jokes, norms). JSON. Original: ${original}. Translated: ${translated}`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { summary: { type: Type.STRING }, adaptations: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { original: { type: Type.STRING }, adapted: { type: Type.STRING }, reason: { type: Type.STRING } }, required: ["original", "adapted", "reason"] } } }, required: ["summary", "adaptations"] } } });
    return JSON.parse(response.text) as CulturalReport;
}

export async function analyzeAudienceReception(scriptText: string, targetLang: string): Promise<AudienceReception> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Analyze audience reception for: ${scriptText} in ${targetLang} region. JSON.`;
    const response = await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: prompt, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { targetDemographic: { type: Type.STRING }, keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } }, potentialChallenges: { type: Type.ARRAY, items: { type: Type.STRING } }, genreAppeal: { type: Type.STRING } }, required: ["targetDemographic", "keyStrengths", "potentialChallenges", "genreAppeal"] } } });
    return JSON.parse(response.text) as AudienceReception;
}

export async function analyzeSceneBreakdown(scriptText: string): Promise<SceneBreakdown[]> {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const regionInstruction = targetRegion ? `Target Region: ${targetRegion}.` : '';
    
    const prompt = `Batch translate these texts from ${sourceLang} to ${targetLang} with a ${tone} tone. 
    Context: ${context}. ${regionInstruction}
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
