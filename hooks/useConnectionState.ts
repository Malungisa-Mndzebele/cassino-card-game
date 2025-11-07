import { useState } from 'react'
import type { ConnectionStatus } from '../types/gameTypes'

/**
 * Custom hook for managing connection state and UI state
 */
export function useConnectionState() {
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [soundReady, setSoundReady] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [ws, setWs] = useState<WebSocket | null>(null)

  return {
    // State
    error,
    setError,
    isLoading,
    setIsLoading,
    soundReady,
    setSoundReady,
    connectionStatus,
    setConnectionStatus,
    ws,
    setWs,
  }
}