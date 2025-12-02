import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createRoom, joinRoom, joinRandomRoom, getGameState, setPlayerReady } from './api';

// Mock fetch globally
global.fetch = vi.fn();

describe('API Utils - Data Transformation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('transformGameState', () => {
        it('should transform snake_case backend response to camelCase', async () => {
            const mockBackendResponse = {
                room_id: 'ABC123',
                phase: 'waiting',
                round: 1,
                players: [
                    { id: '1', name: 'Player1', ready: false }
                ],
                table_cards: [],
                current_turn: 1,
                deck: [],
                player1_hand: [{ id: 'A_hearts', suit: 'hearts', rank: 'A', value: 14 }],
                player2_hand: [],
                player1_captured: [],
                player2_captured: [],
                player1_score: 0,
                player2_score: 0,
                player1_ready: false,
                player2_ready: false,
                winner: null,
                last_action: null,
                last_update: '2024-01-01T00:00:00Z',
                builds: [],
                shuffle_complete: false,
                card_selection_complete: false,
                game_started: false,
                game_completed: false,
                version: 1,
                checksum: 'abc123'
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackendResponse
            });

            const response = await getGameState('ABC123');
            const gameState = response.game_state;

            // Verify camelCase transformation
            expect(gameState.roomId).toBe('ABC123');
            expect(gameState.tableCards).toEqual([]);
            expect(gameState.player1Hand).toHaveLength(1);
            expect(gameState.player2Hand).toEqual([]);
            expect(gameState.player1Captured).toEqual([]);
            expect(gameState.player2Captured).toEqual([]);
            expect(gameState.player1Score).toBe(0);
            expect(gameState.player2Score).toBe(0);
            expect(gameState.player1Ready).toBe(false);
            expect(gameState.player2Ready).toBe(false);
            expect(gameState.lastAction).toBeNull();
            expect(gameState.lastUpdate).toBe('2024-01-01T00:00:00Z');
            expect(gameState.shuffleComplete).toBe(false);
            expect(gameState.cardSelectionComplete).toBe(false);
        });

        it('should handle null/undefined values gracefully', async () => {
            const mockBackendResponse = {
                room_id: 'ABC123',
                phase: 'waiting',
                round: 0,
                players: [],
                table_cards: null,
                current_turn: 1,
                deck: undefined,
                player1_hand: null,
                player2_hand: undefined,
                player1_captured: null,
                player2_captured: null,
                player1_score: null,
                player2_score: undefined,
                player1_ready: null,
                player2_ready: null,
                winner: null,
                last_action: null,
                last_update: null,
                builds: null,
                shuffle_complete: null,
                card_selection_complete: null
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackendResponse
            });

            const response = await getGameState('ABC123');
            const gameState = response.game_state;

            // Verify defaults for null/undefined
            expect(gameState.tableCards).toEqual([]);
            expect(gameState.deck).toEqual([]);
            expect(gameState.player1Hand).toEqual([]);
            expect(gameState.player2Hand).toEqual([]);
            expect(gameState.player1Captured).toEqual([]);
            expect(gameState.player2Captured).toEqual([]);
            expect(gameState.player1Score).toBe(0);
            expect(gameState.player2Score).toBe(0);
            expect(gameState.player1Ready).toBe(false);
            expect(gameState.player2Ready).toBe(false);
            expect(gameState.builds).toEqual([]);
            expect(gameState.shuffleComplete).toBe(false);
            expect(gameState.cardSelectionComplete).toBe(false);
        });
    });

    describe('createRoom', () => {
        it('should include all required fields in response', async () => {
            const mockBackendResponse = {
                room_id: 'ABC123',
                player_id: 1,
                game_state: {
                    room_id: 'ABC123',
                    phase: 'waiting',
                    round: 0,
                    players: [{ id: '1', name: 'Player1', ready: false }],
                    table_cards: [],
                    current_turn: 1,
                    deck: [],
                    player1_hand: [],
                    player2_hand: [],
                    player1_captured: [],
                    player2_captured: [],
                    player1_score: 0,
                    player2_score: 0,
                    player1_ready: false,
                    player2_ready: false
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackendResponse
            });

            const response = await createRoom('Player1');

            expect(response.room_id).toBe('ABC123');
            expect(response.player_id).toBe(1);
            expect(response.player_name).toBe('Player1');
            expect(response.game_state).toBeDefined();
            expect(response.game_state.roomId).toBe('ABC123');
        });

        it('should send correct request body', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    room_id: 'ABC123',
                    player_id: 1,
                    game_state: {}
                })
            });

            await createRoom('TestPlayer');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/rooms/create'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        player_name: 'TestPlayer',
                        max_players: 2
                    })
                })
            );
        });
    });

    describe('joinRoom', () => {
        it('should include all required fields in response', async () => {
            const mockBackendResponse = {
                player_id: 2,
                game_state: {
                    room_id: 'ABC123',
                    phase: 'waiting',
                    round: 0,
                    players: [
                        { id: '1', name: 'Player1', ready: false },
                        { id: '2', name: 'Player2', ready: false }
                    ],
                    table_cards: [],
                    current_turn: 1,
                    deck: [],
                    player1_hand: [],
                    player2_hand: [],
                    player1_captured: [],
                    player2_captured: [],
                    player1_score: 0,
                    player2_score: 0,
                    player1_ready: false,
                    player2_ready: false
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackendResponse
            });

            const response = await joinRoom('ABC123', 'Player2');

            expect(response.room_id).toBe('ABC123');
            expect(response.player_id).toBe(2);
            expect(response.player_name).toBe('Player2');
            expect(response.game_state).toBeDefined();
            expect(response.game_state.players).toHaveLength(2);
        });

        it('should send correct request body', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    player_id: 2,
                    game_state: {}
                })
            });

            await joinRoom('XYZ789', 'TestPlayer');

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/rooms/join'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        room_id: 'XYZ789',
                        player_name: 'TestPlayer'
                    })
                })
            );
        });
    });

    describe('joinRandomRoom', () => {
        it('should include all required fields in response', async () => {
            const mockBackendResponse = {
                player_id: 1,
                game_state: {
                    room_id: 'RANDOM1',
                    phase: 'waiting',
                    round: 0,
                    players: [{ id: '1', name: 'Player1', ready: false }],
                    table_cards: [],
                    current_turn: 1,
                    deck: [],
                    player1_hand: [],
                    player2_hand: [],
                    player1_captured: [],
                    player2_captured: [],
                    player1_score: 0,
                    player2_score: 0,
                    player1_ready: false,
                    player2_ready: false
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackendResponse
            });

            const response = await joinRandomRoom('Player1');

            expect(response.room_id).toBe('RANDOM1');
            expect(response.player_id).toBe(1);
            expect(response.player_name).toBe('Player1');
            expect(response.game_state).toBeDefined();
        });

        it('should handle missing room_id in game_state', async () => {
            const mockBackendResponse = {
                player_id: 1,
                game_state: {
                    phase: 'waiting',
                    players: []
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackendResponse
            });

            const response = await joinRandomRoom('Player1');

            expect(response.room_id).toBe('');
            expect(response.player_id).toBe(1);
        });
    });

    describe('setPlayerReady', () => {
        it('should transform response correctly', async () => {
            const mockBackendResponse = {
                success: true,
                message: 'Player ready status updated',
                game_state: {
                    room_id: 'ABC123',
                    phase: 'waiting',
                    round: 0,
                    players: [],
                    table_cards: [],
                    current_turn: 1,
                    deck: [],
                    player1_hand: [],
                    player2_hand: [],
                    player1_captured: [],
                    player2_captured: [],
                    player1_score: 0,
                    player2_score: 0,
                    player1_ready: true,
                    player2_ready: false
                }
            };

            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => mockBackendResponse
            });

            const response = await setPlayerReady('ABC123', 'player-1', true);

            expect(response.success).toBe(true);
            expect(response.message).toBe('Player ready status updated');
            expect(response.game_state.player1Ready).toBe(true);
            expect(response.game_state.player2Ready).toBe(false);
        });

        it('should send correct request body with is_ready', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    success: true,
                    message: 'Updated',
                    game_state: {}
                })
            });

            await setPlayerReady('ABC123', 'player-1', true);

            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/rooms/player-ready'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({
                        room_id: 'ABC123',
                        player_id: 'player-1',
                        is_ready: true
                    })
                })
            );
        });
    });

    describe('Error Handling', () => {
        it('should handle API errors correctly', async () => {
            (global.fetch as any).mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ detail: 'Room not found' })
            });

            await expect(getGameState('INVALID')).rejects.toThrow('Room not found');
        });

        it('should handle network errors', async () => {
            (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

            await expect(getGameState('ABC123')).rejects.toThrow('Network error');
        });
    });
});
