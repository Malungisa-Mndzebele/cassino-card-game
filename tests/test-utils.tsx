import React from 'react';
// No provider needed for API client
import { render } from '@testing-library/react';
import { vi } from 'vitest';

// Helper to wrap components for tests (no provider needed for API client)
export function renderWithProviders(ui: React.ReactElement) {
  return render(ui);
}

// Mock game state creator
export function createMockGameState(overrides: Partial<any> = {}) {
  const defaultGameState = {
    roomId: 'test-room',
    players: [{ id: 1, name: 'Player 1' }],
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
    scores: {
      1: 0,
      2: 0
    },
    winner: null,
    lastPlay: null,
    lastUpdate: new Date().toISOString(),
    gameCompleted: false,
    player1Ready: false,
    player2Ready: false
  };

  return {
    success: true,
    ...defaultGameState,
    ...overrides
  };
}

// Mock fetch response
export function mockFetch(response: any) {
  (global.fetch as any) = vi.fn().mockImplementationOnce(() =>
    Promise.resolve({
      ok: response.success !== false,
      json: () => Promise.resolve({
        success: response.success ?? true,
        error: response.error,
        playerId: response.playerId,
        gameState: response.gameState,
        roomId: response.roomId
      })
    })
  );
}

import type { GamePreferences, GameStatistics } from '../components/GameSettings';

// Mock preferences creator
export function createMockPreferences(): GamePreferences {
  return {
    soundEnabled: true,
    soundVolume: 1,
    hintsEnabled: true,
    statisticsEnabled: true
  };
}

// Mock statistics creator
export function createMockStatistics(): GameStatistics {
  return {
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    totalScore: 0,
    bestScore: 0,
    averageScore: 0,
    longestWinStreak: 0,
    currentWinStreak: 0,
    captureRate: 0,
    buildRate: 0
  };
}
