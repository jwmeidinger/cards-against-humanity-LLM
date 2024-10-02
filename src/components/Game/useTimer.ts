// src/components/Game/useTimer.ts

import { useEffect, useState } from 'react';
import { GameState, Round } from '../../types/game';
import { updateGameState } from '../../utils/api';
import { removeReservedFields } from '../../utils/removeReservedFields';

export const useTimer = (
  currentRound: Round,
  gameState: GameState,
  setGameState: (gameState: GameState) => void
) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!currentRound || !currentRound.submissionDeadline) {
      setTimeLeft(0);
      return;
    }

    const deadline = new Date(currentRound.submissionDeadline);
    if (isNaN(deadline.getTime())) {
      console.error('Invalid submissionDeadline:', currentRound.submissionDeadline);
      setTimeLeft(0);
      return;
    }

    const interval = setInterval(() => {
      if (currentRound.phase === 'submission') {
        const now = new Date();
        const difference = Math.max(0, deadline.getTime() - now.getTime());
        setTimeLeft(Math.ceil(difference / 1000));

        if (difference <= 0) {
          clearInterval(interval);
          handleSubmissionTimeout(currentRound, gameState, setGameState);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRound, gameState, setGameState]);

  return timeLeft;
};

const handleSubmissionTimeout = async (
  currentRound: Round,
  gameState: GameState,
  setGameState: (gameState: GameState) => void
) => {
  // Check if phase is still 'submission' and judging hasn't started
  if (currentRound.phase !== 'submission' || currentRound.judgingPhaseStarted) {
    return;
  }

  const updatedSubmissions = [...currentRound.submissions];
  const updatedPlayers = [...gameState.players];
  const whiteCardsCopy = [...gameState.whiteCards];
  let updated = false;

  // Find players who haven't submitted
  const playersWhoNeedToSubmit = gameState.players.filter((p) => {
    return (
      p.id !== currentRound.judgeId &&
      !currentRound.submissions.some((s) => s.playerId === p.id)
    );
  });

  for (const p of playersWhoNeedToSubmit) {
    // Randomly select a card from the player's hand
    if (p.hand.length === 0) {
      console.warn(`Player ${p.id} has no cards to submit.`);
      continue;
    }

    const cardIndex = Math.floor(Math.random() * p.hand.length);
    const card = p.hand.splice(cardIndex, 1)[0];

    // Add submission
    if (card) {
      updatedSubmissions.push({ playerId: p.id, card });
      updated = true;

      // Draw a new card for the player
      const newCard = whiteCardsCopy.shift();
      if (newCard) {
        p.hand.push(newCard);
      }

      console.log(`Auto-submitted card for player ${p.id}: "${card}"`);
    }
  }

  if (updated) {
    const updatedRound: Round = {
      ...currentRound,
      submissions: updatedSubmissions,
    };

    // Check if all submissions are in
    const requiredSubmissions = gameState.players.filter(
      (p) => p.id !== currentRound.judgeId
    ).length;
    const hasAllSubmissions = updatedSubmissions.length >= requiredSubmissions;

    if (hasAllSubmissions) {
      updatedRound.phase = 'judging';
      updatedRound.judgingPhaseStarted = true;
    }

    const updatedGameState: GameState = {
      ...gameState,
      players: updatedPlayers,
      rounds: gameState.rounds.map((r, idx) =>
        idx === gameState.currentRound ? updatedRound : r
      ),
      whiteCards: whiteCardsCopy,
    };

    const cleanUpdatedGameState = removeReservedFields(updatedGameState);

    const latestGameState = await updateGameState(gameState.gameCode, cleanUpdatedGameState);
    if (latestGameState) {
      setGameState(latestGameState);
      console.log('Auto-submission completed and game state updated.');
    } else {
      console.error('Failed to update game state after auto-submission.');
    }
  }
};
