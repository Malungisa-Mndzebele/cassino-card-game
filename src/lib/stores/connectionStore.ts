import { writable } from 'svelte/store';
import { gameStore } from './gameStore';
import { ErrorHandler } from '$lib/utils/errorHandler';
import { syncStateManager } from './syncState.svelte';
import { applyDelta } from '$lib/utils/deltaApplication';
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
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    const POLLING_INTERVAL = 2000; // Poll every 2 seconds as fallback

    const connect = (roomId: string) => {
        if (ws?.readyState === WebSocket.OPEN) {
            return;
        }

        const apiUrl =
            typeof window !== 'undefined' && window.location.hostname === 'localhost'
                ? 'ws://localhost:8000'
                : 'wss://cassino-game-backend.onrender.com';

        // Get session token from sessionStorage for reconnection
        const sessionToken = typeof window !== 'undefined'
            ? sessionStorage.getItem('session_token')
            : null;

        const wsUrl = sessionToken
            ? `${apiUrl}/ws/${roomId}?session_token=${encodeURIComponent(sessionToken)}`
            : `${apiUrl}/ws/${roomId}`;

        update((s) => ({ ...s, status: 'connecting', error: null }));

        // Start polling fallback immediately - this ensures state syncs even if WebSocket is flaky
        startPolling(roomId);

        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = async () => {
                const wasReconnecting = reconnectAttempts > 0;
                reconnectAttempts = 0;
                update((s) => ({ ...s, status: 'connected', error: null }));

                // Sync state on reconnection
                if (wasReconnecting) {
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
                                    currentVersion: response.game_state?.version || 0,
                                    clientVersion: clientVersion || 0,
                                    state: response.game_state ?? undefined,
                                    requiresFullSync: false
                                };
                            }
                        );
                    } catch (err) {
                        ErrorHandler.logError(err, 'Reconnection sync');
                    }
                }

                // Start heartbeat
                startHeartbeat();
            };

            ws.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handle different message types
                    if (data.type === 'server_ping') {
                        // Respond to server ping IMMEDIATELY to keep connection alive
                        if (ws?.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }));
                        }
                        return;
                    } else if (data.type === 'game_state_update' || data.type === 'state_update') {
                        // Full state update
                        if (data.game_state || data.state) {
                            // Transform snake_case to camelCase
                            const { transformGameState } = await import('$lib/utils/api');
                            const rawState = data.game_state || data.state;
                            const newState = transformGameState(rawState);

                            // Validate checksum if provided
                            if (newState && newState.checksum) {
                                const isValid = await validateChecksum(newState, newState.checksum);
                                if (!isValid) {
                                    syncStateManager.recordChecksumMismatch();

                                    // Auto-resync if threshold reached
                                    if (syncStateManager.shouldAutoResync) {
                                        try {
                                            const { getGameState } = await import('$lib/utils/api');
                                            const response = await getGameState(data.room_id);
                                            if (response.game_state) {
                                                await gameStore.setGameState(response.game_state);
                                            }
                                        } catch (err) {
                                            ErrorHandler.logError(err, 'Auto-resync');
                                        }
                                    }
                                    return;
                                }
                            }

                            if (newState) {
                                await gameStore.setGameState(newState);
                            }
                        } else if (data.room_id) {
                            // No state in message, fetch from API
                            try {
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(data.room_id);
                                if (response.game_state) {
                                    await gameStore.setGameState(response.game_state);
                                }
                            } catch (err) {
                                ErrorHandler.logError(err, 'Fetch game state');
                            }
                        }
                    } else if (data.type === 'state_delta') {
                        // Delta update
                        const currentState = gameStore.getConfirmedGameState();
                        if (!currentState) {
                            try {
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(data.room_id);
                                if (response.game_state) {
                                    await gameStore.setGameState(response.game_state);
                                }
                            } catch (err) {
                                ErrorHandler.logError(err, 'Fetch game state for delta');
                            }
                            return;
                        }

                        // Apply delta
                        const result = await applyDelta(currentState, data.delta);
                        if (result.success && result.state) {
                            await gameStore.setGameState(result.state);
                        } else {
                            // Request full state
                            try {
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(data.room_id);
                                if (response.game_state) {
                                    await gameStore.setGameState(response.game_state);
                                }
                            } catch (err) {
                                ErrorHandler.logError(err, 'Fetch game state after delta fail');
                            }
                        }
                    } else if (data.type === 'player_joined') {
                        // Update game state when a player joins - use included state if available
                        try {
                            if (data.game_state) {
                                // Use the game state included in the message (more reliable)
                                const { transformGameState } = await import('$lib/utils/api');
                                const newState = transformGameState(data.game_state);
                                if (newState) {
                                    await gameStore.setGameState(newState);
                                }
                            } else {
                                // Fallback: fetch from API if no state included
                                const { getGameState } = await import('$lib/utils/api');
                                const response = await getGameState(data.room_id);
                                if (response.game_state) {
                                    await gameStore.setGameState(response.game_state);
                                }
                            }
                        } catch (err) {
                            ErrorHandler.logError(err, 'Player join state update');
                        }
                    } else if (data.type === 'pong') {
                        // Calculate latency from our ping
                        if (data.timestamp) {
                            const serverTime = new Date(data.timestamp).getTime();
                            const latency = Date.now() - serverTime;
                            update((s) => ({ ...s, latency: Math.abs(latency) }));
                        }
                    } else if (data.type === 'chat_message') {
                        // Handle incoming chat message
                        try {
                            const { communication } = await import('./communication.svelte');
                            communication.receiveMessage({
                                id: data.data.id,
                                content: data.data.content,
                                sender_id: data.data.sender_id,
                                sender_name: data.data.sender_name
                            });
                        } catch (err) {
                            ErrorHandler.logError(err, 'Chat message handling');
                        }
                    } else if (data.type === 'media_status') {
                        // Handle opponent media status update
                        try {
                            const { communication } = await import('./communication.svelte');
                            communication.handleOpponentMediaStatus(data.data);
                        } catch (err) {
                            ErrorHandler.logError(err, 'Media status handling');
                        }
                    } else if (data.type === 'webrtc_offer') {
                        // Handle WebRTC offer for voice/video
                        try {
                            const { communication } = await import('./communication.svelte');
                            await communication.handleOffer(data.data);
                        } catch (err) {
                            ErrorHandler.logError(err, 'WebRTC offer handling');
                        }
                    } else if (data.type === 'webrtc_answer') {
                        // Handle WebRTC answer
                        try {
                            const { communication } = await import('./communication.svelte');
                            await communication.handleAnswer(data.data);
                        } catch (err) {
                            ErrorHandler.logError(err, 'WebRTC answer handling');
                        }
                    } else if (data.type === 'webrtc_ice_candidate') {
                        // Handle ICE candidate
                        try {
                            const { communication } = await import('./communication.svelte');
                            await communication.handleIceCandidate(data.data);
                        } catch (err) {
                            ErrorHandler.logError(err, 'ICE candidate handling');
                        }
                    } else if (data.type === 'error') {
                        update((s) => ({ ...s, error: data.message }));

                        // Handle invalid session - clear stored session and stop reconnecting
                        if (data.code === 'invalid_session' || data.code === 'wrong_room') {
                            if (typeof sessionStorage !== 'undefined') {
                                sessionStorage.removeItem('session_token');
                                sessionStorage.removeItem('cassino_room_id');
                                sessionStorage.removeItem('cassino_player_id');
                                sessionStorage.removeItem('cassino_session_timestamp');
                            }
                            // Stop reconnection attempts for invalid sessions
                            reconnectAttempts = maxReconnectAttempts;
                        }
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

            ws.onclose = (event) => {
                update((s) => ({ ...s, status: 'disconnected' }));
                stopHeartbeat();

                // Don't reconnect if session was invalid (code 1008)
                if (event.code === 1008) {
                    if (typeof sessionStorage !== 'undefined') {
                        sessionStorage.removeItem('session_token');
                        sessionStorage.removeItem('cassino_room_id');
                        sessionStorage.removeItem('cassino_player_id');
                        sessionStorage.removeItem('cassino_session_timestamp');
                    }
                    update((s) => ({
                        ...s,
                        error: 'Session expired. Please create or join a new room.'
                    }));
                    return;
                }

                // Attempt to reconnect for other close codes
                if (reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);

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
        stopPolling();

        if (ws) {
            ws.close();
            ws = null;
        }

        set({ status: 'disconnected', error: null, latency: 0 });
        reconnectAttempts = 0;
    };

    const send = (data: Record<string, unknown>) => {
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    };

    const startHeartbeat = () => {
        stopHeartbeat();
        // Send first ping immediately to establish keep-alive
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
        // Then send every 3 seconds (Render has very aggressive idle timeout)
        heartbeatInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            }
        }, 3000); // Every 3 seconds to prevent idle timeout
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
    };

    // Polling fallback - fetches game state periodically to ensure sync even when WebSocket is unreliable
    const startPolling = (roomId: string) => {
        stopPolling();

        // Poll immediately on start
        pollGameState(roomId);

        // Then poll every POLLING_INTERVAL ms
        pollingInterval = setInterval(() => {
            pollGameState(roomId);
        }, POLLING_INTERVAL);
    };

    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    };

    const pollGameState = async (roomId: string) => {
        try {
            const { getGameState } = await import('$lib/utils/api');
            const response = await getGameState(roomId);

            if (response.game_state) {
                const currentState = gameStore.getConfirmedGameState();
                const newVersion = response.game_state.version || 0;
                const currentVersion = currentState?.version || 0;

                // Only update if server has newer state
                if (newVersion > currentVersion) {
                    await gameStore.setGameState(response.game_state);
                }
            }
        } catch {
            // Silently fail polling - WebSocket might still work
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
