import { useEffect, useCallback } from 'react'
import { getWebSocketUrl } from '../utils/config'
import { api } from '../apiClient'
import type { ConnectionStatus } from '../types/gameTypes'

interface UseWebSocketProps {
  roomId: string
  ws: WebSocket | null
  setWs: (ws: WebSocket | null) => void
  setConnectionStatus: (status: ConnectionStatus) => void
  applyResponseState: (payload: any) => void
}

/**
 * Custom hook for managing WebSocket connection
 */
export function useWebSocket({
  roomId,
  ws,
  setWs,
  setConnectionStatus,
  applyResponseState
}: UseWebSocketProps) {
  
  const notifyRoomUpdate = useCallback(() => {
    try {
      if (ws && ws.readyState === WebSocket.OPEN && roomId) {
        ws.send(JSON.stringify({ type: 'state_update', roomId }))
      }
    } catch {
      /* noop */
    }
  }, [ws, roomId])

  // WebSocket connection effect
  useEffect(() => {
    if (!roomId) return

    const wsUrl = getWebSocketUrl(roomId)
    
    if (import.meta.env.DEV) {
      console.log('🔌 Attempting WebSocket connection to:', wsUrl)
    }

    let socket: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null
    let isConnecting = false
    
    const connectWebSocket = () => {
      if (isConnecting || !roomId) return
      isConnecting = true
      
      try {
        socket = new WebSocket(wsUrl)
        setWs(socket)

        socket.onopen = () => {
          if (import.meta.env.DEV) {
            console.log('✅ WebSocket connected successfully')
          }
          isConnecting = false
          setConnectionStatus('connected')
          // Clear any reconnect timeout
          if (reconnectTimeout) {
            clearTimeout(reconnectTimeout)
            reconnectTimeout = null
          }
        }

        socket.onmessage = async (event) => {
          try {
            if (!roomId) return
            if (import.meta.env.DEV) {
              console.log('📨 WebSocket message received')
            }
            const res = await api.getGameState.getGameState({ room_id: roomId })
            applyResponseState(res)
          } catch (error) {
            if (import.meta.env.DEV) {
              console.error('❌ Error processing WebSocket message:', error)
            }
          }
        }

        socket.onerror = (error) => {
          if (import.meta.env.DEV) {
            console.error('⚠️ WebSocket error, falling back to polling:', error)
          }
          isConnecting = false
          setConnectionStatus('connected') // Still connected via polling
        }

        socket.onclose = (event) => {
          if (import.meta.env.DEV) {
            console.log('🔌 WebSocket closed, falling back to polling', {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean
            })
          }
          setWs(null)
          isConnecting = false
          
          // Only attempt to reconnect if close was unexpected (not a clean close)
          if (event.code !== 1000 && roomId) {
            reconnectTimeout = setTimeout(() => {
              if (roomId) {
                connectWebSocket()
              }
            }, 3000)
          }
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ Error creating WebSocket:', error)
        }
        isConnecting = false
        setConnectionStatus('connected') // Still connected via polling
      }
    }
    
    connectWebSocket()

    return () => {
      isConnecting = false
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
      if (socket) {
        try {
          socket.close(1000, 'Component unmounting')
        } catch {
          /* noop */
        }
      }
      setWs(null)
    }
  }, [roomId, applyResponseState, setWs, setConnectionStatus])

  return {
    notifyRoomUpdate
  }
}