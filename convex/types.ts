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

// Convex context type for backend mutations
export type Db = {
  db: {
    query: (table: string) => any;
    patch: (id: string, update: any) => Promise<void>;
  };
};

export interface GameState {
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
  lastPlay?: any;
  lastUpdate?: string;
  winner?: number | 'tie';
}
