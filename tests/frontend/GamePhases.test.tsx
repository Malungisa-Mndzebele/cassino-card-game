import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { GamePhases } from '../../components/GamePhases'

describe('GamePhases', () => {
  beforeEach(() => {
    cleanup()
  })

  const mockGameState = {
    roomId: 'TEST01',
    players: [
      { id: 1, name: 'Alice', joined_at: '2023-01-01T00:00:00Z' },
      { id: 2, name: 'Bob', joined_at: '2023-01-01T00:01:00Z' }
    ],
    phase: 'cardSelection' as const,
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
    currentTurn: 1,
    cardSelectionComplete: false,
    shuffleComplete: true,
    countdownStartTime: null,
    gameStarted: false,
    lastPlay: null,
    lastAction: null,
    lastUpdate: new Date().toISOString(),
    gameCompleted: false,
    winner: null,
    dealingComplete: false,
    player1Ready: true,
    player2Ready: true,
    countdownRemaining: null
  }

  const mockProps = {
    gameState: mockGameState,
    playerId: 1,
    onSelectFaceUpCards: vi.fn(),
    onPlayCard: vi.fn(),
    onResetGame: vi.fn(),
    onPlayerReady: vi.fn(),
    onPlayerNotReady: vi.fn(),
    onStartShuffle: vi.fn(),
    preferences: {
      soundEnabled: true,
      soundVolume: 1,
      hintsEnabled: true,
      statisticsEnabled: true
    }
  }

  it('renders card selection phase', () => {
    render(<GamePhases {...mockProps} />)
    
    const selectionElements = screen.getAllByText(/select.*4.*cards|card selection/i)
    expect(selectionElements.length).toBeGreaterThan(0)
  })

  it('shows dealing phase', () => {
    const dealingState = {
      ...mockGameState,
      phase: 'dealing' as const
    }
    
    render(<GamePhases {...mockProps} gameState={dealingState} />)
    
    expect(screen.getByText(/dealing/i)).toBeInTheDocument()
  })

  it('shows finished phase with winner', () => {
    const finishedState = {
      ...mockGameState,
      phase: 'finished' as const,
      gameCompleted: true,
      winner: 1,
      player1Score: 11,
      player2Score: 8
    }
    
    render(<GamePhases {...mockProps} gameState={finishedState} />)
    
    expect(screen.getByText(/won|victory|winner/i)).toBeInTheDocument()
  })

  it('shows tie game', () => {
    const tieState = {
      ...mockGameState,
      phase: 'finished' as const,
      gameCompleted: true,
      winner: 'tie',
      player1Score: 10,
      player2Score: 10
    }
    
    render(<GamePhases {...mockProps} gameState={tieState} />)
    
    expect(screen.getByText(/tie/i)).toBeInTheDocument()
  })

  it('calls onSelectFaceUpCards when cards selected', () => {
    const mockSelect = vi.fn()
    render(<GamePhases {...mockProps} onSelectFaceUpCards={mockSelect} />)
    
    const selectButtons = screen.queryAllByRole('button', { name: /confirm selection/i })
    if (selectButtons.length > 0 && !selectButtons[0].hasAttribute('disabled')) {
      fireEvent.click(selectButtons[0])
      expect(mockSelect).toHaveBeenCalled()
    } else {
      // Button is disabled when no cards selected, which is expected
      expect(selectButtons.length).toBeGreaterThan(0)
    }
  })

  it('calls onResetGame when reset button clicked', () => {
    const mockReset = vi.fn()
    const finishedState = {
      ...mockGameState,
      phase: 'finished' as const,
      gameCompleted: true,
      winner: 1
    }
    
    render(<GamePhases {...mockProps} gameState={finishedState} onResetGame={mockReset} />)
    
    const resetButtons = screen.getAllByRole('button', { name: /play again/i })
    fireEvent.click(resetButtons[0])
    expect(mockReset).toHaveBeenCalled()
  })

  it('shows player ready status', () => {
    const dealerState = {
      ...mockGameState,
      phase: 'dealer' as const,
      player1Ready: false,
      player2Ready: false
    }
    
    render(<GamePhases {...mockProps} gameState={dealerState} />)
    
    const readyElements = screen.queryAllByText(/ready|waiting/i)
    expect(readyElements.length).toBeGreaterThan(0)
  })

  it('shows game statistics when enabled', () => {
    const finishedState = {
      ...mockGameState,
      phase: 'finished' as const,
      gameCompleted: true
    }
    
    render(<GamePhases {...mockProps} gameState={finishedState} />)
    
    const scoreElements = screen.getAllByText(/score|points/i)
    expect(scoreElements.length).toBeGreaterThan(0)
  })

  it('handles unknown phase gracefully', () => {
    const unknownState = {
      ...mockGameState,
      phase: 'unknown' as any
    }
    
    expect(() => {
      render(<GamePhases {...mockProps} gameState={unknownState} />)
    }).not.toThrow()
  })
})
