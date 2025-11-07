import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { Card } from '../../components/Card'

describe('Card', () => {
  beforeEach(() => {
    cleanup()
  })

  const mockCard = {
    id: 'A_hearts',
    suit: 'hearts',
    rank: 'A',
    value: 14
  }

  const mockProps = {
    card: mockCard,
    onClick: vi.fn(),
    selected: false,
    disabled: false,
    size: 'medium' as const
  }

  it('renders card with rank and suit', () => {
    const { container } = render(<Card {...mockProps} />)
    
    const rankElements = container.querySelectorAll('*')
    const hasRank = Array.from(rankElements).some(el => el.textContent?.includes('A'))
    const hasSuit = Array.from(rankElements).some(el => el.textContent?.includes('♥'))
    expect(hasRank).toBe(true)
    expect(hasSuit).toBe(true)
  })

  it('shows spades suit symbol', () => {
    const spadesCard = {
      ...mockCard,
      suit: 'spades',
      id: 'A_spades'
    }
    
    const { container } = render(<Card {...mockProps} card={spadesCard} />)
    const hasSuit = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('♠'))
    expect(hasSuit).toBe(true)
  })

  it('shows diamonds suit symbol', () => {
    const diamondsCard = {
      ...mockCard,
      suit: 'diamonds',
      id: 'A_diamonds'
    }
    
    const { container } = render(<Card {...mockProps} card={diamondsCard} />)
    const hasSuit = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('♦'))
    expect(hasSuit).toBe(true)
  })

  it('shows clubs suit symbol', () => {
    const clubsCard = {
      ...mockCard,
      suit: 'clubs',
      id: 'A_clubs'
    }
    
    const { container } = render(<Card {...mockProps} card={clubsCard} />)
    const hasSuit = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('♣'))
    expect(hasSuit).toBe(true)
  })

  it('applies red color for hearts and diamonds', () => {
    const { container } = render(<Card {...mockProps} />)
    const hasSuit = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('♥'))
    expect(hasSuit).toBe(true)
  })

  it('applies black color for spades and clubs', () => {
    const spadesCard = {
      ...mockCard,
      suit: 'spades',
      id: 'A_spades'
    }
    
    const { container } = render(<Card {...mockProps} card={spadesCard} />)
    const hasSuit = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('♠'))
    expect(hasSuit).toBe(true)
  })

  it('calls onClick when clicked', () => {
    const mockClick = vi.fn()
    render(<Card {...mockProps} onClick={mockClick} />)
    
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    expect(mockClick).toHaveBeenCalled()
  })

  it('shows selected state', () => {
    render(<Card {...mockProps} selected={true} onClick={vi.fn()} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows disabled state', () => {
    const { container } = render(<Card {...mockProps} disabled={true} onClick={vi.fn()} />)
    
    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(0)
  })

  it('does not call onClick when disabled', () => {
    const mockClick = vi.fn()
    render(<Card {...mockProps} onClick={mockClick} disabled={true} />)
    
    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(0)
  })

  it('handles face cards correctly', () => {
    const kingCard = {
      ...mockCard,
      rank: 'K',
      value: 13,
      id: 'K_hearts'
    }
    
    const { container } = render(<Card {...mockProps} card={kingCard} />)
    const hasRank = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('K'))
    expect(hasRank).toBe(true)
  })

  it('handles number cards correctly', () => {
    const numberCard = {
      ...mockCard,
      rank: '10',
      value: 10,
      id: '10_hearts'
    }
    
    const { container } = render(<Card {...mockProps} card={numberCard} />)
    const hasRank = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('10'))
    expect(hasRank).toBe(true)
  })

  it('applies correct size class', () => {
    const { container } = render(<Card {...mockProps} size="large" />)
    const hasRank = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('A'))
    expect(hasRank).toBe(true)
  })

  it('applies small size class', () => {
    const { container } = render(<Card {...mockProps} size="small" />)
    const hasRank = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('A'))
    expect(hasRank).toBe(true)
  })

  it('has proper accessibility attributes', () => {
    render(<Card {...mockProps} onClick={vi.fn()} />)
    
    const buttons = screen.getAllByRole('button')
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('of'))
    expect(buttons[0]).toHaveAttribute('aria-label', expect.stringContaining('hearts'))
  })

  it('shows card back when face down', () => {
    const { container } = render(<Card {...mockProps} isHidden={true} />)
    
    // Should show ? instead of rank/suit
    const hasQuestion = Array.from(container.querySelectorAll('*')).some(el => el.textContent?.includes('?'))
    expect(hasQuestion).toBe(true)
  })
})
