import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { api, useMutation, useQuery } from './apiClient';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('API Functions', () => {
    it('should create a room successfully', async () => {
      const mockResponse = {
        room_id: 'ABC123',
        player_id: 1,
        game_state: {
          roomId: 'ABC123',
          players: [{ id: 1, name: 'Test Player' }],
          phase: 'waiting'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.createRoom.createRoom({ player_name: 'Test Player' });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/rooms/create', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({ player_name: 'Test Player' })
      });

      expect(result).toEqual({
        roomId: 'ABC123',
        playerId: 1,
        gameState: {
          roomId: 'ABC123',
          players: [{ id: 1, name: 'Test Player' }],
          phase: 'waiting'
        }
      });
    });

    it('should join a room successfully', async () => {
      const mockResponse = {
        player_id: 2,
        game_state: {
          roomId: 'ABC123',
          players: [
            { id: 1, name: 'Host' },
            { id: 2, name: 'Joiner' }
          ],
          phase: 'waiting'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.joinRoom.joinRoom({
        room_id: 'ABC123',
        player_name: 'Joiner'
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/rooms/join', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          room_id: 'ABC123',
          player_name: 'Joiner'
        })
      });

      expect(result).toEqual({
        playerId: 2,
        gameState: {
          roomId: 'ABC123',
          players: [
            { id: 1, name: 'Host' },
            { id: 2, name: 'Joiner' }
          ],
          phase: 'waiting'
        }
      });
    });

    it('should set player ready status', async () => {
      const mockResponse = {
        success: true,
        message: 'Player ready status updated',
        game_state: {
          roomId: 'ABC123',
          player1_ready: true,
          player2_ready: false
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.setPlayerReady.setPlayerReady({
        room_id: 'ABC123',
        player_id: 1,
        is_ready: true
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/rooms/player-ready', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          room_id: 'ABC123',
          player_id: 1,
          is_ready: true
        })
      });

      expect(result).toEqual({
        success: true,
        message: 'Player ready status updated',
        gameState: {
          roomId: 'ABC123',
          player1Ready: true,
          player2Ready: false
        }
      });
    });

    it('should get game state', async () => {
      const mockResponse = {
        game_state: {
          roomId: 'ABC123',
          phase: 'waiting',
          players: [{ id: 1, name: 'Player 1' }]
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.getGameState.getGameState({ room_id: 'ABC123' });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/rooms/ABC123/state', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      expect(result).toEqual({
        gameState: {
          roomId: 'ABC123',
          phase: 'waiting',
          players: [{ id: 1, name: 'Player 1' }]
        }
      });
    });

    it('should play a card', async () => {
      const mockResponse = {
        success: true,
        message: 'Card played successfully',
        game_state: {
          roomId: 'ABC123',
          last_action: 'capture'
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.playCard.playCard({
        room_id: 'ABC123',
        player_id: 1,
        card_id: 'A_hearts',
        action: 'capture',
        target_cards: ['K_spades']
      });

      expect(fetch).toHaveBeenCalledWith('http://localhost:8000/game/play-card', {
        headers: {
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          room_id: 'ABC123',
          player_id: 1,
          card_id: 'A_hearts',
          action: 'capture',
          target_cards: ['K_spades']
        })
      });

      expect(result).toEqual({
        success: true,
        message: 'Card played successfully',
        gameState: {
          roomId: 'ABC123',
          lastAction: 'capture'
        }
      });
    });

    it('should handle API errors', async () => {
      // Mock the environment to avoid the "Cannot connect to backend" message
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { hostname: 'example.com' };

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ detail: 'Room not found' })
      });

      try {
        await expect(
          api.getGameState.getGameState({ room_id: 'INVALID' })
        ).rejects.toThrow('Room not found');
      } finally {
        // Restore original location
        (window as any).location = originalLocation;
      }
    });

    it('should handle network errors', async () => {
      // Mock the environment to avoid the "Cannot connect to backend" message
      const originalLocation = window.location;
      delete (window as any).location;
      (window as any).location = { hostname: 'example.com' };

      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      try {
        await expect(
          api.createRoom.createRoom({ player_name: 'Test' })
        ).rejects.toThrow('Network error');
      } finally {
        // Restore original location
        (window as any).location = originalLocation;
      }
    });
  });

  describe('Data Transformation', () => {
    it('should convert snake_case to camelCase', async () => {
      const mockResponse = {
        room_id: 'ABC123',
        player_id: 1,
        game_state: {
          room_id: 'ABC123',
          player1_ready: true,
          player2_ready: false,
          table_cards: [],
          player1_hand: [],
          player2_hand: []
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await api.createRoom.createRoom({ player_name: 'Test' });

      expect(result).toEqual({
        roomId: 'ABC123',
        playerId: 1,
        gameState: {
          roomId: 'ABC123',
          player1Ready: true,
          player2Ready: false,
          tableCards: [],
          player1Hand: [],
          player2Hand: []
        }
      });
    });
  });

  describe('Hooks', () => {
    it('should provide useMutation hook', () => {
      const mutation = useMutation(api.createRoom.createRoom);
      expect(typeof mutation).toBe('function');
    });

    it('should provide useQuery hook structure', () => {
      // Test the hook structure without calling it directly
      expect(typeof useQuery).toBe('function');
      expect(useQuery.length).toBe(2); // Should accept 2 parameters
    });
  });
});
