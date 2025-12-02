import { describe, it, expect, beforeEach } from 'vitest';
import { createOptimisticStateManager } from './optimisticState.svelte';
import type { GameState, GameAction } from '$lib/types/game';

describe('OptimisticStateManager', () => {
	let manager: ReturnType<typeof createOptimisticStateManager>;
	let mockState: GameState;

	beforeEach(() => {
		manager = createOptimisticStateManager();
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
			version: 1,
			checksum: 'abc123'
		};
		manager.setState(mockState);
	});

	it('should initialize with null state', () => {
		const newManager = createOptimisticStateManager();
		expect(newManager.localState).toBeNull();
		expect(newManager.stateVersion).toBe(0);
		expect(newManager.pendingActions).toEqual([]);
	});

	it('should set initial state', () => {
		expect(manager.localState).toEqual(mockState);
		expect(manager.stateVersion).toBe(1);
	});

	it('should apply optimistic update', () => {
		const action: GameAction = {
			type: 'capture',
			playerId: 'player1',
			card: { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 1 },
			timestamp: Date.now()
		};

		const actionId = manager.applyOptimistic(action, (state) => ({
			...state,
			player1Score: state.player1Score + 1,
			version: (state.version || 0) + 1
		}));

		expect(actionId).toBeTruthy();
		expect(manager.localState?.player1Score).toBe(1);
		expect(manager.stateVersion).toBe(2);
		expect(manager.pendingActions).toHaveLength(1);
		expect(manager.pendingActions[0].status).toBe('pending');
	});

	it('should confirm optimistic update', () => {
		const action: GameAction = {
			type: 'capture',
			playerId: 'player1',
			card: { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 1 },
			timestamp: Date.now()
		};

		const actionId = manager.applyOptimistic(action, (state) => ({
			...state,
			player1Score: state.player1Score + 1
		}));

		const serverState = { ...mockState, player1Score: 1, version: 2 };
		manager.confirmAction(actionId, serverState);

		expect(manager.pendingActions).toHaveLength(0);
		expect(manager.localState?.player1Score).toBe(1);
	});

	it('should reject optimistic update and rollback', () => {
		const action: GameAction = {
			type: 'capture',
			playerId: 'player1',
			card: { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 1 },
			timestamp: Date.now()
		};

		const actionId = manager.applyOptimistic(action, (state) => ({
			...state,
			player1Score: state.player1Score + 1
		}));

		expect(manager.localState?.player1Score).toBe(1);

		manager.rejectAction(actionId, 'Invalid action');

		expect(manager.pendingActions).toHaveLength(0);
		expect(manager.localState?.player1Score).toBe(0); // Rolled back
	});

	it('should throw error when applying optimistic update without state', () => {
		const newManager = createOptimisticStateManager();
		const action: GameAction = {
			type: 'capture',
			playerId: 'player1',
			card: { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 1 },
			timestamp: Date.now()
		};

		expect(() => {
			newManager.applyOptimistic(action, (state) => state);
		}).toThrow('Cannot apply optimistic update: no local state');
	});

	it('should throw error when queue is full', () => {
		const action: GameAction = {
			type: 'capture',
			playerId: 'player1',
			card: { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 1 },
			timestamp: Date.now()
		};

		// Fill queue to max (10 actions)
		for (let i = 0; i < 10; i++) {
			manager.applyOptimistic(action, (state) => state);
		}

		expect(() => {
			manager.applyOptimistic(action, (state) => state);
		}).toThrow('Too many pending actions');
	});

	it('should clear pending actions', () => {
		const action: GameAction = {
			type: 'capture',
			playerId: 'player1',
			card: { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 1 },
			timestamp: Date.now()
		};

		manager.applyOptimistic(action, (state) => state);
		expect(manager.pendingActions).toHaveLength(1);

		manager.clearPending();
		expect(manager.pendingActions).toHaveLength(0);
	});

	it('should track hasPending correctly', () => {
		expect(manager.pendingActions.length > 0).toBe(false);

		const action: GameAction = {
			type: 'capture',
			playerId: 'player1',
			card: { id: 'A_hearts', rank: 'A', suit: 'hearts', value: 1 },
			timestamp: Date.now()
		};

		const actionId = manager.applyOptimistic(action, (state) => state);
		expect(manager.pendingActions.length > 0).toBe(true);

		manager.confirmAction(actionId, mockState);
		expect(manager.pendingActions.length > 0).toBe(false);
	});
});
