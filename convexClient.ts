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
  },
  setPlayerReady: {
    setPlayerReady: () => {}
  },
  startGame: {
    startGame: () => {}
  },
  dealCards: {
    dealCards: () => {}
  },
  captureCards: {
    captureCards: () => {}
  },
  buildCards: {
    buildCards: () => {}
  },
  endTurn: {
    endTurn: () => {}
  },
  endRound: {
    endRound: () => {}
  },
  endGame: {
    endGame: () => {}
  },
  leaveRoom: {
    leaveRoom: () => {}
  },
  updatePlayerName: {
    updatePlayerName: () => {}
  },
  getGameState: {
    getGameState: () => {}
  },
  getRooms: {
    getRooms: () => {}
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

    // Mock setPlayerReady
    if (mutationFunction === mockApi.setPlayerReady.setPlayerReady) {
      return { success: true };
    }

    // Mock startGame
    if (mutationFunction === mockApi.startGame.startGame) {
      return { success: true };
    }

    // Mock dealCards
    if (mutationFunction === mockApi.dealCards.dealCards) {
      return { success: true };
    }

    // Mock captureCards
    if (mutationFunction === mockApi.captureCards.captureCards) {
      return { success: true };
    }

    // Mock buildCards
    if (mutationFunction === mockApi.buildCards.buildCards) {
      return { success: true };
    }

    // Mock endTurn
    if (mutationFunction === mockApi.endTurn.endTurn) {
      return { success: true };
    }

    // Mock endRound
    if (mutationFunction === mockApi.endRound.endRound) {
      return { success: true };
    }

    // Mock endGame
    if (mutationFunction === mockApi.endGame.endGame) {
      return { success: true };
    }

    // Mock leaveRoom
    if (mutationFunction === mockApi.leaveRoom.leaveRoom) {
      return { success: true };
    }

    // Mock updatePlayerName
    if (mutationFunction === mockApi.updatePlayerName.updatePlayerName) {
      return { success: true };
    }

    // Default mock response
    return { success: true };
  };
}

export function useQuery(queryFunction: any, args?: any) {
  // Mock query responses
  if (queryFunction === mockApi.getGameState.getGameState) {
    return createMockGameState({
      roomId: args?.roomId || 'DEMO123',
      players: [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ],
      phase: 'waiting'
    });
  }

  if (queryFunction === mockApi.getRooms.getRooms) {
    return [
      {
        roomId: 'DEMO123',
        players: [
          { id: 1, name: 'Player 1' },
          { id: 2, name: 'Player 2' }
        ],
        phase: 'waiting'
      }
    ];
  }

  // Default return null for other queries
  return null;
}
