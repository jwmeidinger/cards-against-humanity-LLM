// netlify/functions/updateGameState.ts

import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { removeReservedFields } from './utils/removeReservedFields';

const client = new Client({
  secret: process.env.FAUNA_SECRET!,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    console.log('Received event body:', event.body);

    const parsedBody = JSON.parse(event.body || '{}');
    console.log('Parsed body:', parsedBody);

    const { gameCode, gameState } = parsedBody;

    if (!gameCode || !gameState) {
      console.error('Missing gameCode or gameState in request body');
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing gameCode or gameState' }),
      };
    }

    // Remove reserved fields before updating
    const cleanGameState = removeReservedFields(gameState);

    console.log('Updating game state for gameCode:', gameCode);

    // Update game state in the database
    const result = await client.query(fql`
      let game = games.where(.gameCode == ${gameCode}).first()
      game.update(${cleanGameState})
    `);

    console.log('Game state updated successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({ gameState: result.data }),
    };
  } catch (error: any) {
    console.error('Error updating game state:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'An error occurred while updating the game state',
        details: error.message,
      }),
    };
  }
};
