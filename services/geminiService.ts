
import { GoogleGenAI, Type, Modality } from "@google/genai";
import type { TranslationResult, Synopsis, CharacterProfile, CulturalReport, AudienceReception, GeolocationCoordinates, GroundingSource, TranscriptionStyle } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Handles API errors by parsing them into user-friendly messages.
 * @param error The error caught from the API call.
 * @param context A string describing the action that failed (e.g., 'translating script').
 * @returns An Error object with a user-friendly message.
 */
function handleApiError(error: unknown, context: string): Error {
    console.error(`Error during ${context}:`, error);

    let message = `An unexpected error occurred while ${context}. Please try again.`;

    if (error instanceof Error) {
        // Check for specific error messages from the Gemini API or underlying fetch issues
        if (error.message.includes('API key not valid')) {
            message = 'Authentication failed: Invalid API Key. Please ensure your API key is correctly configured.';
        } else if (error.message.toLowerCase().includes('quota')) {
            message = 'Quota exceeded. You have reached your API usage limit. Please check your billing information or try again later.';
        } else if (error.message.includes('[429]')) {
            message = 'Too many requests. Please wait a moment before trying again.';
        } else if (error.message.includes('SAFETY')) {
            message = 'The request was blocked for safety reasons (e.g., potentially harmful content). Please modify your input and try again.';
        } else if (error.message.includes('400')) { // Bad Request
            message = 'The request was invalid, possibly due to a malformed input or an unsupported file type. Please check your prompt and attachments.';
        } else if (error.message.includes('500') || error.message.includes('503')) { // Server Error
            message = 'The AI service is currently experiencing issues. The team has been notified. Please try again in a few moments.';
        } else if (error.message.toLowerCase().includes('fetch') || error.message.toLowerCase().includes('network')) {
             message = 'A network error occurred. Please check your internet connection and try again.';
        } else {
            // Use a cleaned-up version of the original message
            message = `An error occurred: ${error.message.split(';')[0]}`; // Attempt to shorten long, complex error strings
        }
    }
    
    return new Error(message);
}

const translationSchema = {
  type: Type.OBJECT,
  properties: {
    directTranslation: {
      type: Type.STRING,
      description: "A direct, literal translation of the source text."
    },
    culturallyAwareTranslation: {
      type: Type.STRING,
      description: "A translation that is adapted for the target language's culture, including appropriate idioms, tone, and expressions."
    },
    explanation: {
      type: Type.STRING,
      description: "A detailed explanation of the cultural and linguistic nuances. Explain why the culturally aware translation is more appropriate than the direct one, highlighting idioms, social norms, or regional expressions used."
    },
    pronunciation: {
      type: Type.STRING,
      description: "A simple, user-friendly phonetic spelling of the culturally-aware translation to guide pronunciation. For example, for 'Bonjour', it might be 'bon-zhoor'."
    },
  },
  required: ["directTranslation", "culturallyAwareTranslation", "explanation"]
};

async function fileToGenerativePart(file: File) {
    const base64EncodedDataPromise = new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            mimeType: file.type,
            data: await base64EncodedDataPromise,
        },
    };
}

export async function getNuancedTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
  tone: string,
  attachments: File[] = []
): Promise<TranslationResult> {
  try {
    const model = "gemini-flash-lite-latest";

    let prompt = `You are an expert cultural and linguistic translator, deeply versed in the nuances of both ${sourceLang} and ${targetLang}. Your task is to translate the provided text, considering the specified tone: '${tone}'. 
    If there are any images, audio files, or documents attached, use them as crucial context for the translation.
    
    Your goal is to make the translation sound as if it were originally written by a native speaker who is an expert in both cultures. The final translation must be fluid and natural, avoiding any "robotic" or overly literal phrasing. You must:
    1.  **Prioritize Cultural Resonance:** Go beyond literal translation. Adapt idioms, regional dialects, and social norms to be perfectly natural for a ${targetLang} speaker. If a direct equivalent doesn't exist, find the closest cultural concept.
    2.  **Master Tone and Politeness:** This is the most critical part of your task. Accurately capture and convey the specified '${tone}' and the appropriate level of politeness for the context. For example, a formal request in ${sourceLang} must translate to a formal request in ${targetLang}, using the correct honorifics or phrasing.
    3.  **Handle Idiomatic Expressions:** Do not translate idioms word-for-word. Find the equivalent expression or concept in ${targetLang} that evokes the same feeling and meaning.
    4.  **Provide Pronunciation:** For the culturally-aware translation, also provide a simple, phonetic spelling to guide the user on how to pronounce it. This should be easy to read for a non-native speaker (e.g., using hyphens to separate syllables).
    
    Provide your response in the required JSON format.
    `;
    
    if(text) {
      prompt += `\n\nSource Text: "${text}"`;
    }

    const contents: { parts: any[] } = { parts: [{ text: prompt }] };
    
    for (const file of attachments) {
        contents.parts.unshift(await fileToGenerativePart(file));
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: contents.parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: translationSchema,
        temperature: 0.7,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as TranslationResult;

  } catch (error) {
    throw handleApiError(error, "getting nuanced translation");
  }
}

export async function generateChatResponse(
    prompt: string,
    isThinkingMode: boolean,
    location: GeolocationCoordinates | null,
    attachments: File[] = []
): Promise<{ text: string, groundingSources?: GroundingSource[] }> {
    try {
        const model = isThinkingMode ? "gemini-3-pro-preview" : "gemini-2.5-flash";
        const tools: any[] = [];
        const toolConfig: any = {};

        // Basic keyword check for grounding
        const needsSearch = /(who|what|when|why|latest|news|weather|define|explain)/i.test(prompt);
        const needsMaps = /(restaurants|nearby|directions|locations|places|how to get to)/i.test(prompt);

        if (needsSearch) tools.push({ googleSearch: {} });
        if (needsMaps) {
            tools.push({ googleMaps: {} });
            if (location) {
                toolConfig.retrievalConfig = { latLng: location };
            }
        }
        
        const contents: { parts: any[] } = { parts: [{ text: prompt }] };
        for (const file of attachments) {
            contents.parts.unshift(await fileToGenerativePart(file));
        }

        const response = await ai.models.generateContent({
            model,
            contents: { parts: contents.parts },
            config: {
                ...(isThinkingMode && { thinkingConfig: { thinkingBudget: 32768 } }),
                ...(tools.length > 0 && { tools, toolConfig }),
            }
        });

        const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
        let groundingSources: GroundingSource[] = [];

        if (groundingMetadata?.groundingChunks) {
            groundingSources = groundingMetadata.groundingChunks
                .map((chunk: any) => (chunk.web || chunk.maps))
                .filter(Boolean)
                .map((source: any) => ({
                    uri: source.uri,
                    title: source.title,
                }));
        }

        return { text: response.text, groundingSources };

    } catch (error) {
        throw handleApiError(error, "generating chat response");
    }
}

export async function generateImage(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }]
            },
            config: {
                imageConfig: {
                    aspectRatio: '1:1',
                }
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("No image generated");

    } catch (error) {
        throw handleApiError(error, "generating image");
    }
}

export async function transcribeAudio(audioFile: File, style: TranscriptionStyle = 'normal'): Promise<string> {
    try {
        const audioPart = await fileToGenerativePart(audioFile);
        
        let prompt = '';
        if (style === 'interview') {
            prompt = `Transcribe the following audio file with high accuracy in an interview style. 
            Detect each individual speaker and label them clearly (e.g., "Speaker 1:", "Speaker 2:", or "Interviewer:", "Interviewee:" if discernible). 
            Ensure precise punctuation and paragraph breaks for readability.`;
        } else {
            prompt = `Transcribe the following audio file with high accuracy. 
            Ensure precise punctuation, capitalization, and paragraph breaks to create a clean, readable text. 
            The output should be a standard block of text, not speaker-labeled.`;
        }

        const promptPart = { text: prompt };

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [audioPart, promptPart] }
        });
        return response.text;
    } catch (error) {
        throw handleApiError(error, "transcribing audio");
    }
}

export async function textToSpeech(text: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    } catch (error) {
        throw handleApiError(error, "generating speech");
    }
}

// --- Video Generation Service --- //

export async function startVideoGeneration(prompt: string, imageFile?: File, config?: { resolution?: '720p' | '1080p', aspectRatio?: '16:9' | '9:16' }) {
    try {
        const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let imagePart = undefined;
        if (imageFile) {
            const part = await fileToGenerativePart(imageFile);
            imagePart = {
                imageBytes: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }

        return await localAi.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt,
            image: imagePart,
            config: {
                numberOfVideos: 1,
                resolution: config?.resolution || '720p',
                aspectRatio: config?.aspectRatio || '16:9'
            }
        });
    } catch (error) {
        throw handleApiError(error, "starting video generation");
    }
}

export async function pollVideoOperation(operation: any) {
    try {
        const localAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
        return await localAi.operations.getVideosOperation({ operation });
    } catch (error) {
        throw handleApiError(error, "polling video operation");
    }
}


// --- All other service functions from the original file --- //

export async function translateScript(
  scriptText: string,
  sourceLang: string,
  targetLang: string,
  tone: string,
): Promise<string> {
    try {
        const model = "gemini-2.5-flash";
        const prompt = `You are a world-class script translator and cultural consultant, specializing in adapting creative works for film and theatre. Your task is to translate the following script from ${sourceLang} to ${targetLang} with a ${tone} tone. 

        Your translation must feel completely authentic to a ${targetLang}-speaking audience. Your primary goal is to preserve the story's soul, not just its words. You must:
        1.  **Adapt for Cultural Resonance:** Aggressively adapt dialogue, jokes, and cultural references to be meaningful and authentic for the target culture. A literal translation that loses the joke or reference is a failure.
        2.  **Capture Subtext and Nuance:** Pay close attention to subtext. A character's true meaning is often between the lines. Your translation must capture this subtext, adapting it where necessary.
        3.  **Preserve Character Voice:** Each character must sound distinct and believable in ${targetLang}. Their socio-economic background, education, and personality must be reflected in their speech patterns, syntax, and word choice.
        4.  **Maintain Pacing and Rhythm:** Dialogue has a rhythm. Your translation should preserve the pacing and flow of conversations to feel natural when spoken by actors.
        5.  **Maintain Formatting Integrity:** Meticulously preserve all standard script formatting (scene headings, character names, parentheticals, dialogue).
        6.  **Output Only the Translation:** Do not add any commentary, explanations, or text that is not part of the translated script itself. Your output must be the pure, translated script, ready for a table read.

        --- SCRIPT TEXT ---
        ${scriptText}
        --- END SCRIPT TEXT ---
        `;
        
        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                temperature: 0.5,
            }
        });

        return response.text;
    } catch (error) {
        throw handleApiError(error, "translating script");
    }
}

export async function translateBook(
  bookText: string,
  sourceLang: string,
  targetLang: string,
  tone: string,
  onProgress: (progress: number, translatedChunk: string) => void
): Promise<void> {
    try {
        const model = "gemini-2.5-flash";
        // Split book into paragraphs. A blank line is the delimiter.
        const chunks = bookText.split(/\n\s*\n/).filter(chunk => chunk.trim() !== '');
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const prompt = `You are a world-class literary translator, an artist who bridges cultures through words. Your task is to translate the following paragraph from a book, from ${sourceLang} to ${targetLang}, maintaining a ${tone} tone.

            Your translation must be a work of art in its own right, capturing the soul of the original text while making it feel native to the ${targetLang} language. You must:
            1.  **Translate the 'Feeling':** Do not just translate words; translate the experience, emotion, and atmosphere of the paragraph.
            2.  **Master Authorial Voice:** Preserve the original author's unique style, rhythm, pacing, and narrative voice. This includes sentence structure and literary devices (e.g., alliteration, metaphor). The translation should sound like the original author writing in ${targetLang}.
            3.  **Adapt Cultural Context:** Intelligently adapt idioms, metaphors, and cultural references to be profoundly meaningful and authentic to a reader in ${targetLang}.
            4.  **Ensure Literary Excellence:** The final translation must read like a beautifully written piece of literature, avoiding awkward or literal phrasing.
            5.  **Output Only the Translation:** Your output must be ONLY the translated paragraph. Do not add any commentary, notes, or explanations.

            Paragraph to translate: "${chunk}"
            `;

            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                 config: {
                    temperature: 0.7,
                }
            });
            
            const translatedChunk = response.text;
            
            const progress = Math.round(((i + 1) / chunks.length) * 100);
            // Call callback with progress and the newly translated chunk
            onProgress(progress, translatedChunk + '\n\n');
        }
    } catch (error) {
        throw handleApiError(error, "translating book");
    }
}

export async function summarizeMeeting(
  transcript: string,
  meetingLink?: string,
  summaryLangName: string = 'English'
): Promise<string> {
  try {
    const model = "gemini-2.5-flash";
    let prompt = `You are a highly efficient AI Meeting Assistant. Your task is to analyze the provided meeting transcript and generate a clear, concise, and structured summary in ${summaryLangName}. The summary must be in Markdown format.

    The summary should be organized into the following three sections, with headers also in ${summaryLangName}:
    1.  **Key Discussion Points:** A bulleted list of the main topics and important conversations that occurred.
    2.  **Decisions Made:** A bulleted list of all concrete decisions that were finalized during the meeting.
    3.  **Action Items:** A bulleted list of all tasks assigned, including who is responsible if mentioned in the transcript.

    Format your entire response using Markdown. Do not include any text or headers before the first section header (e.g., "Key Discussion Points"). Ensure the entire response is in ${summaryLangName}.`;

    if (meetingLink) {
      prompt += `\n\nFor context, the meeting was for this event: ${meetingLink}`;
    }

    prompt += `\n\n--- MEETING TRANSCRIPT ---\n${transcript}\n--- END TRANSCRIPT ---`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        temperature: 0.3,
      },
    });

    return response.text;
  } catch (error) {
    throw handleApiError(error, "summarizing meeting");
  }
}

// --- Script Translator AI Toolkit Functions --- //

export async function generateSynopsis(scriptText: string, targetLang: string): Promise<Synopsis> {
    try {
        const model = "gemini-2.5-flash";
        const prompt = `You are an expert script analyst and copywriter for the film industry. Analyze the following script, which is in ${targetLang}, and generate a compelling logline and a short synopsis.

        1.  **Logline:** A single, captivating sentence that summarizes the core conflict of the story.
        2.  **Synopsis:** A short paragraph (3-5 sentences) that outlines the main plot points, character arc, and stakes.

        The tone should be professional and engaging, suitable for pitching to producers or for marketing materials. Provide the response in the required JSON format.

        --- SCRIPT TEXT ---
        ${scriptText}
        --- END SCRIPT TEXT ---
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        logline: { type: Type.STRING },
                        synopsis: { type: Type.STRING },
                    },
                    required: ["logline", "synopsis"],
                },
                temperature: 0.6,
            },
        });
        return JSON.parse(response.text.trim()) as Synopsis;
    } catch (error) {
        throw handleApiError(error, "generating synopsis");
    }
}

export async function analyzeCharacters(scriptText: string, targetLang: string): Promise<CharacterProfile[]> {
    try {
        const model = "gemini-2.5-flash";
        const prompt = `You are a professional script doctor and character analyst with deep expertise in the culture associated with the ${targetLang} language. Read the following script, which has been translated into ${targetLang}, and provide a detailed analysis for up to the 3 main characters. Your analysis should consider how their personalities, motivations, and arcs might be perceived by an audience from a ${targetLang}-speaking culture.

        For each character, identify:
        - **Name:** The character's name.
        - **Description:** A brief overview of their personality and role in the story, considering cultural archetypes relevant to ${targetLang} speakers.
        - **Motivation:** What drives their actions and decisions? How might these motivations be interpreted within the cultural context of ${targetLang}?
        - **Emotional Arc:** How does the character change emotionally? Is this a relatable and resonant arc for a ${targetLang} audience?

        Provide the response as a JSON array of character objects.

        --- SCRIPT TEXT ---
        ${scriptText}
        --- END SCRIPT TEXT ---
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            motivation: { type: Type.STRING },
                            emotionalArc: { type: Type.STRING },
                        },
                        required: ["name", "description", "motivation", "emotionalArc"],
                    },
                },
                temperature: 0.5,
            },
        });
        return JSON.parse(response.text.trim()) as CharacterProfile[];
    } catch (error) {
        throw handleApiError(error, "analyzing characters");
    }
}

export async function generateCulturalReport(originalScript: string, translatedScript: string, sourceLang: string, targetLang: string): Promise<CulturalReport> {
    try {
        const model = "gemini-2.5-flash";
        const prompt = `You are a cultural consultant and localization expert. You have been given an original script in ${sourceLang} and its translation into ${targetLang}. Your task is to generate a "Cultural Adaptation Report".

        Compare the two scripts and identify key instances where the translation was adapted for cultural resonance. This includes changes to:
        - Idioms, slang, and proverbs.
        - Jokes and humor.
        - Cultural references (e.g., food, holidays, public figures).
        - Social norms, politeness levels, and honorifics.

        For each adaptation, provide:
        - The original text.
        - The adapted translation.
        - A brief reason for the adaptation.

        Conclude with a summary of the overall adaptation strategy. Provide the response in the required JSON format.

        --- ORIGINAL SCRIPT ---
        ${originalScript}
        --- END ORIGINAL SCRIPT ---

        --- TRANSLATED SCRIPT ---
        ${translatedScript}
        --- END TRANSLATED SCRIPT ---
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
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
                                required: ["original", "adapted", "reason"],
                            },
                        },
                    },
                    required: ["summary", "adaptations"],
                },
                temperature: 0.5,
            },
        });
        // FIX: Added missing return statement.
        return JSON.parse(response.text.trim()) as CulturalReport;
    } catch (error) {
        throw handleApiError(error, "generating cultural report");
    }
}

// FIX: Added missing analyzeAudienceReception function.
export async function analyzeAudienceReception(scriptText: string, targetLang: string): Promise<AudienceReception> {
    try {
        const model = "gemini-2.5-flash";
        const prompt = `You are a film marketing and distribution expert with a deep understanding of audiences in ${targetLang}-speaking regions. Analyze the following script, which is in ${targetLang}, and provide a report on its potential audience reception.

        Your analysis should include:
        - **Target Demographic:** The primary audience for this script (e.g., age, gender, interests).
        - **Key Strengths:** What aspects of the story, characters, or themes will likely resonate most strongly with this audience?
        - **Potential Challenges:** Are there any cultural, thematic, or pacing elements that might be challenging or poorly received?
        - **Genre Appeal:** How does this script fit within the popular genres and tropes in the ${targetLang} market?

        Provide the response in the required JSON format.

        --- SCRIPT TEXT ---
        ${scriptText}
        --- END SCRIPT TEXT ---
        `;

        const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        targetDemographic: { type: Type.STRING },
                        keyStrengths: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        potentialChallenges: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                        },
                        genreAppeal: { type: Type.STRING },
                    },
                    required: ["targetDemographic", "keyStrengths", "potentialChallenges", "genreAppeal"],
                },
                temperature: 0.6,
            },
        });
        return JSON.parse(response.text.trim()) as AudienceReception;
    } catch (error) {
        throw handleApiError(error, "analyzing audience reception");
    }
}
