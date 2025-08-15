import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// Mock the Convex client
vi.mock('../../convexClient', () => ({
  convex: {},
  useMutation: () => vi.fn(),
}));

// Mock fetch API
global.fetch = vi.fn() as unknown as typeof fetch;

beforeEach(() => {
  vi.clearAllMocks();
  (global.fetch as unknown as ReturnType<typeof vi.fn>).mockClear();
});

afterEach(() => {
  vi.resetAllMocks();
});
