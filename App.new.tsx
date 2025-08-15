import React, { useState } from 'react'
import { GamePhases } from './components/GamePhases'
import { RoomManager } from './components/RoomManager'
import { SoundSystem } from './components/SoundSystem'
import { useMutation } from './convexClient'

interface GameCard {
  id: string
  suit: string
  rank: string
}

interface Player {
  id: number
  name: string
}

interface Build {
  id: string
  cards: GameCard[]
  value: number
  owner: number
}

interface GameState {
  roomId: string
  players: Player[]
  deck: GameCard[]
  player1Hand: GameCard[]
  player2Hand: GameCard[]
  tableCards: GameCard[]
  builds: Build[]
  player1Captured: GameCard[]
  player2Captured: GameCard[]
  currentTurn: number
  phase: string
  round: number
  countdownStartTime: string | null
  countdownRemaining?: number
  gameStarted: boolean
  shuffleComplete: boolean
  cardSelectionComplete: boolean
  dealingComplete: boolean
  player1Score: number
  player2Score: number
  winner: number | string | null
  lastPlay: any
  lastUpdate: string
}

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

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
      
    } catch (error: any) {
      console.error('Error creating room:', error);
      setError(error?.message || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
      {!gameState ? (
        <RoomManager
          roomId={roomId}
          setRoomId={setRoomId}
          playerName={playerName}
          setPlayerName={setPlayerName}
          onCreateRoom={createRoom}
          onJoinRoom={() => {}}
          error={error}
          isLoading={isLoading}
        />
      ) : (
        <div data-testid="game-container">
          <GamePhases
            gameState={gameState}
            playerId={playerId || 1}
            onStartShuffle={() => {}}
            onSelectFaceUpCards={() => {}}
            onPlayCard={() => {}}
            onResetGame={() => {}}
            preferences={{ soundEnabled: true, soundVolume: 1 }}
          />
          <SoundSystem />
        </div>
      )}
    </div>
  )
}
