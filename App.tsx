import React, { useState, useEffect, useCallback } from 'react'
import { GamePhases } from './components/GamePhases'
import { RoomManager } from './components/RoomManager'
import { GameSettings, useGamePreferences, useGameStatistics } from './components/GameSettings'
import { SoundSystem, soundManager } from './components/SoundSystem'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Separator } from './components/ui/separator'
import { convex } from './convexClient'
import { api } from './convex/_generated/api'
import { useMutation } from 'convex/react'
import { Trophy, Users, Clock, Heart, Diamond, Spade, Club, Crown, Star, Wifi, WifiOff } from 'lucide-react'

// Game-related interfaces
interface Player {
  id: number;
  name: string;
}

interface GameCard {
  id: string;
  suit: string;
  rank: string;
}

interface Build {
  id: string;
  owner: number;
  cards: GameCard[];
  value: number;
}

interface LastPlay {
  cardId: string;
  action: string;
  targetCards?: string[];
  buildValue?: number;
}

interface GamePreferences {
  soundEnabled: boolean;
  soundVolume: number;
  hintsEnabled: boolean;
  statisticsEnabled: boolean;
}

interface GameState {
  roomId: string;
  players: Player[];
  phase: string;
  round: number;
  deck: GameCard[];
  player1Hand: GameCard[];
  player2Hand: GameCard[];
  tableCards: GameCard[];
  builds: Build[];
  player1Captured: GameCard[];
  player2Captured: GameCard[];
  player1Score: number;
  player2Score: number;
  currentTurn: number;
  cardSelectionComplete: boolean;
  shuffleComplete: boolean;
  countdownStartTime: string | null;
  countdownRemaining?: number;
  gameStarted: boolean;
  lastPlay: LastPlay | null;
  lastAction?: string;
  lastUpdate: string;
  gameCompleted: boolean;
  winner: number | string | null;
  dealingComplete: boolean;
  player1Ready: boolean;
  player2Ready: boolean;
}

const initialGameState: GameState = {
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
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [previousGameState, setPreviousGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  
  // UI state
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');

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
const [preferences, setPreferences] = useGamePreferences(defaultPreferences)
  const [statistics, updateStatistics] = useGameStatistics();

  // Update sound manager volume when preferences change
  useEffect(() => {
    if (soundReady) {
      soundManager.setMasterVolume(preferences.soundEnabled ? preferences.soundVolume : 0)
    }
  }, [preferences.soundEnabled, preferences.soundVolume, soundReady])

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
      const response = await createRoomMutation({ playerName });
      
      if (!response) {
        throw new Error("Failed to create room");
      }
      
      setRoomId(response.roomId);
      setPlayerId(1);
      setGameState(response.gameState);
      setConnectionStatus('connected');
    } catch (error: any) {
      console.error("Error creating room:", error);
      const errorMsg = error?.message || String(error);
      setError(`Network error`); // Using a generic error message for network issues
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoomMutation = useMutation(api.joinRoom.joinRoom);
  const joinRoom = async (targetRoomId?: string, targetPlayerName?: string) => {
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
      const data = await joinRoomMutation({ 
        roomId: roomToJoin, 
        playerName: nameToUse 
      });
      
      if (!data.playerId || !data.gameState) {
        throw new Error('Failed to join room');
      }

      setRoomId(roomToJoin);
      setPlayerId(data.playerId);
      setGameState(data.gameState);
      setConnectionStatus('connected');
    } catch (error: any) {
      console.error('Error joining room:', error);
      const errorMsg = error?.message || error;
      setError(`Failed to join room - ${errorMsg}`);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

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

  // Poll for game state updates (Convex or local mock)
  const pollGameState = useCallback(async () => {
    if (!roomId) return;
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
    if (!isConnected || !roomId) return

    // Poll more frequently during active phases
    const interval = setInterval(pollGameState, 1000)
    return () => clearInterval(interval)
  }, [isConnected, roomId, pollGameState])

  const startShuffle = async () => {
    if (!roomId || !playerId) return;
    // TODO: Replace with Convex mutation
    setGameState((prev) => prev ? {
      ...prev,
      shuffleComplete: true
    } : null);
    setError('');
  };

  const selectFaceUpCards = async (cardIds: string[]) => {
    if (!roomId || !playerId) return;
    // TODO: Replace with Convex mutation
    setGameState((prev) => prev ? {
      ...prev,
      cardSelectionComplete: true
    } : null);
    setError('');
  };

  const playCard = async (cardId: string, action: string, targetCards?: string[], buildValue?: number) => {
    if (!roomId || !playerId) return;
    // TODO: Replace with Convex mutation
    setGameState((prev) => prev ? {
      ...prev,
      lastPlay: { cardId, action, targetCards, buildValue }
    } : null);
    setError('');
  };

  const resetGame = async () => {
    if (!roomId) return;
    // TODO: Replace with Convex mutation
    setGameState(null);
    setPreviousGameState(null);
    setError('');
  };

  const disconnectGame = () => {
    setConnectionStatus('disconnected')
    setGameState(null)
    setPlayerId(null)
    setRoomId('')
    setError('')
  }

  // Get current scores for header display
  const myScore = playerId === 1 ? gameState?.player1Score ?? 0 : gameState?.player2Score ?? 0;
  const opponentScore = playerId === 1 ? gameState?.player2Score ?? 0 : gameState?.player1Score ?? 0;
  const myName = gameState?.players?.find(p => p.id === playerId)?.name || 'You';
  const opponentName = gameState?.players?.find(p => p.id !== playerId)?.name || 'Opponent';

  return (
    <>
      <SoundSystem onSoundReady={() => setSoundReady(true)} />
      <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 relative">
        {/* Show RoomManager if not connected */}
        {!isConnected && (
          <RoomManager
            roomId={roomId}
            setRoomId={setRoomId}
            playerName={playerName}
            setPlayerName={setPlayerName}
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            error={error}
            isLoading={isLoading}
          />
        )}

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
                          {gameState?.roomId}
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
                          {gameState?.phase ? (gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)) : ''}
                        </span>
                      </div>
                      {(gameState?.round || 0) > 0 && (
                        <div className="text-xs text-gray-600">
                          Round {gameState?.round || 0}/2
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
            {gameState?.phase === 'waiting' && gameState && (
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
                        {gameState?.players?.length || 0}/2 players joined
                      </p>
                      <div className="flex justify-center space-x-3">
                        {gameState?.players?.map(player => (
                          <div key={player.id} className="bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full px-4 py-2 border border-emerald-200">
                            <span className="text-emerald-800 font-medium">{player.name}</span>
                          </div>
                        ))}
                        {(gameState?.players?.length || 0) < 2 && (
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
                          {gameState?.roomId}
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
            {gameState?.phase !== 'waiting' && playerId && (
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
  );
}