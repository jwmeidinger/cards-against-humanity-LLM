// src/components/Game/utils/helpers.ts

import { Player } from '../../../types/game';

export const getPlayerNameById = (playerId: string, players: Player[]): string => {
  const player = players.find((p) => p.id === playerId);
  return player ? player.name : 'Unknown';
};

export const dealWhiteCardsToPlayers = (
  players: Player[],
  whiteCards: string[]
): { updatedPlayers: Player[]; remainingWhiteCards: string[] } => {
  const updatedPlayers = players.map((p) => {
    const cardsNeeded = 10 - p.hand.length;
    const newCards = whiteCards.splice(0, cardsNeeded);
    return { ...p, hand: [...p.hand, ...newCards] };
  });

  const remainingWhiteCards = whiteCards;
  return { updatedPlayers, remainingWhiteCards };
};
