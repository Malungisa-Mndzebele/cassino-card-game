import React, { useState, useEffect, useCallback } from 'react'
import { GamePhases } from './components/GamePhases'
import { RoomManager } from './components/RoomManager'
import { GameSettings, useGamePreferences, useGameStatistics } from './components/GameSettings'
import { SoundSystem, soundManager } from './components/SoundSystem'
import { Badge } from './components/ui/badge'
import { Button } from './components/ui/button'
import { Card, CardContent } from './components/ui/card'
import { Separator } from './components/ui/separator'
import { convex, api, useMutation, useQuery } from './convexClient'
import { Trophy, Users, Clock, Heart, Diamond, Spade, Club, Crown, Star, Wifi, WifiOff } from 'lucide-react'
import type { GameState } from './convex/types'

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

  // Derive connection state from connection status and game state
  // Temporarily force show landing page for testing
  const isConnected = false; // connectionStatus === 'connected' && gameState !== null && roomId !== '';

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
      
      // Use the convex mutation (which may be mocked in tests)
      const response = await createRoomMutation({ playerName });
      
      if (!response) {
        throw new Error("Failed to create room");
      }
      
      setRoomId(response.roomId);
      setPlayerId(1); // Player 1 is the room creator
      setGameState(response.gameState);
      setConnectionStatus('connected');
    } catch (error: any) {
      console.error("Error creating room:", error);
      const errorMsg = error?.message || String(error);
      setError(errorMsg);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoomMutation = useMutation(api.joinRoom.joinRoom);
  const setPlayerReadyMutation = useMutation(api.setPlayerReady.setPlayerReady);
  
  const joinRoom = async (targetRoomId?: string, targetPlayerName?: string) => {
    console.log('🎯 joinRoom function called!');
    const roomToJoin = targetRoomId || roomId;
    const nameToUse = targetPlayerName || playerName;
    
    console.log('🚀 Joining room:', { roomToJoin, nameToUse });
    
    if (!roomToJoin || !nameToUse) {
      setError('Please enter room ID and player name');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      setConnectionStatus('connecting');
      
      // Use the actual Convex mutation
      const response = await joinRoomMutation({ 
        roomId: roomToJoin, 
        playerName: nameToUse 
      });
      
      console.log('✅ Join room response:', response);
      
      if (!response) {
        throw new Error("Failed to join room");
      }
      
      setRoomId(roomToJoin);
      setPlayerId(response.playerId);
      setGameState(response.gameState);
      setConnectionStatus('connected');
      
      console.log('🎯 Updated game state:', {
        phase: response.gameState.phase,
        players: response.gameState.players?.length || 0,
        shouldShowDealer: response.gameState.phase === 'dealer'
      });
    } catch (error: any) {
      console.error("❌ Error joining room:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        roomId: roomToJoin,
        playerName: nameToUse
      });
      const errorMsg = error?.message || String(error);
      setError(errorMsg);
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

  // No polling needed - using real-time Convex subscription instead

  // Real-time game state subscription - only when we have a valid roomId AND we're actually in the game
  const gameStateData = useQuery(
    api.getGameState.getGameState, 
    roomId && roomId.trim() && roomId.length > 0 && roomId !== '' && playerId ? { roomId } : "skip"
  );
  
  // Update local game state when Convex data changes
  useEffect(() => {
    if (gameStateData && gameStateData.gameState && roomId) {
      console.log('🔄 Game state updated from Convex:', {
        phase: gameStateData.gameState.phase,
        players: gameStateData.gameState.players?.length || 0,
        roomId: gameStateData.gameState.roomId
      });
      setGameState(gameStateData.gameState);
      setConnectionStatus('connected');
    }
  }, [gameStateData, roomId]);

  // Force refresh game state every 2 seconds to catch real-time updates
  useEffect(() => {
    if (roomId && playerId && connectionStatus === 'connected') {
      const interval = setInterval(() => {
        console.log('🔄 Periodic game state refresh for room:', roomId);
        // The useQuery will automatically refetch
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [roomId, playerId, connectionStatus]);

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
        {/* Global Settings - Always Available */}
        <div className="absolute top-4 right-4 z-50" data-testid="game-settings">
          <GameSettings
            preferences={preferences}
            onPreferencesChange={setPreferences}
            statistics={preferences.statisticsEnabled ? statistics : undefined}
          />
        </div>

        {/* Global Statistics Display */}
        {preferences.statisticsEnabled && (
          <div data-testid="statistics" className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
            <div className="text-sm font-medium text-gray-800">Games: {statistics.gamesPlayed}</div>
          </div>
        )}

        {/* Global Error Display */}
        {error && (
          <div data-testid="error-message" className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 shadow-lg">
              <p className="text-red-700 font-medium text-center">{error}</p>
            </div>
          </div>
        )}

        {/* Show RoomManager if not connected */}
        {!isConnected ? (
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
        ) : (
          <>
            {/* Enhanced Decorative Background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-10 transform rotate-12 floating">
                <Heart className="w-20 h-20 text-casino-red-light glow-casino" />
              </div>
              <div className="absolute top-40 right-20 transform -rotate-45 floating" style={{ animationDelay: '1s' }}>
                <Spade className="w-18 h-18 text-gray-300 glow-casino" />
              </div>
              <div className="absolute bottom-32 left-16 transform rotate-45 floating" style={{ animationDelay: '2s' }}>
                <Diamond className="w-22 h-22 text-casino-blue-light glow-casino" />
              </div>
              <div className="absolute bottom-20 right-10 transform -rotate-12 floating" style={{ animationDelay: '3s' }}>
                <Club className="w-20 h-20 text-gray-300 glow-casino" />
              </div>
              <div className="absolute top-1/2 left-1/4 transform -rotate-12 floating" style={{ animationDelay: '0.5s' }}>
                <Crown className="w-16 h-16 text-casino-gold glow-gold" />
              </div>
              <div className="absolute top-1/3 right-1/3 transform rotate-45 floating" style={{ animationDelay: '1.5s' }}>
                <Star className="w-14 h-14 text-casino-purple-light glow-casino" />
              </div>
            </div>

            <div className="relative z-10 p-4">
              <div className="max-w-6xl mx-auto">
            {/* Enhanced Header */}
            <Card className="backdrop-blur-sm bg-white/95 shadow-2xl border-0 mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  {/* Game Info */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <div className="absolute -inset-2 bg-gradient-to-r from-casino-gold via-casino-purple to-casino-blue rounded-full blur-lg opacity-50 animate-pulse-slow"></div>
                      <div className="relative backdrop-casino-dark rounded-full p-4 shadow-gold">
                        <Crown className="w-10 h-10 text-casino-gold glow-gold" />
                      </div>
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-black text-gradient-casino mb-2">Cassino</h1>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="flex items-center backdrop-casino-dark px-3 py-1.5 rounded-full shadow-casino">
                          <Users className="w-4 h-4 mr-2 text-casino-blue" />
                          <span className="font-medium text-white">{gameState?.roomId}</span>
                        </span>
                        <Separator orientation="vertical" className="h-4 bg-casino-gold/30" />
                        <span className="flex items-center backdrop-casino-dark px-3 py-1.5 rounded-full shadow-casino">
                          {connectionStatus === 'connected' ? (
                            <Wifi className="w-4 h-4 mr-2 text-casino-green-light" />
                          ) : connectionStatus === 'connecting' ? (
                            <Clock className="w-4 h-4 mr-2 text-casino-gold animate-spin" />
                          ) : (
                            <WifiOff className="w-4 h-4 mr-2 text-casino-red-light" />
                          )}
                          <span className="font-medium text-white">
                            {connectionStatus === 'connected' ? 'Connected' : 
                             connectionStatus === 'connecting' ? 'Connecting...' : 
                             'Disconnected'}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Score Display */}
                  <div className="flex items-center space-x-8">
                    <div className="text-center backdrop-casino-dark rounded-xl px-6 py-4 shadow-casino border border-casino-gold/20">
                      <div className="text-sm font-medium text-casino-gold mb-2 uppercase tracking-wider">{myName}</div>
                      <div className="flex items-center justify-center space-x-2">
                        <Trophy className="w-5 h-5 text-casino-gold" />
                        <span className="text-2xl font-black text-gradient-gold">{myScore}</span>
                        <span className="text-lg font-medium text-white/60">/11</span>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-black text-white/30 shimmer">VS</div>
                    </div>
                    
                    <div className="text-center backdrop-casino-dark rounded-xl px-6 py-4 shadow-casino border border-casino-blue/20">
                      <div className="text-sm font-medium text-casino-blue mb-2 uppercase tracking-wider">{opponentName}</div>
                      <div className="flex items-center justify-center space-x-2">
                        <Trophy className="w-5 h-5 text-casino-blue" />
                        <span className="text-2xl font-black text-gradient-casino">{opponentScore}</span>
                        <span className="text-lg font-medium text-white/60">/11</span>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Game Status & Settings */}
                  <div className="flex items-center space-x-4">
                    <div className="text-right backdrop-casino-dark rounded-xl px-4 py-3 shadow-casino border border-casino-purple/20">
                      <div className="flex items-center space-x-2 mb-1">
                        <Star className="w-4 h-4 text-casino-purple glow-casino" />
                        <span className="text-sm font-medium text-white">
                          {gameState?.phase ? (gameState.phase.charAt(0).toUpperCase() + gameState.phase.slice(1)) : 'Waiting'}
                        </span>
                      </div>
                      {(gameState?.round || 0) > 0 && (
                        <div className="text-xs text-casino-purple-light font-medium">
                          Round {gameState?.round || 0}/2
                        </div>
                      )}
                    </div>
                    <Separator orientation="vertical" className="h-8" />
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={disconnectGame}
                        variant="outline"
                        size="sm"
                        className="border-casino-red/50 text-casino-red hover:bg-casino-red/10 hover:border-casino-red backdrop-casino-dark shadow-casino transition-all duration-300"
                      >
                        Leave Game
                      </Button>
                    </div>
                  </div>
                </div>


              </CardContent>
            </Card>

            {/* Enhanced Waiting for Players */}
            {gameState?.phase === 'waiting' && gameState && (
              <>
                {/* Debug info */}
                <div className="fixed top-4 left-4 bg-black/80 text-white p-2 rounded text-xs z-50">
                  Debug: Phase={gameState.phase}, Players={gameState.players?.length || 0}
                </div>
              </>
            )}
            {gameState?.phase === 'waiting' && gameState && (
              <Card className="backdrop-casino border-0 shadow-casino-lg overflow-hidden">
                <CardContent className="p-10">
                  <div className="text-center">
                    <div className="mb-8">
                      <div className="inline-flex items-center space-x-3 backdrop-casino-dark rounded-2xl px-8 py-4 shadow-glow-casino border border-casino-blue/30">
                        <Clock className="w-6 h-6 text-casino-blue animate-pulse" />
                        <span className="text-white font-medium text-lg">Waiting for players...</span>
                      </div>
                    </div>

                    <div className="mb-8">
                      <p className="text-2xl text-white font-bold mb-6">
                        {gameState?.players?.length || 0}/2 players joined
                      </p>
                      <div className="flex justify-center space-x-4">
                        {gameState?.players?.map(player => (
                          <div key={player.id} className="backdrop-casino-dark rounded-xl px-6 py-3 border border-casino-green/30 shadow-casino">
                            <span className="text-casino-green-light font-medium text-lg">{player.name}</span>
                          </div>
                        ))}
                        {(gameState?.players?.length || 0) < 2 && (
                          <div className="backdrop-casino-dark rounded-xl px-6 py-3 border-2 border-dashed border-casino-gold/30 animate-pulse">
                            <span className="text-casino-gold">Waiting...</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="backdrop-casino-dark rounded-2xl p-6 mb-8 border border-casino-gold/30 shadow-glow-gold">
                      <p className="text-casino-gold font-medium mb-4 text-lg">
                        Share this room code with another player:
                      </p>
                      <div className="inline-flex items-center gradient-gold rounded-xl px-6 py-3 shadow-gold border border-casino-gold-dark">
                        <code className="text-3xl font-mono font-black text-casino-green-dark tracking-wider shimmer">
                          {gameState?.roomId}
                        </code>
                      </div>
                    </div>

                    {/* Enhanced Game Rules */}
                    <div className="grid md:grid-cols-2 gap-8 text-left">
                      <div className="backdrop-casino-dark rounded-2xl p-6 border border-casino-green/30 shadow-casino">
                        <h3 className="font-bold text-casino-green-light mb-4 flex items-center text-lg">
                          <Trophy className="w-6 h-6 mr-3 text-casino-gold glow-gold" />
                          Scoring System
                        </h3>
                        <div className="space-y-3 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-white">Each Ace (♠♥♦♣)</span>
                            <Badge className="bg-gradient-to-r from-casino-gold to-casino-gold-dark text-white border-0 shadow-gold">1 pt</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white">2 of Spades (2♠)</span>
                            <Badge className="bg-gradient-to-r from-casino-gold to-casino-gold-dark text-white border-0 shadow-gold">1 pt</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white">10 of Diamonds (10♦)</span>
                            <Badge className="bg-gradient-to-r from-casino-purple to-casino-purple-dark text-white border-0 shadow-casino">2 pts</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white">Most cards captured</span>
                            <Badge className="bg-gradient-to-r from-casino-blue to-casino-blue-dark text-white border-0 shadow-casino">2 pts</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-white">Most spades captured</span>
                            <Badge className="bg-gradient-to-r from-casino-green to-casino-green-dark text-white border-0 shadow-casino">2 pts</Badge>
                          </div>
                        </div>
                      </div>

                      <div className="backdrop-casino-dark rounded-2xl p-6 border border-casino-blue/30 shadow-casino">
                        <h3 className="font-bold text-casino-blue-light mb-4 flex items-center text-lg">
                          <Star className="w-6 h-6 mr-3 text-casino-purple glow-casino" />
                          How to Play
                        </h3>
                        <div className="space-y-3 text-sm">
                          <p className="text-white"><strong className="text-casino-blue-light">Capture:</strong> Match your card value with table cards</p>
                          <p className="text-white"><strong className="text-casino-purple-light">Build:</strong> Combine table cards to create a sum you can capture</p>
                          <p className="text-white"><strong className="text-casino-green-light">Trail:</strong> Place a card on the table when you can't capture</p>
                          <div className="mt-4 p-3 backdrop-casino border border-casino-gold/30 rounded-xl">
                            <p className="text-casino-gold font-medium text-xs flex items-center">
                              <span className="text-lg mr-2">⚠️</span>
                              You can only build values that you have cards in hand to capture!
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
            {gameState?.phase && gameState.phase !== 'waiting' && playerId && (
              <GamePhases
                gameState={gameState}
                playerId={playerId}
                onStartShuffle={startShuffle}
                onSelectFaceUpCards={selectFaceUpCards}
                onPlayCard={playCard}
                onResetGame={resetGame}
                onPlayerReady={async () => {
                  if (!roomId || !playerId) return;
                  try {
                    const response = await setPlayerReadyMutation({ 
                      roomId, 
                      playerId, 
                      isReady: true 
                    });
                    if (response) {
                      setGameState(response.gameState);
                    }
                  } catch (error: any) {
                    console.error('Error setting player ready:', error);
                    setError(error?.message || 'Failed to set player ready status');
                  }
                }}
                onPlayerNotReady={async () => {
                  if (!roomId || !playerId) return;
                  try {
                    const response = await setPlayerReadyMutation({ 
                      roomId, 
                      playerId, 
                      isReady: false 
                    });
                    if (response) {
                      setGameState(response.gameState);
                    }
                  } catch (error: any) {
                    console.error('Error setting player not ready:', error);
                    setError(error?.message || 'Failed to set player ready status');
                  }
                }}
                preferences={preferences}
              />
            )}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}