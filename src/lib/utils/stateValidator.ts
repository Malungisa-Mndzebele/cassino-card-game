/**
 * State Validator
 * 
 * Provides client-side state validation including checksum computation,
 * desync detection, and state integrity checks.
 * 
 * The checksum algorithm must match the backend implementation exactly.
 */

import type { GameState } from '$lib/types/game';

export interface ValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface DesyncDetails {
	isDesynced: boolean;
	versionMismatch: boolean;
	checksumMismatch: boolean;
	localVersion: number;
	serverVersion: number;
	localChecksum: string;
	serverChecksum: string;
}

/**
 * Compute SHA-256 checksum of game state
 * Must match backend/state_checksum.py algorithm exactly
 */
export async function computeChecksum(state: GameState): Promise<string> {
	// Create canonical representation (must match backend exactly)
	const canonical = {
		version: state.version || 0,
		phase: state.phase,
		currentTurn: state.currentPlayer,
		cardCounts: {
			deck: state.deck?.length || 0,
			p1Hand: state.player1Hand?.length || 0,
			p2Hand: state.player2Hand?.length || 0,
			table: state.tableCards?.length || 0,
			p1Captured: state.player1Captured?.length || 0,
			p2Captured: state.player2Captured?.length || 0
		},
		scores: {
			p1: state.player1Score || 0,
			p2: state.player2Score || 0
		}
	};

	// Serialize to deterministic JSON string
	const jsonString = JSON.stringify(canonical);

	// Compute SHA-256 hash using Web Crypto API
	const encoder = new TextEncoder();
	const data = encoder.encode(jsonString);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);

	// Convert to hex string
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

	return hashHex;
}

/**
 * Validate checksum matches expected value
 */
export async function validateChecksum(
	state: GameState,
	expectedChecksum: string
): Promise<boolean> {
	const actualChecksum = await computeChecksum(state);
	return actualChecksum === expectedChecksum;
}

/**
 * Detect if local state is desynced from server state
 */
export async function detectDesync(
	localState: GameState,
	serverState: GameState
): Promise<DesyncDetails> {
	const localVersion = localState.version || 0;
	const serverVersion = serverState.version || 0;
	const versionMismatch = localVersion !== serverVersion;

	// Compute checksums
	const localChecksum = await computeChecksum(localState);
	const serverChecksum = serverState.checksum || (await computeChecksum(serverState));
	const checksumMismatch = localChecksum !== serverChecksum;

	return {
		isDesynced: versionMismatch || checksumMismatch,
		versionMismatch,
		checksumMismatch,
		localVersion,
		serverVersion,
		localChecksum,
		serverChecksum
	};
}

/**
 * Validate state transition is legal
 */
export function validateTransition(
	fromState: GameState,
	toState: GameState
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check version increment
	const fromVersion = fromState.version || 0;
	const toVersion = toState.version || 0;
	if (toVersion !== fromVersion + 1) {
		errors.push(`Invalid version increment: ${fromVersion} -> ${toVersion}`);
	}

	// Check phase transitions are valid
	const validPhaseTransitions: Record<string, string[]> = {
		waiting: ['dealer', 'cardSelection'],
		dealer: ['cardSelection'],
		cardSelection: ['dealing'],
		dealing: ['round1'],
		round1: ['round2', 'finished'],
		round2: ['finished'],
		finished: []
	};

	const validNextPhases = validPhaseTransitions[fromState.phase] || [];
	if (toState.phase !== fromState.phase && !validNextPhases.includes(toState.phase)) {
		errors.push(`Invalid phase transition: ${fromState.phase} -> ${toState.phase}`);
	}

	// Check total card count (should always be 52)
	const totalCards =
		(toState.deck?.length || 0) +
		(toState.player1Hand?.length || 0) +
		(toState.player2Hand?.length || 0) +
		(toState.tableCards?.length || 0) +
		(toState.player1Captured?.length || 0) +
		(toState.player2Captured?.length || 0);

	if (totalCards !== 52 && toState.phase !== 'waiting') {
		errors.push(`Invalid card count: ${totalCards} (expected 52)`);
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Validate game rules compliance
 */
export function validateGameRules(state: GameState): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Check scores are non-negative
	if (state.player1Score < 0 || state.player2Score < 0) {
		errors.push('Scores cannot be negative');
	}

	// Check current player is valid
	const playerIds = state.players?.map((p) => p.id) || [];
	if (state.currentPlayer && !playerIds.includes(state.currentPlayer)) {
		errors.push(`Invalid current player: ${state.currentPlayer}`);
	}

	// Check phase-specific rules
	if (state.phase === 'round1' || state.phase === 'round2') {
		// During rounds, hands should not be empty unless deck is also empty
		if (
			state.player1Hand?.length === 0 &&
			state.player2Hand?.length === 0 &&
			state.deck?.length > 0
		) {
			warnings.push('Both hands empty but deck has cards');
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}
