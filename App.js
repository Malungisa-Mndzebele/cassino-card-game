import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { GamePhases } from './components/GamePhases';
import { RoomManager } from './components/RoomManager';
import { GameSettings, useGamePreferences, useGameStatistics } from './components/GameSettings';
import { SoundSystem, soundManager } from './components/SoundSystem';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { Separator } from './components/ui/separator';
import { api } from './convex/_generated/api';
import { useMutation } from 'convex/react';
import { Trophy, Users, Clock, Heart, Diamond, Spade, Club, Crown, Star, Wifi, WifiOff } from 'lucide-react';
const initialGameState = {
    roomId: '',
    players: [],
    phase: 'waiting',
    round: 0,
    deck: [],
    player1Hand: [],
    player2Hand: [],
    tableCards: [],
    builds: [],
    player1Captured: [],
    player2Captured: [],
    player1Score: 0,
    player2Score: 0,
    currentTurn: 0,
    cardSelectionComplete: false,
    shuffleComplete: false,
    countdownStartTime: null,
    gameStarted: false,
    lastPlay: null,
    lastAction: undefined,
    lastUpdate: new Date().toISOString(),
    gameCompleted: false,
    winner: null,
    dealingComplete: false,
    player1Ready: false,
    player2Ready: false,
    countdownRemaining: undefined
};
export default function App() {
    // Game state management
    const [gameState, setGameState] = useState(null);
    const [previousGameState, setPreviousGameState] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    // UI state
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [soundReady, setSoundReady] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    // Derive connection state from connection status
    const isConnected = connectionStatus === 'connected';
    // Game preferences and statistics
    const defaultPreferences = {
        soundEnabled: true,
        soundVolume: 1,
        hintsEnabled: true,
        statisticsEnabled: true
    };
    // Game preferences and statistics
    const [preferences, setPreferences] = useGamePreferences(defaultPreferences);
    const [statistics, updateStatistics] = useGameStatistics();
    // Update sound manager volume when preferences change
    useEffect(() => {
        if (soundReady) {
            soundManager.setMasterVolume(preferences.soundEnabled ? preferences.soundVolume : 0);
        }
    }, [preferences.soundEnabled, preferences.soundVolume, soundReady]);
    // Room creation and joining
    const createRoomMutation = useMutation(api.createRoom.createRoom);
    const createRoom = async () => {
        if (!playerName) {
            setError("Please enter your name");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            setConnectionStatus('connecting');
            // For now, always use mock implementation since Convex is not set up
            console.log("Using mock implementation for room creation");
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const response = {
                roomId,
                gameState: {
                    roomId,
                    players: [{ id: 1, name: playerName }],
                    phase: 'waiting',
                    round: 0,
                    deck: [],
                    player1Hand: [],
                    player2Hand: [],
                    tableCards: [],
                    builds: [],
                    player1Captured: [],
                    player2Captured: [],
                    player1Score: 0,
                    player2Score: 0,
                    currentTurn: 0,
                    cardSelectionComplete: false,
                    shuffleComplete: false,
                    countdownStartTime: null,
                    countdownRemaining: undefined,
                    gameStarted: false,
                    lastPlay: null,
                    lastAction: undefined,
                    lastUpdate: new Date().toISOString(),
                    gameCompleted: false,
                    winner: null,
                    dealingComplete: false,
                    player1Ready: false,
                    player2Ready: false,
                }
            };
            if (!response) {
                throw new Error("Failed to create room");
            }
            setRoomId(response.roomId);
            setPlayerId(1);
            setGameState(response.gameState);
            setConnectionStatus('connected');
        }
        catch (error) {
            console.error("Error creating room:", error);
            const errorMsg = error?.message || String(error);
            setError(`Network error`); // Using a generic error message for network issues
            setConnectionStatus('disconnected');
        }
        finally {
            setIsLoading(false);
        }
    };
    const joinRoomMutation = useMutation(api.joinRoom.joinRoom);
    const joinRoom = async (targetRoomId, targetPlayerName) => {
        const roomToJoin = targetRoomId || roomId;
        const nameToUse = targetPlayerName || playerName;
        if (!roomToJoin || !nameToUse) {
            setError('Please enter room ID and player name');
            return;
        }
        setIsLoading(true);
        setError('');
        try {
            setConnectionStatus('connecting');
            // For now, always use mock implementation since Convex is not set up
            console.log("Using mock implementation for room joining");
            const data = {
                playerId: 2,
                gameState: {
                    roomId: roomToJoin,
                    players: [{ id: 1, name: 'Host' }, { id: 2, name: nameToUse }],
                    phase: 'waiting',
                    round: 0,
                    deck: [],
                    player1Hand: [],
                    player2Hand: [],
                    tableCards: [],
                    builds: [],
                    player1Captured: [],
                    player2Captured: [],
                    player1Score: 0,
                    player2Score: 0,
                    currentTurn: 0,
                    cardSelectionComplete: false,
                    shuffleComplete: false,
                    countdownStartTime: null,
                    countdownRemaining: undefined,
                    gameStarted: false,
                    lastPlay: null,
                    lastAction: undefined,
                    lastUpdate: new Date().toISOString(),
                    gameCompleted: false,
                    winner: null,
                    dealingComplete: false,
                    player1Ready: false,
                    player2Ready: false,
                }
            };
            if (!data.playerId || !data.gameState) {
                throw new Error('Failed to join room');
            }
            setRoomId(roomToJoin);
            setPlayerId(data.playerId);
            setGameState(data.gameState);
            setConnectionStatus('connected');
        }
        catch (error) {
            console.error('Error joining room:', error);
            const errorMsg = error?.message || error;
            setError(`Failed to join room - ${errorMsg}`);
            setConnectionStatus('disconnected');
        }
        finally {
            setIsLoading(false);
        }
    };
    // Track game state changes for statistics and sound effects
    useEffect(() => {
        if (!gameState || !previousGameState || !preferences.statisticsEnabled) {
            setPreviousGameState(gameState);
            return;
        }
        // Game finished - update statistics
        if (gameState.phase === 'finished' && previousGameState.phase !== 'finished' && playerId) {
            const myScore = playerId === 1 ? gameState.player1Score : gameState.player2Score;
            const isWinner = gameState.winner === playerId;
            const isTie = gameState.winner === 'tie';
            updateStatistics({
                gamesPlayed: statistics.gamesPlayed + 1,
                gamesWon: isWinner ? statistics.gamesWon + 1 : statistics.gamesWon,
                gamesLost: (!isWinner && !isTie) ? statistics.gamesLost + 1 : statistics.gamesLost,
                totalScore: statistics.totalScore + myScore,
                bestScore: Math.max(statistics.bestScore, myScore),
                currentWinStreak: isWinner ? statistics.currentWinStreak + 1 : 0,
                longestWinStreak: isWinner ? Math.max(statistics.longestWinStreak, statistics.currentWinStreak + 1) : statistics.longestWinStreak
            });
            // Play game end sound
            if (preferences.soundEnabled && soundReady) {
                soundManager.playSound('gameEnd');
            }
        }
        // Game started - play start sound
        if (gameState.phase === 'round1' && previousGameState.phase !== 'round1') {
            if (preferences.soundEnabled && soundReady) {
                soundManager.playSound('gameStart');
            }
        }
        setPreviousGameState(gameState);
    }, [gameState, previousGameState, playerId, preferences.statisticsEnabled, preferences.soundEnabled, soundReady, statistics, updateStatistics]);
    // Poll for game state updates (Convex or local mock)
    const pollGameState = useCallback(async () => {
        if (!roomId)
            return;
        setConnectionStatus('connecting');
        // TODO: Replace with Convex query or local mock
        // Example: const data = await convex.query('getGameState', { roomId });
        // For now, just simulate success
        setTimeout(() => {
            setGameState((prev) => prev || {
                ...initialGameState,
                roomId,
                phase: 'waiting',
                players: []
            });
            setError('');
            setConnectionStatus('connected');
        }, 200);
    }, [roomId]);
    // Set up polling when connected
    useEffect(() => {
        if (!isConnected || !roomId)
            return;
        // Poll more frequently during active phases
        const interval = setInterval(pollGameState, 1000);
        return () => clearInterval(interval);
    }, [isConnected, roomId, pollGameState]);
    const startShuffle = async () => {
        if (!roomId || !playerId)
            return;
        // TODO: Replace with Convex mutation
        setGameState((prev) => prev ? {
            ...prev,
            shuffleComplete: true
        } : null);
        setError('');
    };
    const selectFaceUpCards = async (cardIds) => {
        if (!roomId || !playerId)
            return;
        // TODO: Replace with Convex mutation
        setGameState((prev) => prev ? {
            ...prev,
            cardSelectionComplete: true
        } : null);
        setError('');
    };
    const playCard = async (cardId, action, targetCards, buildValue) => {
        if (!roomId || !playerId)
            return;
        // TODO: Replace with Convex mutation
        setGameState((prev) => prev ? {
            ...prev,
            lastPlay: { cardId, action, targetCards, buildValue }
        } : null);
        setError('');
    };
    const resetGame = async () => {
        if (!roomId)
            return;
        // TODO: Replace with Convex mutation
        setGameState(null);
        setPreviousGameState(null);
        setError('');
    };
    const disconnectGame = () => {
        setConnectionStatus('disconnected');
        setGameState(null);
        setPlayerId(null);
        setRoomId('');
        setError('');
    };
    // Get current scores for header display
    const myScore = playerId === 1 ? gameState?.player1Score ?? 0 : gameState?.player2Score ?? 0;
    const opponentScore = playerId === 1 ? gameState?.player2Score ?? 0 : gameState?.player1Score ?? 0;
    const myName = gameState?.players?.find(p => p.id === playerId)?.name || 'You';
    const opponentName = gameState?.players?.find(p => p.id !== playerId)?.name || 'Opponent';
    return (_jsxs(_Fragment, { children: [_jsx(SoundSystem, { onSoundReady: () => setSoundReady(true) }), _jsxs("div", { className: "min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 relative", children: [!isConnected && (_jsx(RoomManager, { roomId: roomId, setRoomId: setRoomId, playerName: playerName, setPlayerName: setPlayerName, onCreateRoom: createRoom, onJoinRoom: joinRoom, error: error, isLoading: isLoading })), _jsxs("div", { className: "absolute inset-0 opacity-5", children: [_jsx("div", { className: "absolute top-20 left-10 transform rotate-12", children: _jsx(Heart, { className: "w-16 h-16 text-red-300" }) }), _jsx("div", { className: "absolute top-40 right-20 transform -rotate-45", children: _jsx(Spade, { className: "w-14 h-14 text-gray-300" }) }), _jsx("div", { className: "absolute bottom-32 left-16 transform rotate-45", children: _jsx(Diamond, { className: "w-18 h-18 text-red-300" }) }), _jsx("div", { className: "absolute bottom-20 right-10 transform -rotate-12", children: _jsx(Club, { className: "w-16 h-16 text-gray-300" }) })] }), isConnected && (_jsx("div", { className: "relative z-10 p-4", children: _jsxs("div", { className: "max-w-6xl mx-auto", children: [_jsx(Card, { className: "backdrop-blur-sm bg-white/95 shadow-2xl border-0 mb-6", children: _jsxs(CardContent, { className: "p-6", children: [_jsxs("div", { className: "flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4", children: [_jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur opacity-30" }), _jsx("div", { className: "relative bg-white rounded-full p-2 shadow-lg", children: _jsx(Crown, { className: "w-8 h-8 text-emerald-600" }) })] }), _jsxs("div", { children: [_jsx("h1", { className: "text-2xl lg:text-3xl font-bold text-gray-800", children: "Cassino" }), _jsxs("div", { className: "flex items-center space-x-3 text-sm text-gray-600", children: [_jsxs("span", { className: "flex items-center", children: [_jsx(Users, { className: "w-4 h-4 mr-1" }), gameState?.roomId] }), _jsx(Separator, { orientation: "vertical", className: "h-4" }), _jsxs("span", { className: "flex items-center", children: [connectionStatus === 'connected' ? (_jsx(Wifi, { className: "w-4 h-4 mr-1 text-green-600" })) : connectionStatus === 'connecting' ? (_jsx(Clock, { className: "w-4 h-4 mr-1 text-yellow-600 animate-spin" })) : (_jsx(WifiOff, { className: "w-4 h-4 mr-1 text-red-600" })), connectionStatus === 'connected' ? 'Connected' :
                                                                                        connectionStatus === 'connecting' ? 'Connecting...' :
                                                                                            'Disconnected'] })] })] })] }), _jsxs("div", { className: "flex items-center space-x-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: myName }), _jsxs(Badge, { variant: "default", className: "text-lg px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg", children: [_jsx(Trophy, { className: "w-4 h-4 mr-1" }), myScore, "/11"] })] }), _jsx("div", { className: "text-center", children: _jsx("div", { className: "text-2xl font-bold text-gray-400", children: "VS" }) }), _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-sm text-gray-600 mb-1", children: opponentName }), _jsxs(Badge, { variant: "secondary", className: "text-lg px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg", children: [_jsx(Trophy, { className: "w-4 h-4 mr-1" }), opponentScore, "/11"] })] })] }), _jsxs("div", { className: "flex items-center space-x-3", children: [_jsxs("div", { className: "text-right", children: [_jsxs("div", { className: "flex items-center space-x-2 mb-1", children: [_jsx(Star, { className: "w-4 h-4 text-yellow-500" }), _jsx("span", { className: "text-sm font-medium text-gray-800", children: gameState?.phase ? (gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)) : '' })] }), (gameState?.round || 0) > 0 && (_jsxs("div", { className: "text-xs text-gray-600", children: ["Round ", gameState?.round || 0, "/2"] }))] }), _jsx(Separator, { orientation: "vertical", className: "h-8" }), _jsxs("div", { className: "flex items-center space-x-2", children: [_jsx(GameSettings, { preferences: preferences, onPreferencesChange: setPreferences, statistics: preferences.statisticsEnabled ? statistics : undefined }), _jsx(Button, { onClick: disconnectGame, variant: "outline", size: "sm", className: "border-gray-300 text-gray-600 hover:bg-gray-50", children: "Leave Game" })] })] })] }), error && (_jsx("div", { className: "mt-4 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg", children: _jsx("p", { className: "text-red-700 font-medium", children: error }) }))] }) }), gameState?.phase === 'waiting' && gameState && (_jsx(Card, { className: "backdrop-blur-sm bg-white/95 shadow-2xl border-0", children: _jsx(CardContent, { className: "p-8", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "mb-6", children: _jsxs("div", { className: "inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-6 py-3", children: [_jsx(Clock, { className: "w-5 h-5 text-blue-600 animate-pulse" }), _jsx("span", { className: "text-blue-800 font-medium", children: "Waiting for players..." })] }) }), _jsxs("div", { className: "mb-6", children: [_jsxs("p", { className: "text-xl text-gray-700 mb-4", children: [gameState?.players?.length || 0, "/2 players joined"] }), _jsxs("div", { className: "flex justify-center space-x-3", children: [gameState?.players?.map(player => (_jsx("div", { className: "bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-4 py-2 border border-emerald-200", children: _jsx("span", { className: "text-emerald-800 font-medium", children: player.name }) }, player.id))), (gameState?.players?.length || 0) < 2 && (_jsx("div", { className: "bg-gray-100 rounded-full px-4 py-2 border-2 border-dashed border-gray-300", children: _jsx("span", { className: "text-gray-500", children: "Waiting..." }) }))] })] }), _jsxs("div", { className: "bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-6", children: [_jsx("p", { className: "text-gray-700 mb-2", children: "Share this room code with another player:" }), _jsx("div", { className: "inline-flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border", children: _jsx("code", { className: "text-2xl font-mono font-bold text-emerald-600 tracking-wider", children: gameState?.roomId }) })] }), _jsxs("div", { className: "grid md:grid-cols-2 gap-6 text-left", children: [_jsxs("div", { className: "bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4", children: [_jsxs("h3", { className: "font-bold text-emerald-800 mb-3 flex items-center", children: [_jsx(Trophy, { className: "w-5 h-5 mr-2" }), "Scoring System"] }), _jsxs("div", { className: "space-y-2 text-sm text-emerald-700", children: [_jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Each Ace (\u2660\u2665\u2666\u2663)" }), _jsx(Badge, { variant: "secondary", className: "bg-emerald-100 text-emerald-800", children: "1 pt" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "2 of Spades (2\u2660)" }), _jsx(Badge, { variant: "secondary", className: "bg-emerald-100 text-emerald-800", children: "1 pt" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "10 of Diamonds (10\u2666)" }), _jsx(Badge, { variant: "secondary", className: "bg-emerald-100 text-emerald-800", children: "2 pts" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Most cards captured" }), _jsx(Badge, { variant: "secondary", className: "bg-emerald-100 text-emerald-800", children: "2 pts" })] }), _jsxs("div", { className: "flex justify-between", children: [_jsx("span", { children: "Most spades captured" }), _jsx(Badge, { variant: "secondary", className: "bg-emerald-100 text-emerald-800", children: "2 pts" })] })] })] }), _jsxs("div", { className: "bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4", children: [_jsxs("h3", { className: "font-bold text-blue-800 mb-3 flex items-center", children: [_jsx(Star, { className: "w-5 h-5 mr-2" }), "How to Play"] }), _jsxs("div", { className: "space-y-2 text-sm text-blue-700", children: [_jsxs("p", { children: [_jsx("strong", { children: "Capture:" }), " Match your card value with table cards"] }), _jsxs("p", { children: [_jsx("strong", { children: "Build:" }), " Combine table cards to create a sum you can capture"] }), _jsxs("p", { children: [_jsx("strong", { children: "Trail:" }), " Place a card on the table when you can't capture"] }), _jsx("div", { className: "mt-3 p-2 bg-orange-100 rounded-md border-l-4 border-orange-400", children: _jsx("p", { className: "text-orange-800 font-medium text-xs", children: "\u26A0\uFE0F You can only build values that you have cards in hand to capture!" }) })] })] })] }), preferences.statisticsEnabled && statistics.gamesPlayed > 0 && (_jsxs("div", { className: "mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4", children: [_jsxs("h4", { className: "font-bold text-purple-800 mb-3 flex items-center justify-center", children: [_jsx(Crown, { className: "w-5 h-5 mr-2" }), "Your Game Statistics"] }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 text-center", children: [_jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-purple-600", children: statistics.gamesPlayed }), _jsx("div", { className: "text-xs text-purple-500", children: "Games" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-green-600", children: statistics.gamesWon }), _jsx("div", { className: "text-xs text-green-500", children: "Wins" })] }), _jsxs("div", { children: [_jsxs("div", { className: "text-2xl font-bold text-blue-600", children: [((statistics.gamesWon / statistics.gamesPlayed) * 100).toFixed(1), "%"] }), _jsx("div", { className: "text-xs text-blue-500", children: "Win Rate" })] }), _jsxs("div", { children: [_jsx("div", { className: "text-2xl font-bold text-yellow-600", children: statistics.bestScore }), _jsx("div", { className: "text-xs text-yellow-500", children: "Best Score" })] })] })] }))] }) }) })), gameState?.phase !== 'waiting' && playerId && (_jsx(GamePhases, { gameState: gameState, playerId: playerId, onStartShuffle: startShuffle, onSelectFaceUpCards: selectFaceUpCards, onPlayCard: playCard, onResetGame: resetGame, preferences: preferences }))] }) }))] })] }));
}
