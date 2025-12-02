/**
 * Sync State Manager
 * 
 * Handles state synchronization on reconnection, manual resync,
 * and automatic resync after repeated checksum mismatches.
 * 
 * Uses Svelte 5 runes for reactivity.
 */

import type { GameState } from '$lib/types/game';
import { detectDesync } from '$lib/utils/stateValidator';

export interface SyncResult {
	success: boolean;
	currentVersion: number;
	clientVersion: number;
	state?: GameState;
	requiresFullSync: boolean;
	error?: string;
}

interface SyncStateConfig {
	autoResyncThreshold: number; // Number of consecutive checksum mismatches before auto-resync
}

const DEFAULT_CONFIG: SyncStateConfig = {
	autoResyncThreshold: 3
};

/**
 * Creates a sync state manager
 */
export function createSyncStateManager(config: Partial<SyncStateConfig> = {}) {
	const finalConfig = { ...DEFAULT_CONFIG, ...config };

	// Reactive state using Svelte 5 runes
	let isSyncing = $state(false);
	let lastSyncTime = $state<number | null>(null);
	let syncError = $state<string | null>(null);
	let consecutiveChecksumMismatches = $state(0);
	let isDesynced = $state(false);

	/**
	 * Sync client state with server on reconnection
	 */
	async function syncOnReconnect(
		roomId: string,
		localState: GameState | null,
		fetchStateFn: (roomId: string, clientVersion?: number) => Promise<SyncResult>
	): Promise<SyncResult> {
		if (isSyncing) {
			return {
				success: false,
				currentVersion: 0,
				clientVersion: 0,
				requiresFullSync: false,
				error: 'Sync already in progress'
			};
		}

		isSyncing = true;
		syncError = null;

		try {
			const clientVersion = localState?.version || 0;

			// Fetch current state from server
			const result = await fetchStateFn(roomId, clientVersion);

			if (result.success) {
				lastSyncTime = Date.now();
				consecutiveChecksumMismatches = 0;
				isDesynced = false;
			} else {
				syncError = result.error || 'Sync failed';
			}

			return result;
		} catch (error) {
			syncError = error instanceof Error ? error.message : 'Unknown sync error';
			return {
				success: false,
				currentVersion: 0,
				clientVersion: localState?.version || 0,
				requiresFullSync: true,
				error: syncError
			};
		} finally {
			isSyncing = false;
		}
	}

	/**
	 * Manually trigger a full state resync
	 */
	async function manualResync(
		roomId: string,
		fetchStateFn: (roomId: string) => Promise<GameState>
	): Promise<GameState | null> {
		if (isSyncing) {
			throw new Error('Sync already in progress');
		}

		isSyncing = true;
		syncError = null;

		try {
			// Fetch fresh state from server
			const state = await fetchStateFn(roomId);

			lastSyncTime = Date.now();
			consecutiveChecksumMismatches = 0;
			isDesynced = false;

			return state;
		} catch (error) {
			syncError = error instanceof Error ? error.message : 'Manual resync failed';
			throw error;
		} finally {
			isSyncing = false;
		}
	}

	/**
	 * Check if automatic resync should be triggered
	 */
	function shouldAutoResync(): boolean {
		return consecutiveChecksumMismatches >= finalConfig.autoResyncThreshold;
	}

	/**
	 * Record a checksum mismatch
	 */
	function recordChecksumMismatch(): void {
		consecutiveChecksumMismatches++;
		if (shouldAutoResync()) {
			isDesynced = true;
		}
	}

	/**
	 * Reset checksum mismatch counter
	 */
	function resetChecksumMismatches(): void {
		consecutiveChecksumMismatches = 0;
		isDesynced = false;
	}

	/**
	 * Validate sync state against server state
	 */
	async function validateSync(
		localState: GameState,
		serverState: GameState
	): Promise<boolean> {
		const desyncDetails = await detectDesync(localState, serverState);

		if (desyncDetails.isDesynced) {
			if (desyncDetails.checksumMismatch) {
				recordChecksumMismatch();
			}
			return false;
		}

		resetChecksumMismatches();
		return true;
	}

	/**
	 * Clear sync error
	 */
	function clearError(): void {
		syncError = null;
	}

	return {
		// Reactive state (getters for Svelte 5 runes)
		get isSyncing() {
			return isSyncing;
		},
		get lastSyncTime() {
			return lastSyncTime;
		},
		get syncError() {
			return syncError;
		},
		get consecutiveChecksumMismatches() {
			return consecutiveChecksumMismatches;
		},
		get isDesynced() {
			return isDesynced;
		},
		get shouldAutoResync() {
			return consecutiveChecksumMismatches >= finalConfig.autoResyncThreshold;
		},

		// Methods
		syncOnReconnect,
		manualResync,
		recordChecksumMismatch,
		resetChecksumMismatches,
		validateSync,
		clearError
	};
}

// Export singleton instance
export const syncStateManager = createSyncStateManager();
