import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import App from '../../App'

// Mock the API client
vi.mock('../../apiClient', () => ({
  api: {
    createRoom: {
      createRoom: vi.fn()
    },
    joinRoom: {
      joinRoom: vi.fn()
    },
    joinRandomRoom: {
      joinRandomRoom: vi.fn()
    },
    setPlayerReady: {
      setPlayerReady: vi.fn()
    },
    getGameState: {
      getGameState: vi.fn()
    },
    playCard: {
      playCard: vi.fn()
    },
    startShuffle: {
      startShuffle: vi.fn()
    },
    selectFaceUpCards: {
      selectFaceUpCards: vi.fn()
    },
    resetGame: {
      resetGame: vi.fn()
    }
  },
  useMutation: vi.fn((fn) => fn),
  useQuery: vi.fn(() => null)
}))

// Mock WebSocket
global.WebSocket = vi.fn(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  send: vi.fn(),
  readyState: 1
})) as any

describe('Game Creation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders room manager on initial load', () => {
    render(<App />)
    
    const roomManagers = screen.queryAllByTestId('room-manager')
    expect(roomManagers.length).toBeGreaterThan(0)
  })

  it('allows player to enter name', () => {
    render(<App />)
    
    const nameInputs = screen.getAllByTestId('player-name-input-create-test')
    fireEvent.change(nameInputs[0], {
      target: { value: 'TestPlayer' }
    })
    
    expect(nameInputs[0]).toHaveValue('TestPlayer')
  })

  it('shows create room button when name is entered', () => {
    render(<App />)
    
    const nameInputs = screen.getAllByTestId('player-name-input-create-test')
    fireEvent.change(nameInputs[0], {
      target: { value: 'TestPlayer' }
    })
    
    const createButtons = screen.getAllByTestId('create-room-test')
    expect(createButtons.length).toBeGreaterThan(0)
    expect(createButtons[0]).toBeInTheDocument()
    expect(createButtons[0]).not.toBeDisabled()
  })
})

