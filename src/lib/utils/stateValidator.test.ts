import { describe, it, expect } from 'vitest';
import {
	computeChecksum,
	validateChecksum,
	detectDesync,
	validateTransition,
	validateGameRules
} from './stateValidator';
import type { GameState } from '$lib/types/game';

describe('StateValidator', () => {
	const mockState: GameState = {
		roomId: 'TEST01',
		phase: 'round1',
		round: 1,
		players: [
			{ id: 'player1', name: 'Alice', score: 5, hand: [], captured: [] },
			{ id: 'player2', name: 'Bob', score: 3, hand: [], captured: [] }
		],
		tableCards: [],
		currentPlayer: 'player1',
		deck: new Array(40).fill(null),
		player1Hand: new Array(4).fill(null),
		player2Hand: new Array(4).fill(null),
		player1Captured: new Array(2).fill(null),
		player2Captured: new Array(2).fill(null),
		player1Score: 5,
		player2Score: 3,
		player1Ready: true,
		player2Ready: true,
		winner: null,
		lastAction: null,
		version: 1
	};

	describe('computeChecksum', () => {
		it('should compute checksum for state', async () => {
			const checksum = await computeChecksum(mockState);
			expect(checksum).toBeTruthy();
			expect(typeof checksum).toBe('string');
			expect(checksum.length).toBe(64); // SHA-256 hex string
		});

		it('should produce same checksum for same state', async () => {
			const checksum1 = await computeChecksum(mockState);
			const checksum2 = await computeChecksum(mockState);
			expect(checksum1).toBe(checksum2);
		});

		it('should produce different checksum for different state', async () => {
			const checksum1 = await computeChecksum(mockState);
			const modifiedState = { ...mockState, player1Score: 10 };
			const checksum2 = await computeChecksum(modifiedState);
			expect(checksum1).not.toBe(checksum2);
		});

		it('should handle state without version', async () => {
			const stateWithoutVersion = { ...mockState };
			delete stateWithoutVersion.version;
			const checksum = await computeChecksum(stateWithoutVersion);
			expect(checksum).toBeTruthy();
		});
	});

	describe('validateChecksum', () => {
		it('should validate correct checksum', async () => {
			const checksum = await computeChecksum(mockState);
			const isValid = await validateChecksum(mockState, checksum);
			expect(isValid).toBe(true);
		});

		it('should reject incorrect checksum', async () => {
			const isValid = await validateChecksum(mockState, 'invalid_checksum');
			expect(isValid).toBe(false);
		});
	});

	describe('detectDesync', () => {
		it('should detect no desync when states match', async () => {
			const serverState = { ...mockState, checksum: await computeChecksum(mockState) };
			const desync = await detectDesync(mockState, serverState);

			expect(desync.isDesynced).toBe(false);
			expect(desync.versionMismatch).toBe(false);
			expect(desync.checksumMismatch).toBe(false);
		});

		it('should detect version mismatch', async () => {
			const serverState = { ...mockState, version: 2 };
			const desync = await detectDesync(mockState, serverState);

			expect(desync.isDesynced).toBe(true);
			expect(desync.versionMismatch).toBe(true);
			expect(desync.localVersion).toBe(1);
			expect(desync.serverVersion).toBe(2);
		});

		it('should detect checksum mismatch', async () => {
			const serverState = {
				...mockState,
				player1Score: 10,
				checksum: await computeChecksum({ ...mockState, player1Score: 10 })
			};
			const desync = await detectDesync(mockState, serverState);

			expect(desync.isDesynced).toBe(true);
			expect(desync.checksumMismatch).toBe(true);
		});
	});

	describe('validateTransition', () => {
		it('should validate correct version increment', () => {
			const fromState = { ...mockState, version: 1 };
			const toState = { ...mockState, version: 2 };
			const result = validateTransition(fromState, toState);

			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject invalid version increment', () => {
			const fromState = { ...mockState, version: 1 };
			const toState = { ...mockState, version: 5 };
			const result = validateTransition(fromState, toState);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Invalid version increment: 1 -> 5');
		});

		it('should validate phase transitions', () => {
			const fromState = { ...mockState, phase: 'round1' as const };
			const toState = { ...mockState, phase: 'round2' as const, version: 2 };
			const result = validateTransition(fromState, toState);

			expect(result.valid).toBe(true);
		});

		it('should reject invalid phase transitions', () => {
			const fromState = { ...mockState, phase: 'round1' as const };
			const toState = { ...mockState, phase: 'waiting' as const, version: 2 };
			const result = validateTransition(fromState, toState);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('Invalid phase transition'))).toBe(true);
		});

		it('should validate card count', () => {
			const invalidState = {
				...mockState,
				deck: new Array(30).fill(null), // Wrong count
				version: 2
			};
			const result = validateTransition(mockState, invalidState);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('Invalid card count'))).toBe(true);
		});
	});

	describe('validateGameRules', () => {
		it('should validate correct game state', () => {
			const result = validateGameRules(mockState);
			expect(result.valid).toBe(true);
			expect(result.errors).toHaveLength(0);
		});

		it('should reject negative scores', () => {
			const invalidState = { ...mockState, player1Score: -5 };
			const result = validateGameRules(invalidState);

			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Scores cannot be negative');
		});

		it('should reject invalid current player', () => {
			const invalidState = { ...mockState, currentPlayer: 'invalid_player' };
			const result = validateGameRules(invalidState);

			expect(result.valid).toBe(false);
			expect(result.errors.some((e) => e.includes('Invalid current player'))).toBe(true);
		});

		it('should warn about empty hands with cards in deck', () => {
			const stateWithWarning = {
				...mockState,
				player1Hand: [],
				player2Hand: [],
				deck: new Array(10).fill(null)
			};
			const result = validateGameRules(stateWithWarning);

			expect(result.warnings.some((w) => w.includes('Both hands empty'))).toBe(true);
		});
	});
});
