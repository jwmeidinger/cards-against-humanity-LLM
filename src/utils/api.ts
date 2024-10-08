// src/utils/api.ts

import { GameState, Player, BotPickCardRequest} from '../types/game';

const API_BASE_URL = '/.netlify/functions'

export const createGame = async (player: Player): Promise<GameState | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/createGame`, {
      method: 'POST',
      body: JSON.stringify({ player }),
    });

    const data = await response.json();

    if (response.ok) {
      return data.gameState;
    } else {
      console.error('Error creating game:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Network error creating game:', error);
    return null;
  }
};

export const joinGame = async (gameCode: string, player: Player): Promise<GameState | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/joinGame`, {
      method: 'POST',
      body: JSON.stringify({ gameCode, player }),
    });

    const data = await response.json();

    if (response.ok) {
      return data.gameState;
    } else {
      console.error('Error joining game:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Network error joining game:', error);
    return null;
  }
};

export const getGameState = async (gameCode: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/getGameState?gameCode=${gameCode}`);
    if (response.ok) {
      const data = await response.json();
      return data.gameState as GameState;
    } else {
      console.error('Failed to fetch game state:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error fetching game state:', error);
    return null;
  }
};

export const updateGameState = async (gameCode: string, gameState: GameState) => {
  const response = await fetch(`${API_BASE_URL}/updateGameState`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ gameCode, gameState }),
  });

  console.log('API response status:', response.status);

  if (response.ok) {
    const data = await response.json();
    console.log('API response data:', data);
    return data.gameState as GameState;
  } else {
    const errorText = await response.text();
    console.error('Failed to update game state:', errorText);
    return null;
  }
};

export const startGame = async (gameCode: string): Promise<GameState | null> => {
  try {
    const apiKey = localStorage.getItem('apiKey');
    const response = await fetch(`${API_BASE_URL}/startGame`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameCode, apiKey }),
    });

    const data = await response.json();

    if (response.ok) {
      return data.gameState;
    } else {
      console.error('Error starting game:', data.error);
      return null;
    }
  } catch (error) {
    console.error('Network error starting game:', error);
    return null;
  }
};

export const botPickCard = async ({
  botName,
  blackCardText,
  options,
  context,
  provider,
  model,
}: BotPickCardRequest): Promise<string | null> => {
  try {
    const apiKey = localStorage.getItem('apiKey');
    console.debug("123TESTING STUFF")
    console.debug(botName)
    console.debug(blackCardText)
    console.debug(options)
    console.debug(context)
    console.debug(provider)
    console.debug(model)
    const response = await fetch(`${API_BASE_URL}/botPickCard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botName,
        blackCardText,
        options,
        context,
        provider,
        model,
        apiKey,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text(); // Capture the error message from the server
      console.error('Error calling botPickCard API:', response.status, errorData);
      return null;
    }


    const data = await response.json();
    const { selectedCard } = data;

    return selectedCard;
  } catch (error) {
    console.error('Error calling botPickCard API:', error);
    return null;
  }
};
