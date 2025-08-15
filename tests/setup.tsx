import React from 'react';
import * as testUtils from './test-utils';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock fetch globally
if (!globalThis.fetch) {
  globalThis.fetch = vi.fn();
}

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

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
});

Object.defineProperty(window, 'Audio', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    volume: 1
  }))
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
if (!globalThis.localStorage) {
  globalThis.localStorage = localStorageMock as any;
}
