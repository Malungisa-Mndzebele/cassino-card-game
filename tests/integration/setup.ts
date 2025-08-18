import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// Mock the Convex client
vi.mock('../../convexClient', () => ({
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
        return {
          roomId: 'new-room',
          playerId: 1,
          gameState: {
            roomId: 'new-room',
            players: [{ id: 1, name: playerName }],
            phase: 'waiting'
          }
        };
      };
    }
    // Mock joinRoom mutation
    if (fn && fn.toString().includes('joinRoom')) {
      return async ({ roomId, playerName }: { roomId: string, playerName: string }) => {
        return {
          playerId: 2,
          gameState: {
            roomId,
            players: [{ id: 1, name: 'Player 1' }, { id: 2, name: playerName }],
            phase: 'dealer'
          }
        };
      };
    }
    return vi.fn();
  },
  useQuery: (fn: any, args?: any) => {
    if (fn && fn.toString().includes('getGameState') && args && args !== 'skip') {
      return {
        gameState: {
          roomId: args.roomId,
          phase: 'waiting',
          players: []
        }
      };
    }
    return null;
  },
  ConvexProvider: ({ children }: { children: React.ReactNode }) => children,
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
