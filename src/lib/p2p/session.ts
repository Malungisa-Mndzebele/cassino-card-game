/**
 * P2P game session — ties the WebRTC Peer, the authoritative RoomController
 * (host only), and the gameStore together.
 *
 * Roles:
 *  - host: owns the RoomController, applies every action locally, and broadcasts
 *    the resulting state to the guest.
 *  - guest: sends action requests to the host and renders the state the host
 *    broadcasts back.
 *
 * The action API (performAction) is called by src/lib/utils/api.ts, so the game
 * components are unchanged.
 */

import { writable } from 'svelte/store';
import { gameStore } from '$stores/gameStore';
import { Peer } from './peer';
import { RoomController, type SerializedGameState } from '$lib/engine/roomController';

export type ConnStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface ConnectionState {
    status: ConnStatus;
    error: string | null;
    latency: number;
}

export const connection = writable<ConnectionState>({
    status: 'disconnected',
    error: null,
    latency: 0
});

type Role = 'host' | 'guest' | null;
type ActionName = 'setReady' | 'startShuffle' | 'selectFaceUpCards' | 'startGame' | 'playCard' | 'tableBuild' | 'reset';

interface WireMessage {
    kind: 'welcome' | 'state' | 'join' | 'action' | 'relay' | 'error';
    [key: string]: unknown;
}

let role: Role = null;
let peer: Peer | null = null;
let controller: RoomController | null = null;
let myPlayerId = 0;
let myName = '';
let roomId = '';
let lastState: SerializedGameState | null = null;

function setStatus(status: ConnStatus, error: string | null = null): void {
    connection.update((s) => ({ ...s, status, error }));
}

/** Push a serialized state to the gameStore (camelCase via transformGameState). */
async function pushState(state: SerializedGameState): Promise<void> {
    lastState = state;
    const { transformGameState } = await import('$lib/utils/api');
    const transformed = transformGameState(state as Parameters<typeof transformGameState>[0]);
    if (transformed) await gameStore.setGameState(transformed);
}

function broadcast(state: SerializedGameState): void {
    peer?.send({ kind: 'state', state });
}

/** Route chat / media / voice-signaling messages to the communication store. */
async function dispatchRelay(msg: Record<string, unknown>): Promise<void> {
    const { communication } = await import('$stores/communication.svelte');
    switch (msg.type) {
        case 'chat_message':
            communication.receiveMessage(msg.data as never);
            break;
        case 'media_status':
            communication.handleOpponentMediaStatus(msg.data as never);
            break;
        case 'webrtc_offer':
            await communication.handleOffer(msg.data as never);
            break;
        case 'webrtc_answer':
            await communication.handleAnswer(msg.data as never);
            break;
        case 'webrtc_ice_candidate':
            await communication.handleIceCandidate(msg.data as never);
            break;
    }
}

// ---- host action application ---------------------------------------------

function applyOnController(action: ActionName, params: Record<string, unknown>): SerializedGameState {
    if (!controller) throw new Error('No active room');
    const pid = Number(params.playerId);
    switch (action) {
        case 'setReady':
            return controller.setReady(pid, Boolean(params.ready));
        case 'startShuffle':
            return controller.startShuffle();
        case 'selectFaceUpCards':
            return controller.selectFaceUpCards(pid);
        case 'startGame':
            return controller.startGame();
        case 'playCard':
            return controller.playCard({
                playerId: pid,
                cardId: params.cardId as string,
                action: params.action as 'capture' | 'build' | 'trail',
                targetCards: params.targetCards as string[] | undefined,
                buildValue: params.buildValue as number | undefined,
                components: params.components as string[][] | undefined,
                targetBuilds: params.targetBuilds as string[] | undefined
            });
        case 'tableBuild':
            return controller.tableBuild(pid, params.targetCards as string[], params.buildValue as number);
        case 'reset':
            return controller.reset();
        default:
            throw new Error(`Unknown action: ${action}`);
    }
}

// ---- message handlers ----------------------------------------------------

async function hostOnMessage(raw: unknown): Promise<void> {
    const msg = raw as WireMessage;
    try {
        if (msg.kind === 'join') {
            const state = controller!.addGuest((msg.name as string) || 'Player 2');
            await pushState(state);
            broadcast(state);
        } else if (msg.kind === 'action') {
            const state = applyOnController(msg.action as ActionName, msg.params as Record<string, unknown>);
            await pushState(state);
            broadcast(state);
        } else if (msg.kind === 'relay') {
            await dispatchRelay(msg.msg as Record<string, unknown>);
        }
    } catch (err) {
        peer?.send({ kind: 'error', message: err instanceof Error ? err.message : 'Action failed' });
    }
}

async function guestOnMessage(raw: unknown): Promise<void> {
    const msg = raw as WireMessage;
    if (msg.kind === 'welcome') {
        roomId = msg.roomId as string;
        myPlayerId = Number(msg.guestPlayerId) || 2;
        gameStore.setRoomId(roomId);
        gameStore.setPlayerId(myPlayerId);
        gameStore.setPlayerName(myName);
    } else if (msg.kind === 'state') {
        await pushState(msg.state as SerializedGameState);
    } else if (msg.kind === 'relay') {
        await dispatchRelay(msg.msg as Record<string, unknown>);
    } else if (msg.kind === 'error') {
        setStatus('connected', (msg.message as string) || 'Action rejected');
    }
}

function onClose(): void {
    setStatus('disconnected', 'Connection to the other player was lost');
}

// ---- public API ----------------------------------------------------------

export function getRole(): Role {
    return role;
}

export function getState(): SerializedGameState | null {
    return lastState;
}

/** Host: create a room and return an offer code to share with the guest. */
export async function startHost(name: string): Promise<{ offerCode: string; roomId: string }> {
    teardown();
    role = 'host';
    myName = name;
    myPlayerId = 1;
    controller = new RoomController();
    roomId = controller.roomId;

    const initial = controller.createRoom(name);
    // Note: gameStore.setRoomId is deferred to onOpen so the lobby stays mounted
    // (to show the offer code / accept the answer) until the peer connects.
    await pushState(initial);

    setStatus('connecting');
    peer = new Peer('host', {
        onOpen: () => {
            setStatus('connected');
            gameStore.setRoomId(roomId);
            gameStore.setPlayerId(1);
            gameStore.setPlayerName(myName);
            peer?.send({ kind: 'welcome', roomId, guestPlayerId: 2 });
            if (lastState) broadcast(lastState);
        },
        onMessage: hostOnMessage,
        onClose,
        onError: () => setStatus('error', 'Connection error')
    });

    const offerCode = await peer.createOffer();
    return { offerCode, roomId };
}

/** Host: apply the guest's answer code to finish establishing the connection. */
export async function hostAcceptAnswer(answerCode: string): Promise<void> {
    if (!peer || role !== 'host') throw new Error('Not hosting a game');
    await peer.acceptAnswer(answerCode);
}

/** Guest: accept the host's offer code, returning an answer code to send back. */
export async function startGuest(name: string, offerCode: string): Promise<{ answerCode: string }> {
    teardown();
    role = 'guest';
    myName = name;
    myPlayerId = 2;

    setStatus('connecting');
    peer = new Peer('guest', {
        onOpen: () => {
            setStatus('connected');
            peer?.send({ kind: 'join', name: myName });
        },
        onMessage: guestOnMessage,
        onClose,
        onError: () => setStatus('error', 'Connection error')
    });

    const answerCode = await peer.acceptOfferAndCreateAnswer(offerCode);
    return { answerCode };
}

/**
 * Perform a game action. Host applies locally and broadcasts; guest forwards to
 * the host and returns the last known state (the authoritative update arrives
 * via broadcast).
 */
export async function performAction(
    action: ActionName,
    params: Record<string, unknown>
): Promise<SerializedGameState | null> {
    if (role === 'host') {
        const state = applyOnController(action, params);
        await pushState(state);
        broadcast(state);
        return state;
    }
    if (role === 'guest') {
        peer?.send({ kind: 'action', action, params });
        return lastState;
    }
    throw new Error('No active game session');
}

/** Relay a chat / media / voice-signaling message over the data channel. */
export function relay(msg: unknown): void {
    peer?.send({ kind: 'relay', msg });
}

export function teardown(): void {
    peer?.close();
    peer = null;
    controller = null;
    role = null;
    myPlayerId = 0;
    roomId = '';
    lastState = null;
    setStatus('disconnected');
}
