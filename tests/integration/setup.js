import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
// Mock the Convex client
vi.mock('../../convexClient', () => ({
    convex: {},
    useMutation: () => vi.fn(),
}));
// Mock fetch API
global.fetch = vi.fn();
beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
});
afterEach(() => {
    vi.resetAllMocks();
});
