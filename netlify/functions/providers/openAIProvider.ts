// /netlify/functions/providers/openAIProvider.ts

import OpenAI from 'openai';

export const callOpenAIAPI = async (prompt: string, apiKey: string, model: string, maxTokens: number): Promise<string | null> => {
  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return null;
  }
};