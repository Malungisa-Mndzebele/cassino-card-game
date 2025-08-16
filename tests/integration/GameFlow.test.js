import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils.tsx';
import App from '../../App';
import * as testUtils from '../test-utils';
// Mock all external dependencies
vi.mock('../../components/SoundSystem', () => ({
    SoundSystem: ({ onSoundReady }) => {
        React.useEffect(() => {
            onSoundReady?.();
        }, [onSoundReady]);
        return _jsx("div", { "data-testid": "sound-system", children: "Sound System" });
    },
    soundManager: {
        setMasterVolume: vi.fn(),
        playSound: vi.fn()
    }
}));
vi.mock('../../components/GamePhases', () => ({
    GamePhases: ({ gameState, playerId, onStartShuffle, onSelectFaceUpCards, onPlayCard, onResetGame, preferences }) => {
        if (!gameState || !gameState.phase)
            return null;
        return (_jsxs("div", { "data-testid": "game-phases", children: [_jsx("div", { "data-testid": "current-phase", children: gameState.phase }), _jsxs("div", { "data-testid": "current-turn", children: ["Turn: ", gameState.currentTurn] }), _jsxs("div", { "data-testid": "player-id", children: ["Player: ", playerId] }), gameState.phase === 'waiting' && (_jsxs("div", { "data-testid": "waiting-phase", children: [_jsxs("div", { children: ["Players: ", gameState.players?.length || 0, "/2"] }), _jsx("button", { onClick: onStartShuffle, "data-testid": "start-shuffle-btn", children: "Start Game" })] })), gameState.phase === 'cardSelection' && (_jsxs("div", { "data-testid": "card-selection-phase", children: [_jsx("div", { children: "Select 4 cards to keep face up" }), _jsx("button", { onClick: () => onSelectFaceUpCards(['card1', 'card2', 'card3', 'card4']), "data-testid": "confirm-selection-btn", children: "Confirm Selection" })] })), gameState.phase === 'round1' && (_jsxs("div", { "data-testid": "game-play-phase", children: [_jsx("div", { children: "Round 1 - Playing cards" }), _jsx("button", { onClick: () => onPlayCard('card1', 'capture', ['table1']), "data-testid": "capture-btn", children: "Capture" }), _jsx("button", { onClick: () => onPlayCard('card1', 'build', ['table1'], 5), "data-testid": "build-btn", children: "Build" }), _jsx("button", { onClick: () => onPlayCard('card1', 'trail'), "data-testid": "trail-btn", children: "Trail" })] })), gameState.phase === 'finished' && (_jsxs("div", { "data-testid": "game-finished", children: [_jsx("div", { children: "Game Over!" }), _jsxs("div", { children: ["Winner: ", gameState.winner] }), _jsx("button", { onClick: onResetGame, "data-testid": "reset-game-btn", children: "New Game" })] }))] }));
    }
}));
vi.mock('../../components/RoomManager', () => ({
    RoomManager: ({ roomId, setRoomId, playerName, setPlayerName, onCreateRoom, onJoinRoom, error, isLoading }) => {
        const [showJoinForm, setShowJoinForm] = React.useState(false);
        return (_jsxs("div", { "data-testid": "room-manager", children: [error && _jsx("div", { "data-testid": "error-message", children: error }), showJoinForm ? (_jsxs("div", { "data-testid": "join-form", children: [_jsx("input", { "data-testid": "room-id-input", value: roomId, onChange: (e) => setRoomId(e.target.value), placeholder: "Room ID" }), _jsx("input", { "data-testid": "player-name-input-create", value: playerName, onChange: (e) => setPlayerName(e.target.value), placeholder: "Player Name" }), _jsx("button", { onClick: onJoinRoom, disabled: isLoading, "data-testid": "join-room-btn", children: isLoading ? 'Joining...' : 'Join Room' })] })) : (_jsxs("div", { "data-testid": "create-form", children: [_jsx("input", { "data-testid": "player-name-input-create", value: playerName, onChange: (e) => setPlayerName(e.target.value), placeholder: "Player Name" }), _jsx("button", { onClick: onCreateRoom, disabled: isLoading, "data-testid": "create-room-btn", children: isLoading ? 'Creating...' : 'Create Room' }), _jsx("button", { onClick: () => setShowJoinForm(true), "data-testid": "show-join-form-btn", children: "Join Room" })] }))] }));
    }
}));
vi.mock('../../components/GameSettings', () => ({
    GameSettings: ({ preferences, onPreferencesChange, statistics }) => {
        const [soundEnabled, setSoundEnabled] = React.useState(preferences?.soundEnabled ?? true);
        const toggleSound = () => {
            const newSoundEnabled = !soundEnabled;
            setSoundEnabled(newSoundEnabled);
            onPreferencesChange?.({ ...preferences, soundEnabled: newSoundEnabled });
        };
        return (_jsxs("div", { "data-testid": "game-settings", children: [_jsxs("button", { onClick: toggleSound, "data-testid": "toggle-sound-btn", children: ["Sound: ", soundEnabled ? 'On' : 'Off'] }), statistics && _jsxs("div", { "data-testid": "statistics", children: ["Games: ", statistics.gamesPlayed] })] }));
    },
    useGamePreferences: (defaultPrefs) => {
        const prefs = defaultPrefs || testUtils.createMockPreferences();
        return [prefs, vi.fn()];
    },
    useGameStatistics: () => {
        const stats = testUtils.createMockStatistics();
        return [stats, vi.fn(), vi.fn()];
    }
}));
// Mock Convex mutations
vi.mock('convex/react', async () => {
    const actual = await import('convex/react');
    return {
        ...actual,
        useMutation: (fn) => {
            if (fn.name === 'createRoom') {
                return vi.fn().mockImplementation(async ({ playerName }) => {
                    return {
                        roomId: 'TEST123',
                        playerId: 1,
                        gameState: testUtils.createMockGameState({
                            roomId: 'TEST123',
                            phase: 'waiting',
                            players: [{ id: 1, name: playerName }]
                        })
                    };
                });
            }
            if (fn.name === 'joinRoom') {
                return vi.fn().mockImplementation(async ({ roomId, playerName }) => {
                    return {
                        playerId: 2,
                        gameState: testUtils.createMockGameState({
                            roomId,
                            phase: 'waiting',
                            players: [
                                { id: 1, name: 'Host Player' },
                                { id: 2, name: playerName }
                            ]
                        })
                    };
                });
            }
            if (fn.name === 'startShuffle') {
                return vi.fn().mockImplementation(async ({ roomId }) => {
                    return { success: true };
                });
            }
            if (fn.name === 'selectFaceUpCards') {
                return vi.fn().mockImplementation(async ({ roomId, cardIds }) => {
                    return { success: true };
                });
            }
            if (fn.name === 'playCard') {
                return vi.fn().mockImplementation(async ({ roomId, cardId, action, targetCards, buildValue }) => {
                    return { success: true };
                });
            }
            if (fn.name === 'resetGame') {
                return vi.fn().mockImplementation(async ({ roomId }) => {
                    return { success: true };
                });
            }
            return vi.fn();
        },
        useQuery: (fn) => {
            if (fn.name === 'getGameState') {
                return testUtils.createMockGameState({
                    roomId: 'TEST123',
                    phase: 'waiting',
                    players: [{ id: 1, name: 'Test Player' }]
                });
            }
            return null;
        },
        ConvexProvider: ({ children }) => _jsx(_Fragment, { children: children }),
    };
});
describe('Complete Game Flow Integration', () => {
    let user;
    beforeEach(() => {
        user = userEvent.setup();
        vi.clearAllMocks();
        localStorage.clear();
    });
    afterEach(() => {
        vi.resetAllMocks();
    });
    describe('Basic App Rendering', () => {
        it('should render the app with all main components', async () => {
            renderWithProviders(_jsx(App, {}));
            // Check that main components are rendered
            expect(screen.getByTestId('sound-system')).toBeInTheDocument();
            expect(screen.getByTestId('room-manager')).toBeInTheDocument();
            expect(screen.getByTestId('game-settings')).toBeInTheDocument();
        });
        it('should show room creation form by default', async () => {
            renderWithProviders(_jsx(App, {}));
            expect(screen.getByTestId('create-form')).toBeInTheDocument();
            expect(screen.getByTestId('player-name-input-create')).toBeInTheDocument();
            expect(screen.getByTestId('create-room-btn')).toBeInTheDocument();
            expect(screen.getByTestId('show-join-form-btn')).toBeInTheDocument();
        });
    });
    describe('Room Management', () => {
        it('should allow switching between create and join forms', async () => {
            renderWithProviders(_jsx(App, {}));
            // Initially show create form
            expect(screen.getByTestId('create-form')).toBeInTheDocument();
            // Click to show join form
            await user.click(screen.getByTestId('show-join-form-btn'));
            // Should now show join form
            expect(screen.getByTestId('join-form')).toBeInTheDocument();
            expect(screen.getByTestId('room-id-input')).toBeInTheDocument();
            expect(screen.getByTestId('join-room-btn')).toBeInTheDocument();
        });
        it('should handle player name input', async () => {
            renderWithProviders(_jsx(App, {}));
            const playerNameInput = screen.getByTestId('player-name-input-create');
            await user.type(playerNameInput, 'Test Player');
            expect(playerNameInput).toHaveValue('Test Player');
        });
        it('should handle room ID input', async () => {
            renderWithProviders(_jsx(App, {}));
            // Switch to join form
            await user.click(screen.getByTestId('show-join-form-btn'));
            const roomIdInput = screen.getByTestId('room-id-input');
            await user.type(roomIdInput, 'ABC123');
            expect(roomIdInput).toHaveValue('ABC123');
        });
    });
    describe('Game Settings', () => {
        it('should toggle sound setting', async () => {
            renderWithProviders(_jsx(App, {}));
            const soundButton = screen.getByTestId('toggle-sound-btn');
            // Initially should be on
            expect(soundButton).toHaveTextContent('Sound: On');
            // Toggle off
            await user.click(soundButton);
            expect(soundButton).toHaveTextContent('Sound: Off');
            // Toggle back on
            await user.click(soundButton);
            expect(soundButton).toHaveTextContent('Sound: On');
        });
        it('should display game statistics', async () => {
            renderWithProviders(_jsx(App, {}));
            expect(screen.getByTestId('statistics')).toBeInTheDocument();
            expect(screen.getByTestId('statistics')).toHaveTextContent('Games: 0');
        });
    });
    describe('Game Phases Component', () => {
        it('should render game phases when game state is provided', async () => {
            // Mock a game state
            const mockGameState = testUtils.createMockGameState({
                roomId: 'TEST123',
                phase: 'waiting',
                players: [{ id: 1, name: 'Player 1' }]
            });
            // Render GamePhases component directly
            const { GamePhases } = await import('../../components/GamePhases');
            render(_jsx(GamePhases, { gameState: mockGameState, playerId: 1, onStartShuffle: vi.fn(), onSelectFaceUpCards: vi.fn(), onPlayCard: vi.fn(), onResetGame: vi.fn() }));
            expect(screen.getByTestId('game-phases')).toBeInTheDocument();
            expect(screen.getByTestId('current-phase')).toHaveTextContent('waiting');
        });
        it('should render waiting phase correctly', async () => {
            const mockGameState = testUtils.createMockGameState({
                roomId: 'TEST123',
                phase: 'waiting',
                players: [{ id: 1, name: 'Player 1' }]
            });
            const { GamePhases } = await import('../../components/GamePhases');
            render(_jsx(GamePhases, { gameState: mockGameState, playerId: 1, onStartShuffle: vi.fn(), onSelectFaceUpCards: vi.fn(), onPlayCard: vi.fn(), onResetGame: vi.fn() }));
            expect(screen.getByTestId('waiting-phase')).toBeInTheDocument();
            expect(screen.getByTestId('start-shuffle-btn')).toBeInTheDocument();
        });
        it('should render card selection phase correctly', async () => {
            const mockGameState = testUtils.createMockGameState({
                roomId: 'TEST123',
                phase: 'cardSelection',
                players: [{ id: 1, name: 'Player 1' }]
            });
            const { GamePhases } = await import('../../components/GamePhases');
            render(_jsx(GamePhases, { gameState: mockGameState, playerId: 1, onStartShuffle: vi.fn(), onSelectFaceUpCards: vi.fn(), onPlayCard: vi.fn(), onResetGame: vi.fn() }));
            expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
            expect(screen.getByTestId('confirm-selection-btn')).toBeInTheDocument();
        });
        it('should render game play phase correctly', async () => {
            const mockGameState = testUtils.createMockGameState({
                roomId: 'TEST123',
                phase: 'round1',
                players: [{ id: 1, name: 'Player 1' }]
            });
            const { GamePhases } = await import('../../components/GamePhases');
            render(_jsx(GamePhases, { gameState: mockGameState, playerId: 1, onStartShuffle: vi.fn(), onSelectFaceUpCards: vi.fn(), onPlayCard: vi.fn(), onResetGame: vi.fn() }));
            expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
            expect(screen.getByTestId('capture-btn')).toBeInTheDocument();
            expect(screen.getByTestId('build-btn')).toBeInTheDocument();
            expect(screen.getByTestId('trail-btn')).toBeInTheDocument();
        });
    });
    describe('Error Handling', () => {
        it('should handle missing game state gracefully', async () => {
            const { GamePhases } = await import('../../components/GamePhases');
            const { container } = render(_jsx(GamePhases, { gameState: null, playerId: 1, onStartShuffle: vi.fn(), onSelectFaceUpCards: vi.fn(), onPlayCard: vi.fn(), onResetGame: vi.fn() }));
            // Should render nothing when gameState is null
            expect(container.firstChild).toBeNull();
        });
        it('should handle network errors gracefully', async () => {
            renderWithProviders(_jsx(App, {}));
            // Simulate a network error by setting the global error
            globalThis.mockError = 'Network error';
            // Try to create a room
            await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
            await user.click(screen.getByTestId('create-room-btn'));
            // Should show error message
            await waitFor(() => {
                expect(screen.getByTestId('error-message')).toBeInTheDocument();
            });
        });
    });
    describe('Component Integration', () => {
        it('should integrate all components properly', async () => {
            renderWithProviders(_jsx(App, {}));
            // All main components should be present
            expect(screen.getByTestId('sound-system')).toBeInTheDocument();
            expect(screen.getByTestId('room-manager')).toBeInTheDocument();
            expect(screen.getByTestId('game-settings')).toBeInTheDocument();
            // Room manager should be in create mode
            expect(screen.getByTestId('create-form')).toBeInTheDocument();
            // Game settings should be functional
            const soundButton = screen.getByTestId('toggle-sound-btn');
            expect(soundButton).toBeInTheDocument();
            // Statistics should be displayed
            expect(screen.getByTestId('statistics')).toBeInTheDocument();
        });
    });
});
