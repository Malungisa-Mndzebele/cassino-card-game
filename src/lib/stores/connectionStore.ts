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

// Configuration
const CONFIG = {
    HEARTBEAT_INTERVAL: 3000,
    POLLING_INTERVAL: 2000,
    MAX_RECONNECT_ATTEMPTS: 5,
    SESSION_KEYS: ['session_token', 'cassino_room_id', 'cassino_player_id', 'cassino_session_timestamp']
} as const;

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

    const getApiUrl = () => 
        typeof window !== 'undefined' && window.location.hostname === 'localhost'
            ? 'ws://localhost:8000'
            : 'wss://cassino-game-backend.onrender.com';

    const getSessionToken = () => 
        typeof window !== 'undefined' ? sessionStorage.getItem('session_token') : null;

    const clearSessionData = () => {
        if (typeof sessionStorage !== 'undefined') {
            CONFIG.SESSION_KEYS.forEach(key => sessionStorage.removeItem(key));
        }
    };

    const startHeartbeat = () => {
        stopHeartbeat();
        if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
        }
        heartbeatInterval = setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
            }
        }, CONFIG.HEARTBEAT_INTERVAL);
    };

    const stopHeartbeat = () => {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
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

                if (newVersion > currentVersion) {
                    await gameStore.setGameState(response.game_state);
                }
            }
        } catch {
            // Silently fail - WebSocket might still work
        }
    };

    const startPolling = (roomId: string) => {
        stopPolling();
        pollGameState(roomId);
        pollingInterval = setInterval(() => pollGameState(roomId), CONFIG.POLLING_INTERVAL);
    };

    const stopPolling = () => {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }
    };

    const handleStateUpdate = async (data: Record<string, unknown>) => {
        const rawState = data.game_state || data.state;
        if (!rawState && data.room_id) {
            const { getGameState } = await import('$lib/utils/api');
            const response = await getGameState(data.room_id as string);
            if (response.game_state) {
                await gameStore.setGameState(response.game_state);
            }
            return;
        }

        const { transformGameState } = await import('$lib/utils/api');
        const newState = transformGameState(rawState);

        if (newState?.checksum) {
            const isValid = await validateChecksum(newState, newState.checksum);
            if (!isValid) {
                syncStateManager.recordChecksumMismatch();
                if (syncStateManager.shouldAutoResync && data.room_id) {
                    const { getGameState } = await import('$lib/utils/api');
                    const response = await getGameState(data.room_id as string);
                    if (response.game_state) {
                        await gameStore.setGameState(response.game_state);
                    }
                }
                return;
            }
        }

        if (newState) {
            await gameStore.setGameState(newState);
        }
    };

    const handleDeltaUpdate = async (data: Record<string, unknown>) => {
        const currentState = gameStore.getConfirmedGameState();
        if (!currentState) {
            const { getGameState } = await import('$lib/utils/api');
            const response = await getGameState(data.room_id as string);
            if (response.game_state) {
                await gameStore.setGameState(response.game_state);
            }
            return;
        }

        const result = await applyDelta(currentState, data.delta);
        if (result.success && result.state) {
            await gameStore.setGameState(result.state);
        } else {
            const { getGameState } = await import('$lib/utils/api');
            const response = await getGameState(data.room_id as string);
            if (response.game_state) {
                await gameStore.setGameState(response.game_state);
            }
        }
    };

    const handleMessage = async (event: MessageEvent) => {
        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case 'server_ping':
                    if (ws?.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'pong', timestamp: data.timestamp }));
                    }
                    break;

                case 'game_state_update':
                case 'state_update':
                    await handleStateUpdate(data);
                    break;

                case 'state_delta':
                    await handleDeltaUpdate(data);
                    break;

                case 'player_joined':
                    if (data.game_state) {
                        const { transformGameState } = await import('$lib/utils/api');
                        const newState = transformGameState(data.game_state);
                        if (newState) await gameStore.setGameState(newState);
                    } else if (data.room_id) {
                        const { getGameState } = await import('$lib/utils/api');
                        const response = await getGameState(data.room_id);
                        if (response.game_state) await gameStore.setGameState(response.game_state);
                    }
                    break;

                case 'pong':
                    if (data.timestamp) {
                        const latency = Math.abs(Date.now() - new Date(data.timestamp).getTime());
                        update(s => ({ ...s, latency }));
                    }
                    break;

                case 'chat_message': {
                    const { communication } = await import('./communication.svelte');
                    communication.receiveMessage(data.data);
                    break;
                }

                case 'media_status': {
                    const { communication } = await import('./communication.svelte');
                    communication.handleOpponentMediaStatus(data.data);
                    break;
                }

                case 'webrtc_offer': {
                    const { communication } = await import('./communication.svelte');
                    await communication.handleOffer(data.data);
                    break;
                }

                case 'webrtc_answer': {
                    const { communication } = await import('./communication.svelte');
                    await communication.handleAnswer(data.data);
                    break;
                }

                case 'webrtc_ice_candidate': {
                    const { communication } = await import('./communication.svelte');
                    await communication.handleIceCandidate(data.data);
                    break;
                }

                case 'error':
                    update(s => ({ ...s, error: data.message }));
                    if (data.code === 'invalid_session' || data.code === 'wrong_room') {
                        clearSessionData();
                        reconnectAttempts = CONFIG.MAX_RECONNECT_ATTEMPTS;
                    }
                    break;
            }
        } catch (err) {
            ErrorHandler.logError(err, 'WebSocket message parsing');
        }
    };

    const connect = (roomId: string) => {
        if (ws?.readyState === WebSocket.OPEN) return;

        const sessionToken = getSessionToken();
        const wsUrl = sessionToken
            ? `${getApiUrl()}/ws/${roomId}?session_token=${encodeURIComponent(sessionToken)}`
            : `${getApiUrl()}/ws/${roomId}`;

        update(s => ({ ...s, status: 'connecting', error: null }));
        startPolling(roomId);

        try {
            ws = new WebSocket(wsUrl);

            ws.onopen = async () => {
                const wasReconnecting = reconnectAttempts > 0;
                reconnectAttempts = 0;
                update(s => ({ ...s, status: 'connected', error: null }));

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
                startHeartbeat();
            };

            ws.onmessage = handleMessage;

            ws.onerror = (error) => {
                ErrorHandler.logError(error, 'WebSocket');
                update(s => ({ ...s, status: 'error', error: ErrorHandler.handleWebSocketError(error) }));
            };

            ws.onclose = (event) => {
                update(s => ({ ...s, status: 'disconnected' }));
                stopHeartbeat();

                if (event.code === 1008) {
                    clearSessionData();
                    update(s => ({ ...s, error: 'Session expired. Please create or join a new room.' }));
                    return;
                }

                if (reconnectAttempts < CONFIG.MAX_RECONNECT_ATTEMPTS) {
                    reconnectAttempts++;
                    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
                    reconnectTimeout = setTimeout(() => connect(roomId), delay);
                } else {
                    update(s => ({ ...s, error: 'Failed to reconnect after multiple attempts' }));
                }
            };
        } catch (err) {
            ErrorHandler.logError(err, 'WebSocket creation');
            update(s => ({ ...s, status: 'error', error: ErrorHandler.getUserMessage(err) }));
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

    return {
        subscribe,
        connect,
        disconnect,
        send,
        initialize: () => {}
    };
}

export const connectionStore = createConnectionStore();
