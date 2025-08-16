// Card, Build, and GameState type definitions for Convex backend

export interface Card {
  id: string;
  rank: string; // e.g. 'A', '2', ..., 'K'
  suit: string; // e.g. 'hearts', 'diamonds', 'clubs', 'spades'
}

export interface Build {
  id: string;
  cards: Card[];
  value: number;
  owner: number; // playerId
}

export interface Player {
  id: number;
  name: string;
}

// Import correct Convex types
import { MutationCtx, QueryCtx } from './_generated/server';

export interface GameState {
  roomId: string;
  players: Player[];
  phase: string;
  round: number;
  deck: Card[];
  tableCards: Card[];
  builds: Build[];
  player1Hand: Card[];
  player2Hand: Card[];
  player1Captured: Card[];
  player2Captured: Card[];
  player1Score: number;
  player2Score: number;
  currentTurn: number;
  cardSelectionComplete: boolean;
  shuffleComplete: boolean;
  dealingComplete: boolean;
  countdownStartTime: number | null;
  countdownRemaining?: number;
  gameStarted: boolean;
  lastPlay?: any;
  lastAction?: any;
  lastUpdate: string;
  gameCompleted: boolean;
  winner: number | 'tie' | null;
  player1Ready: boolean;
  player2Ready: boolean;
}
