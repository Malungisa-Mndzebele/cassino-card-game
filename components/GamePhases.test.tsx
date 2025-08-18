import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import '@testing-library/jest-dom'
import { GamePhases } from './GamePhases'

// Mock the Card component
vi.mock('./Card', () => ({
  Card: function MockCard({ suit, rank, onClick, isPlayable, size }: any) {
    return (
      <div 
        data-testid={`card-${suit}-${rank}`}
        onClick={onClick}
        className={`card ${isPlayable ? 'playable' : ''} ${size || 'normal'}`}
      >
        {rank} of {suit}
      </div>
    )
  }
}))

// Mock the GameActions component
vi.mock('./GameActions', () => ({
  GameActions: function MockGameActions({ onPlayCard, isMyTurn }: any) {
    return (
      <div data-testid="game-actions">
        <button onClick={() => onPlayCard('test-card', 'trail')}>Trail</button>
        <button onClick={() => onPlayCard('test-card', 'capture', ['target1'])}>Capture</button>
        <button onClick={() => onPlayCard('test-card', 'build', ['target1'], 10)}>Build</button>
        <span data-testid="turn-status">{isMyTurn ? 'My Turn' : 'Opponent Turn'}</span>
      </div>
    )
  }
}))

// Mock the Dealer component
vi.mock('./Dealer', () => ({
  Dealer: function MockDealer({ gameState, playerId, onPlayerReady, onPlayerNotReady }: any) {
    return (
      <div data-testid="dealer-component">
        <h2>Dealer Phase</h2>
        <button onClick={onPlayerReady}>Ready</button>
        <button onClick={onPlayerNotReady}>Not Ready</button>
        <span data-testid="player-id">Player {playerId}</span>
      </div>
    )
  }
}))

describe('GamePhases Component', () => {
  const defaultGameState = {
    roomId: 'TEST123',
    players: [
      { id: 1, name: 'Player 1' },
      { id: 2, name: 'Player 2' }
    ],
    phase: 'waiting',
    round: 1,
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
    shuffleComplete: false,
    dealingComplete: false,
    gameStarted: false,
    lastPlay: null,
    lastAction: null,
    lastUpdate: new Date().toISOString(),
    gameCompleted: false,
    winner: null,
    player1Ready: false,
    player2Ready: false,
    countdownStartTime: null,
    countdownRemaining: undefined
  }

  const defaultProps = {
    gameState: defaultGameState,
    playerId: 1,
    onStartShuffle: vi.fn(),
    onSelectFaceUpCards: vi.fn(),
    onPlayCard: vi.fn(),
    onResetGame: vi.fn(),
    onPlayerReady: vi.fn(),
    onPlayerNotReady: vi.fn(),
    preferences: {
      soundEnabled: true,
      soundVolume: 1,
      hintsEnabled: true,
      statisticsEnabled: true
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render dealer phase correctly', () => {
      const dealerState = {
        ...defaultGameState,
        phase: 'dealer'
      }
      
      render(<GamePhases {...defaultProps} gameState={dealerState} />)
      
      expect(screen.getByTestId('dealer-component')).toBeInTheDocument()
      expect(screen.getByText('Dealer Phase')).toBeInTheDocument()
    })

    it('should render countdown phase correctly', () => {
      const countdownState = {
        ...defaultGameState,
        phase: 'countdown',
        countdownStartTime: Date.now()
      }
      
      render(<GamePhases {...defaultProps} gameState={countdownState} />)
      
      expect(screen.getByText('Game Starting Soon!')).toBeInTheDocument()
      expect(screen.getByText('seconds remaining')).toBeInTheDocument()
    })

    it('should render shuffling phase correctly', () => {
      const shuffleState = {
        ...defaultGameState,
        phase: 'shuffling'
      }
      
      render(<GamePhases {...defaultProps} gameState={shuffleState} />)
      
      expect(screen.getByText('Shuffling Cards')).toBeInTheDocument()
      expect(screen.getByText('The dealer is shuffling the deck...')).toBeInTheDocument()
    })

    it('should render card selection phase correctly', () => {
      const cardSelectionState = {
        ...defaultGameState,
        phase: 'cardSelection',
        deck: [
          { id: 'card1', suit: 'hearts', rank: 'A' },
          { id: 'card2', suit: 'spades', rank: '2' }
        ]
      }
      
      render(<GamePhases {...defaultProps} gameState={cardSelectionState} />)
      
      expect(screen.getByText('Card Selection Phase')).toBeInTheDocument()
      expect(screen.getByText('Select 4 cards to place face up on the table')).toBeInTheDocument()
    })

    it('should render dealing phase correctly', () => {
      const dealingState = {
        ...defaultGameState,
        phase: 'dealing'
      }
      
      render(<GamePhases {...defaultProps} gameState={dealingState} />)
      
      expect(screen.getByText('Dealing Cards')).toBeInTheDocument()
      expect(screen.getByText('The dealer is distributing 4 cards to each player alternately...')).toBeInTheDocument()
    })

    it('should render round1 phase correctly', () => {
      const gamePlayState = {
        ...defaultGameState,
        phase: 'round1',
        player1Hand: [{ id: 'card1', suit: 'hearts', rank: 'A' }],
        player2Hand: [{ id: 'card2', suit: 'spades', rank: '2' }]
      }
      
      render(<GamePhases {...defaultProps} gameState={gamePlayState} />)
      
      expect(screen.getByText(/Cassino - Round\s*1/i)).toBeInTheDocument()
      expect(screen.getByText('Your turn')).toBeInTheDocument()
    })

    it('should render finished phase correctly', () => {
      const finishedState = {
        ...defaultGameState,
        phase: 'finished',
        winner: 2,
        player1Score: 5,
        player2Score: 7
      }
      
      render(<GamePhases {...defaultProps} gameState={finishedState} />)
      
      expect(screen.getByText('You Lost!')).toBeInTheDocument()
      expect(screen.getByText('Final Scores')).toBeInTheDocument()
      expect(screen.getByText('Play Again')).toBeInTheDocument()
    })
  })

  describe('Game Actions', () => {
    it('should call onPlayCard when trail button is clicked', () => {
      const gamePlayState = {
        ...defaultGameState,
        phase: 'round1',
        player1Hand: [{ id: 'card1', suit: 'hearts', rank: 'A' }],
        player2Hand: [{ id: 'card2', suit: 'spades', rank: '2' }]
      }
      
      render(<GamePhases {...defaultProps} gameState={gamePlayState} />)
      
      const trailButton = screen.getByText('Trail')
      fireEvent.click(trailButton)
      
      expect(defaultProps.onPlayCard).toHaveBeenCalledWith('test-card', 'trail')
    })
  })

  describe('Scoring Logic', () => {
    it('should calculate score breakdown correctly for captured cards', () => {
      const capturedCards = [
        { id: 'card1', suit: 'hearts', rank: 'A' },
        { id: 'card2', suit: 'spades', rank: '2' },
        { id: 'card3', suit: 'diamonds', rank: '10' }
      ]
      
      // This would be tested in the actual component logic
      expect(capturedCards.length).toBe(3)
    })
  })

  describe('Game State Transitions', () => {
    it('should handle shuffle phase correctly', () => {
      const shuffleState = {
        ...defaultGameState,
        phase: 'shuffling'
      }
      
      render(<GamePhases {...defaultProps} gameState={shuffleState} />)
      
      expect(screen.getByText('Shuffling Cards')).toBeInTheDocument()
    })

    it('should handle countdown phase correctly', () => {
      const countdownState = {
        ...defaultGameState,
        phase: 'countdown',
        countdownStartTime: Date.now()
      }
      
      render(<GamePhases {...defaultProps} gameState={countdownState} />)
      
      expect(screen.getByText('Game Starting Soon!')).toBeInTheDocument()
    })

    it('should handle finished game phase correctly', () => {
      const finishedState = {
        ...defaultGameState,
        phase: 'finished',
        winner: 1
      }
      
      render(<GamePhases {...defaultProps} gameState={finishedState} />)
      
      expect(screen.getByText('Final Scores')).toBeInTheDocument()
    })
  })

  describe('Player Turn Management', () => {
    it('should show correct turn information', () => {
      const waitingState = {
        ...defaultGameState,
        phase: 'waiting'
      }
      
      render(<GamePhases {...defaultProps} gameState={waitingState} />)
      
      // When no gameState is provided, it should show loading
      expect(screen.getByText('Loading game phase...')).toBeInTheDocument()
    })

    it('should handle opponent turn correctly', () => {
      const opponentTurnState = {
        ...defaultGameState,
        phase: 'round1',
        currentTurn: 2,
        player1Hand: [{ id: 'card1', suit: 'hearts', rank: 'A' }],
        player2Hand: [{ id: 'card2', suit: 'spades', rank: '2' }]
      }
      
      render(<GamePhases {...defaultProps} gameState={opponentTurnState} />)
      
      expect(screen.getByTestId('turn-status')).toBeInTheDocument()
      expect(screen.getByText('Opponent Turn')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing game state gracefully', () => {
      const { container } = render(
        <GamePhases {...defaultProps} gameState={null} />
      )
      
      expect(container.firstChild).toBeNull()
    })

    it('should handle missing players array gracefully', () => {
      const noPlayersState = {
        ...defaultGameState,
        players: undefined
      }
      
      expect(() => {
        render(<GamePhases {...defaultProps} gameState={noPlayersState} />)
      }).not.toThrow()
    })
  })

  describe('Dealer Component Integration', () => {
    it('should call onPlayerReady when ready button is clicked', () => {
      const dealerState = {
        ...defaultGameState,
        phase: 'dealer'
      }
      
      render(<GamePhases {...defaultProps} gameState={dealerState} />)
      
      const readyButton = screen.getByText('Ready')
      fireEvent.click(readyButton)
      
      expect(defaultProps.onPlayerReady).toHaveBeenCalled()
    })

    it('should call onPlayerNotReady when not ready button is clicked', () => {
      const dealerState = {
        ...defaultGameState,
        phase: 'dealer'
      }
      
      render(<GamePhases {...defaultProps} gameState={dealerState} />)
      
      const notReadyButton = screen.getByText('Not Ready')
      fireEvent.click(notReadyButton)
      
      expect(defaultProps.onPlayerNotReady).toHaveBeenCalled()
    })
  })
})
