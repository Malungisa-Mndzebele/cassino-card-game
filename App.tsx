import React, { useState, useEffect, useCallback } from 'react'
import { GamePhases } from './components/GamePhases'
import { RoomManager } from './components/RoomManager'
import { GameSettings, useGamePreferences, useGameStatistics } from './components/GameSettings'
import { SoundSystem, soundManager } from './components/SoundSystem'
import { AppHeader } from './components/app/AppHeader'
import { Decor } from './components/app/Decor'
import { api, useMutation, useQuery } from './apiClient'
import { CasinoRoomView } from './components/CasinoRoomView'
import { PokerTableView } from './components/PokerTableView'
import type { GameState } from './apiClient'
import { getWebSocketUrl } from './utils/config'

export default function App() {
  // Game state management
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [countdownInterval, setCountdownInterval] = useState<NodeJS.Timeout | null>(null);
  const [previousGameState, setPreviousGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  
  // UI state
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Helpers to normalize API responses and broadcast updates
  const extractGameState = useCallback((payload: any): GameState | null => {
    if (!payload) return null;
    // Check if payload is wrapped in game_state/gameState
    if ((payload as any).gameState) return (payload as any).gameState as GameState;
    if ((payload as any).game_state) return (payload as any).game_state as GameState;
    if ((payload as any).data?.gameState) return (payload as any).data.gameState as GameState;
    if ((payload as any).data?.game_state) return (payload as any).data.game_state as GameState;
    // Check if payload IS a game state (has roomId/room_id and phase)
    if ((payload as any).roomId || (payload as any).room_id) {
      // This is a direct game state response, convert it to GameState format
      const state = payload as any;
      if (state.phase !== undefined || state.players !== undefined) {
        return state as GameState;
      }
    }
    return null;
  }, []);

  const applyResponseState = useCallback((payload: any) => {
    const next = extractGameState(payload);
    if (next) setGameState(next);
  }, [extractGameState]);

  const notifyRoomUpdate = useCallback(() => {
    try {
      if (ws && ws.readyState === WebSocket.OPEN && roomId) {
        ws.send(JSON.stringify({ type: 'state_update', roomId }));
      }
    } catch {
      /* noop */
    }
  }, [ws, roomId]);

  // Derive connection state from connection status and game state
  const isConnected = connectionStatus === 'connected' && gameState !== null && roomId !== '';
  
  // Helper function to determine if current player is player 1 or 2
  const isPlayer1 = useCallback(() => {
    if (!gameState || !playerId) return false;
    const players = gameState.players || [];
    if (players.length === 0) return false;
    
    // Sort players by joined_at to determine order
    const sortedPlayers = [...players].sort((a, b) => 
      new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    );
    
    // First player (by join time) is player 1
    return sortedPlayers[0]?.id === playerId;
  }, [gameState, playerId]);

    // Game preferences and statistics
  const defaultPreferences = {
    soundEnabled: true,
    soundVolume: 1,
    hintsEnabled: true,
    statisticsEnabled: true
  };
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
      
             // Use the API mutation
      const response = await createRoomMutation({ player_name: playerName });
      
      if (!response) {
        throw new Error("Failed to create room");
      }
      
      setRoomId((response as any).roomId);
      setPlayerId((response as any).playerId);
      applyResponseState(response);
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
  const joinRandomRoomMutation = useMutation(api.joinRandomRoom.joinRandomRoom);
  const setPlayerReadyMutation = useMutation(api.setPlayerReady.setPlayerReady);
  
  const joinRoom = async (targetRoomId?: string, targetPlayerName?: string) => {
    const roomToJoin = targetRoomId || roomId;
    const nameToUse = targetPlayerName || playerName;
    
    console.log('🚀 Joining room:', { roomToJoin, nameToUse });
    
    // Add defensive checks
    if (!roomToJoin || typeof roomToJoin !== 'string') {
      setError('Please enter a valid room ID');
      return;
    }
    
    if (!nameToUse || typeof nameToUse !== 'string') {
      setError('Please enter a valid player name');
      return;
    }
    
    if (!roomToJoin.trim() || !nameToUse.trim()) {
      setError('Please enter room ID and player name');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      setConnectionStatus('connecting');
      
             // Use the actual API mutation
      const response = await joinRoomMutation({ 
        room_id: roomToJoin.trim(), 
        player_name: nameToUse.trim() 
      });
      
      console.log('✅ Join room response:', response);
      
      if (!response) {
        throw new Error("Failed to join room");
      }
      
      setRoomId(roomToJoin.trim());
      setPlayerId((response as any).playerId);
      applyResponseState(response);
      setConnectionStatus('connected');
       
       console.log('🎯 State after join:', {
         roomId: roomToJoin.trim(),
         playerId: (response as any).playerId,
         gameState: (response as any).gameState,
         connectionStatus: 'connected'
       });
      
      console.log('🎯 Updated game state:', {
        phase: (response as any).gameState.phase,
        players: (response as any).gameState.players?.length || 0,
        shouldShowDealer: (response as any).gameState.phase === 'dealer'
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

  const joinRandomRoom = async (targetPlayerName?: string) => {
    const nameToUse = targetPlayerName || playerName;
    
    console.log('🎲 Joining random room:', { nameToUse });
    
    // Add defensive checks
    if (!nameToUse || typeof nameToUse !== 'string') {
      setError('Please enter a valid player name');
      return;
    }
    
    if (!nameToUse.trim()) {
      setError('Please enter your player name');
      return;
    }
    
    setIsLoading(true);
    setError('');
    try {
      setConnectionStatus('connecting');
      
      // Use the random room join API mutation
      const response = await joinRandomRoomMutation({ 
        player_name: nameToUse.trim() 
      });
      
      console.log('✅ Join random room response:', response);
      
      if (!response) {
        throw new Error("Failed to join random room");
      }
      
      const joinedRoomId = (response as any).gameState?.roomId || (response as any).gameState?.room_id;
      setRoomId(joinedRoomId || '');
      setPlayerId((response as any).playerId);
      applyResponseState(response);
      setConnectionStatus('connected');
       
      console.log('🎯 State after random join:', {
        roomId: joinedRoomId,
        playerId: (response as any).playerId,
        gameState: (response as any).gameState,
        connectionStatus: 'connected'
      });
      
      console.log('🎯 Updated game state:', {
        phase: (response as any).gameState?.phase,
        players: (response as any).gameState?.players?.length || 0,
        shouldShowDealer: (response as any).gameState?.phase === 'dealer'
      });
    } catch (error: any) {
      console.error("❌ Error joining random room:", error);
      console.error("Error details:", {
        message: error.message,
        stack: error.stack,
        playerName: nameToUse
      });
      const errorMsg = error?.message || String(error);
      setError(errorMsg);
      setConnectionStatus('disconnected');
    } finally {
      setIsLoading(false);
    }
  };

  // WebSocket: connect when we have a roomId; receive notifications and refresh state
  useEffect(() => {
    if (!roomId) return;

    // Use centralized config for WebSocket URL
    const wsUrl = getWebSocketUrl(roomId);

    try {
      const socket = new WebSocket(wsUrl);
      setWs(socket);

      socket.onmessage = async () => {
        try {
          if (!roomId) return;
          const res = await api.getGameState.getGameState({ room_id: roomId });
          applyResponseState(res);
        } catch {
          /* noop */
        }
      };

      socket.onclose = () => {
        setWs(null);
      };

      return () => {
        try { socket.close(); } catch {
          /* noop */
        }
      };
    } catch {
      /* noop */
    }
  }, [roomId, applyResponseState]);

  // Track game state changes for statistics and sound effects
  useEffect(() => {
    if (!gameState || !previousGameState || !preferences.statisticsEnabled) {
      setPreviousGameState(gameState)
      return
    }

    // Game finished - update statistics
    if (gameState.phase === 'finished' && previousGameState.phase !== 'finished' && playerId) {
      const myScore = isPlayer1() ? gameState.player1Score : gameState.player2Score
      const isWinner = gameState.winner === playerId
      const isTie = gameState.winner === null || gameState.winner === 0

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
  }, [gameState, previousGameState, playerId, preferences.statisticsEnabled, preferences.soundEnabled, soundReady, statistics, updateStatistics, isPlayer1])

  // Countdown effect when both players are ready
  useEffect(() => {
    if (gameState && gameState.player1Ready && gameState.player2Ready && countdown === null) {
      console.log('🎯 Both players ready, starting countdown!');
      setCountdown(10);
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            setCountdownInterval(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      
      setCountdownInterval(interval);
    }
    
    // Cleanup interval on unmount or when game state changes
    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
        setCountdownInterval(null);
      }
    };
  }, [gameState, countdown, countdownInterval]);

     // No polling needed - using real-time API subscription instead

  // Real-time game state subscription - only when we have a valid roomId AND we're actually in the game
  const gameStateData = useQuery(
    api.getGameState.getGameState, 
    roomId && roomId.trim() && roomId.length > 0 && roomId !== '' && playerId ? { room_id: roomId } : "skip"
  );
  
  // Update local game state when API data changes
  useEffect(() => {
    if (gameStateData && roomId) {
      // getGameState returns GameState directly (not wrapped)
      const state = extractGameState(gameStateData);
      if (import.meta.env.DEV) {
        console.log('🔄 Game state updated from API:', {
          phase: state?.phase,
          players: state?.players?.length || 0,
          roomId: state?.roomId
        });
      }
      applyResponseState(gameStateData);
      setConnectionStatus('connected');
    }
  }, [gameStateData, roomId, applyResponseState, extractGameState]);

  // useQuery handles polling automatically

  // startShuffle is not used in current flow; leave implementation commented to avoid unused warnings

  const selectFaceUpCards = async (cardIds: string[]) => {
    if (!roomId || !playerId) return;
    try {
      const response = await api.selectFaceUpCards.selectFaceUpCards({ room_id: roomId, player_id: playerId, card_ids: cardIds || [] });
      if (response) {
        applyResponseState(response);
        notifyRoomUpdate();
      }
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to select face-up cards');
    }
  };

  const playCard = async (cardId: string, action: string, targetCards?: string[], buildValue?: number) => {
    if (!roomId || !playerId) return;
    try {
      const response = await api.playCard.playCard({ room_id: roomId, player_id: playerId, card_id: cardId, action, target_cards: targetCards, build_value: buildValue });
      if (response) {
        applyResponseState(response);
        notifyRoomUpdate();
      }
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to play card');
    }
  };

  const resetGame = async () => {
    if (!roomId) return;
    try {
      const response = await api.resetGame.resetGame({ room_id: roomId });
      const next = extractGameState(response);
      setGameState(next || null);
      setPreviousGameState(null);
      notifyRoomUpdate();
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to reset game');
    }
  };

  // Manual shuffle function - called when Player 1 clicks "Shuffle the Deck"
  const startShuffle = async () => {
    if (!roomId || !playerId || !isPlayer1()) return;
    try {
      // First start the shuffle
      const shuffleResponse = await api.startShuffle.startShuffle({ room_id: roomId, player_id: playerId });
      if (shuffleResponse) {
        applyResponseState(shuffleResponse);
        notifyRoomUpdate();
      }
      
      // Then proceed to select face-up cards (or deal directly)
          const response = await api.selectFaceUpCards.selectFaceUpCards({ room_id: roomId, player_id: playerId, card_ids: [] });
          if (response) {
        applyResponseState(response);
        notifyRoomUpdate();
      }
      setError('');
    } catch (e: any) {
      setError(e?.message || 'Failed to start shuffle');
            }
  };

  // Don't auto-start shuffle - let Player 1 click the button manually
  // Removed auto-trigger to allow manual shuffle button click

  const disconnectGame = () => {
    setConnectionStatus('disconnected')
    setGameState(null)
    setPlayerId(null)
    setRoomId('')
    setError('')
  }

  // Get current scores for header display
        const myScore = isPlayer1() ? gameState?.player1Score ?? 0 : gameState?.player2Score ?? 0;
      const opponentScore = isPlayer1() ? gameState?.player2Score ?? 0 : gameState?.player1Score ?? 0;
  const myName = gameState?.players?.find(p => p.id === playerId)?.name || 'You';
  const opponentName = gameState?.players?.find(p => p.id !== playerId)?.name || 'Opponent';

  return (
    <>
      <SoundSystem onSoundReady={() => setSoundReady(true)} />
      

      
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
        {error && (
          <div data-testid="error-message" className="absolute top-16 left-1/2 transform -translate-x-1/2 z-40 max-w-md w-full mx-4">
            <div className="backdrop-casino border border-casino-red/30 rounded-lg p-3 shadow-casino">
              <p className="text-casino-red-light font-medium text-center">{error}</p>
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
                    roomId={roomId}
                    setRoomId={setRoomId}
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    onCreateRoom={createRoom}
                    onJoinRoom={joinRoom}
                    onJoinRandomRoom={() => joinRandomRoom(playerName)}
                    error={error}
                    isLoading={isLoading}
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
            {gameState?.phase !== 'round1' && gameState?.phase !== 'round2' && (
              <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto">
                  <AppHeader
                    roomId={gameState?.roomId || ''}
                    connectionStatus={connectionStatus}
                    myName={myName}
                    opponentName={opponentName}
                    myScore={myScore}
                    opponentScore={opponentScore}
                    phase={gameState?.phase}
                    round={gameState?.round}
                    onLeave={disconnectGame}
                  />
                </div>
              </div>
            )}

            {/* Casino Room View - Show for both waiting and dealer phases */}
            {(gameState?.phase === 'waiting' || gameState?.phase === 'dealer') && gameState && playerId && (
              <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto">
                  <CasinoRoomView
                    roomId={gameState.roomId}
                    players={(gameState.players || []).map(p => ({ id: p.id, name: p.name }))}
                    player1Ready={gameState.player1Ready || false}
                    player2Ready={gameState.player2Ready || false}
                    playerId={playerId}
                    onPlayerReady={async () => {
                      if (!roomId || !playerId) return;
                      try {
                        const response = await setPlayerReadyMutation({ 
                          room_id: roomId, 
                          player_id: playerId, 
                          is_ready: true 
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
                          room_id: roomId, 
                          player_id: playerId, 
                          is_ready: false 
                        });
                        if (response) {
                          setGameState(response.gameState);
                        }
                      } catch (error: any) {
                        console.error('Error setting player not ready:', error);
                        setError(error?.message || 'Failed to set player ready status');
                      }
                    }}
                    onStartShuffle={gameState?.phase === 'dealer' && (gameState.player1Ready && gameState.player2Ready) ? startShuffle : undefined}
                  />
                </div>
              </div>
            )}

            {/* Poker Table View - For round1 and round2 phases - Full screen immersive experience */}
            {(gameState?.phase === 'round1' || gameState?.phase === 'round2') && gameState && playerId && (
              <PokerTableView
                gameState={gameState}
                playerId={playerId}
                onPlayCard={playCard}
                onLeave={disconnectGame}
              />
            )}

            {/* Game Phases - For other phases like cardSelection, dealing, finished */}
            {gameState?.phase && 
             gameState.phase !== 'waiting' && 
             gameState.phase !== 'dealer' &&
             gameState.phase !== 'round1' && 
             gameState.phase !== 'round2' && 
             playerId && (
              <div className="relative z-10 p-4">
                <div className="max-w-6xl mx-auto">
                  <GamePhases
                    gameState={gameState}
                    playerId={playerId}
                    onSelectFaceUpCards={selectFaceUpCards}
                    onPlayCard={playCard}
                    onResetGame={resetGame}
                    onPlayerReady={async () => {
                      if (!roomId || !playerId) return;
                      try {
                        const response = await setPlayerReadyMutation({ 
                           room_id: roomId, 
                           player_id: playerId, 
                           is_ready: true 
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
                           room_id: roomId, 
                           player_id: playerId, 
                           is_ready: false 
                        });
                        if (response) {
                          setGameState(response.gameState);
                        }
                      } catch (error: any) {
                        console.error('Error setting player not ready:', error);
                        setError(error?.message || 'Failed to set player ready status');
                      }
                    }}
                    onStartShuffle={startShuffle}
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