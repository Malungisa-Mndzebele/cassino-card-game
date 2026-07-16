import { describe, it, expect } from 'vitest';
import { transformGameState } from './api';

describe('API Utils - Data Transformation', () => {
    describe('transformGameState', () => {
        it('should transform snake_case engine state to camelCase', () => {
            const backend = {
                room_id: 'ABC123',
                phase: 'waiting',
                round: 1,
                players: [{ id: '1', name: 'Player1', ready: false }],
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

            const gameState = transformGameState(backend);
            expect(gameState).not.toBeNull();
            if (!gameState) return;

            expect(gameState.roomId).toBe('ABC123');
            expect(gameState.tableCards).toEqual([]);
            expect(gameState.player1Hand).toHaveLength(1);
            expect(gameState.player2Hand).toEqual([]);
            expect(gameState.player1Score).toBe(0);
            expect(gameState.player1Ready).toBe(false);
            expect(gameState.lastAction).toBeNull();
            expect(gameState.lastUpdate).toBe('2024-01-01T00:00:00Z');
            expect(gameState.shuffleComplete).toBe(false);
            expect(gameState.cardSelectionComplete).toBe(false);
            expect(gameState.currentTurn).toBe(1);
            expect(gameState.version).toBe(1);
        });

        it('should compute currentPlayer from current_turn', () => {
            const base = {
                room_id: 'R',
                phase: 'round1',
                players: [
                    { id: '1', name: 'A', ready: true },
                    { id: '2', name: 'B', ready: true }
                ]
            };
            expect(transformGameState({ ...base, current_turn: 1 })?.currentPlayer).toBe('1');
            expect(transformGameState({ ...base, current_turn: 2 })?.currentPlayer).toBe('2');
        });

        it('should handle null/undefined values gracefully', () => {
            const backend = {
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
            } as never;

            const gameState = transformGameState(backend);
            expect(gameState).not.toBeNull();
            if (!gameState) return;

            expect(gameState.tableCards).toEqual([]);
            expect(gameState.deck).toEqual([]);
            expect(gameState.player1Hand).toEqual([]);
            expect(gameState.player2Hand).toEqual([]);
            expect(gameState.player1Score).toBe(0);
            expect(gameState.player1Ready).toBe(false);
            expect(gameState.builds).toEqual([]);
            expect(gameState.shuffleComplete).toBe(false);
        });

        it('should return null for null/undefined input', () => {
            expect(transformGameState(null)).toBeNull();
            expect(transformGameState(undefined)).toBeNull();
        });
    });
});
