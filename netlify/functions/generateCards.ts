// netlify/functions/generateCards.ts

import { Handler } from '@netlify/functions';
import { callGroqAPI } from './providers/groqProvider';
import { callOpenAIAPI } from './providers/openAIProvider';
import { callAnthropicAPI } from './providers/anthropicProvider';

//const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const BLACK_CARD_COUNT = 15;
const WHITE_CARD_COUNT = 200;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const EXAMPLE_WHITE_CARDS = [
  "Being on fire.",
  "Racism.",
  "Old-people smell.",
  "A micro-penis.",
  "Women in yogurt commercials.",
  "Classist undertones.",
  "Sexting.",
  "Roofies.",
  "Corpses.",
  "The gays.",
  "Oversized lollipops.",
  "African children.",
  "An asymmetric boob job.",
  "Bingeing and purging.",
  "The hardworking Mexican.",
  "An Oedipus complex.",
  "A tiny horse.",
  "Boogers.",
  "Penis envy.",
  "Barack Obama.",
  "My humps.",
  "Scientology.",
  "Dry heaving.",
];

const EXAMPLE_BLACK_CARDS = [
  "I drink to forget _______.",
  "What's that smell?",
  "I got 99 problems but _______ ain't one.",
  "Maybe she's born with it. Maybe it's _______.",
  "What's the next Happy Meal® toy?",
  "Here is the church\nHere is the steeple\nOpen the doors\nAnd there is _______.",
  "It's a pity that kids these days are all getting involved with _______.",
  "During sex, I like to think about _______.",
  "What ended my last relationship?",
  "What's my secret power?",
];

const MAX_TOKENS_FOR_GENERATE = 4000;

const callLLM = async (prompt: string, provider: string, model: string, apiKey: string): Promise<string | null> => {
  switch (provider) {
    case 'groq':
      return callGroqAPI(prompt, apiKey, model, MAX_TOKENS_FOR_GENERATE);
    case 'openai':
      return callOpenAIAPI(prompt, apiKey, model, MAX_TOKENS_FOR_GENERATE);
    case 'anthropic':
      return callAnthropicAPI(prompt, apiKey, model, MAX_TOKENS_FOR_GENERATE);
    default:
      throw new Error('Invalid provider');
  }
};

export const generateCards = async (
  theme: string,
  playerCount: number,
  cardsPerPlayer: number,
  provider: string,
  model: string,
  apiKey: string
): Promise<{ blackCards: string[]; whiteCards: string[] }> => {
  console.log(
    `Generating cards for theme: ${theme}, playerCount: ${playerCount}, cardsPerPlayer: ${cardsPerPlayer}`
  );

  let blackCards: string[] = [];
  let whiteCards: string[] = [];

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`Attempt ${attempt} to generate cards`);

    const prompt = `Generate ${Math.max(WHITE_CARD_COUNT - whiteCards.length, 0)} unique white cards and ${Math.max(
      BLACK_CARD_COUNT - blackCards.length,
      0
    )} unique black cards for an 18+ Cards Against Humanity-style game based on the theme: ${theme}.

The content should be humorous, clever, edgy, and potentially offensive, similar to the original game. Avoid extreme hate speech, but don't shy away from controversial or taboo topics.

Here are some examples of white cards:
${EXAMPLE_WHITE_CARDS.map((card, index) => `${index + 1}. ${card}`).join('\n')}

Here are some examples of black cards:
${EXAMPLE_BLACK_CARDS.map((card, index) => `${index + 1}. ${card}`).join('\n')}

Important: For black cards, use only one blank (_______) per card. Do not create cards with multiple blanks.

Now, generate new cards in the following format:

White Cards:
1. [Answer or phrase]
2. [Answer or phrase]
...

Black Cards:
1. [Question or fill-in-the-blank statement with one blank]
2. [Question or fill-in-the-blank statement with one blank]
...`;

    const generatedText = await callLLM(prompt, provider, model, apiKey);

    if (!generatedText) {
      console.error(`No content generated on attempt ${attempt}`);
      if (attempt < MAX_RETRIES) {
        await wait(RETRY_DELAY);
        continue;
      } else {
        throw new Error('Failed to generate content after multiple attempts');
      }
    }

    const sections = generatedText.split(/White Cards:|Black Cards:/);

    if (sections.length >= 3) {
      const whiteCardContent = sections[1].trim();
      const blackCardContent = sections[2].trim();

      const parseCards = (content: string) =>
        content
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.match(/^\d+\./))
          .map((line) => line.replace(/^\d+\./, '').trim());

      const newWhiteCards = parseCards(whiteCardContent);
      const newBlackCards = parseCards(blackCardContent).filter(
        (card) => (card.match(/_+/g) || []).length === 1
      );

      whiteCards = [...new Set([...whiteCards, ...newWhiteCards])];
      blackCards = [...new Set([...blackCards, ...newBlackCards])];

      console.log(`Current white cards: ${whiteCards.length}, black cards: ${blackCards.length}`);
    }

    if (blackCards.length >= BLACK_CARD_COUNT && whiteCards.length >= WHITE_CARD_COUNT) {
      console.log('Sufficient cards generated, breaking the loop');
      break;
    }

    if (attempt < MAX_RETRIES) {
      console.log(`Not enough cards generated on attempt ${attempt}. Retrying...`);
      await wait(RETRY_DELAY);
    }
  }

  // Final check
  if (blackCards.length < BLACK_CARD_COUNT || whiteCards.length < WHITE_CARD_COUNT) {
    console.warn(
      `Not enough cards generated after ${MAX_RETRIES} attempts. Black cards: ${blackCards.length}/${BLACK_CARD_COUNT}, White cards: ${whiteCards.length}/${WHITE_CARD_COUNT}`
    );
  }

 // Ensure we have at least the minimum required white cards
 const minRequiredWhiteCards = playerCount * cardsPerPlayer + 50; // Extra 50 for replenishment
 if (whiteCards.length < minRequiredWhiteCards) {
   console.warn(`Not enough white cards. Filling with example cards.`);
   const exampleWhiteCardsCopy = [...EXAMPLE_WHITE_CARDS];
   while (whiteCards.length < minRequiredWhiteCards) {
     if (exampleWhiteCardsCopy.length === 0) {
       // Reset the copy if we've used all example cards
       exampleWhiteCardsCopy.push(...EXAMPLE_WHITE_CARDS);
     }
     whiteCards.push(exampleWhiteCardsCopy.shift()!);
   }
 }

 // Ensure we have at least the required black cards
 if (blackCards.length < BLACK_CARD_COUNT) {
   console.warn(`Not enough black cards. Filling with example cards.`);
   const exampleBlackCardsCopy = [...EXAMPLE_BLACK_CARDS];
   while (blackCards.length < BLACK_CARD_COUNT) {
     if (exampleBlackCardsCopy.length === 0) {
       // Reset the copy if we've used all example cards
       exampleBlackCardsCopy.push(...EXAMPLE_BLACK_CARDS);
     }
     blackCards.push(exampleBlackCardsCopy.shift()!);
   }
 }

  // Shuffle the cards
  const shuffleArray = (array: string[]) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  };

  shuffleArray(blackCards);
  shuffleArray(whiteCards);

  // Trim arrays to required length
  blackCards = blackCards.slice(0, BLACK_CARD_COUNT);
  whiteCards = whiteCards.slice(0, Math.max(WHITE_CARD_COUNT, minRequiredWhiteCards));

  console.log(`Final card counts - Black cards: ${blackCards.length}, White cards: ${whiteCards.length}`);

  return { blackCards, whiteCards };
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { theme, playerCount, cardsPerPlayer = 10, provider, model, apiKey } = JSON.parse(event.body || '{}');

  try {
    const { blackCards, whiteCards } = await generateCards(theme, playerCount, cardsPerPlayer, provider, model, apiKey);

    return {
      statusCode: 200,
      body: JSON.stringify({ blackCards, whiteCards }),
    };
  } catch (error: any) {
    console.error('Error generating cards:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to generate cards', details: error.message }),
    };
  }
};
