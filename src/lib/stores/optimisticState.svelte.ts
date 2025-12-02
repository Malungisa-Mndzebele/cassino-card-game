/**
 * Optimistic State Manager
 * 
 * Manages optimistic updates for game actions, providing immediate UI feedback
 * while waiting for server confirmation. Handles rollback on rejection.
 * 
 * Uses Svelte 5 runes for reactivity.
 */

import type { GameState, GameAction } from '$lib/types/game';

export interface PendingAction {
	id: string;
	action: GameAction;
	localVersion: number;
	timestamp: number;
	status: 'pending' | 'confirmed' | 'rejected';
}

interface OptimisticStateConfig {
	maxPendingActions: number;
}

const DEFAULT_CONFIG: OptimisticStateConfig = {
	maxPendingActions: 10
};

/**
 * Creates an optimistic state manager
 */
export function createOptimisticStateManager(config: Partial<OptimisticStateConfig> = {}) {
	const finalConfig = { ...DEFAULT_CONFIG, ...config };

	// Reactive state using Svelte 5 runes
	let localState = $state<GameState | null>(null);
	let pendingActions = $state<PendingAction[]>([]);
	let stateVersion = $state(0);
	let confirmedState = $state<GameState | null>(null); // Last confirmed state for rollback

	/**
	 * Generate unique action ID
	 */
	function generateActionId(): string {
		return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Apply an action optimistically to local state
	 */
	function applyOptimistic(action: GameAction, applyFn: (state: GameState) => GameState): string {
		if (!localState) {
			throw new Error('Cannot apply optimistic update: no local state');
		}

		if (pendingActions.length >= finalConfig.maxPendingActions) {
			throw new Error('Too many pending actions. Please wait for confirmation.');
		}

		// Generate unique action ID
		const actionId = generateActionId();

		// Save current state as confirmed state if this is the first pending action
		if (pendingActions.length === 0) {
			confirmedState = JSON.parse(JSON.stringify(localState));
		}

		// Apply action to local state immediately
		const newState = applyFn(localState);

		// Increment local version
		const newVersion = stateVersion + 1;

		// Store as pending
		pendingActions.push({
			id: actionId,
			action,
			localVersion: newVersion,
			timestamp: Date.now(),
			status: 'pending'
		});

		// Update UI immediately (reactive)
		localState = newState;
		stateVersion = newVersion;

		return actionId;
	}

	/**
	 * Confirm an action with server state
	 */
	function confirmAction(actionId: string, serverState: GameState): void {
		const actionIndex = pendingActions.findIndex((a) => a.id === actionId);

		if (actionIndex === -1) {
			console.warn(`Action ${actionId} not found in pending actions`);
			return;
		}

		// Mark as confirmed
		pendingActions[actionIndex].status = 'confirmed';

		// Update local state to match server
		localState = serverState;
		stateVersion = serverState.version || stateVersion;

		// Update confirmed state
		confirmedState = JSON.parse(JSON.stringify(serverState));

		// Remove confirmed action
		pendingActions.splice(actionIndex, 1);

		// If no more pending actions, clear confirmed state
		if (pendingActions.length === 0) {
			confirmedState = null;
		}
	}

	/**
	 * Reject an action and rollback
	 */
	function rejectAction(actionId: string, reason: string): void {
		const actionIndex = pendingActions.findIndex((a) => a.id === actionId);

		if (actionIndex === -1) {
			console.warn(`Action ${actionId} not found in pending actions`);
			return;
		}

		// Mark as rejected
		pendingActions[actionIndex].status = 'rejected';

		// Rollback to last confirmed state
		if (confirmedState) {
			localState = JSON.parse(JSON.stringify(confirmedState));
			stateVersion = confirmedState.version || stateVersion;
		}

		// Remove rejected action
		pendingActions.splice(actionIndex, 1);

		// Clear all pending actions on rejection (conservative approach)
		pendingActions = [];
		confirmedState = null;

		console.warn(`Action ${actionId} rejected: ${reason}`);
	}

	/**
	 * Rollback to a specific version
	 */
	function rollbackTo(version: number): void {
		if (confirmedState && (confirmedState.version || 0) === version) {
			localState = JSON.parse(JSON.stringify(confirmedState));
			stateVersion = version;
			pendingActions = [];
			confirmedState = null;
		} else {
			console.warn(`Cannot rollback to version ${version}: no confirmed state at that version`);
		}
	}

	/**
	 * Set the base state (from server)
	 */
	function setState(state: GameState): void {
		localState = state;
		stateVersion = state.version || 0;
		confirmedState = JSON.parse(JSON.stringify(state));
		pendingActions = [];
	}

	/**
	 * Clear all pending actions
	 */
	function clearPending(): void {
		pendingActions = [];
		confirmedState = null;
	}

	/**
	 * Check if there are pending actions
	 */
	function hasPending(): boolean {
		return pendingActions.length > 0;
	}

	return {
		// Reactive state (getters for Svelte 5 runes)
		get localState() {
			return localState;
		},
		get pendingActions() {
			return pendingActions;
		},
		get stateVersion() {
			return stateVersion;
		},
		get hasPending() {
			return pendingActions.length > 0;
		},

		// Methods
		applyOptimistic,
		confirmAction,
		rejectAction,
		rollbackTo,
		setState,
		clearPending
	};
}

// Export singleton instance
export const optimisticStateManager = createOptimisticStateManager();
