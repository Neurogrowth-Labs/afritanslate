function extractContent(content: unknown): string {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) {
          const text = (part as { text?: unknown }).text;
          return typeof text === 'string' ? text : '';
        }
        return '';
      })
      .join('');
  }
  return '';
}

async function generateFromOpenRouter(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENROUTER_API_KEY environment variable');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://studio.afritranslate.co.za',
      'X-Title': 'AfriTranslate AI',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: systemInstruction ?? 'You are AfriTranslate AI.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 8000,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();
    throw new Error(`OpenRouter ${response.status}: ${bodyText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: unknown;
      };
    }>;
  };

  const content = extractContent(data.choices?.[0]?.message?.content);
  if (!content.trim()) {
    throw new Error('OpenRouter returned empty content');
  }

  return content;
}

async function generateFromGemini(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  const { generateGeminiContent } = await import('./_gemini.js');
  const isLocalizationPrompt = /localization engine|translate and localize/i.test(prompt);
  const model = isLocalizationPrompt ? 'gemini-2.5-flash' : 'gemini-2.5-pro';
  const userPrompt = systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt;
  return generateGeminiContent(model, userPrompt);
}

export async function generateContent(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  try {
    return await generateFromOpenRouter(prompt, systemInstruction);
  } catch (err) {
    console.warn('[ai-provider] OpenRouter failed, falling back to Gemini:', err);
  }

  try {
    return await generateFromGemini(prompt, systemInstruction);
  } catch (err) {
    console.error('[ai-provider] Both providers failed:', err);
    throw new Error('AI_PROVIDER_UNAVAILABLE');
  }
}
