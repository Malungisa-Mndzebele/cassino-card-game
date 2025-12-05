import { writable, derived, get } from 'svelte/store';
import type { GameState, Player } from '$types/game';
import { optimisticStateManager } from './optimisticState.svelte';
import { syncStateManager } from './syncState.svelte';
import { validateChecksum } from '$lib/utils/stateValidator';

interface GameStoreState {
    roomId: string;
    playerId: string;
    playerName: string;
    gameState: GameState | null;
}

function createGameStore() {
    const { subscribe, set, update } = writable<GameStoreState>({
        roomId: '',
        playerId: '',
        playerName: '',
        gameState: null
    });

    return {
        subscribe,

        // Setters
        setRoomId: (roomId: string) => {
            update((s) => ({ ...s, roomId }));
            // Persist to localStorage with timestamp
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('cassino_room_id', roomId);
                localStorage.setItem('cassino_session_timestamp', Date.now().toString());
            }
        },
        setPlayerId: (playerId: string) => {
            update((s) => ({ ...s, playerId }));
            // Persist to localStorage with timestamp
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('cassino_player_id', playerId);
                localStorage.setItem('cassino_session_timestamp', Date.now().toString());
            }
        },
        setPlayerName: (name: string) => {
            update((s) => ({ ...s, playerName: name }));
            // Persist to localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('cassino_player_name', name);
            }
        },
        
        /**
         * Set game state with version tracking and checksum validation
         */
        setGameState: async (gameState: GameState) => {
            // Validate checksum if provided
            if (gameState.checksum) {
                const isValid = await validateChecksum(gameState, gameState.checksum);
                if (!isValid) {
                    console.warn('Checksum validation failed for received state');
                    syncStateManager.recordChecksumMismatch();
                } else {
                    syncStateManager.resetChecksumMismatches();
                }
            }

            // Update optimistic state manager
            optimisticStateManager.setState(gameState);

            // Update store
            update((s) => ({ ...s, gameState }));
        },

        /**
         * Get current game state (may include optimistic updates)
         */
        getGameState: () => {
            const state = get({ subscribe });
            // Return optimistic state if available, otherwise regular state
            return optimisticStateManager.localState || state.gameState;
        },

        /**
         * Get confirmed game state (without optimistic updates)
         */
        getConfirmedGameState: () => {
            const state = get({ subscribe });
            return state.gameState;
        },

        // Reset
        reset: () => {
            set({
                roomId: '',
                playerId: '',
                playerName: get({ subscribe }).playerName, // Keep player name
                gameState: null
            });
            // Clear session from localStorage
            if (typeof localStorage !== 'undefined') {
                localStorage.removeItem('cassino_room_id');
                localStorage.removeItem('cassino_player_id');
                localStorage.removeItem('cassino_session_timestamp');
            }
            // Clear optimistic state
            optimisticStateManager.clearPending();
        },

        // Initialize from localStorage with session validation
        initialize: () => {
            if (typeof localStorage !== 'undefined') {
                const savedName = localStorage.getItem('cassino_player_name');
                const savedRoomId = localStorage.getItem('cassino_room_id');
                const savedPlayerId = localStorage.getItem('cassino_player_id');
                const sessionTimestamp = localStorage.getItem('cassino_session_timestamp');
                
                // Validate session age (24 hours max)
                const now = Date.now();
                const sessionAge = sessionTimestamp ? now - parseInt(sessionTimestamp) : Infinity;
                const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
                
                if (savedName) {
                    update((s) => ({ ...s, playerName: savedName }));
                }
                
                // Only restore session if valid and not expired
                if (savedRoomId && savedPlayerId && sessionAge < maxSessionAge) {
                    update((s) => ({ 
                        ...s, 
                        roomId: savedRoomId,
                        playerId: savedPlayerId
                    }));
                } else if (sessionAge >= maxSessionAge) {
                    // Clear expired session
                    console.log('Session expired, clearing localStorage');
                    localStorage.removeItem('cassino_room_id');
                    localStorage.removeItem('cassino_player_id');
                    localStorage.removeItem('cassino_session_timestamp');
                }
            }
        }
    };
}

export const gameStore = createGameStore();

// Derived stores for computed values
export const myPlayer = derived(gameStore, ($game) =>
    $game.gameState?.players.find((p) => p.id === $game.playerId)
);

export const opponent = derived(gameStore, ($game) =>
    $game.gameState?.players.find((p) => p.id !== $game.playerId)
);

export const isMyTurn = derived(
    gameStore,
    ($game) => $game.gameState?.currentPlayer === $game.playerId
);

export const myScore = derived(gameStore, ($game) => {
    if (!$game.gameState || !$game.playerId) return 0;
    const player = $game.gameState.players.find((p) => p.id === $game.playerId);
    return player?.score ?? 0;
});

export const opponentScore = derived(gameStore, ($game) => {
    if (!$game.gameState || !$game.playerId) return 0;
    const player = $game.gameState.players.find((p) => p.id !== $game.playerId);
    return player?.score ?? 0;
});

export const myHand = derived(gameStore, ($game) => {
    if (!$game.gameState || !$game.playerId) return [];
    const player = $game.gameState.players.find((p) => p.id === $game.playerId);
    return player?.hand ?? [];
});

export const isPlayer1 = derived(
    gameStore,
    ($game) => $game.gameState?.players[0]?.id === $game.playerId
);

// Additional derived stores for components
export const currentPlayer = derived(gameStore, ($game) => {
    if (!$game.gameState || !$game.playerId) return null;
    return $game.gameState.players.find((p) => p.id === $game.playerId) || null;
});

export const player1Score = derived(gameStore, ($game) => {
    return $game.gameState?.player1Score ?? 0;
});

export const player2Score = derived(gameStore, ($game) => {
    return $game.gameState?.player2Score ?? 0;
});

