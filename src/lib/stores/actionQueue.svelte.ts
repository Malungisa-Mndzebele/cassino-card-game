/**
 * Action Queue
 * 
 * Buffers game actions during network delays and retries failed actions.
 * Maintains action order and handles queue overflow.
 * 
 * Uses Svelte 5 runes for reactivity.
 */

import type { GameAction } from '$lib/types/game';

export interface QueuedAction {
	id: string;
	action: GameAction;
	timestamp: number;
	retryCount: number;
	maxRetries: number;
}

interface ActionQueueConfig {
	maxQueueSize: number;
	maxRetries: number;
	baseRetryDelay: number; // milliseconds
}

const DEFAULT_CONFIG: ActionQueueConfig = {
	maxQueueSize: 10,
	maxRetries: 3,
	baseRetryDelay: 1000 // 1 second
};

/**
 * Creates an action queue manager
 */
export function createActionQueue(config: Partial<ActionQueueConfig> = {}) {
	const finalConfig = { ...DEFAULT_CONFIG, ...config };

	// Reactive state using Svelte 5 runes
	let queue = $state<QueuedAction[]>([]);
	let isProcessing = $state(false);
	let lastError = $state<string | null>(null);

	/**
	 * Generate unique action ID
	 */
	function generateActionId(): string {
		return `queued_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
	}

	/**
	 * Delay for specified milliseconds
	 */
	function delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	/**
	 * Enqueue an action
	 */
	function enqueue(action: GameAction, sendFn: (action: GameAction) => Promise<void>): string {
		if (queue.length >= finalConfig.maxQueueSize) {
			throw new Error(
				`Queue is full (${finalConfig.maxQueueSize} actions). Please wait for actions to process.`
			);
		}

		const actionId = generateActionId();

		queue.push({
			id: actionId,
			action,
			timestamp: Date.now(),
			retryCount: 0,
			maxRetries: finalConfig.maxRetries
		});

		// Trigger flush if not already processing
		if (!isProcessing) {
			flush(sendFn);
		}

		return actionId;
	}

	/**
	 * Dequeue the first action
	 */
	function dequeue(): QueuedAction | null {
		if (queue.length === 0) return null;
		return queue.shift() || null;
	}

	/**
	 * Flush the queue by sending all actions
	 */
	async function flush(sendFn: (action: GameAction) => Promise<void>): Promise<void> {
		if (isProcessing || queue.length === 0) return;

		isProcessing = true;
		lastError = null;

		while (queue.length > 0) {
			const queuedAction = queue[0];

			try {
				// Send action to server
				await sendFn(queuedAction.action);

				// Success - remove from queue
				queue.shift();
			} catch (error) {
				// Failure - increment retry count
				queuedAction.retryCount++;

				if (queuedAction.retryCount >= queuedAction.maxRetries) {
					// Max retries reached - remove from queue
					queue.shift();
					lastError = `Action failed after ${queuedAction.maxRetries} retries: ${error}`;
					console.error(lastError);
				} else {
					// Retry with exponential backoff
					const delayMs = finalConfig.baseRetryDelay * Math.pow(2, queuedAction.retryCount);
					console.warn(
						`Action failed, retrying in ${delayMs}ms (attempt ${queuedAction.retryCount}/${queuedAction.maxRetries})`
					);
					await delay(delayMs);
				}
			}
		}

		isProcessing = false;
	}

	/**
	 * Clear all queued actions
	 */
	function clear(): void {
		queue = [];
		lastError = null;
	}

	/**
	 * Get queue size
	 */
	function size(): number {
		return queue.length;
	}

	/**
	 * Check if queue is full
	 */
	function isFull(): boolean {
		return queue.length >= finalConfig.maxQueueSize;
	}

	/**
	 * Check if queue is empty
	 */
	function isEmpty(): boolean {
		return queue.length === 0;
	}

	/**
	 * Get warning threshold (80% of max size)
	 */
	function isNearFull(): boolean {
		return queue.length >= finalConfig.maxQueueSize * 0.8;
	}

	return {
		// Reactive state (getters for Svelte 5 runes)
		get queue() {
			return queue;
		},
		get isProcessing() {
			return isProcessing;
		},
		get lastError() {
			return lastError;
		},
		get size() {
			return queue.length;
		},
		get isFull() {
			return queue.length >= finalConfig.maxQueueSize;
		},
		get isEmpty() {
			return queue.length === 0;
		},
		get isNearFull() {
			return queue.length >= finalConfig.maxQueueSize * 0.8;
		},

		// Methods
		enqueue,
		dequeue,
		flush,
		clear,

		// Config
		maxQueueSize: finalConfig.maxQueueSize
	};
}

// Export singleton instance
export const actionQueue = createActionQueue();
