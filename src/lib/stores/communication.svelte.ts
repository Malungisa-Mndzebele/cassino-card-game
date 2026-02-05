/**
 * Communication Store
 * 
 * Manages WebRTC peer-to-peer voice, video, and text chat between players.
 * Uses Svelte 5 runes for reactive state management.
 */

import { browser } from '$app/environment';

// WebRTC Configuration
const rtcConfiguration: RTCConfiguration = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
		{ urls: 'stun:stun2.l.google.com:19302' }
	],
	iceCandidatePoolSize: 10,
	bundlePolicy: 'max-bundle',
	rtcpMuxPolicy: 'require'
};

// Chat Message Interface
export interface ChatMessage {
	id: string;
	senderId: string;
	senderName: string;
	content: string;
	timestamp: Date;
	isSystem?: boolean;
}

// Communication State Interface
interface CommunicationState {
	// Connection
	isConnected: boolean;
	isConnecting: boolean;
	connectionError: string | null;

	// Audio
	isAudioEnabled: boolean;
	isAudioMuted: boolean;
	isOpponentAudioMuted: boolean;
	isSpeaking: boolean;
	isOpponentSpeaking: boolean;
	audioVolume: number;

	// Video
	isVideoEnabled: boolean;
	isVideoMuted: boolean;
	isOpponentVideoMuted: boolean;

	// Chat
	messages: ChatMessage[];
	unreadCount: number;
	isChatOpen: boolean;

	// Streams
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;

	// WebRTC
	peerConnection: RTCPeerConnection | null;
	dataChannel: RTCDataChannel | null;

	// Room info
	roomId: string | null;
	playerId: string | null;
	playerName: string | null;
}

const SETTINGS_KEY = 'communication_settings';

// Create reactive state
let state = $state<CommunicationState>({
	isConnected: false,
	isConnecting: false,
	connectionError: null,
	isAudioEnabled: false,
	isAudioMuted: true,
	isOpponentAudioMuted: true,
	isSpeaking: false,
	isOpponentSpeaking: false,
	audioVolume: 80,
	isVideoEnabled: false,
	isVideoMuted: true,
	isOpponentVideoMuted: true,
	messages: [],
	unreadCount: 0,
	isChatOpen: false,
	localStream: null,
	remoteStream: null,
	peerConnection: null,
	dataChannel: null,
	roomId: null,
	playerId: null,
	playerName: null
});

let websocketSend: ((message: any) => void) | null = null;
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let speakingCheckInterval: number | null = null;

function loadSettings() {
	if (!browser) return;
	try {
		const saved = localStorage.getItem(SETTINGS_KEY);
		if (saved) {
			const settings = JSON.parse(saved);
			state.audioVolume = settings.audioVolume ?? 80;
		}
	} catch (e) {
		console.error('Failed to load communication settings:', e);
	}
}

function saveSettings() {
	if (!browser) return;
	try {
		localStorage.setItem(SETTINGS_KEY, JSON.stringify({
			audioVolume: state.audioVolume
		}));
	} catch (e) {
		console.error('Failed to save communication settings:', e);
	}
}

async function initialize(roomId: string, playerId: string, playerName: string, wsSend: (message: any) => void) {
	if (!browser) return;

	state.roomId = roomId;
	state.playerId = playerId;
	state.playerName = playerName;
	websocketSend = wsSend;

	loadSettings();

	// Add system message
	addSystemMessage('Connected to room. You can now chat with your opponent!');
}

function cleanup() {
	if (speakingCheckInterval) {
		clearInterval(speakingCheckInterval);
		speakingCheckInterval = null;
	}

	if (audioContext) {
		audioContext.close();
		audioContext = null;
		analyser = null;
	}

	if (state.localStream) {
		state.localStream.getTracks().forEach(track => track.stop());
		state.localStream = null;
	}

	if (state.dataChannel) {
		state.dataChannel.close();
		state.dataChannel = null;
	}

	if (state.peerConnection) {
		state.peerConnection.close();
		state.peerConnection = null;
	}

	state.isConnected = false;
	state.isConnecting = false;
	state.connectionError = null;
	state.isAudioMuted = true;
	state.isVideoMuted = true;
	state.isSpeaking = false;
	state.remoteStream = null;
	state.messages = [];
	state.unreadCount = 0;
	state.roomId = null;
	state.playerId = null;
	state.playerName = null;
	websocketSend = null;
}

async function toggleAudio() {
	if (!browser) return;

	if (state.isAudioMuted) {
		try {
			state.connectionError = null;

			const constraints: MediaStreamConstraints = {
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true
				},
				video: state.isVideoEnabled ? true : false
			};

			if (state.localStream) {
				// Just enable audio track
				const audioTrack = state.localStream.getAudioTracks()[0];
				if (audioTrack) {
					audioTrack.enabled = true;
				} else {
					// Need to get new stream with audio
					const stream = await navigator.mediaDevices.getUserMedia({ audio: constraints.audio });
					stream.getAudioTracks().forEach(track => {
						state.localStream!.addTrack(track);
					});
				}
			} else {
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				state.localStream = stream;
				setupSpeakingDetection(stream);
			}

			// Ensure connection exists and add tracks
			const isNew = ensurePeerConnection();
			await addLocalTracks();

			if (isNew) {
				// Create data channel if we initiated
				state.dataChannel = state.peerConnection!.createDataChannel('chat', { ordered: true });
				setupDataChannelHandlers(state.dataChannel);
			}

			state.isAudioEnabled = true;
			state.isAudioMuted = false;
			sendMediaStatus();
		} catch (error: any) {
			handleMediaError(error, 'microphone');
		}
	} else {
		if (state.localStream) {
			state.localStream.getAudioTracks().forEach(track => {
				track.enabled = false;
			});
		}
		state.isAudioMuted = true;
		state.isSpeaking = false;
		sendMediaStatus();
	}
}

async function toggleVideo() {
	if (!browser) return;

	if (state.isVideoMuted) {
		try {
			state.connectionError = null;

			if (state.localStream) {
				const videoTrack = state.localStream.getVideoTracks()[0];
				if (videoTrack) {
					videoTrack.enabled = true;
				} else {
					const stream = await navigator.mediaDevices.getUserMedia({ video: true });
					stream.getVideoTracks().forEach(track => {
						state.localStream!.addTrack(track);
					});
				}
			} else {
				const stream = await navigator.mediaDevices.getUserMedia({
					video: true,
					audio: state.isAudioEnabled
				});
				state.localStream = stream;

				if (state.isAudioEnabled) {
					setupSpeakingDetection(stream);
				}
			}

			// Ensure connection and add tracks
			const isNew = ensurePeerConnection();
			await addLocalTracks();

			if (isNew) {
				state.dataChannel = state.peerConnection!.createDataChannel('chat', { ordered: true });
				setupDataChannelHandlers(state.dataChannel);
			}

			state.isVideoEnabled = true;
			state.isVideoMuted = false;
			sendMediaStatus();
		} catch (error: any) {
			handleMediaError(error, 'camera');
		}
	} else {
		if (state.localStream) {
			state.localStream.getVideoTracks().forEach(track => {
				track.enabled = false;
			});
		}
		state.isVideoMuted = true;
		sendMediaStatus();
	}
}

function handleMediaError(error: any, device: string) {
	console.error(`Failed to access ${device}:`, error);

	if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
		state.connectionError = `${device.charAt(0).toUpperCase() + device.slice(1)} permission denied. Please allow access in browser settings.`;
	} else if (error.name === 'NotFoundError') {
		state.connectionError = `No ${device} found. Please connect a ${device} and try again.`;
	} else {
		state.connectionError = `Failed to access ${device}. Please check your device settings.`;
	}
}

function setupSpeakingDetection(stream: MediaStream) {
	if (!browser) return;

	try {
		audioContext = new AudioContext();
		analyser = audioContext.createAnalyser();
		const source = audioContext.createMediaStreamSource(stream);
		source.connect(analyser);

		analyser.fftSize = 256;
		const bufferLength = analyser.frequencyBinCount;
		const dataArray = new Uint8Array(bufferLength);

		speakingCheckInterval = window.setInterval(() => {
			if (!analyser) return;
			analyser.getByteFrequencyData(dataArray);
			const average = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
			state.isSpeaking = average > 20;
		}, 100);
	} catch (e) {
		console.error('Failed to set up speaking detection:', e);
	}
}

function setVolume(volume: number) {
	state.audioVolume = Math.max(0, Math.min(100, volume));
	saveSettings();

	if (browser && state.remoteStream) {
		const audioElements = document.querySelectorAll('audio[data-comm-audio], video[data-comm-video]');
		audioElements.forEach(el => {
			(el as HTMLMediaElement).volume = state.audioVolume / 100;
		});
	}
}

function sendMessage(content: string) {
	if (!content.trim() || !state.playerId || !state.playerName) {
		return;
	}

	const message: ChatMessage = {
		id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
		senderId: state.playerId,
		senderName: state.playerName,
		content: content.trim(),
		timestamp: new Date()
	};

	state.messages = [...state.messages, message];

	// Send via WebSocket
	if (websocketSend) {
		websocketSend({
			type: 'chat_message',
			data: {
				id: message.id,
				content: message.content,
				sender_name: message.senderName
			}
		});
	}

	// Also send via data channel if available
	if (state.dataChannel?.readyState === 'open') {
		state.dataChannel.send(JSON.stringify({
			type: 'chat',
			...message
		}));
	}
}

function receiveMessage(data: { id: string; content: string; sender_id: string; sender_name: string }) {
	const message: ChatMessage = {
		id: data.id,
		senderId: data.sender_id,
		senderName: data.sender_name,
		content: data.content,
		timestamp: new Date()
	};

	state.messages = [...state.messages, message];

	if (!state.isChatOpen) {
		state.unreadCount++;
	}
}

function addSystemMessage(content: string) {
	const message: ChatMessage = {
		id: `sys_${Date.now()}`,
		senderId: 'system',
		senderName: 'System',
		content,
		timestamp: new Date(),
		isSystem: true
	};
	state.messages = [...state.messages, message];
}

function toggleChat() {
	state.isChatOpen = !state.isChatOpen;
	if (state.isChatOpen) {
		state.unreadCount = 0;
	}
}

function sendMediaStatus() {
	if (!websocketSend) return;

	websocketSend({
		type: 'media_status',
		data: {
			audio_muted: state.isAudioMuted,
			video_muted: state.isVideoMuted
		}
	});
}

function handleOpponentMediaStatus(data: { audio_muted: boolean; video_muted: boolean }) {
	state.isOpponentAudioMuted = data.audio_muted;
	state.isOpponentVideoMuted = data.video_muted;
}

async function createOffer() {
	if (!browser || !websocketSend) return;

	try {
		state.isConnecting = true;
		state.connectionError = null;

		const isNew = ensurePeerConnection();

		if (isNew) {
			// Create data channel for chat if new connection
			state.dataChannel = state.peerConnection!.createDataChannel('chat', {
				ordered: true
			});
			setupDataChannelHandlers(state.dataChannel);
		}

		await addLocalTracks();

		const offer = await state.peerConnection!.createOffer();
		await state.peerConnection!.setLocalDescription(offer);

		websocketSend({
			type: 'webrtc_offer',
			data: { sdp: offer.sdp, type: offer.type }
		});
	} catch (e) {
		console.error('Failed to create offer:', e);
		state.connectionError = 'Failed to establish connection';
		state.isConnecting = false;
	}
}

async function handleOffer(offer: RTCSessionDescriptionInit) {
	if (!browser || !websocketSend) return;

	try {
		state.isConnecting = true;

		ensurePeerConnection();

		await state.peerConnection!.setRemoteDescription(new RTCSessionDescription(offer));

		await addLocalTracks();

		const answer = await state.peerConnection!.createAnswer();
		await state.peerConnection!.setLocalDescription(answer);

		websocketSend({
			type: 'webrtc_answer',
			data: { sdp: answer.sdp, type: answer.type }
		});
	} catch (e) {
		console.error('Failed to handle offer:', e);
		state.connectionError = 'Failed to establish connection';
		state.isConnecting = false;
	}
}

async function handleAnswer(answer: RTCSessionDescriptionInit) {
	if (!state.peerConnection) return;

	try {
		await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
	} catch (e) {
		console.error('Failed to handle answer:', e);
	}
}

async function handleIceCandidate(candidate: RTCIceCandidateInit) {
	if (!state.peerConnection) return;

	try {
		await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	} catch (e) {
		console.error('Failed to add ICE candidate:', e);
	}
}

function setupPeerConnectionHandlers() {
	if (!state.peerConnection || !websocketSend) return;

	state.peerConnection.onicecandidate = (event) => {
		if (event.candidate && websocketSend) {
			websocketSend({
				type: 'webrtc_ice_candidate',
				data: {
					candidate: event.candidate.candidate,
					sdpMLineIndex: event.candidate.sdpMLineIndex,
					sdpMid: event.candidate.sdpMid
				}
			});
		}
	};

	state.peerConnection.ontrack = (event) => {
		state.remoteStream = event.streams[0];

		setTimeout(() => {
			const elements = document.querySelectorAll('audio[data-comm-audio], video[data-comm-video]');
			elements.forEach(el => {
				(el as HTMLMediaElement).volume = state.audioVolume / 100;
			});
		}, 100);
	};

	state.peerConnection.onnegotiationneeded = async () => {
		if (!state.peerConnection || state.peerConnection.signalingState !== 'stable') return;

		try {
			const offer = await state.peerConnection.createOffer();
			await state.peerConnection.setLocalDescription(offer);

			if (websocketSend) {
				websocketSend({
					type: 'webrtc_offer',
					data: { sdp: offer.sdp, type: offer.type }
				});
			}
		} catch (e) {
			console.error('Failed to handle negotiation needed:', e);
		}
	};

	state.peerConnection.ondatachannel = (event) => {
		state.dataChannel = event.channel;
		setupDataChannelHandlers(event.channel);
	};

	state.peerConnection.onconnectionstatechange = () => {
		if (!state.peerConnection) return;

		switch (state.peerConnection.connectionState) {
			case 'connected':
				state.isConnected = true;
				state.isConnecting = false;
				state.connectionError = null;
				addSystemMessage('Voice/video connection established!');
				break;
			case 'disconnected':
			case 'failed':
				state.isConnected = false;
				state.isConnecting = false;
				state.connectionError = 'Connection lost';
				addSystemMessage('Voice/video connection lost.');
				break;
			case 'closed':
				state.isConnected = false;
				state.isConnecting = false;
				break;
		}
	};
}

function ensurePeerConnection() {
	if (!state.peerConnection) {
		state.peerConnection = new RTCPeerConnection(rtcConfiguration);
		setupPeerConnectionHandlers();
		return true; // Created new
	}
	return false; // Existing
}

async function addLocalTracks() {
	if (!state.peerConnection || !state.localStream) return;

	const senders = state.peerConnection.getSenders();
	state.localStream.getTracks().forEach(track => {
		// Check if track is already added
		const exists = senders.some(sender => sender.track === track);
		if (!exists) {
			state.peerConnection!.addTrack(track, state.localStream!);
		}
	});
}

function setupDataChannelHandlers(channel: RTCDataChannel) {
	channel.onopen = () => {
		// Data channel ready
	};

	channel.onmessage = (event) => {
		try {
			const data = JSON.parse(event.data);
			if (data.type === 'chat') {
				receiveMessage({
					id: data.id,
					content: data.content,
					sender_id: data.senderId,
					sender_name: data.senderName
				});
			}
		} catch (e) {
			console.error('Failed to parse data channel message:', e);
		}
	};

	channel.onclose = () => {
		// Data channel closed
	};
}

export const communication = {
	// State getters
	get isConnected() { return state.isConnected; },
	get isConnecting() { return state.isConnecting; },
	get connectionError() { return state.connectionError; },
	get isAudioEnabled() { return state.isAudioEnabled; },
	get isAudioMuted() { return state.isAudioMuted; },
	get isOpponentAudioMuted() { return state.isOpponentAudioMuted; },
	get isSpeaking() { return state.isSpeaking; },
	get isOpponentSpeaking() { return state.isOpponentSpeaking; },
	get audioVolume() { return state.audioVolume; },
	get isVideoEnabled() { return state.isVideoEnabled; },
	get isVideoMuted() { return state.isVideoMuted; },
	get isOpponentVideoMuted() { return state.isOpponentVideoMuted; },
	get messages() { return state.messages; },
	get unreadCount() { return state.unreadCount; },
	get isChatOpen() { return state.isChatOpen; },
	get localStream() { return state.localStream; },
	get remoteStream() { return state.remoteStream; },

	// Actions
	initialize,
	cleanup,
	toggleAudio,
	toggleVideo,
	setVolume,
	sendMessage,
	receiveMessage,
	toggleChat,
	handleOpponentMediaStatus,
	createOffer,
	handleOffer,
	handleAnswer,
	handleIceCandidate
};
