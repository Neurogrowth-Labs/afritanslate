import { GoogleGenAI } from '@google/genai';
import { MissingEnvError } from './_supabase.js';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingEnvError('Server is missing GEMINI_API_KEY. Configure it in Vercel project env vars.');
  client = new GoogleGenAI({ apiKey });
  return client;
}

export async function generateGeminiContent(model: string, prompt: string): Promise<string> {
  const response = await getClient().models.generateContent({ model, contents: prompt });
  if (!response.text?.trim()) throw new Error('Gemini returned empty content');
  return response.text;
}
