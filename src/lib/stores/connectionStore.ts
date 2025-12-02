import { writable } from 'svelte/store';
import { gameStore } from './gameStore';
import { ErrorHandler } from '$lib/utils/errorHandler';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface ConnectionState {
    status: ConnectionStatus;
    error: string | null;
    latency: number;
}

function createConnectionStore() {
    const { subscribe, set, update } = writable<ConnectionState>({
        status: 'disconnected',
        error: null,
        latency: 0
    });

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = (roomId: string) => {
        if (ws?.readyState === WebSocket.OPEN) {
            console.log('WebSocket already connected');
            return;
        }

        const apiUrl =
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'ws://localhost:8000'
                : 'wss://cassino-game-backend.onrender.com';

        const wsUrl = `${apiUrl}/ws/${roomId}`;

        update((s) => ({ ...s, status: 'connecting', error: null }));

        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected');
                reconnectAttempts = 0;
                update((s) => ({ ...s, status: 'connected', error: null }));

                // Start heartbeat
                startHeartbeat();
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle different message types
                    if (data.type === 'game_state_update') {
                        // Fetch the latest game state from the server
                        console.log('Game state update received, fetching latest state...');
                        try {
                            const { getGameState } = await import('$lib/utils/api');
                            const response = await getGameState(data.room_id);
                            gameStore.setGameState(response.game_state);
                        } catch (err) {
                            console.error('Failed to fetch game state:', err);
                            // If data includes game_state, use it as fallback
                            if (data.game_state) {
                                gameStore.setGameState(data.game_state);
                            }
                        }
                    } else if (data.type === 'player_joined') {
                        // Refresh game state when a player joins
                        console.log(`Player ${data.player_name} joined the room`);
                        // Fetch updated game state from API
                        try {
                            const { getGameState } = await import('$lib/utils/api');
                            const response = await getGameState(data.room_id);
                            gameStore.setGameState(response.game_state);
                        } catch (err) {
                            console.error('Failed to refresh game state:', err);
                        }
                    } else if (data.type === 'pong') {
                        // Calculate latency
                        const latency = Date.now() - data.timestamp;
                        update((s) => ({ ...s, latency }));
                    } else if (data.type === 'error') {
                        update((s) => ({ ...s, error: data.message }));
                    }
                } catch (err) {
                    ErrorHandler.logError(err, 'WebSocket message parsing');
                }
            };

            ws.onerror = (error) => {
                ErrorHandler.logError(error, 'WebSocket');
                const errorMessage = ErrorHandler.handleWebSocketError(error);
                update((s) => ({ ...s, status: 'error', error: errorMessage }));
            };

            ws.onclose = () => {
                console.log('WebSocket closed');
                update((s) => ({ ...s, status: 'disconnected' }));
                stopHeartbeat();

                // Attempt to reconnect
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);

                    reconnectTimeout = setTimeout(() => {
                        connect(roomId);
                    }, delay);
                } else {
                    update((s) => ({
                        ...s,
                        error: 'Failed to reconnect after multiple attempts'
                    }));
                }
            };
        } catch (err) {
            ErrorHandler.logError(err, 'WebSocket creation');
            const errorMessage = ErrorHandler.getUserMessage(err);
            update((s) => ({ ...s, status: 'error', error: errorMessage }));
        }
    };

    const disconnect = () => {
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        stopHeartbeat();

        if (ws) {
            ws.close();
            ws = null;
        }

        set({ status: 'disconnected', error: null, latency: 0 });
        reconnectAttempts = 0;
    };

    const send = (data: any) => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        } else {
            console.warn('WebSocket not connected, cannot send message');
        }
    };

    const startHeartbeat = () => {
        stopHeartbeat();
        heartbeatInterval = setInterval(() => {
            send({ type: 'ping', timestamp: Date.now() });
        }, 30000); // Every 30 seconds
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    };

    return {
        subscribe,
        connect,
        disconnect,
        send,
        initialize: () => {
            // Initialize if needed
        }
    };
}

export const connectionStore = createConnectionStore();
