/**
 * Voice Chat Store
 * 
 * Manages WebRTC peer-to-peer voice communication between players using Svelte 5 runes.
 * Handles media stream acquisition, peer connection management, and signaling.
 */

import { browser } from '$app/environment';

// WebRTC Configuration
const rtcConfiguration: RTCConfiguration = {
	iceServers: [
		// Public STUN servers for NAT traversal
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
		{ urls: 'stun:stun2.l.google.com:19302' }
	],
	iceCandidatePoolSize: 10,
	bundlePolicy: 'max-bundle',
	rtcpMuxPolicy: 'require'
};

// Media Constraints
const mediaConstraints: MediaStreamConstraints = {
	audio: {
		echoCancellation: true,
		noiseSuppression: true,
		autoGainControl: true,
		sampleRate: 48000,
		channelCount: 1 // Mono for voice
	},
	video: false
};

// Voice Chat State Interface
interface VoiceChatState {
	// Connection state
	isConnected: boolean;
	isConnecting: boolean;
	connectionError: string | null;

	// Audio state
	isMuted: boolean;
	isOpponentMuted: boolean;
	isSpeaking: boolean;
	isOpponentSpeaking: boolean;

	// Settings
	volume: number; // 0-100
	isEnabled: boolean; // User preference

	// Media
	localStream: MediaStream | null;
	remoteStream: MediaStream | null;

	// WebRTC
	peerConnection: RTCPeerConnection | null;

	// Room info
	roomId: string | null;
	playerId: string | null;
}

// Settings storage key
const SETTINGS_KEY = 'voice_chat_settings';

// Create reactive state using Svelte 5 runes
let state = $state<VoiceChatState>({
	isConnected: false,
	isConnecting: false,
	connectionError: null,
	isMuted: true, // Start muted
	isOpponentMuted: true,
	isSpeaking: false,
	isOpponentSpeaking: false,
	volume: 80,
	isEnabled: true,
	localStream: null,
	remoteStream: null,
	peerConnection: null,
	roomId: null,
	playerId: null
});

// WebSocket reference (will be set from outside)
let websocketSend: ((message: any) => void) | null = null;

// Audio context for speaking detection
let audioContext: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let speakingCheckInterval: number | null = null;

/**
 * Load settings from localStorage
 */
function loadSettings() {
	if (!browser) return;

	try {
		const saved = localStorage.getItem(SETTINGS_KEY);
		if (saved) {
			const settings = JSON.parse(saved);
			state.volume = settings.volume ?? 80;
			state.isEnabled = settings.enabled ?? true;
		}
	} catch (error) {
		console.error('Failed to load voice chat settings:', error);
	}
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
	if (!browser) return;

	try {
		const settings = {
			enabled: state.isEnabled,
			volume: state.volume,
			lastMutedState: state.isMuted
		};
		localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
	} catch (error) {
		console.error('Failed to save voice chat settings:', error);
	}
}

/**
 * Initialize voice chat for a room
 */
async function initialize(roomId: string, playerId: string, wsSend: (message: any) => void) {
	if (!browser) return;

	state.roomId = roomId;
	state.playerId = playerId;
	websocketSend = wsSend;

	// Load saved settings
	loadSettings();

	// Don't initialize if disabled
	if (!state.isEnabled) {
		return;
	}
}

/**
 * Cleanup voice chat resources
 */
function cleanup() {
	// Stop speaking detection
	if (speakingCheckInterval) {
		clearInterval(speakingCheckInterval);
		speakingCheckInterval = null;
	}

	// Close audio context
	if (audioContext) {
		audioContext.close();
		audioContext = null;
		analyser = null;
	}

	// Stop local stream
	if (state.localStream) {
		state.localStream.getTracks().forEach((track) => track.stop());
		state.localStream = null;
	}

	// Close peer connection
	if (state.peerConnection) {
		state.peerConnection.close();
		state.peerConnection = null;
	}

	// Reset state
	state.isConnected = false;
	state.isConnecting = false;
	state.connectionError = null;
	state.isMuted = true;
	state.isSpeaking = false;
	state.remoteStream = null;
	state.roomId = null;
	state.playerId = null;
	websocketSend = null;
}

/**
 * Toggle mute/unmute
 */
async function toggleMute() {
	if (!browser) return;

	if (state.isMuted) {
		// Unmute: request microphone access
		try {
			state.connectionError = null;

			// Request microphone permission
			const stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);
			state.localStream = stream;

			// Set up speaking detection
			setupSpeakingDetection(stream);

			// Add stream to peer connection if it exists
			if (state.peerConnection) {
				stream.getTracks().forEach((track) => {
					state.peerConnection!.addTrack(track, stream);
				});
			}

			state.isMuted = false;

			// Broadcast mute status
			sendMuteStatus(false);
		} catch (error: any) {
			console.error('Failed to access microphone:', error);

			if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
				state.connectionError = 'Microphone permission denied. Please allow access in your browser settings.';
			} else if (error.name === 'NotFoundError') {
				state.connectionError = 'No microphone found. Please connect a microphone and try again.';
			} else {
				state.connectionError = 'Failed to access microphone. Please check your device settings.';
			}

			state.isMuted = true;
		}
	} else {
		// Mute: stop transmitting
		if (state.localStream) {
			state.localStream.getTracks().forEach((track) => track.stop());
			state.localStream = null;
		}

		// Stop speaking detection
		if (speakingCheckInterval) {
			clearInterval(speakingCheckInterval);
			speakingCheckInterval = null;
		}
		state.isSpeaking = false;

		state.isMuted = true;

		// Broadcast mute status
		sendMuteStatus(true);
	}

	saveSettings();
}

/**
 * Set up audio level detection for speaking indicator
 */
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

		// Check audio levels periodically
		speakingCheckInterval = window.setInterval(() => {
			if (!analyser) return;

			analyser.getByteFrequencyData(dataArray);

			// Calculate average volume
			const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;

			// Threshold for speaking detection (adjust as needed)
			const speakingThreshold = 20;
			state.isSpeaking = average > speakingThreshold;
		}, 100);
	} catch (error) {
		console.error('Failed to set up speaking detection:', error);
	}
}

/**
 * Set volume for remote audio
 */
function setVolume(volume: number) {
	state.volume = Math.max(0, Math.min(100, volume));
	saveSettings();

	// Apply volume to remote audio element if it exists
	if (browser && state.remoteStream) {
		const audioElements = document.querySelectorAll('audio[data-voice-chat]');
		audioElements.forEach((audio) => {
			(audio as HTMLAudioElement).volume = state.volume / 100;
		});
	}
}

/**
 * Enable or disable voice chat
 */
function setEnabled(enabled: boolean) {
	state.isEnabled = enabled;
	saveSettings();

	if (!enabled) {
		// Clean up if disabling
		cleanup();
	}
}

/**
 * Create WebRTC offer
 */
async function createOffer() {
	if (!browser || !websocketSend) return;

	try {
		state.isConnecting = true;
		state.connectionError = null;

		// Create peer connection
		state.peerConnection = new RTCPeerConnection(rtcConfiguration);

		// Set up event handlers
		setupPeerConnectionHandlers();

		// Add local stream if unmuted
		if (state.localStream) {
			state.localStream.getTracks().forEach((track) => {
				state.peerConnection!.addTrack(track, state.localStream!);
			});
		}

		// Create offer
		const offer = await state.peerConnection.createOffer();
		await state.peerConnection.setLocalDescription(offer);

		// Send offer via WebSocket
		websocketSend({
			type: 'voice_offer',
			data: {
				sdp: offer.sdp,
				type: offer.type
			}
		});
	} catch (error) {
		console.error('Failed to create offer:', error);
		state.connectionError = 'Failed to establish voice connection';
		state.isConnecting = false;
	}
}

/**
 * Handle incoming WebRTC offer
 */
async function handleOffer(offer: RTCSessionDescriptionInit) {
	if (!browser || !websocketSend) return;

	try {
		state.isConnecting = true;
		state.connectionError = null;

		// Create peer connection if it doesn't exist
		if (!state.peerConnection) {
			state.peerConnection = new RTCPeerConnection(rtcConfiguration);
			setupPeerConnectionHandlers();

			// Add local stream if unmuted
			if (state.localStream) {
				state.localStream.getTracks().forEach((track) => {
					state.peerConnection!.addTrack(track, state.localStream!);
				});
			}
		}

		// Set remote description
		await state.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

		// Create answer
		const answer = await state.peerConnection.createAnswer();
		await state.peerConnection.setLocalDescription(answer);

		// Send answer via WebSocket
		websocketSend({
			type: 'voice_answer',
			data: {
				sdp: answer.sdp,
				type: answer.type
			}
		});
	} catch (error) {
		console.error('Failed to handle offer:', error);
		state.connectionError = 'Failed to establish voice connection';
		state.isConnecting = false;
	}
}

/**
 * Handle incoming WebRTC answer
 */
async function handleAnswer(answer: RTCSessionDescriptionInit) {
	if (!browser || !state.peerConnection) return;

	try {
		await state.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
	} catch (error) {
		console.error('Failed to handle answer:', error);
		state.connectionError = 'Failed to establish voice connection';
	}
}

/**
 * Handle incoming ICE candidate
 */
async function handleIceCandidate(candidate: RTCIceCandidateInit) {
	if (!browser || !state.peerConnection) return;

	try {
		await state.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	} catch (error) {
		console.error('Failed to add ICE candidate:', error);
	}
}

/**
 * Set up peer connection event handlers
 */
function setupPeerConnectionHandlers() {
	if (!state.peerConnection || !websocketSend) return;

	// ICE candidate event
	state.peerConnection.onicecandidate = (event) => {
		if (event.candidate && websocketSend) {
			websocketSend({
				type: 'voice_ice_candidate',
				data: {
					candidate: event.candidate.candidate,
					sdpMLineIndex: event.candidate.sdpMLineIndex,
					sdpMid: event.candidate.sdpMid
				}
			});
		}
	};

	// Track event (receiving remote stream)
	state.peerConnection.ontrack = (event) => {
		state.remoteStream = event.streams[0];

		// Apply volume setting
		setTimeout(() => {
			const audioElements = document.querySelectorAll('audio[data-voice-chat]');
			audioElements.forEach((audio) => {
				(audio as HTMLAudioElement).volume = state.volume / 100;
			});
		}, 100);
	};

	// Connection state change
	state.peerConnection.onconnectionstatechange = () => {
		if (!state.peerConnection) return;

		switch (state.peerConnection.connectionState) {
			case 'connected':
				state.isConnected = true;
				state.isConnecting = false;
				state.connectionError = null;
				break;
			case 'disconnected':
			case 'failed':
				state.isConnected = false;
				state.isConnecting = false;
				state.connectionError = 'Voice connection lost';
				// TODO: Implement reconnection logic
				break;
			case 'closed':
				state.isConnected = false;
				state.isConnecting = false;
				break;
		}
	};

	// ICE connection state change
	state.peerConnection.oniceconnectionstatechange = () => {
		// ICE connection state changed
	};
}

/**
 * Send mute status to opponent
 */
function sendMuteStatus(isMuted: boolean) {
	if (!websocketSend) return;

	websocketSend({
		type: 'voice_mute_status',
		data: {
			is_muted: isMuted
		}
	});
}

/**
 * Handle incoming mute status from opponent
 */
function handleOpponentMuteStatus(isMuted: boolean) {
	state.isOpponentMuted = isMuted;
}

// Export the store
export const voiceChat = {
	// Reactive state (read-only)
	get isConnected() {
		return state.isConnected;
	},
	get isConnecting() {
		return state.isConnecting;
	},
	get connectionError() {
		return state.connectionError;
	},
	get isMuted() {
		return state.isMuted;
	},
	get isOpponentMuted() {
		return state.isOpponentMuted;
	},
	get isSpeaking() {
		return state.isSpeaking;
	},
	get isOpponentSpeaking() {
		return state.isOpponentSpeaking;
	},
	get volume() {
		return state.volume;
	},
	get isEnabled() {
		return state.isEnabled;
	},
	get localStream() {
		return state.localStream;
	},
	get remoteStream() {
		return state.remoteStream;
	},

	// Actions
	initialize,
	cleanup,
	toggleMute,
	setVolume,
	setEnabled,
	createOffer,
	handleOffer,
	handleAnswer,
	handleIceCandidate,
	handleOpponentMuteStatus
};
