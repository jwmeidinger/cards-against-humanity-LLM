// /netlify/functions/providers/groqProvider.ts

import Groq from 'groq-sdk';

export const callGroqAPI = async (prompt: string, apiKey: string, model: string, maxTokens: number): Promise<string | null> => {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: model,
      temperature: 0.9,
      max_tokens: maxTokens,
    });

    return chatCompletion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return null;
  }
};