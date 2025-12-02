import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSyncStateManager } from './syncState.svelte';
import type { GameState } from '$lib/types/game';
import type { SyncResult } from './syncState.svelte';

describe('SyncStateManager', () => {
	let manager: ReturnType<typeof createSyncStateManager>;
	let mockState: GameState;

	beforeEach(() => {
		manager = createSyncStateManager({ autoResyncThreshold: 3 });
		mockState = {
			roomId: 'TEST01',
			phase: 'round1',
			round: 1,
			players: [],
			tableCards: [],
			currentPlayer: 'player1',
			deck: [],
			player1Hand: [],
			player2Hand: [],
			player1Captured: [],
			player2Captured: [],
			player1Score: 0,
			player2Score: 0,
			player1Ready: false,
			player2Ready: false,
			winner: null,
			lastAction: null,
			version: 1
		};
	});

	it('should initialize with default state', () => {
		expect(manager.isSyncing).toBe(false);
		expect(manager.lastSyncTime).toBeNull();
		expect(manager.syncError).toBeNull();
		expect(manager.consecutiveChecksumMismatches).toBe(0);
		expect(manager.isDesynced).toBe(false);
	});

	describe('syncOnReconnect', () => {
		it('should sync successfully', async () => {
			const fetchFn = vi.fn().mockResolvedValue({
				success: true,
				currentVersion: 2,
				clientVersion: 1,
				state: mockState,
				requiresFullSync: false
			} as SyncResult);

			const result = await manager.syncOnReconnect('TEST01', mockState, fetchFn);

			expect(result.success).toBe(true);
			expect(manager.isSyncing).toBe(false);
			expect(manager.lastSyncTime).toBeTruthy();
			expect(manager.consecutiveChecksumMismatches).toBe(0);
			expect(manager.isDesynced).toBe(false);
		});

		it('should handle sync failure', async () => {
			const fetchFn = vi.fn().mockResolvedValue({
				success: false,
				currentVersion: 0,
				clientVersion: 1,
				requiresFullSync: false,
				error: 'Sync failed'
			} as SyncResult);

			const result = await manager.syncOnReconnect('TEST01', mockState, fetchFn);

			expect(result.success).toBe(false);
			expect(manager.syncError).toBe('Sync failed');
		});

		it('should prevent concurrent syncs', async () => {
			const fetchFn = vi.fn().mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			const promise1 = manager.syncOnReconnect('TEST01', mockState, fetchFn);
			const promise2 = manager.syncOnReconnect('TEST01', mockState, fetchFn);

			const result2 = await promise2;
			expect(result2.success).toBe(false);
			expect(result2.error).toBe('Sync already in progress');

			await promise1;
		});

		it('should handle fetch errors', async () => {
			const fetchFn = vi.fn().mockRejectedValue(new Error('Network error'));

			const result = await manager.syncOnReconnect('TEST01', mockState, fetchFn);

			expect(result.success).toBe(false);
			expect(manager.syncError).toBe('Network error');
		});
	});

	describe('manualResync', () => {
		it('should perform manual resync', async () => {
			const fetchFn = vi.fn().mockResolvedValue(mockState);

			const result = await manager.manualResync('TEST01', fetchFn);

			expect(result).toEqual(mockState);
			expect(manager.lastSyncTime).toBeTruthy();
			expect(manager.consecutiveChecksumMismatches).toBe(0);
			expect(manager.isDesynced).toBe(false);
		});

		it('should throw error on manual resync failure', async () => {
			const fetchFn = vi.fn().mockRejectedValue(new Error('Fetch failed'));

			await expect(manager.manualResync('TEST01', fetchFn)).rejects.toThrow('Fetch failed');
			expect(manager.syncError).toBe('Fetch failed');
		});

		it('should prevent concurrent manual resyncs', async () => {
			const fetchFn = vi.fn().mockImplementation(
				() => new Promise((resolve) => setTimeout(resolve, 100))
			);

			const promise1 = manager.manualResync('TEST01', fetchFn);

			await expect(manager.manualResync('TEST01', fetchFn)).rejects.toThrow(
				'Sync already in progress'
			);

			await promise1;
		});
	});

	describe('checksum mismatch tracking', () => {
		it('should record checksum mismatches', () => {
			expect(manager.consecutiveChecksumMismatches).toBe(0);

			manager.recordChecksumMismatch();
			expect(manager.consecutiveChecksumMismatches).toBe(1);

			manager.recordChecksumMismatch();
			expect(manager.consecutiveChecksumMismatches).toBe(2);
		});

		it('should trigger desync after threshold', () => {
			expect(manager.isDesynced).toBe(false);

			manager.recordChecksumMismatch();
			manager.recordChecksumMismatch();
			expect(manager.isDesynced).toBe(false);

			manager.recordChecksumMismatch();
			expect(manager.isDesynced).toBe(true);
			expect(manager.shouldAutoResync).toBe(true);
		});

		it('should reset checksum mismatches', () => {
			manager.recordChecksumMismatch();
			manager.recordChecksumMismatch();
			expect(manager.consecutiveChecksumMismatches).toBe(2);

			manager.resetChecksumMismatches();
			expect(manager.consecutiveChecksumMismatches).toBe(0);
			expect(manager.isDesynced).toBe(false);
		});
	});

	describe('validateSync', () => {
		it('should validate matching states', async () => {
			const serverState = { ...mockState };
			const isValid = await manager.validateSync(mockState, serverState);

			expect(isValid).toBe(true);
			expect(manager.consecutiveChecksumMismatches).toBe(0);
		});

		it('should detect version mismatch', async () => {
			const serverState = { ...mockState, version: 2 };
			const isValid = await manager.validateSync(mockState, serverState);

			expect(isValid).toBe(false);
		});

		it('should record checksum mismatch', async () => {
			const serverState = { ...mockState, player1Score: 10 };
			const isValid = await manager.validateSync(mockState, serverState);

			expect(isValid).toBe(false);
			expect(manager.consecutiveChecksumMismatches).toBe(1);
		});
	});

	it('should clear sync error', async () => {
		// Trigger an error by failing a sync
		const fetchFn = vi.fn().mockRejectedValue(new Error('Test error'));
		await manager.syncOnReconnect('TEST01', mockState, fetchFn);
		
		expect(manager.syncError).toBe('Test error');

		manager.clearError();
		expect(manager.syncError).toBeNull();
	});
});
