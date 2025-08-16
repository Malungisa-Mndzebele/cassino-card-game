import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Settings, BarChart3, Lightbulb, Volume2, VolumeX } from 'lucide-react';
const DEFAULT_PREFERENCES = {
    hintsEnabled: true,
    statisticsEnabled: true,
    soundEnabled: true,
    soundVolume: 0.5
};
export function GameSettings({ preferences, onPreferencesChange, statistics }) {
    const [isOpen, setIsOpen] = useState(false);
    const [showStats, setShowStats] = useState(false);
    const currentPreferences = {
        ...DEFAULT_PREFERENCES,
        ...preferences
    };
    const updatePreference = (key, value) => {
        onPreferencesChange({
            ...currentPreferences,
            [key]: value
        });
    };
    const resetStatistics = () => {
        if (confirm('Are you sure you want to reset all statistics? This cannot be undone.')) {
            const event = new CustomEvent('resetStatistics');
            window.dispatchEvent(event);
        }
    };
    const winRate = statistics ? (statistics.gamesWon / Math.max(1, statistics.gamesPlayed) * 100) : 0;
    return (_jsxs(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", "aria-label": "Open settings", children: [_jsx(Settings, { className: "h-4 w-4 mr-1" }), "Settings"] }) }), _jsxs(DialogContent, { className: "max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Game Settings" }), _jsxs(Button, { variant: "ghost", size: "sm", className: "absolute right-4 top-4", onClick: () => setIsOpen(false), "data-testid": "dialog-close-x", "aria-label": "Close settings dialog", children: [_jsx("span", { className: "sr-only", children: "Close" }), "\u00D7"] })] }), _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "font-medium", children: "Sound Effects" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [preferences.soundEnabled ? _jsx(Volume2, { className: "h-4 w-4" }) : _jsx(VolumeX, { className: "h-4 w-4" }), _jsx(Label, { htmlFor: "sound-enabled", children: "Enable Sounds" })] }), _jsx(Switch, { id: "sound-enabled", role: "switch", "aria-label": "Enable sound effects", checked: preferences.soundEnabled, onCheckedChange: (checked) => updatePreference('soundEnabled', checked) })] }), preferences.soundEnabled && (_jsxs("div", { className: "pl-6", children: [_jsxs(Label, { htmlFor: "volume", children: ["Volume: ", Math.round(preferences.soundVolume * 100), "%"] }), _jsx("input", { id: "volume", type: "range", min: "0", max: "1", step: "0.1", value: preferences.soundVolume, onChange: (e) => updatePreference('soundVolume', parseFloat(e.target.value)), className: "w-full mt-1", "aria-label": "Sound volume" })] }))] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "font-medium", children: "Gameplay Assistance" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(Lightbulb, { className: "h-4 w-4" }), _jsx(Label, { htmlFor: "hints-enabled", children: "Show Hints" })] }), _jsx(Switch, { id: "hints-enabled", role: "switch", "aria-label": "Enable gameplay hints", checked: preferences.hintsEnabled, onCheckedChange: (checked) => updatePreference('hintsEnabled', checked) })] })] }), _jsxs("div", { className: "space-y-3", children: [_jsx("h3", { className: "font-medium", children: "Statistics" }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(BarChart3, { className: "h-4 w-4" }), _jsx(Label, { htmlFor: "stats-enabled", children: "Track Statistics" })] }), _jsx(Switch, { id: "stats-enabled", role: "switch", "aria-label": "Enable statistics tracking", checked: preferences.statisticsEnabled, onCheckedChange: (checked) => updatePreference('statisticsEnabled', checked) })] }), preferences.statisticsEnabled && statistics && (_jsxs("div", { className: "pl-6 space-y-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowStats(!showStats), children: [showStats ? 'Hide' : 'Show', " Stats"] }), showStats && (_jsxs("div", { className: "bg-muted rounded-lg p-3 space-y-2", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 text-xs", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Games Played" }), _jsx(Badge, { variant: "secondary", children: statistics.gamesPlayed })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Win Rate" }), _jsxs(Badge, { variant: "default", children: [winRate.toFixed(1), "%"] })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Best Score" }), _jsxs(Badge, { variant: "secondary", children: [statistics.bestScore, "/11"] })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Avg Score" }), _jsx(Badge, { variant: "secondary", children: statistics.averageScore.toFixed(1) })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Win Streak" }), _jsx(Badge, { variant: "default", children: statistics.currentWinStreak })] }), _jsxs("div", { children: [_jsx("p", { className: "font-medium", children: "Best Streak" }), _jsx(Badge, { variant: "secondary", children: statistics.longestWinStreak })] })] }), _jsx(Button, { variant: "destructive", size: "sm", onClick: resetStatistics, children: "Reset Statistics" })] }))] }))] })] }), _jsx("div", { className: "mt-6 flex justify-end", children: _jsx(Button, { onClick: () => setIsOpen(false), "data-testid": "dialog-close", children: "Close" }) })] })] }));
}
// Hook for managing preferences
function useGamePreferences(defaultPreferences) {
    const [preferences, setPreferences] = useState(defaultPreferences || {
        hintsEnabled: false,
        statisticsEnabled: false,
        soundEnabled: true,
        soundVolume: 0.7
    });
    useEffect(() => {
        let saved = null;
        try {
            saved = localStorage.getItem('cassino-preferences');
        }
        catch (e) {
            console.error('Failed to access localStorage for preferences:', e);
        }
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPreferences({ ...preferences, ...parsed });
            }
            catch (e) {
                console.error('Failed to load preferences:', e);
            }
        }
    }, []);
    const updatePreferences = (newPreferences) => {
        setPreferences(newPreferences);
        try {
            localStorage.setItem('cassino-preferences', JSON.stringify(newPreferences));
        }
        catch (e) {
            console.error('Failed to save preferences to localStorage:', e);
        }
    };
    return [preferences, updatePreferences];
}
// Hook for managing statistics
function useGameStatistics() {
    const [statistics, setStatistics] = useState({
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0,
        totalScore: 0,
        bestScore: 0,
        averageScore: 0,
        longestWinStreak: 0,
        currentWinStreak: 0,
        captureRate: 0,
        buildRate: 0
    });
    useEffect(() => {
        let saved = null;
        try {
            saved = localStorage.getItem('cassino-statistics');
        }
        catch (e) {
            console.error('Failed to access localStorage for statistics:', e);
        }
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setStatistics({ ...statistics, ...parsed });
            }
            catch (e) {
                console.error('Failed to load statistics:', e);
            }
        }
        const handleReset = () => {
            const defaultStats = {
                gamesPlayed: 0,
                gamesWon: 0,
                gamesLost: 0,
                totalScore: 0,
                bestScore: 0,
                averageScore: 0,
                longestWinStreak: 0,
                currentWinStreak: 0,
                captureRate: 0,
                buildRate: 0
            };
            setStatistics(defaultStats);
            localStorage.setItem('cassino-statistics', JSON.stringify(defaultStats));
        };
        window.addEventListener('resetStatistics', handleReset);
        return () => window.removeEventListener('resetStatistics', handleReset);
    }, []);
    const updateStatistics = (update) => {
        const newStats = { ...statistics, ...update };
        if (newStats.gamesPlayed > 0) {
            newStats.averageScore = newStats.totalScore / newStats.gamesPlayed;
        }
        setStatistics(newStats);
        try {
            localStorage.setItem('cassino-statistics', JSON.stringify(newStats));
        }
        catch (e) {
            console.error('Failed to save statistics to localStorage:', e);
        }
    };
    const reset = () => {
        const defaultStats = {
            gamesPlayed: 0,
            gamesWon: 0,
            gamesLost: 0,
            totalScore: 0,
            bestScore: 0,
            averageScore: 0,
            longestWinStreak: 0,
            currentWinStreak: 0,
            captureRate: 0,
            buildRate: 0
        };
        setStatistics(defaultStats);
        try {
            localStorage.setItem('cassino-statistics', JSON.stringify(defaultStats));
        }
        catch (e) {
            console.error('Failed to reset statistics in localStorage:', e);
        }
    };
    return [statistics, updateStatistics, reset];
}
export { useGamePreferences, useGameStatistics };
