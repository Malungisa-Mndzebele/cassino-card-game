import { useState, useCallback } from 'react'
import type { GameState } from '../types/gameTypes'

/**
 * Custom hook for managing game state and related operations
 */
export function useGameState() {
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [previousGameState, setPreviousGameState] = useState<GameState | null>(null)
  const [playerId, setPlayerId] = useState<number | null>(null)
  const [roomId, setRoomId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')

  // Helper to extract and normalize game state from API responses
  const extractGameState = useCallback((payload: any): GameState | null => {
    if (!payload) return null
    
    // Helper to extract nested game state
    let state: any = null
    if ((payload as any).gameState) state = (payload as any).gameState
    else if ((payload as any).game_state) state = (payload as any).game_state
    else if ((payload as any).data?.gameState) state = (payload as any).data.gameState
    else if ((payload as any).data?.game_state) state = (payload as any).data.game_state
    else if ((payload as any).roomId || (payload as any).room_id) {
      // This is a direct game state response
      state = payload
    }
    
    if (!state || (!state.phase && !state.players)) return null
    
    // Ensure all fields are properly mapped, especially player1Ready/player2Ready
    const gameState: GameState = {
      roomId: state.roomId || state.room_id || '',
      players: state.players || [],
      phase: state.phase || 'waiting',
      round: state.round || 0,
      deck: state.deck || [],
      player1Hand: state.player1Hand || state.player1_hand || [],
      player2Hand: state.player2Hand || state.player2_hand || [],
      tableCards: state.tableCards || state.table_cards || [],
      builds: state.builds || [],
      player1Captured: state.player1Captured || state.player1_captured || [],
      player2Captured: state.player2Captured || state.player2_captured || [],
      player1Score: state.player1Score ?? state.player1_score ?? 0,
      player2Score: state.player2Score ?? state.player2_score ?? 0,
      currentTurn: state.currentTurn ?? state.current_turn ?? 1,
      cardSelectionComplete: state.cardSelectionComplete ?? state.card_selection_complete ?? false,
      shuffleComplete: state.shuffleComplete ?? state.shuffle_complete ?? false,
      countdownStartTime: state.countdownStartTime || state.countdown_start_time || null,
      gameStarted: state.gameStarted ?? state.game_started ?? false,
      lastPlay: state.lastPlay || state.last_play || null,
      lastAction: state.lastAction || state.last_action || null,
      lastUpdate: state.lastUpdate || state.last_update || new Date().toISOString(),
      gameCompleted: state.gameCompleted ?? state.game_completed ?? false,
      winner: state.winner ?? null,
      dealingComplete: state.dealingComplete ?? state.dealing_complete ?? false,
      player1Ready: state.player1Ready ?? state.player1_ready ?? false,
      player2Ready: state.player2Ready ?? state.player2_ready ?? false,
      countdownRemaining: state.countdownRemaining ?? state.countdown_remaining ?? null,
    }
    
    return gameState
  }, [])

  const applyResponseState = useCallback((payload: any) => {
    const next = extractGameState(payload)
    if (next) setGameState(next)
  }, [extractGameState])

  // Helper function to determine if current player is player 1 or 2
  const isPlayer1 = useCallback(() => {
    if (!gameState || !playerId) return false
    const players = gameState.players || []
    if (players.length === 0) return false
    
    // Sort players by joined_at to determine order
    const sortedPlayers = [...players].sort((a, b) => 
      new Date(a.joined_at).getTime() - new Date(b.joined_at).getTime()
    )
    
    // First player (by join time) is player 1
    return sortedPlayers[0]?.id === playerId
  }, [gameState, playerId])

  // Derived state
  const myScore = isPlayer1() ? gameState?.player1Score ?? 0 : gameState?.player2Score ?? 0
  const opponentScore = isPlayer1() ? gameState?.player2Score ?? 0 : gameState?.player1Score ?? 0
  const myName = gameState?.players?.find(p => p.id === playerId)?.name || 'You'
  const opponentName = gameState?.players?.find(p => p.id !== playerId)?.name || 'Opponent'

  return {
    // State
    gameState,
    setGameState,
    previousGameState,
    setPreviousGameState,
    playerId,
    setPlayerId,
    roomId,
    setRoomId,
    playerName,
    setPlayerName,
    
    // Helpers
    extractGameState,
    applyResponseState,
    isPlayer1,
    
    // Derived state
    myScore,
    opponentScore,
    myName,
    opponentName,
  }
}