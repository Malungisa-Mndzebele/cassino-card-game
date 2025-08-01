import '@testing-library/jest-dom'

// Mock fetch globally
global.fetch = jest.fn()

// Mock Supabase info
jest.mock('../utils/supabase/info', () => ({
  projectId: 'test-project-id',
  publicAnonKey: 'test-anon-key'
}))

// Mock sound system
Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    createGain: jest.fn(() => ({
      connect: jest.fn(),
      gain: { value: 1 }
    })),
    createOscillator: jest.fn(() => ({
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      frequency: { value: 440 }
    })),
    destination: {},
    currentTime: 0
  }))
})

Object.defineProperty(window, 'Audio', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    volume: 1
  }))
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
})

// Global test utilities
global.testUtils = {
  createMockGameState: (overrides = {}) => ({
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
    ...overrides
  }),

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
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok,
      json: jest.fn().mockResolvedValue(response),
      text: jest.fn().mockResolvedValue(JSON.stringify(response))
    })
  },

  mockFetchError: (error: string) => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error(error))
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