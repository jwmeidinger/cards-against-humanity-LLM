// netlify/functions/getGameState.ts

import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';

const client = new Client({
  secret: process.env.FAUNA_SECRET!,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const gameCode = event.queryStringParameters?.gameCode;

    if (!gameCode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing gameCode' }),
      };
    }

    const result = await client.query(fql`
      games.where(.gameCode == ${gameCode}).first()
    `);

    if (!result.data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Game not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ gameState: result.data }),
    };
  } catch (error: any) {
    console.error('Error fetching game state:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while fetching the game state', details: error.message }),
    };
  }
};
