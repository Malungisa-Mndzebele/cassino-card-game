import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { GamePhases } from './components/GamePhases';
import { RoomManager } from './components/RoomManager';
import { SoundSystem } from './components/SoundSystem';
export default function App() {
    const [gameState, setGameState] = useState(null);
    const [playerId, setPlayerId] = useState(null);
    const [roomId, setRoomId] = useState('');
    const [playerName, setPlayerName] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Mock createRoom mutation
    const createRoom = async () => {
        if (!playerName) {
            setError("Please enter your name");
            return;
        }
        setIsLoading(true);
        setError("");
        try {
            // Simulate API call
            const response = {
                roomId: 'test-room-123',
                gameState: {
                    roomId: 'test-room-123',
                    players: [{ id: 1, name: playerName }],
                    deck: [],
                    player1Hand: [],
                    player2Hand: [],
                    tableCards: [],
                    builds: [],
                    player1Captured: [],
                    player2Captured: [],
                    currentTurn: 1,
                    phase: 'setup',
                    round: 1,
                    countdownStartTime: null,
                    gameStarted: false,
                    shuffleComplete: false,
                    cardSelectionComplete: false,
                    dealingComplete: false,
                    player1Score: 0,
                    player2Score: 0,
                    winner: null,
                    lastPlay: null,
                    lastUpdate: new Date().toISOString()
                }
            };
            setRoomId(response.roomId);
            setPlayerId(1);
            setGameState(response.gameState);
        }
        catch (error) {
            console.error('Error creating room:', error);
            setError(error?.message || 'Failed to create room');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900", children: !gameState ? (_jsx(RoomManager, { roomId: roomId, setRoomId: setRoomId, playerName: playerName, setPlayerName: setPlayerName, onCreateRoom: createRoom, onJoinRoom: () => { }, error: error, isLoading: isLoading })) : (_jsxs("div", { "data-testid": "game-container", children: [_jsx(GamePhases, { gameState: gameState, playerId: playerId || 1, onStartShuffle: () => { }, onSelectFaceUpCards: () => { }, onPlayCard: () => { }, onResetGame: () => { }, preferences: { soundEnabled: true, soundVolume: 1 } }), _jsx(SoundSystem, {})] })) }));
}
