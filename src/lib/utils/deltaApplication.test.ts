import { describe, it, expect } from 'vitest';
import {
	applyDelta,
	isDeltaUpdate,
	isFullStateUpdate,
	parseStateUpdate
} from './deltaApplication';
import type { GameState } from '$lib/types/game';
import type { StateDelta } from './deltaApplication';

describe('DeltaApplication', () => {
	const mockState: GameState = {
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
		player1Score: 5,
		player2Score: 3,
		player1Ready: true,
		player2Ready: true,
		winner: null,
		lastAction: null,
		version: 1
	};

	describe('applyDelta', () => {
		it('should apply delta to state', async () => {
			const delta: StateDelta = {
				version: 2,
				baseVersion: 1,
				changes: {
					player1Score: 10,
					currentPlayer: 'player2'
				},
				timestamp: Date.now()
			};

			const result = await applyDelta(mockState, delta);

			expect(result.success).toBe(true);
			expect(result.state?.version).toBe(2);
			expect(result.state?.player1Score).toBe(10);
			expect(result.state?.currentPlayer).toBe('player2');
		});

		it('should reject delta with mismatched base version', async () => {
			const delta: StateDelta = {
				version: 3,
				baseVersion: 2, // Mismatch
				changes: { player1Score: 10 },
				timestamp: Date.now()
			};

			const result = await applyDelta(mockState, delta);

			expect(result.success).toBe(false);
			expect(result.error).toContain('Base version mismatch');
		});

		it('should handle state without version', async () => {
			const stateWithoutVersion = { ...mockState };
			delete stateWithoutVersion.version;

			const delta: StateDelta = {
				version: 1,
				baseVersion: 0,
				changes: { player1Score: 10 },
				timestamp: Date.now()
			};

			const result = await applyDelta(stateWithoutVersion, delta);

			expect(result.success).toBe(true);
			expect(result.state?.player1Score).toBe(10);
		});

		it('should preserve unchanged fields', async () => {
			const delta: StateDelta = {
				version: 2,
				baseVersion: 1,
				changes: { player1Score: 10 },
				timestamp: Date.now()
			};

			const result = await applyDelta(mockState, delta);

			expect(result.success).toBe(true);
			expect(result.state?.player2Score).toBe(3); // Unchanged
			expect(result.state?.roomId).toBe('TEST01'); // Unchanged
		});
	});

	describe('isDeltaUpdate', () => {
		it('should identify delta update message', () => {
			const message = {
				type: 'state_delta',
				delta: {
					version: 2,
					baseVersion: 1,
					changes: {},
					timestamp: Date.now()
				}
			};

			expect(isDeltaUpdate(message)).toBe(true);
		});

		it('should reject non-delta messages', () => {
			const message = {
				type: 'state_update',
				state: mockState
			};

			expect(isDeltaUpdate(message)).toBe(false);
		});

		it('should reject messages without delta', () => {
			const message = {
				type: 'state_delta'
			};

			expect(isDeltaUpdate(message)).toBe(false);
		});
	});

	describe('isFullStateUpdate', () => {
		it('should identify full state update message', () => {
			const message = {
				type: 'state_update',
				state: mockState
			};

			expect(isFullStateUpdate(message)).toBe(true);
		});

		it('should reject non-state-update messages', () => {
			const message = {
				type: 'state_delta',
				delta: {}
			};

			expect(isFullStateUpdate(message)).toBe(false);
		});

		it('should reject messages without state', () => {
			const message = {
				type: 'state_update'
			};

			expect(isFullStateUpdate(message)).toBe(false);
		});
	});

	describe('parseStateUpdate', () => {
		it('should parse delta update', () => {
			const delta: StateDelta = {
				version: 2,
				baseVersion: 1,
				changes: {},
				timestamp: Date.now()
			};

			const message = {
				type: 'state_delta',
				delta
			};

			const result = parseStateUpdate(message);

			expect(result.type).toBe('delta');
			expect(result.data).toEqual(delta);
		});

		it('should parse full state update', () => {
			const message = {
				type: 'state_update',
				state: mockState
			};

			const result = parseStateUpdate(message);

			expect(result.type).toBe('full');
			expect(result.data).toEqual(mockState);
		});

		it('should handle unknown message type', () => {
			const message = {
				type: 'unknown',
				data: {}
			};

			const result = parseStateUpdate(message);

			expect(result.type).toBe('unknown');
			expect(result.data).toBeUndefined();
		});
	});
});
