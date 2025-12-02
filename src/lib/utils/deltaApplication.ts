/**
 * Delta Application Utility
 * 
 * Applies incremental state updates (deltas) to game state.
 * Handles delta parsing, base version validation, and state merging.
 */

import type { GameState } from '$lib/types/game';
import { computeChecksum } from './stateValidator';

export interface StateDelta {
	version: number;
	baseVersion: number;
	changes: Partial<GameState>;
	checksum?: string;
	timestamp: number;
}

export interface DeltaApplicationResult {
	success: boolean;
	state?: GameState;
	error?: string;
}

/**
 * Apply a delta to current state
 */
export async function applyDelta(
	currentState: GameState,
	delta: StateDelta
): Promise<DeltaApplicationResult> {
	// Verify base version matches
	const currentVersion = currentState.version || 0;
	if (delta.baseVersion !== currentVersion) {
		return {
			success: false,
			error: `Base version mismatch: expected ${currentVersion}, got ${delta.baseVersion}`
		};
	}

	try {
		// Apply changes to create new state
		const newState: GameState = {
			...currentState,
			...delta.changes,
			version: delta.version
		};

		// Verify checksum if provided
		if (delta.checksum) {
			const computedChecksum = await computeChecksum(newState);
			if (computedChecksum !== delta.checksum) {
				return {
					success: false,
					error: 'Checksum mismatch after applying delta'
				};
			}
		}

		return {
			success: true,
			state: newState
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to apply delta'
		};
	}
}

/**
 * Check if a message is a delta update
 */
export function isDeltaUpdate(message: any): message is { type: 'state_delta'; delta: StateDelta } {
	return !!(message && message.type === 'state_delta' && message.delta && typeof message.delta === 'object');
}

/**
 * Check if a message is a full state update
 */
export function isFullStateUpdate(message: any): message is { type: 'state_update'; state: GameState } {
	return !!(message && message.type === 'state_update' && message.state && typeof message.state === 'object');
}

/**
 * Parse WebSocket message and determine update type
 */
export function parseStateUpdate(message: any): {
	type: 'delta' | 'full' | 'unknown';
	data?: StateDelta | GameState;
} {
	if (isDeltaUpdate(message)) {
		return {
			type: 'delta',
			data: message.delta
		};
	}

	if (isFullStateUpdate(message)) {
		return {
			type: 'full',
			data: message.state
		};
	}

	return {
		type: 'unknown'
	};
}

/**
 * Decompress delta if compressed (optional - for future use)
 */
export async function decompressDelta(compressedDelta: ArrayBuffer): Promise<StateDelta> {
	// Placeholder for future compression support
	// Would use pako or similar library
	throw new Error('Delta decompression not yet implemented');
}
