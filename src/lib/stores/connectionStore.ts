/**
 * Connection store — serverless P2P edition.
 *
 * The real connection lifecycle (WebRTC handshake) lives in the P2P session and
 * is driven by the lobby's copy/paste flow. This store just exposes the session
 * connection status ({status, error, latency}) and the small method surface the
 * game components rely on, so those components did not have to change.
 */

import { connection, teardown, relay, type ConnectionState } from '$lib/p2p/session';

function createConnectionStore() {
    return {
        subscribe: connection.subscribe,

        /**
         * No-op for P2P: the peer connection is established during the lobby
         * handshake, not on demand. Kept so existing callers (reconnect paths)
         * don't break.
         */
        connect: (_roomId: string) => {
            /* handshake handled by the lobby via the P2P session */
        },

        /** Tear down the peer connection. */
        disconnect: () => {
            teardown();
        },

        /** No stored peer session survives a reload, so nothing to restore. */
        initialize: () => {
            /* nothing to initialize for P2P */
        },

        /** Relay a chat / media / voice-signaling message over the data channel. */
        send: (message: unknown) => {
            relay(message);
        }
    };
}

export const connectionStore = createConnectionStore();
export type { ConnectionState };
