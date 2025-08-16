import React from 'react';

// Mock Convex client for static deployment
// This allows the game to run without a backend

// Game state interface for mock data
interface GameState {
  roomId: string;
  players: Array<{ id: number; name: string }>;
  phase: string;
  currentTurn: number;
  [key: string]: any;
}

// Generate a simple room ID
function generateRoomId(): string {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Mock game state generator
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    roomId: generateRoomId(),
    players: [],
    phase: 'waiting',
    currentTurn: 1,
    deck: [],
    player1Hand: [],
    player2Hand: [],
    tableCards: [],
    builds: [],
    player1Captured: [],
    player2Captured: [],
    shuffleComplete: false,
    cardSelectionComplete: false,
    dealingComplete: false,
    gameStarted: false,
    player1Score: 0,
    player2Score: 0,
    winner: null,
    lastPlay: null,
    countdownStartTime: null,
    lastUpdate: new Date().toISOString(),
    round: 0,
    gameCompleted: false,
    player1Ready: false,
    player2Ready: false,
    countdownRemaining: undefined,
    ...overrides
  };
}

// Create mock API object that matches the Convex API structure
const mockApi = {
  createRoom: {
    createRoom: () => {}
  },
  joinRoom: {
    joinRoom: () => {}
  },
  playCard: {
    playCard: () => {}
  },
  startShuffle: {
    startShuffle: () => {}
  },
  selectFaceUpCards: {
    selectFaceUpCards: () => {}
  },
  resetGame: {
    resetGame: () => {}
  }
};

// Mock convex client
const mockConvex = {
  mutation: () => () => Promise.resolve({}),
  query: () => () => null,
};

export const convex = mockConvex;

// Export the mock API for imports
export const api = mockApi;

// Mock implementations for React hooks
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return React.createElement(React.Fragment, null, children);
}

export function useMutation(mutationFunction: any) {
  return async (args: any) => {
    // Mock createRoom
    if (mutationFunction === mockApi.createRoom.createRoom) {
      const gameState = createMockGameState({
        players: [{ id: 1, name: args.playerName }],
        phase: 'waiting'
      });
      return {
        roomId: gameState.roomId,
        playerId: 1,
        gameState
      };
    }

    // Mock joinRoom  
    if (mutationFunction === mockApi.joinRoom.joinRoom) {
      const gameState = createMockGameState({
        roomId: args.roomId,
        players: [
          { id: 1, name: 'Player 1' },
          { id: 2, name: args.playerName }
        ],
        phase: 'shuffle'
      });
      return {
        playerId: 2,
        gameState
      };
    }

    // Default mock response
    return { success: true };
  };
}

export function useQuery() {
  return null;
}
