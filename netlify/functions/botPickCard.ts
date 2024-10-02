// netlify/functions/botPickCard.ts

import { Handler } from '@netlify/functions';
import { callGroqAPI } from './providers/groqProvider';
import { callOpenAIAPI } from './providers/openAIProvider';
import { callAnthropicAPI } from './providers/anthropicProvider';

interface BotPickCardRequest {
  botName: string;
  blackCardText: string;
  options: string[];
  context: 'submission' | 'judging';
  provider: 'groq' | 'openai' | 'anthropic';
  model: string;
  apiKey?: string;
}

const MAX_TOKENS_FOR_PICK = 150;

const callLLM = async (prompt: string, provider: string, model: string, apiKey: string): Promise<string | null> => {
  switch (provider) {
    case 'groq':
      return callGroqAPI(prompt, apiKey, model, MAX_TOKENS_FOR_PICK);
    case 'openai':
      return callOpenAIAPI(prompt, apiKey, model, MAX_TOKENS_FOR_PICK);
    case 'anthropic':
      return callAnthropicAPI(prompt, apiKey, model, MAX_TOKENS_FOR_PICK);
    default:
      throw new Error('Invalid provider');
  }
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const requestBody: BotPickCardRequest = JSON.parse(event.body || '{}');

  const { botName, blackCardText, options, context, provider, model, apiKey } = requestBody;

  if (!botName || !blackCardText || !options || !context || !provider || !model) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields in the request body' }),
    };
  }

  try {
    let prompt = '';

    if (context === 'submission') {
      prompt = `
You are playing a game similar to Cards Against Humanity. As a bot named "${botName}", you need to select the most funny, or edgy white card from your hand based on the black card provided.

Black Card:
"${blackCardText}"

Your Hand:
${options.map((option, index) => `${index + 1}. ${option}`).join('\n')}

As a funny, edgy "${botName}", choose the number of the white card that best fits the black card, considering your personality and preferences implied by your name.

Just provide the number of the selected card.
`;
    } else if (context === 'judging') {
      prompt = `
You are the judge in a game similar to Cards Against Humanity. As a bot named "${botName}", you need to select the best funny, or edgy white card submission based on the black card.

Black Card:
"${blackCardText}"

White Card Submissions:
${options.map((option, index) => `${index + 1}. ${option}`).join('\n')}

As a funny, edgy "${botName}", choose the number of the submission that you think is the funniest or most appropriate, considering your personality and preferences implied by your name.

Just provide the number of the selected submission.
`;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid context. Must be "submission" or "judging".' }),
      };
    }

    const llmResponse = await callLLM(prompt, provider, model, apiKey);
    console.debug("WHAT IS HAPPENING HERE:")
    console.debug(llmResponse)
    if (!llmResponse) {
      throw new Error('No response from LLM API');
    }

    const selectedNumberMatch = llmResponse.match(/^\s*(\d+)/);
    if (!selectedNumberMatch) {
      throw new Error('Could not parse the LLM response');
    }

    const selectedIndex = parseInt(selectedNumberMatch[1], 10) - 1;

    if (selectedIndex < 0 || selectedIndex >= options.length) {
      throw new Error('Selected index out of bounds');
    }

    const selectedCard = options[selectedIndex];

    return {
      statusCode: 200,
      body: JSON.stringify({ selectedCard }),
    };
  } catch (error: any) {
    console.error('Error in botPickCard function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Failed to process bot card selection',
        details: error.message,
      }),
    };
  }
};