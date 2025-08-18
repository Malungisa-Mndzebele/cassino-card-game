import React from 'react';
import * as testUtils from './test-utils';
import { afterEach, vi } from 'vitest';

// Mock convexClient module
vi.mock('../convexClient', () => ({
  convex: {
    mutation: () => () => Promise.resolve({}),
    query: () => () => null,
  },
  api: {
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
    getGameState: {
      getGameState: () => {}
    },
    getRooms: {
      getRooms: () => {}
    }
  },
  useMutation: (fn: any) => {
    // Mock createRoom mutation
    if (fn && fn.toString().includes('createRoom')) {
      return async ({ playerName }: { playerName: string }) => {
        const gameState = testUtils.createMockGameState({ roomId: 'new-room', players: [{ id: 1, name: playerName }] });
        return {
          roomId: 'new-room',
          playerId: 1,
          gameState: gameState && gameState.roomId ? gameState : { roomId: 'new-room', players: [{ id: 1, name: playerName }] }
        };
      };
    }
    // Mock joinRoom mutation
    if (fn && fn.toString().includes('joinRoom')) {
      return async ({ roomId, playerName }: { roomId: string, playerName: string }) => {
        const gameState = testUtils.createMockGameState({ roomId, players: [{ id: 1, name: playerName }] });
        return {
          playerId: 1,
          gameState: gameState && gameState.roomId ? gameState : { roomId, players: [{ id: 1, name: playerName }] }
        };
      };
    }
    return vi.fn();
  },
  useQuery: (fn: any, args?: any) => {
    if (fn && fn.toString().includes('getGameState') && args && args !== 'skip') {
      return {
        gameState: testUtils.createMockGameState({ 
          roomId: args.roomId,
          phase: 'waiting',
          players: []
        })
      };
    }
    return null;
  },
  ConvexProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

// Mock convex/react globally for all tests
vi.mock('convex/react', async () => {
  const actual = await vi.importActual<any>('convex/react');
  return {
    ...actual,
    ConvexProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
    useMutation: (fn: any) => {
      // Mock createRoom mutation
      if (fn && fn.toString().includes('createRoom')) {
        return async ({ playerName }: { playerName: string }) => {
          const gameState = testUtils.createMockGameState({ roomId: 'new-room', players: [{ id: 1, name: playerName }] });
          return {
            roomId: 'new-room',
            playerId: 1,
            gameState: gameState && gameState.roomId ? gameState : { roomId: 'new-room', players: [{ id: 1, name: playerName }] }
          };
        };
      }
      // Mock joinRoom mutation
      if (fn && fn.toString().includes('joinRoom')) {
        return async ({ roomId, playerName }: { roomId: string, playerName: string }) => {
          const gameState = testUtils.createMockGameState({ roomId, players: [{ id: 1, name: playerName }] });
          return {
            playerId: 1,
            gameState: gameState && gameState.roomId ? gameState : { roomId, players: [{ id: 1, name: playerName }] }
          };
        };
      }
      return vi.fn();
    },
  };
});

import '@testing-library/jest-dom'
import { expect } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { cleanup } from '@testing-library/react'

expect.extend(matchers)

// Mock fetch globally
globalThis.fetch = vi.fn()

// Clean up after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})


// Mock sound system
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    createGain: vi.fn(() => ({
      connect: vi.fn(),
      gain: { value: 1 }
    })),
    createOscillator: vi.fn(() => ({
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      frequency: { value: 440 }
    })),
    destination: {},
    currentTime: 0
  }))
})

Object.defineProperty(window, 'Audio', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    volume: 1
  }))
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock IntersectionObserver
globalThis.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
globalThis.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})

// Global test utilities
globalThis.testUtils = {
  createMockGameState: (overrides = {}) => {
    const base = {
      roomId: 'test-room',
      players: [
        { id: 1, name: 'Player 1' },
        { id: 2, name: 'Player 2' }
      ],
      deck: [],
      player1Hand: [],
      player2Hand: [],
      tableCards: [],
      builds: [],
      player1Captured: [],
      player2Captured: [],
      currentTurn: 1,
      phase: 'waiting',
      round: 0,
      countdownStartTime: null,
      gameStarted: false,
      shuffleComplete: false,
      cardSelectionComplete: false,
      dealingComplete: false,
      player1Score: 0,
      player2Score: 0,
      winner: null,
      lastPlay: null,
      lastUpdate: new Date().toISOString(),
    };
    const merged = { ...base, ...overrides };
    if (!merged.roomId) merged.roomId = 'test-room';
    if (!Array.isArray(merged.players) || merged.players.length === 0) {
      merged.players = [ { id: 1, name: 'Player 1' } ];
    }
    return merged;
  },

  createMockCard: (suit = 'hearts', rank = 'A') => ({
    id: `${suit}-${rank}`,
    suit,
    rank
  }),

  createMockPlayer: (id = 1, name = 'Test Player') => ({
    id,
    name
  }),

  createMockPreferences: (overrides = {}) => ({
    soundEnabled: true,
    soundVolume: 0.5,
    hintsEnabled: true,
    statisticsEnabled: true,
    ...overrides
  }),

  createMockStatistics: (overrides = {}) => ({
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    totalScore: 0,
    bestScore: 0,
    currentWinStreak: 0,
    longestWinStreak: 0,
    ...overrides
  }),

  mockFetch: (response: any, ok = true) => {
    // Always return an object with expected shape for error cases
    const safeResponse = {
      success: response && typeof response.success === 'boolean' ? response.success : true,
      roomId: response && response.roomId !== undefined ? response.roomId : '',
      playerId: response && response.playerId !== undefined ? response.playerId : 1,
      gameState: response && response.gameState !== undefined ? response.gameState : testUtils.createMockGameState(),
      error: response && response.error ? response.error : undefined,
      ...response
    };
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok,
      json: () => Promise.resolve(safeResponse),
      text: () => Promise.resolve(JSON.stringify(safeResponse))
    });
  },

  mockFetchError: (error: string) => {
    (globalThis.fetch as any).mockRejectedValueOnce(new Error(error));
  }
}

// Type definitions for global utilities
declare global {
  var testUtils: {
    createMockGameState: (overrides?: any) => any
    createMockCard: (suit?: string, rank?: string) => any
    createMockPlayer: (id?: number, name?: string) => any
    createMockPreferences: (overrides?: any) => any
    createMockStatistics: (overrides?: any) => any
    mockFetch: (response: any, ok?: boolean) => void
    mockFetchError: (error: string) => void
  }
}