// API Client for FastAPI backend
// This replaces the Convex client with HTTP calls to our Python backend

import React from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://khasinogaming.com/api';

// Check if we're in a live environment without backend
const isLiveEnvironment = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
const shouldUseMock = isLiveEnvironment && !import.meta.env.VITE_API_URL;

// Convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  const camelCaseObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelCaseObj[camelKey] = toCamelCase(value);
  }
  return camelCaseObj;
}

// Generic API call function
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return toCamelCase(data);
}

// Game state interface
export interface GameState {
  roomId: string;
  players: Array<{ id: number; name: string; ready: boolean; joined_at: string }>;
  phase: string;
  round: number;
  deck: any[];
  player1Hand: any[];
  player2Hand: any[];
  tableCards: any[];
  builds: any[];
  player1Captured: any[];
  player2Captured: any[];
  player1Score: number;
  player2Score: number;
  currentTurn: number;
  cardSelectionComplete: boolean;
  shuffleComplete: boolean;
  countdownStartTime: string | null;
  gameStarted: boolean;
  lastPlay: any | null;
  lastAction: string | null;
  lastUpdate: string;
  gameCompleted: boolean;
  winner: number | null;
  dealingComplete: boolean;
  player1Ready: boolean;
  player2Ready: boolean;
  countdownRemaining: number | null;
}

// API functions that match the expected interface
export const api = {
  createRoom: {
    createRoom: async (data: { player_name: string }) => {
      return apiCall<{ room_id: string; player_id: number; game_state: GameState }>('/rooms/create', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },
  joinRoom: {
    joinRoom: async (data: { room_id: string; player_name: string }) => {
      return apiCall<{ player_id: number; game_state: GameState }>('/rooms/join', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },
  setPlayerReady: {
    setPlayerReady: async (data: { room_id: string; player_id: number; is_ready: boolean }) => {
      return apiCall<{ success: boolean; message: string; game_state: GameState }>('/rooms/player-ready', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },
  getGameState: {
    getGameState: async (data: { room_id: string }) => {
      return apiCall<{ game_state: GameState }>(`/rooms/${data.room_id}/state`);
    }
  },
  playCard: {
    playCard: async (data: { room_id: string; player_id: number; card_id: string; action: string; target_cards?: string[]; build_value?: number }) => {
      return apiCall<{ success: boolean; message: string; game_state: GameState }>('/game/play-card', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },
  startShuffle: {
    startShuffle: async (data: { room_id: string; player_id: number }) => {
      return apiCall<{ success: boolean; message: string; game_state: GameState }>('/game/start-shuffle', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },
  selectFaceUpCards: {
    selectFaceUpCards: async (data: { room_id: string; player_id: number; card_ids: string[] }) => {
      return apiCall<{ success: boolean; message: string; game_state: GameState }>('/game/select-face-up-cards', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  },
  resetGame: {
    resetGame: async (data: { room_id: string }) => {
      return apiCall<{ success: boolean; message: string }>('/game/reset', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  }
};

// Mock hooks for compatibility with existing code
export function useMutation(mutationFn: any) {
  return mutationFn;
}

export function useQuery(queryFn: any, params: any) {
  // Simple polling implementation for real-time updates
  const [data, setData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!params || params === 'skip') {
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await queryFn(params);
        if (isMounted) {
          setData(result);
        }
      } catch (err) {
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initial fetch
    fetchData();

    // Set up polling every 2 seconds
    const interval = setInterval(fetchData, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [queryFn, JSON.stringify(params)]);

  return { data, isLoading, error };
}


