/**
 * Shared WebRTC Configuration
 * 
 * Common configuration and utilities for WebRTC-based communication.
 */

export const RTC_CONFIG: RTCConfiguration = {
	iceServers: [
		{ urls: 'stun:stun.l.google.com:19302' },
		{ urls: 'stun:stun1.l.google.com:19302' },
		{ urls: 'stun:stun2.l.google.com:19302' }
	],
	iceCandidatePoolSize: 10,
	bundlePolicy: 'max-bundle',
	rtcpMuxPolicy: 'require'
};

export const AUDIO_CONSTRAINTS: MediaTrackConstraints = {
	echoCancellation: true,
	noiseSuppression: true,
	autoGainControl: true
};

export const SETTINGS_KEYS = {
	VOICE_CHAT: 'voice_chat_settings',
	COMMUNICATION: 'communication_settings'
} as const;

export interface WebSocketMessage {
	type: string;
	data?: Record<string, unknown>;
}

/**
 * Load settings from localStorage safely
 */
export function loadSettings<T>(key: string, defaults: T): T {
	if (typeof window === 'undefined') return defaults;
	
	try {
		const saved = localStorage.getItem(key);
		return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
	} catch {
		return defaults;
	}
}

/**
 * Save settings to localStorage safely
 */
export function saveSettings(key: string, settings: Record<string, unknown>): void {
	if (typeof window === 'undefined') return;
	
	try {
		localStorage.setItem(key, JSON.stringify(settings));
	} catch (e) {
		console.error(`Failed to save settings to ${key}:`, e);
	}
}

/**
 * Handle media access errors with user-friendly messages
 */
export function getMediaErrorMessage(error: unknown, device: string): string {
	const err = error as Error & { name?: string };
	
	if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
		return `${device.charAt(0).toUpperCase() + device.slice(1)} permission denied. Please allow access in browser settings.`;
	}
	if (err.name === 'NotFoundError') {
		return `No ${device} found. Please connect a ${device} and try again.`;
	}
	return `Failed to access ${device}. Please check your device settings.`;
}

/**
 * Create audio level analyzer for speaking detection
 */
export function createSpeakingDetector(
	stream: MediaStream,
	onSpeakingChange: (isSpeaking: boolean) => void,
	threshold = 20
): { cleanup: () => void } {
	const audioContext = new AudioContext();
	const analyser = audioContext.createAnalyser();
	const source = audioContext.createMediaStreamSource(stream);
	source.connect(analyser);

	analyser.fftSize = 256;
	const bufferLength = analyser.frequencyBinCount;
	const dataArray = new Uint8Array(bufferLength);

	const interval = window.setInterval(() => {
		analyser.getByteFrequencyData(dataArray);
		const average = dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
		onSpeakingChange(average > threshold);
	}, 100);

	return {
		cleanup: () => {
			clearInterval(interval);
			audioContext.close();
		}
	};
}
