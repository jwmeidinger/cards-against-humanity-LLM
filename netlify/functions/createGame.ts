// netlify/functions/createGame.ts

import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { GameState, Player } from '../../src/types/game';
import { generateGameCode } from './utils/generateGameCode';

const client = new Client({
  secret: process.env.FAUNA_SECRET!,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { player } = JSON.parse(event.body || '{}');

    if (!player) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing player data' }) };
    }

    const gameCode = generateGameCode();

    const initialGameState: GameState = {
      gameCode,
      players: [player],
      currentRound: 0,
      rounds: [],
      blackCards: [],
      whiteCards: [],
      gameStatus: 'lobby',
      maxRounds: 10,
      winnerCount: 3,
      theme: 'Random',
      whiteCardTimeLimit: 60,
      blackCardTimeLimit: 60,
      provider: 'groq',
      model: 'llama-3.1-8b-instant'
    };

    // Save game state to the database
    const result = await client.query<GameState>(fql`
      games.create(${initialGameState})
    `);

    return {
      statusCode: 200,
      body: JSON.stringify({ gameState: result.data }),
    };
  } catch (error) {
    console.error('Error creating game:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while creating the game' }),
    };
  }
};
