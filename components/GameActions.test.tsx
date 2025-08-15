import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { GameActions } from './GameActions'

// Mock the dependencies
vi.mock('./Card', () => ({
  Card: ({ card, onClick, selected, disabled }: any) => (
    <button
      data-testid={`card-${card.id}`}
      onClick={() => onClick?.(card)}
      disabled={disabled}
      className={selected ? 'selected' : ''}
    >
      {card.rank} of {card.suit}
    </button>
  )
}))

vi.mock('./GameHints', () => ({
  GameHints: ({ gameState, playerId, selectedCard, preferences }: any) => (
    <div data-testid="game-hints">
      {preferences.hintsEnabled && <span>Hints enabled</span>}
      {selectedCard && <span>Selected: {selectedCard.id}</span>}
    </div>
  )
}))

describe('GameActions Component', () => {
  const mockGameState = {
    ...global.testUtils.createMockGameState(),
    phase: 'round1',
    currentTurn: 1,
    player1Hand: [
      global.testUtils.createMockCard('hearts', 'A'),
      global.testUtils.createMockCard('spades', '5'),
      global.testUtils.createMockCard('diamonds', 'K')
    ],
    tableCards: [
      global.testUtils.createMockCard('clubs', '3'),
      global.testUtils.createMockCard('hearts', '7'),
      global.testUtils.createMockCard('spades', '2')
    ],
    builds: []
  }

  const defaultProps = {
    playerHand: [global.testUtils.createMockCard()],
    tableCards: [global.testUtils.createMockCard()],
    builds: [],
    onPlayCard: vi.fn(),
    isMyTurn: true,
    hintsEnabled: false,
    soundEnabled: true,
    playerId: 1
  };

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render player hand cards', () => {
      render(<GameActions {...defaultProps} />)
      
      expect(screen.getByTestId('card-hearts-A')).toBeInTheDocument()
      expect(screen.getByTestId('card-spades-5')).toBeInTheDocument()
      expect(screen.getByTestId('card-diamonds-K')).toBeInTheDocument()
    })

    it('should render table cards', () => {
      render(<GameActions {...defaultProps} />)
      
      expect(screen.getByTestId('card-clubs-3')).toBeInTheDocument()
      expect(screen.getByTestId('card-hearts-7')).toBeInTheDocument()
      expect(screen.getByTestId('card-spades-2')).toBeInTheDocument()
    })

    it('should show turn indicator when it is player turn', () => {
      render(<GameActions {...defaultProps} />)
      
      expect(screen.getByText(/your turn/i)).toBeInTheDocument()
    })

    it('should show waiting message when it is not player turn', () => {
      render(<GameActions {...defaultProps} isMyTurn={false} />)
      
      expect(screen.getByText(/opponent's turn/i)).toBeInTheDocument()
    })

    it('should render game hints when enabled', () => {
      render(<GameActions {...defaultProps} />)
      
      expect(screen.getByTestId('game-hints')).toBeInTheDocument()
      expect(screen.getByText('Hints enabled')).toBeInTheDocument()
    })
  })

  describe('Card Selection', () => {
    it('should select hand card when clicked', async () => {
      const user = userEvent.setup()
      render(<GameActions {...defaultProps} />)
      
      await user.click(screen.getByTestId('card-hearts-A'))
      
      expect(screen.getByTestId('card-hearts-A')).toHaveClass('selected')
    })

    it('should deselect card when clicked again', async () => {
      const user = userEvent.setup()
      render(<GameActions {...defaultProps} />)
      
      const card = screen.getByTestId('card-hearts-A')
      
      // First click - select
      await user.click(card)
      expect(card).toHaveClass('selected')
      
      // Second click - deselect
      await user.click(card)
      expect(card).not.toHaveClass('selected')
    })

    it('should allow multiple table card selection', async () => {
      const user = userEvent.setup()
      render(<GameActions {...defaultProps} />)
      
      // First select a hand card
      await user.click(screen.getByTestId('card-hearts-A'))
      
      // Then select multiple table cards
      await user.click(screen.getByTestId('card-clubs-3'))
      await user.click(screen.getByTestId('card-hearts-7'))
      
      expect(screen.getByTestId('card-clubs-3')).toHaveClass('selected')
      expect(screen.getByTestId('card-hearts-7')).toHaveClass('selected')
    })

    it('should only allow one hand card selection at a time', async () => {
      const user = userEvent.setup()
      render(<GameActions {...defaultProps} />)
      
      await user.click(screen.getByTestId('card-hearts-A'))
      await user.click(screen.getByTestId('card-spades-5'))
      
      expect(screen.getByTestId('card-hearts-A')).not.toHaveClass('selected')
      expect(screen.getByTestId('card-spades-5')).toHaveClass('selected')
    })
  })

  describe('Game Actions', () => {
    it('should show capture action when valid capture is available', async () => {
      const user = userEvent.setup()
      render(<GameActions {...defaultProps} />)
      
      // Select hand card and matching table card
      await user.click(screen.getByTestId('card-hearts-A')) // Ace (value 1)
      
      expect(screen.getByRole('button', { name: /capture/i })).toBeInTheDocument()
    })

    it('should show trail action when no captures available', async () => {
      const user = userEvent.setup()
      render(<GameActions {...defaultProps} />)
      
      await user.click(screen.getByTestId('card-diamonds-K')) // King (no matches on table)
      
      expect(screen.getByRole('button', { name: /trail/i })).toBeInTheDocument()
    })

    it('should show build action when valid build is possible', async () => {
      const user = userEvent.setup()
      const buildableProps = {
        ...defaultProps,
        playerHand: [global.testUtils.createMockCard('spades', '5')],
        tableCards: [
          global.testUtils.createMockCard('clubs', '3'),
          global.testUtils.createMockCard('hearts', '2') // 3 + 2 = 5, can build for 5 in hand
        ]
      }
      
      render(<GameActions {...buildableProps} />)
      
      await user.click(screen.getByTestId('card-spades-5')) // Have 5 in hand
      await user.click(screen.getByTestId('card-clubs-3'))
      await user.click(screen.getByTestId('card-hearts-2'))
      
      expect(screen.getByRole('button', { name: /build/i })).toBeInTheDocument()
    })

    it('should execute capture action correctly', async () => {
      const user = userEvent.setup()
      const onPlayCard = vi.fn()
      
      const captureProps = {
        ...defaultProps,
        onPlayCard
      }
      render(<GameActions {...captureProps} />)
      
      await user.click(screen.getByTestId('card-hearts-A'))
      await user.click(screen.getByRole('button', { name: /capture/i }))
      
      expect(onPlayCard).toHaveBeenCalledWith(
        'hearts-A',
        'capture',
        [],
        undefined
      )
    })

    it('should execute trail action correctly', async () => {
      const user = userEvent.setup()
      const onPlayCard = jest.fn()
      
      render(<GameActions {...defaultProps} onPlayCard={onPlayCard} />)
      
      await user.click(screen.getByTestId('card-diamonds-K'))
      await user.click(screen.getByRole('button', { name: /trail/i }))
      
      expect(onPlayCard).toHaveBeenCalledWith(
        'diamonds-K',
        'trail',
        [],
        undefined
      )
    })

    it('should execute build action correctly', async () => {
      const user = userEvent.setup()
      const onPlayCard = jest.fn()
      const gameStateWithBuildableCards = {
        ...mockGameState,
        tableCards: [
          global.testUtils.createMockCard('clubs', '3'),
          global.testUtils.createMockCard('hearts', '2')
        ]
      }
      
      render(<GameActions {...defaultProps} gameState={gameStateWithBuildableCards} onPlayCard={onPlayCard} />)
      
      await user.click(screen.getByTestId('card-spades-5'))
      await user.click(screen.getByTestId('card-clubs-3'))
      await user.click(screen.getByTestId('card-hearts-2'))
      await user.click(screen.getByRole('button', { name: /build/i }))
      
      expect(onPlayCard).toHaveBeenCalledWith(
        'spades-5',
        'build',
        ['clubs-3', 'hearts-2'],
        5
      )
    })
  })

  describe('Build Value Selection', () => {
    it('should show build value selector when building', async () => {
      const user = userEvent.setup()
      const gameStateWithBuildableCards = {
        ...mockGameState,
        player1Hand: [
          global.testUtils.createMockCard('hearts', 'A'),
          global.testUtils.createMockCard('spades', '5'),
          global.testUtils.createMockCard('diamonds', '7')
        ],
        tableCards: [
          global.testUtils.createMockCard('clubs', '3'),
          global.testUtils.createMockCard('hearts', '2')
        ]
      }
      
      render(<GameActions {...defaultProps} gameState={gameStateWithBuildableCards} />)
      
      await user.click(screen.getByTestId('card-hearts-A'))
      await user.click(screen.getByTestId('card-clubs-3'))
      await user.click(screen.getByTestId('card-hearts-2'))
      
      // Should show possible build values (values that player has cards for)
      expect(screen.getByText(/build for value/i)).toBeInTheDocument()
    })

    it('should only show build values for cards in hand', async () => {
      const user = userEvent.setup()
      const gameStateWithBuildableCards = {
        ...mockGameState,
        player1Hand: [
          global.testUtils.createMockCard('hearts', 'A'), // value 1
          global.testUtils.createMockCard('spades', '5')   // value 5
          // No 6 in hand
        ],
        tableCards: [
          global.testUtils.createMockCard('clubs', '3'),
          global.testUtils.createMockCard('hearts', '3')  // 3 + 3 = 6
        ]
      }
      
      render(<GameActions {...defaultProps} gameState={gameStateWithBuildableCards} />)
      
      await user.click(screen.getByTestId('card-hearts-A'))
      await user.click(screen.getByTestId('card-clubs-3'))
      await user.click(screen.getByTestId('card-hearts-3'))
      
      // Should not allow building for 6 since player doesn't have 6 in hand
      expect(screen.queryByText('6')).not.toBeInTheDocument()
    })
  })

  describe('Turn Management', () => {
    it('should disable actions when not player turn', () => {
      const gameStateNotMyTurn = {
        ...mockGameState,
        currentTurn: 2
      }
      
      render(<GameActions {...defaultProps} gameState={gameStateNotMyTurn} />)
      
      expect(screen.getByTestId('card-hearts-A')).toBeDisabled()
      expect(screen.getByTestId('card-spades-5')).toBeDisabled()
      expect(screen.getByTestId('card-diamonds-K')).toBeDisabled()
    })

    it('should enable actions when it is player turn', () => {
      render(<GameActions {...defaultProps} />)
      
      expect(screen.getByTestId('card-hearts-A')).not.toBeDisabled()
      expect(screen.getByTestId('card-spades-5')).not.toBeDisabled()
      expect(screen.getByTestId('card-diamonds-K')).not.toBeDisabled()
    })
  })

  describe('Builds Display', () => {
    it('should display existing builds', () => {
      const gameStateWithBuilds = {
        ...mockGameState,
        builds: [
          {
            id: 'build1',
            cards: [
              global.testUtils.createMockCard('clubs', '3'),
              global.testUtils.createMockCard('hearts', '2')
            ],
            value: 5,
            owner: 1
          }
        ]
      }
      
      render(<GameActions {...defaultProps} gameState={gameStateWithBuilds} />)
      
      expect(screen.getByText(/build/i)).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should allow capturing own builds', async () => {
      const user = userEvent.setup()
      const onPlayCard = jest.fn()
      const gameStateWithOwnBuild = {
        ...mockGameState,
        builds: [
          {
            id: 'build1',
            cards: [
              global.testUtils.createMockCard('clubs', '3'),
              global.testUtils.createMockCard('hearts', '2')
            ],
            value: 5,
            owner: 1
          }
        ]
      }
      
      render(<GameActions {...defaultProps} gameState={gameStateWithOwnBuild} onPlayCard={onPlayCard} />)
      
      await user.click(screen.getByTestId('card-spades-5'))
      await user.click(screen.getByRole('button', { name: /capture/i }))
      
      expect(onPlayCard).toHaveBeenCalledWith(
        'spades-5',
        'capture',
        ['build1'], // Should capture the build
        undefined
      )
    })

    it('should prevent capturing opponent builds without matching card', async () => {
      const user = userEvent.setup()
      const gameStateWithOpponentBuild = {
        ...mockGameState,
        builds: [
          {
            id: 'build1',
            cards: [
              global.testUtils.createMockCard('clubs', '3'),
              global.testUtils.createMockCard('hearts', '2')
            ],
            value: 5,
            owner: 2 // Opponent's build
          }
        ]
      }
      
      const opponentBuildProps = {
        ...defaultProps,
        builds: [{
          id: 'build-1',
          cards: [global.testUtils.createMockCard()],
          value: 5,
          owner: 2
        }]
      }
      render(<GameActions {...opponentBuildProps} />)
      
      // Try to select opponent's build
      await user.click(screen.getByTestId('card-hearts-A')) // Ace (value 1)
      
      // Should not be able to capture build with value 5 using Ace
      expect(screen.queryByRole('button', { name: /capture/i })).not.toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle empty hand gracefully', () => {
      const gameStateEmptyHand = {
        ...mockGameState,
        player1Hand: []
      }
      
      const emptyHandProps = {
        ...defaultProps,
        playerHand: []
      }
      render(<GameActions {...emptyHandProps} />)
      
      expect(screen.getByText(/no cards in hand/i)).toBeInTheDocument()
    })

    it('should handle empty table gracefully', () => {
      const gameStateEmptyTable = {
        ...mockGameState,
        tableCards: []
      }
      
      const emptyTableProps = {
        ...defaultProps,
        tableCards: []
      }
      render(<GameActions {...emptyTableProps} />)
      
      expect(screen.getByText(/no cards on table/i)).toBeInTheDocument()
    })

    it('should clear selection when phase changes', () => {
      const { rerender } = render(<GameActions {...defaultProps} />)
      
      // Select a card
      fireEvent.click(screen.getByTestId('card-hearts-A'))
      expect(screen.getByTestId('card-hearts-A')).toHaveClass('selected')
      
      // Change phase
      const newGameState = {
        ...mockGameState,
        phase: 'round2'
      }
      
      const newProps = {
        ...defaultProps,
        playerHand: [global.testUtils.createMockCard('hearts', 'K')]
      }
      rerender(<GameActions {...newProps} />)
      
      // Selection should be cleared
      expect(screen.getByTestId('card-hearts-A')).not.toHaveClass('selected')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for actions', () => {
      render(<GameActions {...defaultProps} />)
      
      const captureButton = screen.queryByRole('button', { name: /capture/i })
      if (captureButton) {
        expect(captureButton).toHaveAttribute('aria-label')
      }
    })

    it('should announce turn changes to screen readers', () => {
      const { rerender } = render(<GameActions {...defaultProps} />)
      
      expect(screen.getByRole('status')).toHaveTextContent(/your turn/i)
      
      const gameStateNotMyTurn = {
        ...mockGameState,
        currentTurn: 2
      }
      
      const notMyTurnProps = {
        ...defaultProps,
        isMyTurn: false
      }
      rerender(<GameActions {...notMyTurnProps} />)
      
      expect(screen.getByRole('status')).toHaveTextContent(/opponent's turn/i)
    })

    it('should have keyboard navigation support', async () => {
      const user = userEvent.setup()
      render(<GameActions {...defaultProps} />)
      
      const firstCard = screen.getByTestId('card-hearts-A')
      firstCard.focus()
      
      await user.keyboard('{Tab}')
      expect(screen.getByTestId('card-spades-5')).toHaveFocus()
    })
  })
})