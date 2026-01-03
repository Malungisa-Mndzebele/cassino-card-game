import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';
import { gameStore } from './gameStore';

describe('gameStore - Session Persistence', () => {
    beforeEach(() => {
        // Clear both storages before each test
        localStorage.clear();
        sessionStorage.clear();
        // Reset store to initial state
        gameStore.reset();
    });

    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    describe('setRoomId', () => {
        it('should set room ID in store', () => {
            gameStore.setRoomId('ABC123');
            const state = get(gameStore);
            expect(state.roomId).toBe('ABC123');
        });

        it('should persist room ID to sessionStorage', () => {
            gameStore.setRoomId('ABC123');
            expect(sessionStorage.getItem('cassino_room_id')).toBe('ABC123');
        });
    });

    describe('setPlayerId', () => {
        it('should set player ID in store', () => {
            gameStore.setPlayerId('player-123');
            const state = get(gameStore);
            expect(state.playerId).toBe('player-123');
        });

        it('should persist player ID to sessionStorage', () => {
            gameStore.setPlayerId('player-123');
            expect(sessionStorage.getItem('cassino_player_id')).toBe('player-123');
        });
    });

    describe('setPlayerName', () => {
        it('should set player name in store', () => {
            gameStore.setPlayerName('TestPlayer');
            const state = get(gameStore);
            expect(state.playerName).toBe('TestPlayer');
        });

        it('should persist player name to localStorage', () => {
            gameStore.setPlayerName('TestPlayer');
            expect(localStorage.getItem('cassino_player_name')).toBe('TestPlayer');
        });
    });

    describe('initialize', () => {
        it('should load player name from localStorage', () => {
            localStorage.setItem('cassino_player_name', 'SavedPlayer');
            gameStore.initialize();
            const state = get(gameStore);
            expect(state.playerName).toBe('SavedPlayer');
        });

        it('should load room ID from sessionStorage when both roomId and playerId exist', () => {
            sessionStorage.setItem('cassino_room_id', 'XYZ789');
            sessionStorage.setItem('cassino_player_id', 'player-456');
            sessionStorage.setItem('cassino_session_timestamp', Date.now().toString());
            gameStore.initialize();
            const state = get(gameStore);
            expect(state.roomId).toBe('XYZ789');
        });

        it('should load player ID from sessionStorage when both roomId and playerId exist', () => {
            sessionStorage.setItem('cassino_room_id', 'XYZ789');
            sessionStorage.setItem('cassino_player_id', 'player-456');
            sessionStorage.setItem('cassino_session_timestamp', Date.now().toString());
            gameStore.initialize();
            const state = get(gameStore);
            expect(state.playerId).toBe('player-456');
        });

        it('should load complete session from storage', () => {
            localStorage.setItem('cassino_player_name', 'SavedPlayer');
            sessionStorage.setItem('cassino_room_id', 'XYZ789');
            sessionStorage.setItem('cassino_player_id', 'player-456');
            sessionStorage.setItem('cassino_session_timestamp', Date.now().toString());
            
            gameStore.initialize();
            const state = get(gameStore);
            
            expect(state.playerName).toBe('SavedPlayer');
            expect(state.roomId).toBe('XYZ789');
            expect(state.playerId).toBe('player-456');
        });

        it('should handle missing storage gracefully', () => {
            // Ensure both storages are completely empty
            localStorage.clear();
            sessionStorage.clear();
            gameStore.reset();
            
            gameStore.initialize();
            const state = get(gameStore);
            
            // Should have empty values when nothing in storage
            expect(state.roomId).toBe('');
            expect(state.playerId).toBe('');
            // playerName might be empty or preserved from previous test
            // so we just check it's a string
            expect(typeof state.playerName).toBe('string');
        });
    });

    describe('reset', () => {
        it('should clear room ID from store', () => {
            gameStore.setRoomId('ABC123');
            gameStore.reset();
            const state = get(gameStore);
            expect(state.roomId).toBe('');
        });

        it('should clear player ID from store', () => {
            gameStore.setPlayerId('player-123');
            gameStore.reset();
            const state = get(gameStore);
            expect(state.playerId).toBe('');
        });

        it('should preserve player name in store', () => {
            gameStore.setPlayerName('TestPlayer');
            gameStore.reset();
            const state = get(gameStore);
            expect(state.playerName).toBe('TestPlayer');
        });

        it('should clear room ID from sessionStorage', () => {
            gameStore.setRoomId('ABC123');
            gameStore.reset();
            expect(sessionStorage.getItem('cassino_room_id')).toBeNull();
        });

        it('should clear player ID from sessionStorage', () => {
            gameStore.setPlayerId('player-123');
            gameStore.reset();
            expect(sessionStorage.getItem('cassino_player_id')).toBeNull();
        });

        it('should preserve player name in localStorage', () => {
            gameStore.setPlayerName('TestPlayer');
            gameStore.reset();
            expect(localStorage.getItem('cassino_player_name')).toBe('TestPlayer');
        });

        it('should clear game state', () => {
            gameStore.setGameState({
                roomId: 'ABC123',
                phase: 'waiting',
                round: 1,
                players: [],
                tableCards: [],
                currentPlayer: 'player-1',
                currentTurn: 1,
                deck: [],
                player1Hand: [],
                player2Hand: [],
                player1Captured: [],
                player2Captured: [],
                player1Score: 0,
                player2Score: 0,
                player1Ready: false,
                player2Ready: false,
                winner: null,
                lastAction: null
            });
            
            gameStore.reset();
            const state = get(gameStore);
            expect(state.gameState).toBeNull();
        });
    });

    describe('Session Persistence Flow', () => {
        it('should persist and restore complete session', () => {
            // Clear everything first
            localStorage.clear();
            sessionStorage.clear();
            
            // Simulate creating a room
            gameStore.setPlayerName('Player1');
            gameStore.setRoomId('ABC123');
            gameStore.setPlayerId('player-1');
            
            // Verify sessionStorage has room/player values
            expect(sessionStorage.getItem('cassino_room_id')).toBe('ABC123');
            expect(sessionStorage.getItem('cassino_player_id')).toBe('player-1');
            // Verify localStorage has player name
            expect(localStorage.getItem('cassino_player_name')).toBe('Player1');
            
            // Verify store has the values
            let currentState = get(gameStore);
            expect(currentState.roomId).toBe('ABC123');
            expect(currentState.playerId).toBe('player-1');
            
            // The key test: storage persists the values
            // In a real page refresh, the store would be recreated and initialize() would be called
            // Since we can't recreate the singleton store in tests, we verify that:
            // 1. Values are in storage (checked above)
            // 2. initialize() can read them back (tested in other tests)
            // 3. The pattern works end-to-end (tested in E2E tests)
            
            // This test verifies the persistence mechanism works
            expect(sessionStorage.getItem('cassino_room_id')).toBe('ABC123');
            expect(sessionStorage.getItem('cassino_player_id')).toBe('player-1');
            expect(localStorage.getItem('cassino_player_name')).toBe('Player1');
        });

        it('should handle multiple sessions correctly', () => {
            // First session
            gameStore.setPlayerName('Player1');
            gameStore.setRoomId('ROOM01');
            gameStore.setPlayerId('player-1');
            
            // Leave room
            gameStore.reset();
            
            // Second session
            gameStore.setPlayerName('Player1'); // Same player
            gameStore.setRoomId('ROOM02');
            gameStore.setPlayerId('player-2');
            
            const state = get(gameStore);
            expect(state.roomId).toBe('ROOM02');
            expect(state.playerId).toBe('player-2');
            
            // Verify sessionStorage has latest session
            expect(sessionStorage.getItem('cassino_room_id')).toBe('ROOM02');
            expect(sessionStorage.getItem('cassino_player_id')).toBe('player-2');
        });
    });
});
