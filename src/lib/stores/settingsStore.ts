/**
 * Settings Store
 * 
 * Manages game settings with localStorage persistence.
 * Includes sound effects, music, animations, and theme preferences.
 */

import { writable, derived } from 'svelte/store';
import { browser } from '$app/environment';

// Settings interface
export interface GameSettings {
    soundEffects: boolean;
    music: boolean;
    musicVolume: number; // 0-100
    sfxVolume: number; // 0-100
    animationSpeed: 'slow' | 'normal' | 'fast';
    theme: 'dark' | 'light' | 'auto';
    showHints: boolean;
    autoSort: boolean;
    confirmActions: boolean;
}

// Default settings
const defaultSettings: GameSettings = {
    soundEffects: true,
    music: false,
    musicVolume: 50,
    sfxVolume: 70,
    animationSpeed: 'normal',
    theme: 'dark',
    showHints: true,
    autoSort: true,
    confirmActions: false
};

// Storage key
const STORAGE_KEY = 'cassino_settings';

// Load settings from localStorage
function loadSettings(): GameSettings {
    if (!browser) return defaultSettings;

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            return { ...defaultSettings, ...parsed };
        }
    } catch (error) {
        console.error('Failed to load settings:', error);
    }

    return defaultSettings;
}

// Save settings to localStorage
function saveSettings(settings: GameSettings): void {
    if (!browser) return;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Create the settings store
function createSettingsStore() {
    const { subscribe, set, update } = writable<GameSettings>(loadSettings());

    return {
        subscribe,

        // Update a single setting
        updateSetting: <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
            update(settings => {
                const newSettings = { ...settings, [key]: value };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        // Toggle boolean settings
        toggleSoundEffects: () => {
            update(settings => {
                const newSettings = { ...settings, soundEffects: !settings.soundEffects };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        toggleMusic: () => {
            update(settings => {
                const newSettings = { ...settings, music: !settings.music };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        toggleHints: () => {
            update(settings => {
                const newSettings = { ...settings, showHints: !settings.showHints };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        toggleAutoSort: () => {
            update(settings => {
                const newSettings = { ...settings, autoSort: !settings.autoSort };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        toggleConfirmActions: () => {
            update(settings => {
                const newSettings = { ...settings, confirmActions: !settings.confirmActions };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        // Set volume (0-100)
        setMusicVolume: (volume: number) => {
            const clamped = Math.max(0, Math.min(100, volume));
            update(settings => {
                const newSettings = { ...settings, musicVolume: clamped };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        setSfxVolume: (volume: number) => {
            const clamped = Math.max(0, Math.min(100, volume));
            update(settings => {
                const newSettings = { ...settings, sfxVolume: clamped };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        // Set animation speed
        setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => {
            update(settings => {
                const newSettings = { ...settings, animationSpeed: speed };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        // Set theme
        setTheme: (theme: 'dark' | 'light' | 'auto') => {
            update(settings => {
                const newSettings = { ...settings, theme };
                saveSettings(newSettings);
                return newSettings;
            });
        },

        // Reset to defaults
        reset: () => {
            saveSettings(defaultSettings);
            set(defaultSettings);
        }
    };
}

// Export the settings store
export const settingsStore = createSettingsStore();

// Derived stores for convenience
export const soundEnabled = derived(
    settingsStore,
    $settings => $settings.soundEffects
);

export const musicEnabled = derived(
    settingsStore,
    $settings => $settings.music
);

export const hintsEnabled = derived(
    settingsStore,
    $settings => $settings.showHints
);

export const animationDuration = derived(
    settingsStore,
    $settings => {
        switch ($settings.animationSpeed) {
            case 'slow': return 600;
            case 'fast': return 200;
            default: return 400;
        }
    }
);

// Apply theme to document
if (browser) {
    settingsStore.subscribe(settings => {
        const root = document.documentElement;

        if (settings.theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            root.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            root.setAttribute('data-theme', settings.theme);
        }
    });
}
