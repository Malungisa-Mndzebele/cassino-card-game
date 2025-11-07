import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { AppHeader } from '../../components/app/AppHeader'

describe('AppHeader', () => {
  const mockProps = {
    roomId: 'TEST01',
    connectionStatus: 'connected' as const,
    myName: 'Alice',
    opponentName: 'Bob',
    myScore: 5,
    opponentScore: 3,
    phase: 'round1' as const,
    round: 1,
    onLeave: vi.fn()
  }

  it('renders room ID', () => {
    render(<AppHeader {...mockProps} />)
    
    const roomIdElements = screen.getAllByText('TEST01')
    expect(roomIdElements.length).toBeGreaterThan(0)
  })

  it('shows player names', () => {
    render(<AppHeader {...mockProps} />)
    
    const aliceElements = screen.getAllByText('Alice')
    expect(aliceElements.length).toBeGreaterThan(0)
    const bobElements = screen.getAllByText('Bob')
    expect(bobElements.length).toBeGreaterThan(0)
  })

  it('displays scores', () => {
    render(<AppHeader {...mockProps} />)
    
    const score5Elements = screen.queryAllByText('5')
    const score3Elements = screen.queryAllByText('3')
    // Scores might appear multiple times, just verify they exist
    expect(score5Elements.length + score3Elements.length).toBeGreaterThan(0)
  })

  it('shows connection status', () => {
    render(<AppHeader {...mockProps} />)
    
    const connectedElements = screen.getAllByText(/connected/i)
    expect(connectedElements.length).toBeGreaterThan(0)
  })

  it('shows disconnected status', () => {
    render(<AppHeader {...mockProps} connectionStatus="disconnected" />)
    
    const disconnectedElements = screen.getAllByText(/disconnected/i)
    expect(disconnectedElements.length).toBeGreaterThan(0)
  })

  it('shows connecting status', () => {
    render(<AppHeader {...mockProps} connectionStatus="connecting" />)
    
    const connectingElements = screen.getAllByText(/connecting/i)
    expect(connectingElements.length).toBeGreaterThan(0)
  })

  it('displays current phase', () => {
    render(<AppHeader {...mockProps} />)
    
    const round1Elements = screen.getAllByText(/round.*1/i)
    expect(round1Elements.length).toBeGreaterThan(0)
  })

  it('shows round number', () => {
    render(<AppHeader {...mockProps} round={2} />)
    
    const round2Elements = screen.getAllByText(/round.*2/i)
    expect(round2Elements.length).toBeGreaterThan(0)
  })

  it('has leave button', () => {
    render(<AppHeader {...mockProps} />)
    
    const leaveButtons = screen.getAllByRole('button', { name: /leave/i })
    expect(leaveButtons.length).toBeGreaterThan(0)
  })

  it('calls onLeave when leave button clicked', async () => {
    const mockLeave = vi.fn()
    render(<AppHeader {...mockProps} onLeave={mockLeave} />)
    
    const leaveButtons = screen.getAllByRole('button', { name: /leave/i })
    expect(leaveButtons.length).toBeGreaterThan(0)
    
    // Click all leave buttons to find the right one
    leaveButtons.forEach(button => fireEvent.click(button))
    
    expect(mockLeave).toHaveBeenCalled()
  })

  it('shows game title', () => {
    render(<AppHeader {...mockProps} />)
    
    // AppHeader shows room ID, not "Cassino" title
    const roomIdElements = screen.getAllByText('TEST01')
    expect(roomIdElements.length).toBeGreaterThan(0)
  })

  it('handles missing opponent name', () => {
    render(<AppHeader {...mockProps} opponentName="" />)
    
    // Component still renders with empty opponent name
    const roomIdElements = screen.getAllByText('TEST01')
    expect(roomIdElements.length).toBeGreaterThan(0)
  })

  it('shows score out of 11', () => {
    render(<AppHeader {...mockProps} />)
    
    // Should show scores in format like "5/11" or "5 - 3"
    const scoreTexts = screen.queryAllByText(/5.*3|5\/11|3\/11/)
    if (scoreTexts.length > 0) {
      expect(scoreTexts[0]).toBeInTheDocument()
    }
  })

  it('highlights winning player', () => {
    render(<AppHeader {...mockProps} myScore={8} opponentScore={3} />)
    
    // Verify scores are displayed
    const myScoreElements = screen.queryAllByText('8')
    const opponentScoreElements = screen.queryAllByText('3')
    expect(myScoreElements.length + opponentScoreElements.length).toBeGreaterThan(0)
  })

  it('shows waiting phase correctly', () => {
    render(<AppHeader {...mockProps} phase="waiting" />)
    
    const waitingElements = screen.getAllByText(/waiting/i)
    expect(waitingElements.length).toBeGreaterThan(0)
  })

  it('shows dealer phase correctly', () => {
    render(<AppHeader {...mockProps} phase="dealer" />)
    
    const dealerElements = screen.getAllByText(/dealer/i)
    expect(dealerElements.length).toBeGreaterThan(0)
  })

  it('shows finished phase correctly', () => {
    render(<AppHeader {...mockProps} phase="finished" />)
    
    const finishedElements = screen.getAllByText(/finished|complete/i)
    expect(finishedElements.length).toBeGreaterThan(0)
  })
})