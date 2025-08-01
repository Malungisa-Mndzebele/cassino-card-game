import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from './Card'

describe('Card Component', () => {
  const mockCard = global.testUtils.createMockCard('hearts', 'A')
  
  const defaultProps = {
    card: mockCard,
    onClick: jest.fn(),
    disabled: false,
    selected: false,
    highlighted: false,
    size: 'normal' as const
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render card with correct rank and suit', () => {
      render(<Card {...defaultProps} />)
      
      expect(screen.getByText('A')).toBeInTheDocument()
      expect(screen.getByText('♥')).toBeInTheDocument()
    })

    it('should render different suits correctly', () => {
      const suits = [
        { suit: 'hearts', symbol: '♥', color: 'text-red-500' },
        { suit: 'diamonds', symbol: '♦', color: 'text-red-500' },
        { suit: 'clubs', symbol: '♣', color: 'text-black' },
        { suit: 'spades', symbol: '♠', color: 'text-black' }
      ]

      suits.forEach(({ suit, symbol, color }) => {
        const card = global.testUtils.createMockCard(suit, 'K')
        const { unmount } = render(<Card {...defaultProps} card={card} />)
        
        expect(screen.getByText(symbol)).toBeInTheDocument()
        expect(screen.getByText(symbol)).toHaveClass(color)
        
        unmount()
      })
    })

    it('should render different ranks correctly', () => {
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
      
      ranks.forEach(rank => {
        const card = global.testUtils.createMockCard('hearts', rank)
        const { unmount } = render(<Card {...defaultProps} card={card} />)
        
        expect(screen.getByText(rank)).toBeInTheDocument()
        
        unmount()
      })
    })

    it('should apply selected styling when selected', () => {
      render(<Card {...defaultProps} selected={true} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('ring-4', 'ring-blue-500')
    })

    it('should apply highlighted styling when highlighted', () => {
      render(<Card {...defaultProps} highlighted={true} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('ring-2', 'ring-yellow-400')
    })

    it('should apply disabled styling when disabled', () => {
      render(<Card {...defaultProps} disabled={true} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('opacity-50', 'cursor-not-allowed')
      expect(cardElement).toBeDisabled()
    })
  })

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      render(<Card {...defaultProps} size="small" />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('w-12', 'h-16')
    })

    it('should render normal size correctly', () => {
      render(<Card {...defaultProps} size="normal" />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('w-16', 'h-24')
    })

    it('should render large size correctly', () => {
      render(<Card {...defaultProps} size="large" />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('w-20', 'h-28')
    })
  })

  describe('Interactions', () => {
    it('should call onClick when clicked', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()
      
      render(<Card {...defaultProps} onClick={onClick} />)
      
      await user.click(screen.getByRole('button'))
      
      expect(onClick).toHaveBeenCalledWith(mockCard)
    })

    it('should not call onClick when disabled', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()
      
      render(<Card {...defaultProps} onClick={onClick} disabled={true} />)
      
      await user.click(screen.getByRole('button'))
      
      expect(onClick).not.toHaveBeenCalled()
    })

    it('should handle keyboard interactions', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()
      
      render(<Card {...defaultProps} onClick={onClick} />)
      
      const cardElement = screen.getByRole('button')
      cardElement.focus()
      
      await user.keyboard('{Enter}')
      expect(onClick).toHaveBeenCalledWith(mockCard)
      
      onClick.mockClear()
      
      await user.keyboard(' ')
      expect(onClick).toHaveBeenCalledWith(mockCard)
    })

    it('should not respond to keyboard when disabled', async () => {
      const user = userEvent.setup()
      const onClick = jest.fn()
      
      render(<Card {...defaultProps} onClick={onClick} disabled={true} />)
      
      const cardElement = screen.getByRole('button')
      cardElement.focus()
      
      await user.keyboard('{Enter}')
      expect(onClick).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper button role', () => {
      render(<Card {...defaultProps} />)
      
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should have descriptive aria-label', () => {
      render(<Card {...defaultProps} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveAttribute('aria-label', 'Ace of Hearts')
    })

    it('should indicate selected state to screen readers', () => {
      render(<Card {...defaultProps} selected={true} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveAttribute('aria-pressed', 'true')
    })

    it('should indicate disabled state to screen readers', () => {
      render(<Card {...defaultProps} disabled={true} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveAttribute('aria-disabled', 'true')
    })

    it('should be focusable when not disabled', () => {
      render(<Card {...defaultProps} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveAttribute('tabIndex', '0')
    })

    it('should not be focusable when disabled', () => {
      render(<Card {...defaultProps} disabled={true} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveAttribute('tabIndex', '-1')
    })
  })

  describe('Special Cards', () => {
    it('should highlight special scoring cards', () => {
      const specialCards = [
        global.testUtils.createMockCard('spades', 'A'),     // Ace of Spades
        global.testUtils.createMockCard('hearts', 'A'),     // Ace of Hearts  
        global.testUtils.createMockCard('diamonds', 'A'),   // Ace of Diamonds
        global.testUtils.createMockCard('clubs', 'A'),      // Ace of Clubs
        global.testUtils.createMockCard('spades', '2'),     // 2 of Spades
        global.testUtils.createMockCard('diamonds', '10')   // 10 of Diamonds
      ]

      specialCards.forEach(card => {
        const { unmount } = render(<Card {...defaultProps} card={card} />)
        
        const cardElement = screen.getByRole('button')
        // Should have special styling for scoring cards
        expect(cardElement).toHaveClass('relative')
        
        unmount()
      })
    })

    it('should show point values for special cards', () => {
      const twoOfSpades = global.testUtils.createMockCard('spades', '2')
      render(<Card {...defaultProps} card={twoOfSpades} />)
      
      // Should show point indicator
      expect(screen.getByText('1pt')).toBeInTheDocument()
    })

    it('should show correct point values', () => {
      const testCases = [
        { card: global.testUtils.createMockCard('spades', '2'), points: '1pt' },
        { card: global.testUtils.createMockCard('diamonds', '10'), points: '2pt' },
        { card: global.testUtils.createMockCard('hearts', 'A'), points: '1pt' }
      ]

      testCases.forEach(({ card, points }) => {
        const { unmount } = render(<Card {...defaultProps} card={card} />)
        
        expect(screen.getByText(points)).toBeInTheDocument()
        
        unmount()
      })
    })
  })

  describe('Animation and Visual Feedback', () => {
    it('should have hover effects when not disabled', () => {
      render(<Card {...defaultProps} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('hover:shadow-lg', 'transition-all')
    })

    it('should not have hover effects when disabled', () => {
      render(<Card {...defaultProps} disabled={true} />)
      
      const cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('cursor-not-allowed')
    })

    it('should show different states clearly', () => {
      const { rerender } = render(<Card {...defaultProps} />)
      
      // Normal state
      let cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('bg-white')
      
      // Selected state
      rerender(<Card {...defaultProps} selected={true} />)
      cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('ring-4', 'ring-blue-500')
      
      // Highlighted state
      rerender(<Card {...defaultProps} highlighted={true} />)
      cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('ring-2', 'ring-yellow-400')
      
      // Disabled state
      rerender(<Card {...defaultProps} disabled={true} />)
      cardElement = screen.getByRole('button')
      expect(cardElement).toHaveClass('opacity-50')
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing card gracefully', () => {
      render(<Card {...defaultProps} card={null as any} />)
      
      // Should render placeholder or empty state
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle invalid suit gracefully', () => {
      const invalidCard = global.testUtils.createMockCard('invalid', 'A')
      render(<Card {...defaultProps} card={invalidCard} />)
      
      expect(screen.getByText('A')).toBeInTheDocument()
      // Should fall back to default styling
    })

    it('should handle invalid rank gracefully', () => {
      const invalidCard = global.testUtils.createMockCard('hearts', 'INVALID')
      render(<Card {...defaultProps} card={invalidCard} />)
      
      expect(screen.getByText('♥')).toBeInTheDocument()
      // Should still render the rank even if invalid
    })
  })
})