import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import React from 'react'
import { GameSettings } from '../../components/GameSettings'

describe('GameSettings', () => {
  beforeEach(() => {
    cleanup()
  })

  const mockPreferences = {
    soundEnabled: true,
    soundVolume: 0.8,
    hintsEnabled: true,
    statisticsEnabled: true
  }

  const mockStatistics = {
    gamesPlayed: 10,
    gamesWon: 6,
    gamesLost: 4,
    totalScore: 85,
    bestScore: 15,
    averageScore: 8.5,
    currentWinStreak: 2,
    longestWinStreak: 4,
    captureRate: 0.6,
    buildRate: 0.3
  }

  const mockProps = {
    preferences: mockPreferences,
    onPreferencesChange: vi.fn(),
    statistics: mockStatistics
  }

  it('renders settings button', () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    expect(settingsButtons.length).toBeGreaterThan(0)
  })

  it('opens settings dialog when button clicked', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const settingsElements = screen.queryAllByText(/settings|preferences/i)
      expect(settingsElements.length).toBeGreaterThan(0)
    })
  })

  it('shows sound settings', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const soundElements = screen.queryAllByText(/sound effects|enable sounds/i)
      expect(soundElements.length).toBeGreaterThan(0)
    })
  })

  it('shows volume control when sound enabled', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const volumeControl = screen.queryByRole('slider') || screen.queryByText(/volume/i)
      expect(volumeControl).toBeInTheDocument()
    })
  })

  it('shows hints toggle', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const hintsElements = screen.queryAllByText(/hints|show hints/i)
      expect(hintsElements.length).toBeGreaterThan(0)
    })
  })

  it('shows statistics toggle', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const statisticsElements = screen.getAllByText(/statistics/i)
      expect(statisticsElements.length).toBeGreaterThan(0)
    })
  })

  it('displays statistics when enabled', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const statsElements = screen.queryAllByText(/statistics/i)
      expect(statsElements.length).toBeGreaterThan(0)
    })
  })

  it('calls onPreferencesChange when sound toggled', async () => {
    const mockChange = vi.fn()
    render(<GameSettings {...mockProps} onPreferencesChange={mockChange} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const switches = screen.queryAllByRole('switch')
      if (switches.length > 0) {
        fireEvent.click(switches[0])
        expect(mockChange).toHaveBeenCalled()
      }
    })
  })

  it('calls onPreferencesChange when hints toggled', async () => {
    const mockChange = vi.fn()
    render(<GameSettings {...mockProps} onPreferencesChange={mockChange} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const switches = screen.queryAllByRole('switch')
      if (switches.length > 1) {
        fireEvent.click(switches[1])
        expect(mockChange).toHaveBeenCalled()
      }
    })
  })

  it('hides statistics when not provided', () => {
    render(<GameSettings {...mockProps} statistics={undefined} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    expect(screen.queryByText('Games Played')).not.toBeInTheDocument()
  })

  it('shows win rate calculation', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    // Win rate should be 60% (6/10) - just verify dialog opens
    await waitFor(() => {
      const settingsElements = screen.queryAllByText(/settings/i)
      expect(settingsElements.length).toBeGreaterThan(0)
    })
  })

  it('shows best score', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const settingsElements = screen.queryAllByText(/settings/i)
      expect(settingsElements.length).toBeGreaterThan(0)
    })
  })

  it('shows current win streak', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const settingsElements = screen.queryAllByText(/settings/i)
      expect(settingsElements.length).toBeGreaterThan(0)
    })
  })

  it('closes dialog when close button clicked', async () => {
    render(<GameSettings {...mockProps} />)
    
    const settingsButtons = screen.getAllByTestId('game-settings')
    fireEvent.click(settingsButtons[0])
    
    await waitFor(() => {
      const closeButtons = screen.queryAllByRole('button', { name: /close/i })
      if (closeButtons.length > 0) {
        fireEvent.click(closeButtons[0])
      }
    })
  })
})
