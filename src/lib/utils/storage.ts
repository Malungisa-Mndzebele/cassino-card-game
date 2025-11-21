/**
 * LocalStorage utility with type safety and error handling
 */

export class Storage {
    /**
     * Get item from localStorage with type safety
     */
    static get<T>(key: string, defaultValue: T): T {
        if (typeof window === 'undefined') return defaultValue;

        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error reading from localStorage (${key}):`, error);
            return defaultValue;
        }
    }

    /**
     * Set item in localStorage
     */
    static set<T>(key: string, value: T): boolean {
        if (typeof window === 'undefined') return false;

        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`Error writing to localStorage (${key}):`, error);
            return false;
        }
    }

    /**
     * Remove item from localStorage
     */
    static remove(key: string): boolean {
        if (typeof window === 'undefined') return false;

        try {
            window.localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error(`Error removing from localStorage (${key}):`, error);
            return false;
        }
    }

    /**
     * Clear all items from localStorage
     */
    static clear(): boolean {
        if (typeof window === 'undefined') return false;

        try {
            window.localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Check if key exists in localStorage
     */
    static has(key: string): boolean {
        if (typeof window === 'undefined') return false;

        try {
            return window.localStorage.getItem(key) !== null;
        } catch (error) {
            console.error(`Error checking localStorage (${key}):`, error);
            return false;
        }
    }
}

// Storage keys constants
export const STORAGE_KEYS = {
    PLAYER_NAME: 'cassino_player_name',
    SETTINGS: 'cassino_settings',
    STATISTICS: 'cassino_statistics',
    LAST_ROOM: 'cassino_last_room',
    SOUND_ENABLED: 'cassino_sound_enabled',
    SOUND_VOLUME: 'cassino_sound_volume'
} as const;
