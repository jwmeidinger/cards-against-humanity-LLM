// /netlify/functions/providers/anthropicProvider.ts

import Anthropic from '@anthropic-ai/sdk';

export const callAnthropicAPI = async (prompt: string, apiKey: string, model: string, maxTokens: number): Promise<string | null> => {
  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.completions.create({
      model: model,
      prompt: prompt,
      max_tokens_to_sample: maxTokens,
      temperature: 0.8,
    });

    return response.completion.trim() || null;
  } catch (error) {
    console.error('Error calling Anthropic API:', error);
    return null;
  }
};