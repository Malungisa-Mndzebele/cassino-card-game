import { expect, beforeEach, afterEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest expect with jest-dom matchers
expect.extend(matchers)

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


