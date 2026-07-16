/**
 * Serverless WebRTC transport with manual (copy/paste) signaling.
 *
 * There is no signaling server: the host produces an "offer code", the guest
 * pastes it and produces an "answer code", and the host pastes that back. We use
 * non-trickle ICE (wait for gathering to complete) so a single code carries the
 * full SDP + candidates. Public STUN servers handle NAT discovery for most home
 * networks; restrictive/symmetric NATs would need a TURN relay (a server), which
 * is intentionally out of scope for a zero-backend build.
 */

export type PeerRole = 'host' | 'guest';

export interface PeerEvents {
    onOpen?: () => void;
    onMessage?: (data: unknown) => void;
    onClose?: () => void;
    onError?: (err: unknown) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
];

/** Encode an SDP description into a compact, copy-pasteable code. */
function encodeSignal(desc: RTCSessionDescription | RTCSessionDescriptionInit): string {
    const json = JSON.stringify({ type: desc.type, sdp: desc.sdp });
    // base64 (btoa handles the ASCII SDP fine)
    return btoa(unescape(encodeURIComponent(json)));
}

/** Decode a copy-pasted code back into an SDP description. */
function decodeSignal(code: string): RTCSessionDescriptionInit {
    const json = decodeURIComponent(escape(atob(code.trim())));
    const parsed = JSON.parse(json);
    return { type: parsed.type, sdp: parsed.sdp };
}

/** Resolve once ICE gathering finishes, so the local SDP has all candidates. */
function waitForIceGathering(pc: RTCPeerConnection): Promise<void> {
    if (pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
        const check = () => {
            if (pc.iceGatheringState === 'complete') {
                pc.removeEventListener('icegatheringstatechange', check);
                resolve();
            }
        };
        pc.addEventListener('icegatheringstatechange', check);
        // Safety timeout: some browsers never fire "complete" for host-only paths.
        setTimeout(() => {
            pc.removeEventListener('icegatheringstatechange', check);
            resolve();
        }, 3000);
    });
}

export class Peer {
    private pc: RTCPeerConnection;
    private channel: RTCDataChannel | null = null;
    private events: PeerEvents;
    role: PeerRole;
    connected = false;

    constructor(role: PeerRole, events: PeerEvents = {}) {
        this.role = role;
        this.events = events;
        this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        this.pc.onconnectionstatechange = () => {
            const state = this.pc.connectionState;
            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                if (this.connected) {
                    this.connected = false;
                    this.events.onClose?.();
                }
            }
        };
    }

    private bindChannel(channel: RTCDataChannel): void {
        this.channel = channel;
        channel.onopen = () => {
            this.connected = true;
            this.events.onOpen?.();
        };
        channel.onclose = () => {
            if (this.connected) {
                this.connected = false;
                this.events.onClose?.();
            }
        };
        channel.onmessage = (ev) => {
            try {
                this.events.onMessage?.(JSON.parse(ev.data));
            } catch (err) {
                this.events.onError?.(err);
            }
        };
        channel.onerror = (err) => this.events.onError?.(err);
    }

    /** Host: create the data channel and return an offer code to share. */
    async createOffer(): Promise<string> {
        const channel = this.pc.createDataChannel('game', { ordered: true });
        this.bindChannel(channel);
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        await waitForIceGathering(this.pc);
        return encodeSignal(this.pc.localDescription!);
    }

    /** Host: apply the guest's answer code to complete the connection. */
    async acceptAnswer(answerCode: string): Promise<void> {
        const answer = decodeSignal(answerCode);
        await this.pc.setRemoteDescription(answer);
    }

    /** Guest: apply the host's offer code and return an answer code to share back. */
    async acceptOfferAndCreateAnswer(offerCode: string): Promise<string> {
        this.pc.ondatachannel = (ev) => this.bindChannel(ev.channel);
        const offer = decodeSignal(offerCode);
        await this.pc.setRemoteDescription(offer);
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        await waitForIceGathering(this.pc);
        return encodeSignal(this.pc.localDescription!);
    }

    send(data: unknown): boolean {
        if (this.channel && this.channel.readyState === 'open') {
            this.channel.send(JSON.stringify(data));
            return true;
        }
        return false;
    }

    close(): void {
        try {
            this.channel?.close();
        } catch {
            /* ignore */
        }
        try {
            this.pc.close();
        } catch {
            /* ignore */
        }
        this.connected = false;
    }
}
