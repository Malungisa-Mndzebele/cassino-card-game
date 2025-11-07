import { useCallback } from 'react'
import { api, useMutation } from '../apiClient'
import type { ConnectionStatus } from '../types/gameTypes'



interface UseRoomActionsProps {
  playerName: string
  setRoomId: (roomId: string) => void
  setPlayerId: (playerId: number | null) => void
  applyResponseState: (payload: any) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  setError: (error: string) => void
  setIsLoading: (loading: boolean) => void
}

/**
 * Custom hook for room-related actions (create, join, etc.)
 */
export function useRoomActions({
  playerName,
  setRoomId,
  setPlayerId,
  applyResponseState,
  setConnectionStatus,
  setError,
  setIsLoading
}: UseRoomActionsProps) {
  
  const createRoomMutation = useMutation(api.createRoom.createRoom)
  const joinRoomMutation = useMutation(api.joinRoom.joinRoom)
  const joinRandomRoomMutation = useMutation(api.joinRandomRoom.joinRandomRoom)

  const createRoom = useCallback(async () => {
    if (!playerName) {
      setError("Please enter your name")
      return
    }
    
    setIsLoading(true)
    setError("")
    try {
      setConnectionStatus('connecting')
      
      const response = await createRoomMutation({ player_name: playerName })
      
      if (!response) {
        throw new Error("Failed to create room")
      }
      
      setRoomId((response as any).roomId)
      setPlayerId((response as any).playerId)
      applyResponseState(response)
      setConnectionStatus('connected')
    } catch (error: any) {
      console.error("Error creating room:", error)
      const errorMsg = error?.message || String(error)
      setError(errorMsg)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }, [playerName, setError, setIsLoading, setConnectionStatus, createRoomMutation, setRoomId, setPlayerId, applyResponseState])

  const joinRoom = useCallback(async (targetRoomId?: string, targetPlayerName?: string) => {
    const roomToJoin = targetRoomId
    const nameToUse = targetPlayerName || playerName
    
    console.log('🚀 Joining room:', { roomToJoin, nameToUse })
    
    // Add defensive checks
    if (!roomToJoin || typeof roomToJoin !== 'string') {
      setError('Please enter a valid room ID')
      return
    }
    
    if (!nameToUse || typeof nameToUse !== 'string') {
      setError('Please enter a valid player name')
      return
    }
    
    if (!roomToJoin.trim() || !nameToUse.trim()) {
      setError('Please enter room ID and player name')
      return
    }
    
    setIsLoading(true)
    setError('')
    try {
      setConnectionStatus('connecting')
      
      const response = await joinRoomMutation({ 
        room_id: roomToJoin.trim(), 
        player_name: nameToUse.trim() 
      })
      
      console.log('✅ Join room response:', response)
      
      if (!response) {
        throw new Error("Failed to join room")
      }
      
      setRoomId(roomToJoin.trim())
      setPlayerId((response as any).playerId)
      applyResponseState(response)
      setConnectionStatus('connected')
       
      console.log('🎯 State after join:', {
        roomId: roomToJoin.trim(),
        playerId: (response as any).playerId,
        gameState: (response as any).gameState,
        connectionStatus: 'connected'
      })
    } catch (error: any) {
      console.error("❌ Error joining room:", error)
      const errorMsg = error?.message || String(error)
      setError(errorMsg)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }, [playerName, setError, setIsLoading, setConnectionStatus, joinRoomMutation, setRoomId, setPlayerId, applyResponseState])

  const joinRandomRoom = useCallback(async (targetPlayerName?: string) => {
    const nameToUse = targetPlayerName || playerName
    
    console.log('🎲 Joining random room:', { nameToUse })
    
    if (!nameToUse || typeof nameToUse !== 'string') {
      setError('Please enter a valid player name')
      return
    }
    
    if (!nameToUse.trim()) {
      setError('Please enter your player name')
      return
    }
    
    setIsLoading(true)
    setError('')
    try {
      setConnectionStatus('connecting')
      
      const response = await joinRandomRoomMutation({ 
        player_name: nameToUse.trim() 
      })
      
      console.log('✅ Join random room response:', response)
      
      if (!response) {
        throw new Error("Failed to join random room")
      }
      
      // Extract room ID from response
      const joinedRoomId = (response as any).gameState?.roomId || 
                          (response as any).gameState?.room_id ||
                          (response as any).game_state?.roomId ||
                          (response as any).game_state?.room_id
      
      if (!joinedRoomId) {
        throw new Error("Failed to extract room ID from join random response")
      }
      
      setRoomId(joinedRoomId)
      setPlayerId((response as any).playerId || (response as any).player_id)
      applyResponseState(response)
      setConnectionStatus('connected')
    } catch (error: any) {
      console.error("❌ Error joining random room:", error)
      const errorMsg = error?.message || String(error)
      setError(errorMsg)
      setConnectionStatus('disconnected')
    } finally {
      setIsLoading(false)
    }
  }, [playerName, setError, setIsLoading, setConnectionStatus, joinRandomRoomMutation, setRoomId, setPlayerId, applyResponseState])

  const disconnectGame = useCallback(() => {
    setConnectionStatus('disconnected')
    setRoomId('')
    setPlayerId(null)
    setError('')
  }, [setConnectionStatus, setRoomId, setPlayerId, setError])

  return {
    createRoom,
    joinRoom,
    joinRandomRoom,
    disconnectGame
  }
}