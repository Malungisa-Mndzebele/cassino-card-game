import React, { useState, useEffect, useCallback } from 'react'
import { GamePhases } from './components/GamePhases'
import { RoomManager } from './components/RoomManager'
import { GameSettings, useGamePreferences, useGameStatistics } from './components/GameSettings'
import { SoundSystem, soundManager } from './components/SoundSystem'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Separator } from './components/ui/separator'
import { projectId, publicAnonKey } from './utils/supabase/info'
import { Trophy, Users, Clock, Heart, Diamond, Spade, Club, Crown, Star, Wifi, WifiOff } from 'lucide-react'

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
  const [roomId, setRoomId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [soundReady, setSoundReady] = useState(false)
  const [previousGameState, setPreviousGameState] = useState<GameState | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected')

  // Use custom hooks for preferences and statistics
  const [preferences, setPreferences] = useGamePreferences()
  const [statistics, updateStatistics] = useGameStatistics()

  // Update sound manager volume when preferences change
  useEffect(() => {
    if (soundReady) {
      soundManager.setMasterVolume(preferences.soundEnabled ? preferences.soundVolume : 0)
    }
  }, [preferences.soundEnabled, preferences.soundVolume, soundReady])

  // Track game state changes for statistics and sound effects
  useEffect(() => {
    if (!gameState || !previousGameState || !preferences.statisticsEnabled) {
      setPreviousGameState(gameState)
      return
    }

    // Game finished - update statistics
    if (gameState.phase === 'finished' && previousGameState.phase !== 'finished' && playerId) {
      const myScore = playerId === 1 ? gameState.player1Score : gameState.player2Score
      const isWinner = gameState.winner === playerId
      const isTie = gameState.winner === 'tie'

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
      if (preferences.soundEnabled && soundReady) {
        soundManager.playSound('gameEnd')
      }
    }

    // Game started - play start sound
    if (gameState.phase === 'round1' && previousGameState.phase !== 'round1') {
      if (preferences.soundEnabled && soundReady) {
        soundManager.playSound('gameStart')
      }
    }

    setPreviousGameState(gameState)
  }, [gameState, previousGameState, playerId, preferences.statisticsEnabled, preferences.soundEnabled, soundReady, statistics, updateStatistics])

  // Poll for game state updates
  const pollGameState = useCallback(async () => {
    if (!roomId) return

    try {
      setConnectionStatus('connecting')
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/game/${roomId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()
      if (data.success) {
        setGameState(data.gameState)
        setError('')
        setConnectionStatus('connected')
      } else {
        console.error('Failed to get game state:', data.error)
        setConnectionStatus('disconnected')
      }
    } catch (error) {
      console.error('Error polling game state:', error)
      setConnectionStatus('disconnected')
    }
  }, [roomId])

  // Set up polling when connected
  useEffect(() => {
    if (!isConnected || !roomId) return

    // Poll more frequently during active phases
    const interval = setInterval(pollGameState, 1000)
    return () => clearInterval(interval)
  }, [isConnected, roomId, pollGameState])

  const createRoom = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/create-room`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await response.json()
      if (data.success) {
        setRoomId(data.roomId)
        setGameState(data.gameState)
        
        // Auto-join as player 1
        await joinRoom(data.roomId, playerName || 'Player 1')
      } else {
        setError(data.error || 'Failed to create room')
      }
    } catch (error) {
      console.error('Error creating room:', error)
      setError('Failed to create room')
    } finally {
      setIsLoading(false)
    }
  }

  const joinRoom = async (targetRoomId?: string, targetPlayerName?: string) => {
    const roomToJoin = targetRoomId || roomId
    const nameToUse = targetPlayerName || playerName
    
    if (!roomToJoin || !nameToUse) {
      setError('Please enter room ID and player name')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/join-room`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomId: roomToJoin,
            playerName: nameToUse
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        setRoomId(roomToJoin)
        setPlayerId(data.playerId)
        setGameState(data.gameState)
        setIsConnected(true)
        setError('')
        setConnectionStatus('connected')
      } else {
        setError(data.error || 'Failed to join room')
      }
    } catch (error) {
      console.error('Error joining room:', error)
      setError('Failed to join room')
    } finally {
      setIsLoading(false)
    }
  }

  const startShuffle = async () => {
    if (!roomId || !playerId) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/start-shuffle`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomId,
            playerId
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        setGameState(data.gameState)
        setError('')
      } else {
        setError(data.error || 'Failed to start shuffle')
        if (preferences.soundEnabled && soundReady) {
          soundManager.playSound('error')
        }
      }
    } catch (error) {
      console.error('Error starting shuffle:', error)
      setError('Failed to start shuffle')
      if (preferences.soundEnabled && soundReady) {
        soundManager.playSound('error')
      }
    }
  }

  const selectFaceUpCards = async (cardIds: string[]) => {
    if (!roomId || !playerId) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/select-face-up-cards`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomId,
            playerId,
            cardIds
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        setGameState(data.gameState)
        setError('')
      } else {
        setError(data.error || 'Failed to select face-up cards')
        if (preferences.soundEnabled && soundReady) {
          soundManager.playSound('error')
        }
      }
    } catch (error) {
      console.error('Error selecting face-up cards:', error)
      setError('Failed to select face-up cards')
      if (preferences.soundEnabled && soundReady) {
        soundManager.playSound('error')
      }
    }
  }

  const playCard = async (cardId: string, action: string, targetCards?: string[], buildValue?: number) => {
    if (!roomId || !playerId) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/play-card`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomId,
            playerId,
            cardId,
            action,
            targetCards,
            buildValue
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        setGameState(data.gameState)
        setError('')
      } else {
        setError(data.error || 'Failed to play card')
        if (preferences.soundEnabled && soundReady) {
          soundManager.playSound('error')
        }
      }
    } catch (error) {
      console.error('Error playing card:', error)
      setError('Failed to play card')
      if (preferences.soundEnabled && soundReady) {
        soundManager.playSound('error')
      }
    }
  }

  const resetGame = async () => {
    if (!roomId) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-48645a41/reset-game`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            roomId
          })
        }
      )

      const data = await response.json()
      if (data.success) {
        setGameState(data.gameState)
        setError('')
        setPreviousGameState(null) // Reset previous state
      } else {
        setError(data.error || 'Failed to reset game')
      }
    } catch (error) {
      console.error('Error resetting game:', error)
      setError('Failed to reset game')
    }
  }

  const disconnectGame = () => {
    setIsConnected(false)
    setGameState(null)
    setPlayerId(null)
    setRoomId('')
    setError('')
    setConnectionStatus('disconnected')
  }

  if (!isConnected) {
    return (
      <>
        <SoundSystem onSoundReady={() => setSoundReady(true)} />
        <RoomManager
          roomId={roomId}
          setRoomId={setRoomId}
          playerName={playerName}
          setPlayerName={setPlayerName}
          onCreateRoom={createRoom}
          onJoinRoom={() => joinRoom()}
          error={error}
          isLoading={isLoading}
        />
      </>
    )
  }

  if (!gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 flex items-center justify-center">
        <Card className="backdrop-blur-sm bg-white/90 shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">Loading Game...</h3>
            <p className="text-gray-600">Connecting to room {roomId}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Get current scores for header display
  const myScore = playerId === 1 ? gameState.player1Score : gameState.player2Score
  const opponentScore = playerId === 1 ? gameState.player2Score : gameState.player1Score
  const myName = gameState.players.find(p => p.id === playerId)?.name || 'You'
  const opponentName = gameState.players.find(p => p.id !== playerId)?.name || 'Opponent'

  return (
    <>
      <SoundSystem onSoundReady={() => setSoundReady(true)} />
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 relative">
        {/* Decorative Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-10 transform rotate-12">
            <Heart className="w-16 h-16 text-red-300" />
          </div>
          <div className="absolute top-40 right-20 transform -rotate-45">
            <Spade className="w-14 h-14 text-gray-300" />
          </div>
          <div className="absolute bottom-32 left-16 transform rotate-45">
            <Diamond className="w-18 h-18 text-red-300" />
          </div>
          <div className="absolute bottom-20 right-10 transform -rotate-12">
            <Club className="w-16 h-16 text-gray-300" />
          </div>
        </div>

        <div className="relative z-10 p-4">
          <div className="max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Game Info */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full blur opacity-30"></div>
                      <div className="relative bg-white rounded-full p-2 shadow-lg">
                        <Crown className="w-8 h-8 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">Cassino</h1>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {gameState.roomId}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span className="flex items-center">
                          {connectionStatus === 'connected' ? (
                            <Wifi className="w-4 h-4 mr-1 text-green-600" />
                          ) : connectionStatus === 'connecting' ? (
                            <Clock className="w-4 h-4 mr-1 text-yellow-600 animate-spin" />
                          ) : (
                            <WifiOff className="w-4 h-4 mr-1 text-red-600" />
                          )}
                          {connectionStatus === 'connected' ? 'Connected' : 
                           connectionStatus === 'connecting' ? 'Connecting...' : 
                           'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Player vs Player */}
                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">{myName}</div>
                      <Badge 
                        variant="default" 
                        className="text-lg px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg"
                      >
                        <Trophy className="w-4 h-4 mr-1" />
                        {myScore}/11
                      </Badge>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-400">VS</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-1">{opponentName}</div>
                      <Badge 
                        variant="secondary" 
                        className="text-lg px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg"
                      >
                        <Trophy className="w-4 h-4 mr-1" />
                        {opponentScore}/11
                      </Badge>
                    </div>
                  </div>

                  {/* Game Status & Settings */}
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-800">
                          {gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)}
                        </span>
                      </div>
                      {gameState.round > 0 && (
                        <div className="text-xs text-gray-600">
                          Round {gameState.round}/2
                        </div>
                      )}
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex items-center space-x-2">
                      <GameSettings
                        preferences={preferences}
                        onPreferencesChange={setPreferences}
                        statistics={preferences.statisticsEnabled ? statistics : undefined}
                      />
                      <Button
                        onClick={disconnectGame}
                        variant="outline"
                        size="sm"
                        className="border-gray-300 text-gray-600 hover:bg-gray-50"
                      >
                        Leave Game
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Waiting for Players */}
            {gameState.phase === 'waiting' && (
              <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0">
                <CardContent className="p-8">
                  <div className="text-center">
                    <div className="mb-6">
                      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-full px-6 py-3">
                        <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
                        <span className="text-blue-800 font-medium">Waiting for players...</span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <p className="text-xl text-gray-700 mb-4">
                        {gameState.players.length}/2 players joined
                      </p>
                      <div className="flex justify-center space-x-3">
                        {gameState.players.map(player => (
                          <div key={player.id} className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-4 py-2 border border-emerald-200">
                            <span className="text-emerald-800 font-medium">{player.name}</span>
                          </div>
                        ))}
                        {gameState.players.length < 2 && (
                          <div className="bg-gray-100 rounded-full px-4 py-2 border-2 border-dashed border-gray-300">
                            <span className="text-gray-500">Waiting...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 mb-6">
                      <p className="text-gray-700 mb-2">
                        Share this room code with another player:
                      </p>
                      <div className="inline-flex items-center bg-white rounded-lg px-4 py-2 shadow-sm border">
                        <code className="text-2xl font-mono font-bold text-emerald-600 tracking-wider">
                          {gameState.roomId}
                        </code>
                      </div>
                    </div>

                    {/* Enhanced Game Rules */}
                    <div className="grid md:grid-cols-2 gap-6 text-left">
                      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                        <h3 className="font-bold text-emerald-800 mb-3 flex items-center">
                          <Trophy className="w-5 h-5 mr-2" />
                          Scoring System
                        </h3>
                        <div className="space-y-2 text-sm text-emerald-700">
                          <div className="flex justify-between">
                            <span>Each Ace (♠♥♦♣)</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">1 pt</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>2 of Spades (2♠)</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">1 pt</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>10 of Diamonds (10♦)</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">2 pts</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Most cards captured</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">2 pts</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Most spades captured</span>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">2 pts</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4">
                        <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                          <Star className="w-5 h-5 mr-2" />
                          How to Play
                        </h3>
                        <div className="space-y-2 text-sm text-blue-700">
                          <p><strong>Capture:</strong> Match your card value with table cards</p>
                          <p><strong>Build:</strong> Combine table cards to create a sum you can capture</p>
                          <p><strong>Trail:</strong> Place a card on the table when you can't capture</p>
                          <div className="mt-3 p-2 bg-orange-100 rounded-md border-l-4 border-orange-400">
                            <p className="text-orange-800 font-medium text-xs">
                              ⚠️ You can only build values that you have cards in hand to capture!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Player Statistics */}
                    {preferences.statisticsEnabled && statistics.gamesPlayed > 0 && (
                      <div className="mt-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4">
                        <h4 className="font-bold text-purple-800 mb-3 flex items-center justify-center">
                          <Crown className="w-5 h-5 mr-2" />
                          Your Game Statistics
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{statistics.gamesPlayed}</div>
                            <div className="text-xs text-purple-500">Games</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{statistics.gamesWon}</div>
                            <div className="text-xs text-green-500">Wins</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-blue-600">
                              {((statistics.gamesWon / statistics.gamesPlayed) * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-blue-500">Win Rate</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-yellow-600">{statistics.bestScore}</div>
                            <div className="text-xs text-yellow-500">Best Score</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Game Phases */}
            {gameState.phase !== 'waiting' && playerId && (
              <GamePhases
                gameState={gameState}
                playerId={playerId}
                onStartShuffle={startShuffle}
                onSelectFaceUpCards={selectFaceUpCards}
                onPlayCard={playCard}
                onResetGame={resetGame}
                preferences={preferences}
              />
            )}
          </div>
        </div>
      </div>
    </>
  )
}