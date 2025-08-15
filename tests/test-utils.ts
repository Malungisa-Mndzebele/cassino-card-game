import { vi } from 'vitest';

// Extend the global object with our test utilities
declare global {
  // eslint-disable-next-line no-var
  var testUtils: {
    mockFetch: (response: any) => void;
    mockFetchError: (error: string) => void;
    createMockGameState: (overrides?: any) => any;
    createMockCard: (suit?: string, rank?: string) => any;
    createMockPlayer: (id?: number, name?: string) => any;
    createMockPreferences: (overrides?: any) => any;
    createMockStatistics: (overrides?: any) => any;
  };
}


export const mockFetch = (response: any) => {
  if (!globalThis.fetch || !(globalThis.fetch as any)._isMockFunction) {
    globalThis.fetch = vi.fn();
  }
  (globalThis.fetch as any).mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(response)
    })
  );
};

export const mockFetchError = (error: string) => {
  globalThis.fetch = vi.fn().mockImplementation(() =>
    Promise.reject(new Error(error))
  );
};

export const createMockGameState = (overrides = {}) => ({
  roomId: 'test-room',
  phase: 'waiting',
  players: [],
  deck: [],
  table: [],
  currentPlayer: null,
  ...overrides
});

export const createMockCard = (suit = 'hearts', rank = 'A') => ({
  suit,
  rank,
  id: `${rank}-${suit}`
});

export const createMockPlayer = (id = 1, name = 'Test Player') => ({
  id,
  name,
  hand: [],
  score: 0
});

export const createMockPreferences = (overrides = {}) => ({
  soundEnabled: true,
  soundVolume: 0.5,
  hintsEnabled: true,
  statisticsEnabled: true,
  ...overrides
});

export const createMockStatistics = (overrides = {}) => ({
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  totalScore: 0,
  bestScore: 0,
  averageScore: 0,
  longestWinStreak: 0,
  currentWinStreak: 0,
  captureRate: 0,
  buildRate: 0,
  ...overrides
});

// Attach to globalThis for backwards compatibility
globalThis.testUtils = {
  mockFetch,
  mockFetchError,
  createMockGameState,
  createMockCard,
  createMockPlayer,
  createMockPreferences,
  createMockStatistics
};
