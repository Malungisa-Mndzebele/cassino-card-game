/**
 * Centralized error handling utilities
 */

export interface AppError {
	code: string;
	message: string;
	userMessage: string;
	details?: any;
	timestamp: Date;
}

export class ErrorHandler {
	/**
	 * Convert any error to a user-friendly message
	 */
	static getUserMessage(error: unknown): string {
		if (error instanceof Error) {
			// API errors with specific messages
			if (error.message.includes('Player name already taken')) {
				return 'This player name is already in use. Please choose a different name.';
			}
			if (error.message.includes('Room is full')) {
				return 'This room is full. Please try joining a different room or create a new one.';
			}
			if (error.message.includes('Room not found')) {
				return 'Room not found. Please check the room code and try again.';
			}
			if (error.message.includes('Network error')) {
				return 'Network error. Please check your internet connection and try again.';
			}
			if (error.message.includes('Failed to fetch')) {
				return 'Unable to connect to the server. Please check your internet connection.';
			}

			// Return the error message if it's already user-friendly
			return error.message;
		}

		// Default fallback
		return 'An unexpected error occurred. Please try again.';
	}

	/**
	 * Log error for debugging
	 */
	static logError(error: unknown, context?: string): void {
		const timestamp = new Date().toISOString();
		const contextStr = context ? `[${context}]` : '';

		if (error instanceof Error) {
			console.error(`${timestamp} ${contextStr} Error:`, error.message);
			if (error.stack) {
				console.error('Stack trace:', error.stack);
			}
		} else {
			console.error(`${timestamp} ${contextStr} Unknown error:`, error);
		}
	}

	/**
	 * Create a structured error object
	 */
	static createError(
		code: string,
		message: string,
		userMessage: string,
		details?: any
	): AppError {
		return {
			code,
			message,
			userMessage,
			details,
			timestamp: new Date()
		};
	}

	/**
	 * Handle WebSocket errors
	 */
	static handleWebSocketError(error: Event | Error): string {
		if (error instanceof Error) {
			return this.getUserMessage(error);
		}
		return 'WebSocket connection error. Attempting to reconnect...';
	}

	/**
	 * Handle API errors with retry logic
	 */
	static shouldRetry(error: unknown, attemptNumber: number, maxAttempts: number): boolean {
		if (attemptNumber >= maxAttempts) {
			return false;
		}

		if (error instanceof Error) {
			// Retry on network errors
			if (
				error.message.includes('Network error') ||
				error.message.includes('Failed to fetch') ||
				error.message.includes('timeout')
			) {
				return true;
			}

			// Don't retry on client errors (4xx)
			if (error.message.includes('400') || error.message.includes('404')) {
				return false;
			}

			// Retry on server errors (5xx)
			if (error.message.includes('500') || error.message.includes('503')) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Get retry delay with exponential backoff
	 */
	static getRetryDelay(attemptNumber: number): number {
		return Math.min(1000 * Math.pow(2, attemptNumber), 10000);
	}
}

/**
 * Error types for categorization
 */
export enum ErrorType {
	NETWORK = 'NETWORK',
	VALIDATION = 'VALIDATION',
	AUTH = 'AUTH',
	NOT_FOUND = 'NOT_FOUND',
	SERVER = 'SERVER',
	UNKNOWN = 'UNKNOWN'
}

/**
 * Categorize error by type
 */
export function categorizeError(error: unknown): ErrorType {
	if (error instanceof Error) {
		const message = error.message.toLowerCase();

		if (message.includes('network') || message.includes('fetch')) {
			return ErrorType.NETWORK;
		}
		if (message.includes('invalid') || message.includes('validation')) {
			return ErrorType.VALIDATION;
		}
		if (message.includes('unauthorized') || message.includes('forbidden')) {
			return ErrorType.AUTH;
		}
		if (message.includes('not found') || message.includes('404')) {
			return ErrorType.NOT_FOUND;
		}
		if (message.includes('500') || message.includes('server error')) {
			return ErrorType.SERVER;
		}
	}

	return ErrorType.UNKNOWN;
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: unknown): {
	title: string;
	message: string;
	type: ErrorType;
} {
	const type = categorizeError(error);
	const message = ErrorHandler.getUserMessage(error);

	const titles: Record<ErrorType, string> = {
		[ErrorType.NETWORK]: 'Connection Error',
		[ErrorType.VALIDATION]: 'Invalid Input',
		[ErrorType.AUTH]: 'Authentication Error',
		[ErrorType.NOT_FOUND]: 'Not Found',
		[ErrorType.SERVER]: 'Server Error',
		[ErrorType.UNKNOWN]: 'Error'
	};

	return {
		title: titles[type],
		message,
		type
	};
}
