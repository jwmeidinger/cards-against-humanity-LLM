// netlify/functions/joinGame.ts

import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { GameState, Player } from '../../src/types/game';
import { removeReservedFields } from './utils/removeReservedFields';

const client = new Client({
  secret: process.env.FAUNA_SECRET!,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { gameCode, player } = JSON.parse(event.body || '{}');

    if (!gameCode || !player) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing gameCode or player data' }) };
    }

    const result = await client.query<GameState>(fql`
      let game = games.where(.gameCode == ${gameCode}).first()
      game
    `);

    if (!result.data) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Game not found' }),
      };
    }

    const gameState = result.data;

    // Check if the player is already in the game
    const playerExists = gameState.players.some((p) => p.id === player.id);
    if (playerExists) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Player already in the game' }),
      };
    }

    // Update game state with the new player
    const updatedPlayers = [...gameState.players, player];
    const updatedGameState: GameState = { ...gameState, players: updatedPlayers };

    // Remove reserved fields from the updated game state
    const cleanUpdatedGameState = removeReservedFields(updatedGameState);

    // Update game state in the database
    const updateResult = await client.query<GameState>(fql`
      let game = games.where(.gameCode == ${gameCode}).first()
      game.update(${cleanUpdatedGameState})
    `);

    return {
      statusCode: 200,
      body: JSON.stringify({ gameState: updateResult.data }),
    };
  } catch (error) {
    console.error('Error joining game:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while joining the game' }),
    };
  }
};
