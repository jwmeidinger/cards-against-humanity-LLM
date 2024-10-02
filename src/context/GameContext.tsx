// src/context/GameContext.tsx

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { GameState, Player } from '../types/game';
import { getGameState } from '../utils/api';

interface GameContextProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  player: Player | null;
  setPlayer: React.Dispatch<React.SetStateAction<Player | null>>;
}

interface GameProviderProps {
  children: ReactNode;
}

export const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>({} as GameState);
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => {
    // Load player from localStorage
    const storedPlayer = localStorage.getItem('player');
    if (storedPlayer) {
      setPlayer(JSON.parse(storedPlayer));
    }

    // Load gameState from localStorage
    const storedGameCode = localStorage.getItem('gameCode');
    if (storedGameCode) {
      // Fetch the latest game state from the server
      getGameState(storedGameCode).then((latestGameState) => {
        if (latestGameState) {
          setGameState(latestGameState);
        }
      });
    }
  }, []);

  useEffect(() => {
    // Whenever player changes, update localStorage
    if (player) {
      localStorage.setItem('player', JSON.stringify(player));
    }
  }, [player]);

  useEffect(() => {
    // Whenever gameState changes, update localStorage
    if (gameState.gameCode) {
      localStorage.setItem('gameCode', gameState.gameCode);
    }
  }, [gameState.gameCode]);

  return (
    <GameContext.Provider value={{ gameState, setGameState, player, setPlayer }}>
      {children}
    </GameContext.Provider>
  );
};
