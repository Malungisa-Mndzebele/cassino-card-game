import { writable } from 'svelte/store';
import { gameStore } from './gameStore';
import { ErrorHandler } from '$lib/utils/errorHandler';
import { syncStateManager } from './syncState.svelte';
import { applyDelta, parseStateUpdate } from '$lib/utils/deltaApplication';
import { validateChecksum } from '$lib/utils/stateValidator';

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

            ws.onopen = async () => {
                console.log('WebSocket connected');
                reconnectAttempts = 0;
                update((s) => ({ ...s, status: 'connected', error: null }));

                // Sync state on reconnection
                if (reconnectAttempts > 0) {
                    console.log('Reconnected, syncing state...');
                    try {
                        const currentState = gameStore.getConfirmedGameState();
                        await syncStateManager.syncOnReconnect(
                            roomId,
                            currentState,
                            async (roomId, clientVersion) => {
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(roomId);
                                return {
                                    success: true,
                                    currentVersion: response.game_state.version || 0,
                                    clientVersion: clientVersion || 0,
                                    state: response.game_state,
                                    requiresFullSync: false
                                };
                            }
                        );
                    } catch (err) {
                        console.error('Failed to sync on reconnection:', err);
                    }
                }

                // Start heartbeat
                startHeartbeat();
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Parse state update type (delta or full)
                    const updateInfo = parseStateUpdate(data);

                    // Handle different message types
                    if (data.type === 'game_state_update' || data.type === 'state_update') {
                        // Full state update
                        console.log('Full state update received:', data);
                        
                        if (data.game_state || data.state) {
                            const newState = data.game_state || data.state;
                            
                            // Validate checksum if provided
                            if (newState.checksum) {
                                const isValid = await validateChecksum(newState, newState.checksum);
                                if (!isValid) {
                                    console.warn('Checksum validation failed, requesting resync');
                                    syncStateManager.recordChecksumMismatch();
                                    
                                    // Auto-resync if threshold reached
                                    if (syncStateManager.shouldAutoResync) {
                                        try {
                                            const { getGameState } = await import('$lib/utils/api');
                                            const response = await getGameState(data.room_id);
                                            await gameStore.setGameState(response.game_state);
                                        } catch (err) {
                                            console.error('Auto-resync failed:', err);
                                        }
                                    }
                                    return;
                                }
                            }
                            
                            console.log('Updating game state from WebSocket:', newState);
                            await gameStore.setGameState(newState);
                        } else if (data.room_id) {
                            // No state in message, fetch from API
                            console.log('No state in WebSocket message, fetching from API');
                            try {
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(data.room_id);
                                await gameStore.setGameState(response.game_state);
                            } catch (err) {
                                console.error('Failed to fetch game state:', err);
                            }
                        }
                    } else if (data.type === 'state_delta') {
                        // Delta update
                        console.log('Delta update received');
                        
                        const currentState = gameStore.getConfirmedGameState();
                        if (!currentState) {
                            console.warn('No current state, requesting full state');
                            try {
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(data.room_id);
                                await gameStore.setGameState(response.game_state);
                            } catch (err) {
                                console.error('Failed to fetch game state:', err);
                            }
                            return;
                        }
                        
                        // Apply delta
                        const result = await applyDelta(currentState, data.delta);
                        if (result.success && result.state) {
                            await gameStore.setGameState(result.state);
                        } else {
                            console.warn('Delta application failed:', result.error);
                            // Request full state
                            try {
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(data.room_id);
                                await gameStore.setGameState(response.game_state);
                            } catch (err) {
                                console.error('Failed to fetch game state:', err);
                            }
                        }
                    } else if (data.type === 'player_joined') {
                        // Refresh game state when a player joins
                        console.log(`Player ${data.player_name} joined the room`);
                        try {
                            const { getGameState } = await import('$lib/utils/api');
                            const response = await getGameState(data.room_id);
                            await gameStore.setGameState(response.game_state);
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
