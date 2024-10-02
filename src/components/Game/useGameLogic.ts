// src/components/Game/useGameLogic.ts

import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../../context/GameContext';
import { GameState, Round } from '../../types/game';
import { getGameState, updateGameState } from '../../utils/api';
import { useNavigate } from 'react-router-dom';
import { removeReservedFields } from '../../utils/removeReservedFields';
import { handleBotsSubmission, handleBotJudging } from './BotsHandler';
import { useTimer } from './useTimer';
import { getPlayerNameById as getPlayerNameByIdHelper, dealWhiteCardsToPlayers } from './utils/helpers';

export const useGameLogic = () => {
  const { gameState, setGameState, player, setPlayer } = useContext(GameContext)!;
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const navigate = useNavigate();

  // Load game state and player from local storage on component mount if not in context
  useEffect(() => {
    if (!gameState?.gameCode || !player) {
      // Try to load from localStorage
      const storedGameCode = localStorage.getItem('gameCode');
      const storedPlayer = localStorage.getItem('player');

      if (storedGameCode && storedPlayer) {
        const parsedPlayer = JSON.parse(storedPlayer);
        setPlayer(parsedPlayer);
        fetchGameState(storedGameCode);
      } else {
        alert('Game data not found. Redirecting to home page.');
        navigate('/');
      }
    }
  }, [gameState?.gameCode, player, navigate, setPlayer]);

  // Fetch game state and update player
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState?.gameCode) {
        fetchGameState(gameState.gameCode);
      }
    }, 1500);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState?.gameCode]);

  const fetchGameState = async (gameCode: string) => {
    const latestGameState = await getGameState(gameCode);
    if (latestGameState) {
      setGameState(latestGameState);
      let areWinner = latestGameState.players?.find(
        (player) => player.score >= latestGameState.winnerCount
      );
      if (latestGameState.gameStatus === 'completed' && areWinner) {
        alert(`Game over! ${areWinner.name} has won the game.`);
        navigate('/game-over');
      }
      // Update the player object based on the latest game state
      if (player) {
        const updatedPlayer = latestGameState.players?.find((p) => p.id === player.id);
        if (updatedPlayer) {
          setPlayer(updatedPlayer);
        } else {
          // Player not found in the game; handle accordingly
          alert('Player not found in game. Redirecting to home page.');
          navigate('/');
        }
      } else {
        // No player in context; try to load from localStorage
        const storedPlayer = localStorage.getItem('player');
        if (storedPlayer) {
          const parsedPlayer = JSON.parse(storedPlayer);
          const updatedPlayer = latestGameState.players?.find((p) => p.id === parsedPlayer.id);
          if (updatedPlayer) {
            setPlayer(updatedPlayer);
          } else {
            alert('Player not found in game. Redirecting to home page.');
            navigate('/');
          }
        } else {
          alert('Player data missing. Redirecting to home page.');
          navigate('/');
        }
      }
    } else {
      alert('Failed to fetch game state. Redirecting to home page.');
      navigate('/');
    }
  };

  // Handle bots' actions
  useEffect(() => {
    if (gameState?.rounds?.length > 0) {
      const currentRound = gameState.rounds[gameState.currentRound];
      if (currentRound?.phase === 'submission' && !currentRound.botsSubmitted) {
        handleBotsSubmission(gameState, setGameState);
      } else if (currentRound?.phase === 'judging' && currentRound.judgingPhaseStarted) {
        handleBotJudging(gameState, setGameState, handleWinnerSelect);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState]);

  // Determine if the current player has submitted in the current round
  const currentRound = gameState?.rounds?.[gameState.currentRound];
  const hasPlayerSubmitted = currentRound?.submissions?.some(
    (submission) => submission.playerId === player?.id
  );

  // Reset selectedCardIndex when a new round starts
  useEffect(() => {
    setSelectedCardIndex(null);
    if (gameState) {
      console.log(`New round started: Round ${gameState.currentRound + 1}`);
    }
  }, [gameState?.currentRound]);

  const handleCardSubmitClick = async () => {
    if (!currentRound || !player) return;

    // Ensure the player is not the judge and player is not null
    if (currentRound.judgeId === player.id || selectedCardIndex === null) {
      return;
    }

    const playerCard = player.hand[selectedCardIndex];

    if (!playerCard) {
      return;
    }

    // Remove the card from the player's hand
    const updatedHand = player.hand.filter((_, idx) => idx !== selectedCardIndex);

    // Draw a new card from the whiteCards deck
    const whiteCardsCopy = [...(gameState?.whiteCards ?? [])];
    const newCard = whiteCardsCopy.shift();

    if (newCard) {
      updatedHand.push(newCard);
    }

    // Update player and game state
    const updatedPlayers = gameState.players?.map((p) =>
      p.id === player.id ? { ...p, hand: updatedHand } : p
    ) ?? [];

    // Avoid mutating state directly
    const updatedSubmissions = [
      ...(currentRound.submissions ?? []),
      { playerId: player.id, card: playerCard },
    ];

    const updatedRound: Round = {
      ...currentRound,
      submissions: updatedSubmissions,
    };

    // Check if all submissions are in (Judge does not submit)
    const requiredSubmissions =
      gameState.players?.filter((p) => p.id !== currentRound.judgeId).length ?? 0;
    const hasAllSubmissions = updatedSubmissions.length >= requiredSubmissions;

    if (hasAllSubmissions) {
      updatedRound.phase = 'judging';
      updatedRound.judgingPhaseStarted = true;
    }

    // Update the game state
    const updatedGameState: GameState = {
      ...gameState,
      players: updatedPlayers,
      rounds: gameState.rounds?.map((r, idx) =>
        idx === gameState.currentRound ? updatedRound : r
      ) ?? [],
      whiteCards: whiteCardsCopy,
    };

    // Remove reserved fields before updating
    const cleanUpdatedGameState = removeReservedFields(updatedGameState);

    // Call the API to update the game state
    const latestGameState = await updateGameState(gameState.gameCode, cleanUpdatedGameState);

    if (latestGameState) {
      setGameState(latestGameState);
    } else {
      console.error('Failed to update game state after submitting card.');
    }
  };

  const handleWinnerSelect = async (winnerPlayerId: string) => {
    if (!currentRound || !gameState) return;
  
    console.log(`Winner selected: ${winnerPlayerId}`);
  
    if (currentRound.phase !== 'judging') {
      // Winner has already been selected
      return;
    }
  
    // Update scores
    const updatedPlayers = gameState.players?.map((p) =>
      p.id === winnerPlayerId ? { ...p, score: p.score + 1 } : p
    ) ?? [];
  
    // Mark current round as complete
    const updatedCurrentRound: Round = {
      ...currentRound,
      phase: 'complete',
      winnerId: winnerPlayerId,
      winningCard:
        currentRound.submissions?.find((s) => s.playerId === winnerPlayerId)?.card || '',
    };
  
    // Check for game end condition
    const winningScore = gameState.winnerCount;
    const winner = updatedPlayers.find((p) => p.score >= winningScore);
  
    if (winner) {
      // Game over due to player reaching winning score
      const updatedGameState: GameState = {
        ...gameState,
        players: updatedPlayers,
        rounds: gameState.rounds?.map((r, idx) =>
          idx === gameState.currentRound ? updatedCurrentRound : r
        ) ?? [],
        gameStatus: 'completed',
      };
  
      const cleanUpdatedGameState = removeReservedFields(updatedGameState);
  
      const latestGameState = await updateGameState(gameState.gameCode, cleanUpdatedGameState);
      if (latestGameState) {
        setGameState(latestGameState);
        alert(`Game over! ${winner.name} has won the game.`);
        navigate('/game-over');
      }
    } else if (gameState.currentRound + 1 >= gameState.maxRounds) {
      // Game over due to reaching maximum rounds
      const updatedGameState: GameState = {
        ...gameState,
        players: updatedPlayers,
        rounds: gameState.rounds?.map((r, idx) =>
          idx === gameState.currentRound ? updatedCurrentRound : r
        ) ?? [],
        gameStatus: 'completed',
      };
  
      const cleanUpdatedGameState = removeReservedFields(updatedGameState);
  
      const latestGameState = await updateGameState(gameState.gameCode, cleanUpdatedGameState);
      if (latestGameState) {
        setGameState(latestGameState);
        alert('Game over! Maximum rounds reached.');
        navigate('/game-over');
      }
    } else {
      // Move to the next round
      const nextRoundNumber = gameState.currentRound + 1; // CurrentRound is zero-based index
      const nextJudgeId = winnerPlayerId; // Winner becomes the next judge
  
      // Draw a new black card
      const blackCardsCopy = [...(gameState.blackCards ?? [])];
      const blackCard = blackCardsCopy.pop() || 'Default black card';
  
      // Clone whiteCards
      const whiteCardsCopy = [...(gameState.whiteCards ?? [])];
  
      // Replenish players' hands
      const { updatedPlayers: playersWithFullHands, remainingWhiteCards } =
        dealWhiteCardsToPlayers(updatedPlayers, whiteCardsCopy);
  
      // Set submission deadline
      const submissionDeadline = new Date();
      submissionDeadline.setSeconds(
        submissionDeadline.getSeconds() + (gameState.whiteCardTimeLimit ?? 60)
      );
  
      console.log('Setting up new round:', {
        roundNumber: nextRoundNumber + 1,
        submissionDeadline: submissionDeadline.toISOString(),
      });
  
      const newRound: Round = {
        roundNumber: nextRoundNumber + 1, // Round numbers start from 1
        startTime: new Date().toISOString(),
        submissionDeadline: submissionDeadline.toISOString(),
        isBlackCardRound: false,
        blackCard: blackCard,
        submissions: [], // Ensure submissions are empty
        judgeId: nextJudgeId,
        phase: 'submission',
        botsSubmitted: false,
        judgingPhaseStarted: false,
      };
  
      const updatedGameState: GameState = {
        ...gameState,
        players: playersWithFullHands,
        currentRound: nextRoundNumber,
        rounds: [
          ...(gameState.rounds?.map((r, idx) =>
            idx === gameState.currentRound ? updatedCurrentRound : r
          ) ?? []),
          newRound,
        ],
        blackCards: blackCardsCopy,
        whiteCards: remainingWhiteCards,
      };
  
      const cleanUpdatedGameState = removeReservedFields(updatedGameState);
  
      const latestGameState = await updateGameState(gameState.gameCode, cleanUpdatedGameState);
      if (latestGameState) {
        setGameState(latestGameState);
        // The useEffect will handle resetting selectedCardIndex
      }
    }
  };

  const isJudge = currentRound?.judgeId === player?.id;
  const currentPlayer = gameState?.players?.find((p) => p.id === player?.id);
  const previousRound = gameState?.rounds?.[gameState.currentRound - 1];

  const timeLeft = useTimer(currentRound, gameState, setGameState);

  return {
    gameState,
    player,
    currentRound,
    isJudge,
    currentPlayer,
    previousRound,
    timeLeft,
    hasPlayerSubmitted,
    selectedCardIndex,
    setSelectedCardIndex,
    handleCardSubmitClick,
    handleWinnerSelect,
    getPlayerNameById: (playerId: string) =>
      getPlayerNameByIdHelper(playerId, gameState?.players ?? []),
  };
};
