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
    return fetchAPI<CreateRoomResponse>('/rooms/create', {
        method: 'POST',
        body: JSON.stringify({
            player_name: playerName,
            max_players: 2
        })
    });
}

export async function joinRoom(roomCode: string, playerName: string): Promise<JoinRoomResponse> {
    return fetchAPI<JoinRoomResponse>('/rooms/join', {
        method: 'POST',
        body: JSON.stringify({
            room_code: roomCode,
            player_name: playerName
        })
    });
}

export async function joinRandomRoom(playerName: string): Promise<JoinRoomResponse> {
    return fetchAPI<JoinRoomResponse>('/rooms/join-random', {
        method: 'POST',
        body: JSON.stringify({
            player_name: playerName
        })
    });
}

export async function getGameState(roomId: string): Promise<GameStateResponse> {
    return fetchAPI<GameStateResponse>(`/rooms/${roomId}/state`);
}

export async function setPlayerReady(roomId: string, playerId: string, ready: boolean) {
    return fetchAPI('/rooms/player-ready', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId,
            ready
        })
    });
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

export async function playCard(
    roomId: string,
    playerId: string,
    cardIndex: number,
    action: 'capture' | 'build' | 'trail',
    targetIndices?: number[],
    buildValue?: number
) {
    return fetchAPI('/game/play-card', {
        method: 'POST',
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId,
            card_index: cardIndex,
            action,
            target_indices: targetIndices,
            build_value: buildValue
        })
    });
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

export { APIError };
