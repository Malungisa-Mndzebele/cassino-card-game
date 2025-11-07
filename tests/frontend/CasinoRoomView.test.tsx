import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'
import { CasinoRoomView } from '../../components/CasinoRoomView'

describe('CasinoRoomView', () => {
  beforeEach(() => {
    cleanup()
  })

  const mockProps = {
    roomId: 'TEST01',
    players: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ],
    player1Ready: false,
    player2Ready: false,
    playerId: 1,
    onPlayerReady: vi.fn(),
    onPlayerNotReady: vi.fn(),
    onStartShuffle: undefined
  }

  it('renders dealer room with players', () => {
    render(<CasinoRoomView {...mockProps} />)
    
    expect(screen.getByText('DEALER')).toBeInTheDocument()
    const aliceElements = screen.getAllByText('Alice')
    expect(aliceElements.length).toBeGreaterThan(0)
    const bobElements = screen.getAllByText('Bob')
    expect(bobElements.length).toBeGreaterThan(0)
    const roomCodeElements = screen.getAllByText('TEST01')
    expect(roomCodeElements.length).toBeGreaterThan(0)
  })

  it('shows ready button when player is not ready', () => {
    render(<CasinoRoomView {...mockProps} />)
    
    const readyButtons = screen.getAllByRole('button', { name: /i'm ready/i })
    expect(readyButtons.length).toBeGreaterThan(0)
  })

  it('shows shuffle button when both players ready and player is player 1', () => {
    const mockShuffle = vi.fn()
    render(
      <CasinoRoomView 
        {...mockProps} 
        player1Ready={true}
        player2Ready={true}
        onStartShuffle={mockShuffle}
      />
    )
    
    const shuffleButtons = screen.getAllByRole('button', { name: /shuffle the deck/i })
    expect(shuffleButtons.length).toBeGreaterThan(0)
  })

  it('calls onPlayerReady when ready button clicked', () => {
    const mockReady = vi.fn()
    render(<CasinoRoomView {...mockProps} onPlayerReady={mockReady} />)
    
    const readyButtons = screen.getAllByRole('button', { name: /i'm ready/i })
    fireEvent.click(readyButtons[0])
    
    expect(mockReady).toHaveBeenCalled()
  })

  it('calls onStartShuffle when shuffle button clicked', () => {
    const mockShuffle = vi.fn()
    render(
      <CasinoRoomView 
        {...mockProps} 
        player1Ready={true}
        player2Ready={true}
        onStartShuffle={mockShuffle}
      />
    )
    
    const shuffleButtons = screen.getAllByRole('button', { name: /shuffle the deck/i })
    fireEvent.click(shuffleButtons[0])
    
    expect(mockShuffle).toHaveBeenCalled()
  })

  it('shows waiting message when not both players ready', () => {
    render(<CasinoRoomView {...mockProps} />)
    
    expect(screen.getByText(/both players must confirm/i)).toBeInTheDocument()
  })

  it('shows all players ready message when both ready', () => {
    render(
      <CasinoRoomView 
        {...mockProps} 
        player1Ready={true}
        player2Ready={true}
      />
    )
    
    expect(screen.getByText(/all players ready/i)).toBeInTheDocument()
  })
})
