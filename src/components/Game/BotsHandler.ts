// src/components/Game/BotsHandler.ts

import { GameState, Round } from '../../types/game';
import { removeReservedFields } from '../../utils/removeReservedFields';
import { updateGameState, botPickCard } from '../../utils/api';

const MAX_RETRIES = 3;

export const handleBotsSubmission = async (
  gameState: GameState,
  setGameState: (gameState: GameState) => void
) => {
  const currentRound = gameState.rounds[gameState.currentRound];

  // Ensure that bots do not submit cards if they are the judge
  const bots = gameState.players.filter(
    (player) => player.isBot && player.id !== currentRound.judgeId
  );
  const whiteCardsCopy = [...gameState.whiteCards];
  const updatedSubmissions = [...currentRound.submissions];
  const updatedPlayers = [...gameState.players];
  let updated = false;

  for (const bot of bots) {
    const alreadySubmitted = currentRound.submissions.some(
      (submission) => submission.playerId === bot.id
    );

    if (!alreadySubmitted) {
      let botCardText: string | null = null;
      let retries = 0;
      let botCardIndex = -1;

      // Retry logic
      while (retries < MAX_RETRIES) {
        // Bot picks a card based on their name using the LLM
        botCardText = await botPickCard({
          botName: bot.name,
          blackCardText: currentRound.blackCard,
          options: bot.hand,
          context: 'submission',
          provider: gameState.provider,
          model: gameState.model,
          apiKey: '' // Assigned in function.
        });

        if (!botCardText) {
          console.error(`Bot ${bot.name} failed to pick a card.`);
          retries++;
          continue;
        }

        // Find the card index in the bot's hand
        botCardIndex = bot.hand.findIndex((card) => card === botCardText);
        if (botCardIndex === -1) {
          console.error(`Bot ${bot.name} selected an invalid card.`);
          retries++;
          continue;
        }

        // Valid card selected
        break;
      }

      if (botCardIndex === -1) {
        console.error(`Bot ${bot.name} failed to select a valid card after ${MAX_RETRIES} attempts.`);
        continue;
      }

      const botCard = bot.hand.splice(botCardIndex, 1)[0];

      if (botCard) {
        updatedSubmissions.push({ playerId: bot.id, card: botCard });
        updated = true;

        // Draw a new card for the bot
        const newCard = whiteCardsCopy.shift();
        if (newCard) {
          bot.hand.push(newCard);
        }

        console.log(`Bot ${bot.name} submitted card: "${botCard}"`);
      }
    }
  }

  if (updated) {
    const updatedRound: Round = {
      ...currentRound,
      submissions: updatedSubmissions,
      botsSubmitted: true,
    };

    // Check if all submissions are in
    const requiredSubmissions =
      gameState.players.filter((p) => p.id !== currentRound.judgeId).length;
    const hasAllSubmissions = updatedSubmissions.length >= requiredSubmissions;

    if (hasAllSubmissions) {
      updatedRound.phase = 'judging';
      updatedRound.judgingPhaseStarted = true;
    }

    const updatedGameState: GameState = {
      ...gameState,
      rounds: gameState.rounds.map((r, idx) =>
        idx === gameState.currentRound ? updatedRound : r
      ),
      players: updatedPlayers,
      whiteCards: whiteCardsCopy,
    };

    const cleanUpdatedGameState = removeReservedFields(updatedGameState);

    const latestGameState = await updateGameState(gameState.gameCode, cleanUpdatedGameState);
    if (latestGameState) {
      setGameState(latestGameState);
      console.log('Bots have submitted their cards.');
    }
  }
};

export const handleBotJudging = async (
  gameState: GameState,
  setGameState: (gameState: GameState) => void,
  handleWinnerSelect: (winnerPlayerId: string) => void
) => {
  const currentRound = gameState.rounds[gameState.currentRound];
  const judge = gameState.players.find((p) => p.id === currentRound.judgeId);

  if (judge?.isBot && currentRound.phase === 'judging') {
    console.log(`Bot judge ${judge.name} is selecting a winner...`);
    // Bot selects a winner based on their name using the LLM
    const submissions = currentRound.submissions.filter(
      (s) => s.playerId !== judge.id
    );

    if (submissions.length === 0) {
      console.error('No valid submissions available for bot judge to select.');
      return;
    }

    const submissionOptions = submissions.map((submission) => ({
      playerId: submission.playerId,
      card: submission.card,
    }));

    let winningCardText: string | null = null;
    let retries = 0;
    let winnerSubmission = null;

    // Retry logic
    while (retries < MAX_RETRIES) {
      winningCardText = await botPickCard({
        botName: judge.name,
        blackCardText: currentRound.blackCard,
        options: submissionOptions.map((s) => s.card),
        context: 'judging',
        provider: gameState.provider,
        model: gameState.model,
        apiKey: '' // Assigned in function.
      });

      if (!winningCardText) {
        console.error(`Bot judge ${judge.name} failed to select a winner.`);
        retries++;
        continue;
      }

      winnerSubmission = submissionOptions.find(
        (s) => s.card === winningCardText
      );

      if (!winnerSubmission) {
        console.error('Bot judge could not match the selected card to a player.');
        retries++;
        continue;
      }

      // Valid winner selected
      break;
    }

    if (!winnerSubmission) {
      console.error(`Bot judge ${judge.name} failed to select a valid winner after ${MAX_RETRIES} attempts.`);
      return;
    }

    console.log(`Bot judge selected winner: ${winnerSubmission.playerId}`);
    await handleWinnerSelect(winnerSubmission.playerId);
  }
};
