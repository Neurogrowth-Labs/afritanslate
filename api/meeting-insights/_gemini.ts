import { GoogleGenerativeAI } from '@google/generative-ai';
import { MissingEnvError } from './_supabase.js';

type GenerativeModel = ReturnType<InstanceType<typeof GoogleGenerativeAI>['getGenerativeModel']>;

let cached: { genAI: GoogleGenerativeAI; flash: GenerativeModel; pro: GenerativeModel } | null = null;

function init() {
    if (cached) return cached;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new MissingEnvError(
            'Server is missing GEMINI_API_KEY. Configure it in Vercel project env vars.',
        );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    cached = {
        genAI,
        flash: genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }),
        pro: genAI.getGenerativeModel({ model: 'gemini-2.5-pro' }),
    };
    return cached;
}

export const geminiFlash: GenerativeModel = new Proxy({} as GenerativeModel, {
    get(_target, prop, receiver) {
        return Reflect.get(init().flash, prop, receiver);
    },
});

export const geminiPro: GenerativeModel = new Proxy({} as GenerativeModel, {
    get(_target, prop, receiver) {
        return Reflect.get(init().pro, prop, receiver);
    },
});

export async function generateJSON<T>(
    model: GenerativeModel,
    prompt: string,
): Promise<T> {
    const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
            responseMimeType: 'application/json',
        },
    });

    const text = result.response.text();

    try {
        return JSON.parse(text) as T;
    } catch {
        throw new Error(`Gemini returned invalid JSON: ${text.slice(0, 200)}`);
    }
}
