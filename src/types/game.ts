// src/types/game.ts

export interface Player {
  id: string;
  name: string;
  isHost: boolean;
  score: number;
  hand: string[];
  isBot?: boolean;
}

export interface Submission {
  playerId: string;
  card: string;
}

export interface Round {
  roundNumber: number;
  startTime: string;
  submissionDeadline: string;
  isBlackCardRound: boolean;
  blackCard: string;
  submissions: Submission[];
  judgeId: string;
  phase: 'submission' | 'judging' | 'complete';
  winnerId?: string;
  winningCard?: string;
  botsSubmitted?: boolean;
  judgingPhaseStarted?: boolean;
}


export interface GameState {
  gameCode: string;
  players: Player[];
  currentRound: number;
  rounds: Round[];
  blackCards: string[];
  whiteCards: string[];
  gameStatus: 'lobby' | 'in_progress' | 'completed';
  maxRounds: number;
  winnerCount: number;
  theme: string;
  whiteCardTimeLimit: number;
  blackCardTimeLimit: number;
  provider: string;
  model: string;
}

export interface BotPickCardRequest {
  botName: string;
  blackCardText: string;
  options: string[];
  context: 'submission' | 'judging';
  provider: string ;
  model: string;
  apiKey: string;
}