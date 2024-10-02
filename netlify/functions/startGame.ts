// netlify/functions/startGame.ts

import { Handler } from '@netlify/functions';
import { Client, fql } from 'fauna';
import { removeReservedFields } from './utils/removeReservedFields';
import { GameState, Round, Player } from '../../src/types/game';
import { generateCards } from './generateCards';

const client = new Client({
  secret: process.env.FAUNA_SECRET!,
});

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { gameCode, apiKey } = JSON.parse(event.body || '{}');

    if (!gameCode) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing gameCode' }) };
    }

    // Fetch the game state from the database
    const result = await client.query<GameState>(fql`
      let game = games.where(.gameCode == ${gameCode}).first()
      game
    `);

    if (!result.data) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Game not found' }) };
    }

    const gameState = result.data;

    // Generate cards
    const { blackCards, whiteCards } = await generateCards(
      gameState.theme,
      gameState.players.length,
      10,
      gameState.provider,
      gameState.model,
      apiKey
    );

    // Randomly assign a judge
    const judgeIndex = Math.floor(Math.random() * gameState.players.length);
    const judgeId = gameState.players[judgeIndex].id;

    // Draw a black card
    const blackCard = blackCards.pop() || 'Default black card';

    // Deal white cards to players
    const playersWithHands: Player[] = gameState.players.map((player) => ({
      ...player,
      hand: whiteCards.splice(0, 10),
    }));

    const submissionDeadline = new Date();
    submissionDeadline.setSeconds(
      submissionDeadline.getSeconds() + gameState.whiteCardTimeLimit
    );

    // Initialize the first round
    const newRound: Round = {
      roundNumber: 1,
      startTime: new Date().toISOString(),
      submissionDeadline: submissionDeadline.toISOString(),
      isBlackCardRound: false,
      blackCard: blackCard,
      submissions: [],
      judgeId,
      phase: 'submission',
    };

    const updatedGameState: GameState = {
      ...gameState,
      players: playersWithHands,
      currentRound: 0,
      rounds: [newRound],
      blackCards: blackCards,
      whiteCards: whiteCards,
      gameStatus: 'in_progress',
    };

    // Remove reserved fields before updating
    const cleanUpdatedGameState = removeReservedFields(updatedGameState);

    // Update game state in the database
    const updateResult = await client.query<GameState>(fql`
      let game = games.where(.gameCode == ${gameCode}).first()
      game.update(${cleanUpdatedGameState})
    `);

    if (!updateResult.data) {
      throw new Error('Failed to update game state in database');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ gameState: updateResult.data }),
    };
  } catch (error: any) {
    console.error('Error starting game:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'An error occurred while starting the game', details: error.message }),
    };
  }
};