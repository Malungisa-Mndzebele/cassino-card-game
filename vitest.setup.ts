import { expect, beforeEach, afterEach, vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers)

// Mock SvelteKit modules
vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  building: false,
  version: 'test'
}))

vi.mock('$app/navigation', () => ({
  goto: vi.fn(),
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  preloadData: vi.fn(),
  preloadCode: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn()
}))

vi.mock('$app/stores', () => ({
  page: {
    subscribe: vi.fn()
  },
  navigating: {
    subscribe: vi.fn()
  },
  updated: {
    subscribe: vi.fn()
  }
}))

// Clear localStorage and sessionStorage before each test
beforeEach(() => {
  if (typeof localStorage !== 'undefined') {
    localStorage.clear()
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.clear()
  }
})

// Cleanup after each test (for Svelte Testing Library)
afterEach(() => {
  // Svelte Testing Library cleanup happens automatically
  // but we can add custom cleanup here if needed
})


