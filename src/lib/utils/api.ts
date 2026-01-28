import type {
    CreateRoomResponse,
    JoinRoomResponse,
    GameStateResponse,
    ErrorResponse
} from '$types/game';

const API_URL =
    typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'http://localhost:8000'
        : 'https://cassino-game-backend.onrender.com';

class APIError extends Error {
    constructor(
        message: string,
        public status: number
    ) {
        super(message);
        this.name = 'APIError';
    }
}

async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_URL}${endpoint}`;

    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });

        if (!response.ok) {
            const error: ErrorResponse = await response.json();
            throw new APIError(error.detail || 'API request failed', response.status);
        }

        return await response.json();
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError('Network error', 0);
    }
}

export async function createRoom(playerName: string): Promise<CreateRoomResponse> {
    const response = await fetchAPI<any>('/rooms/create', {
        method: 'POST',
        body: JSON.stringify({
            player_name: playerName,
            max_players: 2
        })
    });

    // Store session token if provided
    if (response.session_token && typeof sessionStorage !== 'undefined') {
        console.log('Storing session token from createRoom:', response.session_token.substring(0, 30) + '...');
        sessionStorage.setItem('session_token', response.session_token);
    } else {
        console.warn('No session_token in createRoom response!');
    }

    return {
        room_id: response.room_id,
        player_id: response.player_id,
        player_name: playerName,
        game_state: transformGameState(response.game_state)
    };
}

export async function joinRoom(roomCode: string, playerName: string): Promise<JoinRoomResponse> {
    const response = await fetchAPI<any>('/rooms/join', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomCode,
            player_name: playerName
        })
    });

    // Store session token if provided
    if (response.session_token && typeof sessionStorage !== 'undefined') {
        console.log('Storing session token from joinRoom:', response.session_token.substring(0, 30) + '...');
        sessionStorage.setItem('session_token', response.session_token);
    } else {
        console.warn('No session_token in joinRoom response!');
    }

    return {
        room_id: roomCode,
        player_id: response.player_id,
        player_name: playerName,
        game_state: transformGameState(response.game_state)
    };
}

export async function joinRandomRoom(playerName: string): Promise<JoinRoomResponse> {
    const response = await fetchAPI<any>('/rooms/join-random', {
        method: 'POST',
        body: JSON.stringify({
            player_name: playerName
        })
    });

    // Store session token if provided
    if (response.session_token && typeof sessionStorage !== 'undefined') {
        console.log('Storing session token from joinRandomRoom:', response.session_token.substring(0, 30) + '...');
        sessionStorage.setItem('session_token', response.session_token);
    } else {
        console.warn('No session_token in joinRandomRoom response!');
    }

    return {
        room_id: response.game_state?.room_id || '',
        player_id: response.player_id,
        player_name: playerName,
        game_state: transformGameState(response.game_state)
    };
}

// Transform backend snake_case to frontend camelCase
export function transformGameState(backendState: any): any {
    if (!backendState) return null;

    return {
        roomId: backendState.room_id,
        phase: backendState.phase,
        round: backendState.round,
        players: backendState.players || [],
        tableCards: backendState.table_cards || [],
        currentPlayer: backendState.current_turn === 1
            ? backendState.players?.[0]?.id
            : backendState.players?.[1]?.id,
        deck: backendState.deck || [],
        player1Hand: backendState.player1_hand || [],
        player2Hand: backendState.player2_hand || [],
        player1Captured: backendState.player1_captured || [],
        player2Captured: backendState.player2_captured || [],
        player1Score: backendState.player1_score || 0,
        player2Score: backendState.player2_score || 0,
        player1Ready: backendState.player1_ready || false,
        player2Ready: backendState.player2_ready || false,
        winner: backendState.winner,
        lastAction: backendState.last_action,
        lastUpdate: backendState.last_update,
        builds: backendState.builds || [],
        shuffleComplete: backendState.shuffle_complete || false,
        cardSelectionComplete: backendState.card_selection_complete || false,
        currentTurn: backendState.current_turn || 1,
        gameStarted: backendState.game_started || false,
        gameCompleted: backendState.game_completed || false,
        dealingComplete: backendState.dealing_complete || false,
        version: backendState.version || 0,
        checksum: backendState.checksum
    };
}

export async function getGameState(roomId: string): Promise<GameStateResponse> {
    const response = await fetchAPI<any>(`/rooms/${roomId}/state`);
    return {
        game_state: transformGameState(response)
    };
}

export async function setPlayerReady(roomId: string, playerId: string, ready: boolean) {
    const response = await fetchAPI<any>('/rooms/player-ready', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId,
            is_ready: ready
        })
    });

    return {
        success: response.success,
        message: response.message,
        game_state: transformGameState(response.game_state)
    };
}

export async function startShuffle(roomId: string, playerId: string) {
    return fetchAPI('/game/start-shuffle', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId
        })
    });
}

export async function selectFaceUpCards(
    roomId: string,
    playerId: string,
    selectedCards: number[]
) {
    return fetchAPI('/game/select-face-up-cards', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId,
            selected_cards: selectedCards
        })
    });
}

export async function startGame(roomId: string, playerId: string) {
    const response = await fetchAPI<any>('/game/start', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId
        })
    });

    return {
        success: response.success,
        message: response.message,
        game_state: transformGameState(response.game_state)
    };
}

export async function playCard(
    roomId: string,
    playerId: string,
    cardIdOrIndex: number | string,
    action: 'capture' | 'build' | 'trail',
    targetCards?: string[],
    buildValue?: number
) {
    const response = await fetchAPI<any>('/game/play-card', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: parseInt(playerId, 10),
            card_id: typeof cardIdOrIndex === 'string' ? cardIdOrIndex : undefined,
            card_index: typeof cardIdOrIndex === 'number' ? cardIdOrIndex : undefined,
            action,
            target_cards: targetCards,
            build_value: buildValue
        })
    });

    return {
        success: response.success,
        message: response.message,
        game_state: transformGameState(response.game_state)
    };
}


export async function tableBuild(
    roomId: string,
    playerId: string,
    targetCards: string[],
    buildValue: number
) {
    const response = await fetchAPI<any>('/game/table-build', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: parseInt(playerId, 10),
            target_cards: targetCards,
            build_value: buildValue
        })
    });

    return {
        success: response.success,
        message: response.message,
        game_state: transformGameState(response.game_state)
    };
}

export async function resetGame(roomId: string, playerId: string) {
    return fetchAPI('/game/reset', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId
        })
    });
}

export async function leaveRoom(roomId: string, playerId: string) {
    const response = await fetchAPI<any>('/rooms/leave', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId
        })
    });

    // Clear session token from sessionStorage
    if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('session_token');
    }

    return {
        success: response.success,
        message: response.message
    };
}

export async function createAIGame(playerName: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium'): Promise<CreateRoomResponse> {
    const response = await fetchAPI<any>('/rooms/create-ai-game', {
        method: 'POST',
        body: JSON.stringify({
            player_name: playerName,
            difficulty: difficulty
        })
    });

    // Store session token if provided
    if (response.session_token && typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('session_token', response.session_token);
    }

    return {
        room_id: response.room_id,
        player_id: response.player_id,
        player_name: playerName,
        game_state: transformGameState(response.game_state)
    };
}

export { APIError };
