import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { Card } from './Card';

describe('Card Component', () => {
  const mockOnClick = vi.fn();
  
  const defaultCard = {
    id: 'test-card-1',
    suit: 'hearts',
    rank: 'A'
  };

  const defaultProps = {
    card: defaultCard,
    onClick: mockOnClick,
    isSelected: false,
    isPlayable: false,
    isHighlighted: false,
    isDisabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render card with correct rank and suit', () => {
      render(<Card {...defaultProps} />);
      
      expect(screen.getByText('A')).toBeInTheDocument();
      expect(screen.getByText('♥')).toBeInTheDocument();
    });

    it('should render different suits correctly', () => {
      const suits = [
        { suit: 'hearts', symbol: '♥' },
        { suit: 'diamonds', symbol: '♦' },
        { suit: 'clubs', symbol: '♣' },
        { suit: 'spades', symbol: '♠' }
      ];

      suits.forEach(({ suit, symbol }) => {
        const { unmount } = render(
          <Card {...defaultProps} card={{ ...defaultCard, suit }} />
        );
        
        expect(screen.getByText(symbol)).toBeInTheDocument();
        unmount();
      });
    });

    it('should render different ranks correctly', () => {
      const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
      
      ranks.forEach(rank => {
        const { unmount } = render(
          <Card {...defaultProps} card={{ ...defaultCard, rank }} />
        );
        
        expect(screen.getByText(rank)).toBeInTheDocument();
        unmount();
      });
    });

    it('should have correct test ID', () => {
      render(<Card {...defaultProps} />);
      
      expect(screen.getByTestId('card-test-card-1')).toBeInTheDocument();
    });
  });

  describe('Card Interactions', () => {
    it('should call onClick when card is clicked', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      fireEvent.click(card);
      
      expect(mockOnClick).toHaveBeenCalledWith(defaultCard.id);
    });

    it('should not call onClick when card is disabled', () => {
      render(<Card {...defaultProps} isDisabled={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      fireEvent.click(card);
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should handle click without onClick handler', () => {
      render(<Card {...defaultProps} onClick={undefined} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(() => fireEvent.click(card)).not.toThrow();
    });
  });

  describe('Visual States', () => {
    it('should apply selected class when isSelected is true', () => {
      render(<Card {...defaultProps} isSelected={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('selected');
    });

    it('should not apply selected class when isSelected is false', () => {
      render(<Card {...defaultProps} isSelected={false} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).not.toHaveClass('selected');
    });

    it('should apply playable class when isPlayable is true', () => {
      render(<Card {...defaultProps} isPlayable={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('playable');
    });

    it('should not apply playable class when isPlayable is false', () => {
      render(<Card {...defaultProps} isPlayable={false} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).not.toHaveClass('playable');
    });

    it('should apply highlighted class when isHighlighted is true', () => {
      render(<Card {...defaultProps} isHighlighted={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('highlighted');
    });

    it('should not apply highlighted class when isHighlighted is false', () => {
      render(<Card {...defaultProps} isHighlighted={false} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).not.toHaveClass('highlighted');
    });

    it('should apply disabled class when isDisabled is true', () => {
      render(<Card {...defaultProps} isDisabled={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('disabled');
    });

    it('should not apply disabled class when isDisabled is false', () => {
      render(<Card {...defaultProps} isDisabled={false} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).not.toHaveClass('disabled');
    });

    it('should apply multiple classes when multiple states are true', () => {
      render(
        <Card 
          {...defaultProps} 
          isSelected={true}
          isPlayable={true}
          isHighlighted={true}
        />
      );
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('selected');
      expect(card).toHaveClass('playable');
      expect(card).toHaveClass('highlighted');
    });
  });

  describe('Suit Colors', () => {
    it('should apply red color to hearts', () => {
      render(<Card {...defaultProps} card={{ ...defaultCard, suit: 'hearts' }} />);
      
      const suitElement = screen.getByText('♥');
      expect(suitElement).toHaveClass('text-red-600');
    });

    it('should apply red color to diamonds', () => {
      render(<Card {...defaultProps} card={{ ...defaultCard, suit: 'diamonds' }} />);
      
      const suitElement = screen.getByText('♦');
      expect(suitElement).toHaveClass('text-red-600');
    });

    it('should apply black color to clubs', () => {
      render(<Card {...defaultProps} card={{ ...defaultCard, suit: 'clubs' }} />);
      
      const suitElement = screen.getByText('♣');
      expect(suitElement).toHaveClass('text-gray-800');
    });

    it('should apply black color to spades', () => {
      render(<Card {...defaultProps} card={{ ...defaultCard, suit: 'spades' }} />);
      
      const suitElement = screen.getByText('♠');
      expect(suitElement).toHaveClass('text-gray-800');
    });
  });

  describe('Card Sizing', () => {
    it('should apply default size classes', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('w-16', 'h-24');
    });

    it('should apply small size when size prop is small', () => {
      render(<Card {...defaultProps} size="small" />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('w-12', 'h-18');
    });

    it('should apply large size when size prop is large', () => {
      render(<Card {...defaultProps} size="large" />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveClass('w-20', 'h-30');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes when disabled', () => {
      render(<Card {...defaultProps} isDisabled={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveAttribute('aria-disabled', 'true');
    });

    it('should have proper ARIA attributes when selected', () => {
      render(<Card {...defaultProps} isSelected={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper role attribute', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveAttribute('role', 'button');
    });

    it('should have proper tab index when not disabled', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper tab index when disabled', () => {
      render(<Card {...defaultProps} isDisabled={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      expect(card).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('Keyboard Interactions', () => {
    it('should call onClick when Enter key is pressed', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(mockOnClick).toHaveBeenCalledWith(defaultCard.id);
    });

    it('should call onClick when Space key is pressed', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      fireEvent.keyDown(card, { key: ' ' });
      
      expect(mockOnClick).toHaveBeenCalledWith(defaultCard.id);
    });

    it('should not call onClick when other keys are pressed', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      fireEvent.keyDown(card, { key: 'Tab' });
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when disabled and key is pressed', () => {
      render(<Card {...defaultProps} isDisabled={true} />);
      
      const card = screen.getByTestId('card-test-card-1');
      fireEvent.keyDown(card, { key: 'Enter' });
      
      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing card data gracefully', () => {
      const incompleteCard = { id: 'incomplete-card' };
      
      render(<Card {...defaultProps} card={incompleteCard} />);
      
      const card = screen.getByTestId('card-incomplete-card');
      expect(card).toBeInTheDocument();
    });

    it('should handle empty card ID', () => {
      const emptyIdCard = { id: '', suit: 'hearts', rank: 'A' };
      
      render(<Card {...defaultProps} card={emptyIdCard} />);
      
      const card = screen.getByTestId('card-');
      expect(card).toBeInTheDocument();
    });

    it('should handle special characters in card ID', () => {
      const specialIdCard = { id: 'card@#$%^&*()', suit: 'hearts', rank: 'A' };
      
      render(<Card {...defaultProps} card={specialIdCard} />);
      
      const card = screen.getByTestId('card-card@#$%^&*()');
      expect(card).toBeInTheDocument();
    });

    it('should handle very long card ID', () => {
      const longIdCard = { id: 'A'.repeat(100), suit: 'hearts', rank: 'A' };
      
      render(<Card {...defaultProps} card={longIdCard} />);
      
      const card = screen.getByTestId(`card-${longIdCard.id}`);
      expect(card).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily when props are the same', () => {
      const { rerender } = render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      const initialTextContent = card.textContent;
      
      rerender(<Card {...defaultProps} />);
      
      expect(card.textContent).toBe(initialTextContent);
    });

    it('should handle rapid clicks gracefully', () => {
      render(<Card {...defaultProps} />);
      
      const card = screen.getByTestId('card-test-card-1');
      
      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(card);
      }
      
      expect(mockOnClick).toHaveBeenCalledTimes(10);
    });
  });
});
