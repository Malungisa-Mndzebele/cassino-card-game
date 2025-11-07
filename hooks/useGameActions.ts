import { useCallback } from 'react'
import { api, useMutation } from '../apiClient'
import type { GameState } from '../types/gameTypes'

interface UseGameActionsProps {
  roomId: string
  playerId: number | null
  applyResponseState: (payload: any) => void
  notifyRoomUpdate: () => void
  setError: (error: string) => void
  extractGameState: (payload: any) => any
  setGameState: (state: any) => void
  setPreviousGameState: (state: any) => void
}

/**
 * Custom hook for game actions (API calls)
 */
export function useGameActions({
  roomId,
  playerId,
  applyResponseState,
  notifyRoomUpdate,
  setError,
  extractGameState,
  setGameState,
  setPreviousGameState
}: UseGameActionsProps) {
  
  const setPlayerReadyMutation = useMutation(api.setPlayerReady.setPlayerReady)

  const selectFaceUpCards = useCallback(async (cardIds: string[]) => {
    if (!roomId || !playerId) return
    try {
      const response = await api.selectFaceUpCards.selectFaceUpCards({ 
        room_id: roomId, 
        player_id: playerId, 
        card_ids: cardIds || [] 
      })
      if (response) {
        applyResponseState(response)
        notifyRoomUpdate()
      }
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Failed to select face-up cards')
    }
  }, [roomId, playerId, applyResponseState, notifyRoomUpdate, setError])

  const playCard = useCallback(async (
    cardId: string, 
    action: string, 
    targetCards?: string[], 
    buildValue?: number
  ) => {
    if (!roomId || !playerId) return
    try {
      const response = await api.playCard.playCard({ 
        room_id: roomId, 
        player_id: playerId, 
        card_id: cardId, 
        action, 
        target_cards: targetCards, 
        build_value: buildValue 
      })
      if (response) {
        applyResponseState(response)
        notifyRoomUpdate()
      }
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Failed to play card')
    }
  }, [roomId, playerId, applyResponseState, notifyRoomUpdate, setError])

  const resetGame = useCallback(async () => {
    if (!roomId) return
    try {
      const response = await api.resetGame.resetGame({ room_id: roomId })
      const next = extractGameState(response)
      setGameState(next || null)
      setPreviousGameState(null)
      notifyRoomUpdate()
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Failed to reset game')
    }
  }, [roomId, extractGameState, setGameState, setPreviousGameState, notifyRoomUpdate, setError])

  const startShuffle = useCallback(async () => {
    if (!roomId || !playerId) return
    try {
      // First start the shuffle
      const shuffleResponse = await api.startShuffle.startShuffle({ 
        room_id: roomId, 
        player_id: playerId 
      })
      if (shuffleResponse) {
        applyResponseState(shuffleResponse)
        notifyRoomUpdate()
      }
      
      // Then proceed to select face-up cards (or deal directly)
      const response = await api.selectFaceUpCards.selectFaceUpCards({ 
        room_id: roomId, 
        player_id: playerId, 
        card_ids: [] 
      })
      if (response) {
        applyResponseState(response)
        notifyRoomUpdate()
      }
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Failed to start shuffle')
    }
  }, [roomId, playerId, applyResponseState, notifyRoomUpdate, setError])

  const setPlayerReady = useCallback(async (isReady: boolean) => {
    if (!roomId || !playerId) return
    try {
      const response = await setPlayerReadyMutation({ 
        room_id: roomId, 
        player_id: playerId, 
        is_ready: isReady 
      })
      if (response) {
        setGameState(response.gameState)
      }
    } catch (error: any) {
      console.error('Error setting player ready:', error)
      setError(error?.message || 'Failed to set player ready status')
    }
  }, [roomId, playerId, setPlayerReadyMutation, setGameState, setError])

  return {
    selectFaceUpCards,
    playCard,
    resetGame,
    startShuffle,
    setPlayerReady
  }
}