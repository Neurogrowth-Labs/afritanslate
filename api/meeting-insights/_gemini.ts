import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY!;

if (!apiKey) {
  throw new Error('Missing GEMINI_API_KEY environment variable');
}

const genAI = new GoogleGenerativeAI(apiKey);

export const geminiFlash = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
export const geminiPro = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

export async function generateJSON<T>(
  model: ReturnType<typeof genAI.getGenerativeModel>,
  prompt: string
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
