import type { Card } from '$types/game';

/**
 * Format a card for display (e.g., "A♠", "10♥")
 */
export function formatCard(card: Card): string {
    return `${card.rank}${card.suit}`;
}

/**
 * Get the color of a card suit
 */
export function getCardColor(suit: string): 'red' | 'black' {
    return ['♥', '♦'].includes(suit) ? 'red' : 'black';
}

/**
 * Calculate the value of a card for game logic
 */
export function getCardValue(rank: string): number {
    if (rank === 'A') return 1;
    if (['J', 'Q', 'K'].includes(rank)) return 10;
    return parseInt(rank, 10);
}

/**
 * Check if cards can be captured with a given card
 */
export function canCapture(playCard: Card, tableCards: Card[]): boolean {
    // Single card capture
    if (tableCards.some((tc) => tc.value === playCard.value)) {
        return true;
    }

    // Multiple card capture (sum equals play card value)
    // This is a simplified check - full implementation would need combination logic
    const sum = tableCards.reduce((acc, card) => acc + card.value, 0);
    return sum === playCard.value;
}

/**
 * Format a score with proper pluralization
 */
export function formatScore(score: number): string {
    return `${score} point${score !== 1 ? 's' : ''}`;
}

/**
 * Get a player's position label
 */
export function getPlayerPosition(isPlayer1: boolean): string {
    return isPlayer1 ? 'Player 1' : 'Player 2';
}

/**
 * Format elapsed time (e.g., "2m 30s")
 */
export function formatElapsedTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    return function executedFunction(...args: Parameters<T>) {
        const later = () => {
            timeout = null;
            func(...args);
        };

        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;

    return function executedFunction(...args: Parameters<T>) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        }
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        const success = document.execCommand('copy');
        document.body.removeChild(textArea);
        return success;
    } catch (error) {
        console.error('Failed to copy to clipboard:', error);
        return false;
    }
}

/**
 * Generate a random room code
 */
export function generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
