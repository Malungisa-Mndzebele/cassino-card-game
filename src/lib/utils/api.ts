/**
 * Game API — serverless P2P edition.
 *
 * The game has no backend. Every action is routed through the P2P session
 * (src/lib/p2p/session.ts): the host applies it to the in-browser authoritative
 * engine and broadcasts the new state; the guest forwards it to the host. The
 * function signatures are kept identical to the old HTTP client so the game
 * components did not have to change.
 */

import type { GameStateResponse, GameState } from '$types/game';
import * as session from '$lib/p2p/session';

class APIError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message);
        this.name = 'APIError';
    }
}

// Backend state interface (snake_case, as produced by the in-browser engine).
interface BackendGameState {
    room_id?: string;
    phase?: string;
    round?: number;
    players?: Array<{ id: string; name: string; ready?: boolean }>;
    table_cards?: unknown[];
    current_turn?: number;
    deck?: unknown[];
    player1_hand?: unknown[];
    player2_hand?: unknown[];
    player1_captured?: unknown[];
    player2_captured?: unknown[];
    player1_score?: number;
    player2_score?: number;
    player1_ready?: boolean;
    player2_ready?: boolean;
    winner?: string | number | null;
    last_action?: unknown;
    last_update?: string;
    builds?: unknown[];
    shuffle_complete?: boolean;
    card_selection_complete?: boolean;
    game_started?: boolean;
    game_completed?: boolean;
    dealing_complete?: boolean;
    version?: number;
    checksum?: string;
}

// Transform engine snake_case state to frontend camelCase.
export function transformGameState(backendState: BackendGameState | null | undefined): GameState | null {
    if (!backendState) return null;

    return {
        roomId: backendState.room_id || '',
        phase: (backendState.phase || 'waiting') as GameState['phase'],
        round: backendState.round || 1,
        players: (backendState.players || []) as GameState['players'],
        tableCards: (backendState.table_cards || []) as GameState['tableCards'],
        currentPlayer:
            backendState.current_turn === 1
                ? backendState.players?.[0]?.id || ''
                : backendState.players?.[1]?.id || '',
        deck: (backendState.deck || []) as GameState['deck'],
        player1Hand: (backendState.player1_hand || []) as GameState['player1Hand'],
        player2Hand: (backendState.player2_hand || []) as GameState['player2Hand'],
        player1Captured: (backendState.player1_captured || []) as GameState['player1Captured'],
        player2Captured: (backendState.player2_captured || []) as GameState['player2Captured'],
        player1Score: backendState.player1_score || 0,
        player2Score: backendState.player2_score || 0,
        player1Ready: backendState.player1_ready || false,
        player2Ready: backendState.player2_ready || false,
        winner: backendState.winner ?? null,
        lastAction: backendState.last_action as GameState['lastAction'],
        lastUpdate: backendState.last_update,
        builds: (backendState.builds || []) as GameState['builds'],
        shuffleComplete: backendState.shuffle_complete || false,
        cardSelectionComplete: backendState.card_selection_complete || false,
        currentTurn: backendState.current_turn || 1,
        version: backendState.version || 0,
        checksum: backendState.checksum
    };
}

/** Standard action result shape used across the game components. */
function result(state: unknown, message = '') {
    return {
        success: true,
        message,
        game_state: transformGameState(state as BackendGameState | null)
    };
}

export async function getGameState(_roomId: string): Promise<GameStateResponse> {
    return { game_state: transformGameState(session.getState() as BackendGameState | null) };
}

export async function setPlayerReady(_roomId: string, playerId: string, ready: boolean) {
    const state = await session.performAction('setReady', { playerId, ready });
    return result(state, 'Player ready status updated');
}

export async function startShuffle(_roomId: string, playerId: string) {
    const state = await session.performAction('startShuffle', { playerId });
    return result(state, 'Shuffle started');
}

export async function selectFaceUpCards(_roomId: string, playerId: string, _selectedCards: number[]) {
    const state = await session.performAction('selectFaceUpCards', { playerId });
    return result(state, 'Cards dealt successfully');
}

export async function startGame(_roomId: string, playerId: string) {
    const state = await session.performAction('startGame', { playerId });
    return result(state, 'Game started! Cards have been dealt.');
}

export async function playCard(
    _roomId: string,
    playerId: string,
    cardIdOrIndex: number | string,
    action: 'capture' | 'build' | 'trail',
    targetCards?: string[],
    buildValue?: number,
    components?: string[][],
    targetBuilds?: string[]
) {
    const state = await session.performAction('playCard', {
        playerId,
        cardId: String(cardIdOrIndex),
        action,
        targetCards,
        buildValue,
        components,
        targetBuilds
    });
    return result(state, 'Card played successfully');
}

export async function tableBuild(_roomId: string, playerId: string, targetCards: string[], buildValue: number) {
    const state = await session.performAction('tableBuild', { playerId, targetCards, buildValue });
    return result(state, 'Table build created');
}

export async function resetGame(_roomId: string, playerId: string) {
    const state = await session.performAction('reset', { playerId });
    return result(state, 'Game reset');
}

export async function leaveRoom(_roomId: string, _playerId: string) {
    session.teardown();
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('session_token');
    }
    return { success: true, message: 'Left the game' };
}

export { APIError };
