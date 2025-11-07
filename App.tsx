/**
 * Casino Card Game - Main Application
 * Version: 1.0.0
 * Production deployment with comprehensive test coverage
 */
import { useState, useEffect } from 'react'
import { GamePhases } from './components/GamePhases'
import { RoomManager } from './components/RoomManager'
import { GameSettings, useGamePreferences, useGameStatistics } from './components/GameSettings'
import { SoundSystem, soundManager } from './components/SoundSystem'
import { AppHeader } from './components/app/AppHeader'
import { Decor } from './components/app/Decor'
import { api, useQuery } from './apiClient'
import { CasinoRoomView } from './components/CasinoRoomView'
import { PokerTableView } from './components/PokerTableView'

// Custom hooks
import { useGameState } from './hooks/useGameState'
import { useConnectionState } from './hooks/useConnectionState'
import { useWebSocket } from './hooks/useWebSocket'
import { useGameActions } from './hooks/useGameActions'
import { useRoomActions } from './hooks/useRoomActions'

export default function App() {
  // Custom hooks for state management
  const gameStateHook = useGameState()
  const connectionHook = useConnectionState()
  
  // Countdown state (kept local as it's UI-specific)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null)

  // WebSocket hook
  const { notifyRoomUpdate } = useWebSocket({
    roomId: gameStateHook.roomId,
    ws: connectionHook.ws,
    setWs: connectionHook.setWs,
    setConnectionStatus: connectionHook.setConnectionStatus,
    applyResponseState: gameStateHook.applyResponseState
  })

  // Game actions hook
  const gameActions = useGameActions({
    roomId: gameStateHook.roomId,
    playerId: gameStateHook.playerId,
    applyResponseState: gameStateHook.applyResponseState,
    notifyRoomUpdate,
    setError: connectionHook.setError,
    extractGameState: gameStateHook.extractGameState,
    setGameState: gameStateHook.setGameState,
    setPreviousGameState: gameStateHook.setPreviousGameState
  })

  // Room actions hook
  const roomActions = useRoomActions({
    playerName: gameStateHook.playerName,
    setRoomId: gameStateHook.setRoomId,
    setPlayerId: gameStateHook.setPlayerId,
    applyResponseState: gameStateHook.applyResponseState,
    setConnectionStatus: connectionHook.setConnectionStatus,
    setError: connectionHook.setError,
    setIsLoading: connectionHook.setIsLoading
  })

  // Derive connection state
  const isConnected = connectionHook.connectionStatus === 'connected' && 
                     gameStateHook.gameState !== null && 
                     gameStateHook.roomId !== ''

  // Game preferences and statistics
  const defaultPreferences = {
    soundEnabled: true,
    soundVolume: 1,
    hintsEnabled: true,
    statisticsEnabled: true
  }
  const [preferences, setPreferences] = useGamePreferences(defaultPreferences)
  const [statistics, updateStatistics] = useGameStatistics()

  // Update sound manager volume when preferences change
  useEffect(() => {
    if (connectionHook.soundReady) {
      soundManager.setMasterVolume(preferences.soundEnabled ? preferences.soundVolume : 0)
    }
  }, [preferences.soundEnabled, preferences.soundVolume, connectionHook.soundReady])

  // Real-time game state subscription
  const gameStateData = useQuery(
    api.getGameState.getGameState, 
    gameStateHook.roomId && gameStateHook.roomId.trim() && gameStateHook.roomId.length > 0 && 
    gameStateHook.roomId !== '' && gameStateHook.playerId ? 
    { room_id: gameStateHook.roomId } : "skip"
  )

  // Update local game state when API data changes
  useEffect(() => {
    if (gameStateData && gameStateHook.roomId) {
      const state = gameStateHook.extractGameState(gameStateData)
      if (import.meta.env.DEV) {
        console.log('🔄 Game state updated from API:', {
          phase: state?.phase,
          players: state?.players?.length || 0,
          roomId: state?.roomId,
          player1Hand: state?.player1Hand?.length || 0,
          player2Hand: state?.player2Hand?.length || 0,
          tableCards: state?.tableCards?.length || 0
        })
      }
      gameStateHook.applyResponseState(gameStateData)
      connectionHook.setConnectionStatus('connected')
    }
  }, [gameStateData, gameStateHook.roomId, gameStateHook.applyResponseState, gameStateHook.extractGameState, connectionHook.setConnectionStatus])

  // Track game state changes for statistics and sound effects
  useEffect(() => {
    if (!gameStateHook.gameState || !gameStateHook.previousGameState || !preferences.statisticsEnabled) {
      gameStateHook.setPreviousGameState(gameStateHook.gameState)
      return
    }

    // Game finished - update statistics
    if (gameStateHook.gameState.phase === 'finished' && 
        gameStateHook.previousGameState.phase !== 'finished' && 
        gameStateHook.playerId) {
      const myScore = gameStateHook.isPlayer1() ? gameStateHook.gameState.player1Score : gameStateHook.gameState.player2Score
      const isWinner = gameStateHook.gameState.winner === gameStateHook.playerId
      const isTie = gameStateHook.gameState.winner === null || gameStateHook.gameState.winner === 0

      updateStatistics({
        gamesPlayed: statistics.gamesPlayed + 1,
        gamesWon: isWinner ? statistics.gamesWon + 1 : statistics.gamesWon,
        gamesLost: (!isWinner && !isTie) ? statistics.gamesLost + 1 : statistics.gamesLost,
        totalScore: statistics.totalScore + myScore,
        bestScore: Math.max(statistics.bestScore, myScore),
        currentWinStreak: isWinner ? statistics.currentWinStreak + 1 : 0,
        longestWinStreak: isWinner ? Math.max(statistics.longestWinStreak, statistics.currentWinStreak + 1) : statistics.longestWinStreak
      })

      // Play game end sound
      if (preferences.soundEnabled && connectionHook.soundReady) {
        soundManager.playSound('gameEnd')
      }
    }

    // Game started - play start sound
    if (gameStateHook.gameState.phase === 'round1' && gameStateHook.previousGameState.phase !== 'round1') {
      if (preferences.soundEnabled && connectionHook.soundReady) {
        soundManager.playSound('gameStart')
      }
    }

    gameStateHook.setPreviousGameState(gameStateHook.gameState)
  }, [gameStateHook.gameState, gameStateHook.previousGameState, gameStateHook.playerId, gameStateHook.isPlayer1, gameStateHook.setPreviousGameState, preferences.statisticsEnabled, preferences.soundEnabled, connectionHook.soundReady, statistics, updateStatistics])

  // Countdown effect when both players are ready
  useEffect(() => {
    if (gameStateHook.gameState && 
        gameStateHook.gameState.player1Ready && 
        gameStateHook.gameState.player2Ready && 
        countdown === null) {
      console.log('🎯 Both players ready, starting countdown!')
      setCountdown(10)
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval)
            setCountdownInterval(null)
            return null
          }
          return prev - 1
        })
      }, 1000)
      
      setCountdownInterval(interval)
    }
    
    // Cleanup interval on unmount or when game state changes
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
        setCountdownInterval(null)
      }
    }
  }, [gameStateHook.gameState, countdown, countdownInterval])

  // Debug log for poker table view rendering
  useEffect(() => {
    if (gameStateHook.gameState && 
        (gameStateHook.gameState.phase === 'round1' || gameStateHook.gameState.phase === 'round2')) {
      if (import.meta.env.DEV) {
        console.log('🎮 Poker Table View should be rendering', {
          phase: gameStateHook.gameState.phase,
          playerId: gameStateHook.playerId,
          players: gameStateHook.gameState.players?.length || 0,
          player1Hand: gameStateHook.gameState.player1Hand?.length || 0,
          player2Hand: gameStateHook.gameState.player2Hand?.length || 0,
          tableCards: gameStateHook.gameState.tableCards?.length || 0
        })
      }
    }
  }, [gameStateHook.gameState, gameStateHook.playerId])

  return (
    <>
      <SoundSystem onSoundReady={() => connectionHook.setSoundReady(true)} />
      
      <div className="min-h-screen casino-bg relative overflow-hidden">
        {/* Enhanced Decorative Background for Landing Page */}
        <Decor visible={!isConnected} />

        {/* Global Settings - Always Available */}
        <div className="absolute top-4 right-4 z-50">
          <GameSettings
            preferences={preferences}
            onPreferencesChange={setPreferences}
            statistics={preferences.statisticsEnabled ? statistics : undefined}
          />
        </div>

        {/* Global Statistics Display */}
        {preferences.statisticsEnabled && (
          <div data-testid="statistics" className="absolute top-4 left-4 z-50 backdrop-casino rounded-lg p-3 shadow-casino border border-casino-gold/20">
            <div className="text-sm font-medium text-white">Games: {statistics.gamesPlayed}</div>
          </div>
        )}

        {/* Global Error Display */}
        {connectionHook.error && (
          <div data-testid="error-message" className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4">
            <div className="backdrop-casino border border-casino-red/30 rounded-lg p-3 shadow-casino">
              <p className="text-casino-red-light font-medium text-center">{connectionHook.error}</p>
            </div>
          </div>
        )}

        {/* Show RoomManager if not connected */}
        {!isConnected ? (
          <div className="relative z-10 p-4 min-h-screen flex items-center justify-center">
            <div className="max-w-6xl mx-auto w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left Column - Room Manager */}
                <div className="w-full">
                  <RoomManager
                    roomId={gameStateHook.roomId}
                    setRoomId={gameStateHook.setRoomId}
                    playerName={gameStateHook.playerName}
                    setPlayerName={gameStateHook.setPlayerName}
                    onCreateRoom={roomActions.createRoom}
                    onJoinRoom={roomActions.joinRoom}
                    onJoinRandomRoom={() => roomActions.joinRandomRoom(gameStateHook.playerName)}
                    error={connectionHook.error}
                    isLoading={connectionHook.isLoading}
                  />
                </div>
                
                {/* Right Column - Game Info */}
                <div className="hidden md:block w-full">
                  <div className="backdrop-casino-dark rounded-2xl p-8 border-2 border-casino-gold/30 shadow-casino-lg">
                    <h2 className="text-3xl font-black text-casino-gold mb-6 text-center">How to Play</h2>
                    <div className="space-y-4 text-white/90">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-casino-gold/20 flex items-center justify-center text-casino-gold font-bold">1</div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">Create or Join a Room</h3>
                          <p className="text-sm">Enter your name and either create a new game or join an existing one with a room code.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-casino-gold/20 flex items-center justify-center text-casino-gold font-bold">2</div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">Wait for Opponent</h3>
                          <p className="text-sm">Once both players are ready, Player 1 will shuffle the deck to begin the game.</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-casino-gold/20 flex items-center justify-center text-casino-gold font-bold">3</div>
                        <div>
                          <h3 className="font-semibold text-white mb-1">Play Your Cards</h3>
                          <p className="text-sm">Capture cards from the table, build sets, or trail cards. The player with the highest score wins!</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8 pt-6 border-t border-casino-gold/20">
                      <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-casino-green/20 rounded-lg p-4">
                          <div className="text-2xl font-bold text-casino-gold">52</div>
                          <div className="text-xs text-white/70 mt-1">Cards in Deck</div>
                        </div>
                        <div className="bg-casino-blue/20 rounded-lg p-4">
                          <div className="text-2xl font-bold text-casino-gold">2</div>
                          <div className="text-xs text-white/70 mt-1">Players</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Decor visible={true} />

            {/* Header - Hide during gameplay (round1/round2) for immersive experience */}
            {gameStateHook.gameState?.phase !== 'round1' && gameStateHook.gameState?.phase !== 'round2' && (
              <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto">
                  <AppHeader
                    roomId={gameStateHook.gameState?.roomId || ''}
                    connectionStatus={connectionHook.connectionStatus}
                    myName={gameStateHook.myName}
                    opponentName={gameStateHook.opponentName}
                    myScore={gameStateHook.myScore}
                    opponentScore={gameStateHook.opponentScore}
                    phase={gameStateHook.gameState?.phase}
                    round={gameStateHook.gameState?.round}
                    onLeave={roomActions.disconnectGame}
                  />
                </div>
              </div>
            )}

            {/* Casino Room View - Show for both waiting and dealer phases */}
            {(gameStateHook.gameState?.phase === 'waiting' || gameStateHook.gameState?.phase === 'dealer') && 
             gameStateHook.gameState && gameStateHook.playerId && (
              <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto">
                  <CasinoRoomView
                    roomId={gameStateHook.gameState.roomId}
                    players={(gameStateHook.gameState.players || []).map(p => ({ id: p.id, name: p.name }))}
                    player1Ready={gameStateHook.gameState.player1Ready || false}
                    player2Ready={gameStateHook.gameState.player2Ready || false}
                    playerId={gameStateHook.playerId}
                    onPlayerReady={() => gameActions.setPlayerReady(true)}
                    onPlayerNotReady={() => gameActions.setPlayerReady(false)}
                    onStartShuffle={gameStateHook.gameState?.phase === 'dealer' && 
                                   (gameStateHook.gameState.player1Ready && gameStateHook.gameState.player2Ready) ? 
                                   gameActions.startShuffle : undefined}
                  />
                </div>
              </div>
            )}

            {/* Poker Table View - For round1 and round2 phases - Full screen immersive experience */}
            {(gameStateHook.gameState?.phase === 'round1' || gameStateHook.gameState?.phase === 'round2') && 
             gameStateHook.gameState && gameStateHook.playerId && (
              <PokerTableView
                gameState={gameStateHook.gameState}
                playerId={gameStateHook.playerId}
                onPlayCard={gameActions.playCard}
                onLeave={roomActions.disconnectGame}
              />
            )}

            {/* Game Phases - For other phases like cardSelection, dealing, finished */}
            {gameStateHook.gameState?.phase && 
             gameStateHook.gameState.phase !== 'waiting' && 
             gameStateHook.gameState.phase !== 'dealer' &&
             gameStateHook.gameState.phase !== 'round1' && 
             gameStateHook.gameState.phase !== 'round2' && 
             gameStateHook.playerId && (
              <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto">
                  <GamePhases
                    gameState={gameStateHook.gameState}
                    playerId={gameStateHook.playerId}
                    onSelectFaceUpCards={gameActions.selectFaceUpCards}
                    onPlayCard={gameActions.playCard}
                    onResetGame={gameActions.resetGame}
                    onPlayerReady={() => gameActions.setPlayerReady(true)}
                    onPlayerNotReady={() => gameActions.setPlayerReady(false)}
                    onStartShuffle={gameActions.startShuffle}
                    preferences={preferences}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}