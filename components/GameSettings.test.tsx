import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GameSettings, useGamePreferences, useGameStatistics } from './GameSettings'

// Mock localStorage more thoroughly
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      store = {}
    })
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
})

describe('GameSettings Component', () => {
  const defaultPreferences = global.testUtils.createMockPreferences()
  const defaultStatistics = global.testUtils.createMockStatistics({
    gamesPlayed: 10,
    gamesWon: 7,
    gamesLost: 3,
    totalScore: 85,
    bestScore: 11,
    currentWinStreak: 3,
    longestWinStreak: 5
  })

  const defaultProps = {
    preferences: defaultPreferences,
    onPreferencesChange: jest.fn(),
    statistics: defaultStatistics
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.clear()
  })

  describe('Component Rendering', () => {
    it('should render settings trigger button', () => {
      render(<GameSettings {...defaultProps} />)
      
      expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
    })

    it('should open settings dialog when clicked', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText(/game settings/i)).toBeInTheDocument()
    })

    it('should render all preference controls', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText(/sound enabled/i)).toBeInTheDocument()
      expect(screen.getByText(/sound volume/i)).toBeInTheDocument()
      expect(screen.getByText(/hints enabled/i)).toBeInTheDocument()
      expect(screen.getByText(/statistics enabled/i)).toBeInTheDocument()
    })

    it('should render statistics when provided', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText(/games played/i)).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument() // games played
      expect(screen.getByText('7')).toBeInTheDocument()  // games won
      expect(screen.getByText('70.0%')).toBeInTheDocument() // win rate
    })

    it('should not render statistics section when not provided', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} statistics={undefined} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.queryByText(/games played/i)).not.toBeInTheDocument()
    })
  })

  describe('Preference Controls', () => {
    it('should toggle sound enabled preference', async () => {
      const user = userEvent.setup()
      const onPreferencesChange = jest.fn()
      
      render(
        <GameSettings 
          {...defaultProps} 
          preferences={{ ...defaultPreferences, soundEnabled: false }}
          onPreferencesChange={onPreferencesChange}
        />
      )
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      const soundToggle = screen.getByRole('switch', { name: /sound enabled/i })
      await user.click(soundToggle)
      
      expect(onPreferencesChange).toHaveBeenCalledWith({
        ...defaultPreferences,
        soundEnabled: true
      })
    })

    it('should change sound volume', async () => {
      const user = userEvent.setup()
      const onPreferencesChange = jest.fn()
      
      render(<GameSettings {...defaultProps} onPreferencesChange={onPreferencesChange} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      const volumeSlider = screen.getByRole('slider', { name: /sound volume/i })
      
      // Simulate slider change
      fireEvent.change(volumeSlider, { target: { value: '0.8' } })
      
      expect(onPreferencesChange).toHaveBeenCalledWith({
        ...defaultPreferences,
        soundVolume: 0.8
      })
    })

    it('should disable volume control when sound is disabled', async () => {
      const user = userEvent.setup()
      
      render(
        <GameSettings 
          {...defaultProps} 
          preferences={{ ...defaultPreferences, soundEnabled: false }}
        />
      )
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      const volumeSlider = screen.getByRole('slider', { name: /sound volume/i })
      expect(volumeSlider).toBeDisabled()
    })

    it('should toggle hints enabled preference', async () => {
      const user = userEvent.setup()
      const onPreferencesChange = jest.fn()
      
      render(<GameSettings {...defaultProps} onPreferencesChange={onPreferencesChange} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      const hintsToggle = screen.getByRole('switch', { name: /hints enabled/i })
      await user.click(hintsToggle)
      
      expect(onPreferencesChange).toHaveBeenCalledWith({
        ...defaultPreferences,
        hintsEnabled: false
      })
    })

    it('should toggle statistics enabled preference', async () => {
      const user = userEvent.setup()
      const onPreferencesChange = jest.fn()
      
      render(<GameSettings {...defaultProps} onPreferencesChange={onPreferencesChange} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      const statsToggle = screen.getByRole('switch', { name: /statistics enabled/i })
      await user.click(statsToggle)
      
      expect(onPreferencesChange).toHaveBeenCalledWith({
        ...defaultPreferences,
        statisticsEnabled: false
      })
    })
  })

  describe('Statistics Display', () => {
    it('should calculate and display win rate correctly', async () => {
      const user = userEvent.setup()
      const stats = global.testUtils.createMockStatistics({
        gamesPlayed: 20,
        gamesWon: 15,
        gamesLost: 5
      })
      
      render(<GameSettings {...defaultProps} statistics={stats} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText('75.0%')).toBeInTheDocument() // 15/20 = 75%
    })

    it('should handle zero games played', async () => {
      const user = userEvent.setup()
      const stats = global.testUtils.createMockStatistics({
        gamesPlayed: 0,
        gamesWon: 0,
        gamesLost: 0
      })
      
      render(<GameSettings {...defaultProps} statistics={stats} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText('0.0%')).toBeInTheDocument()
    })

    it('should display average score correctly', async () => {
      const user = userEvent.setup()
      const stats = global.testUtils.createMockStatistics({
        gamesPlayed: 4,
        totalScore: 30
      })
      
      render(<GameSettings {...defaultProps} statistics={stats} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      expect(screen.getByText('7.5')).toBeInTheDocument() // 30/4 = 7.5
    })

    it('should display all statistics correctly', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      // Check all expected statistics
      expect(screen.getByText('10')).toBeInTheDocument() // games played
      expect(screen.getByText('7')).toBeInTheDocument()  // games won
      expect(screen.getByText('3')).toBeInTheDocument()  // games lost
      expect(screen.getByText('8.5')).toBeInTheDocument() // average score (85/10)
      expect(screen.getByText('11')).toBeInTheDocument() // best score
      expect(screen.getByText('3')).toBeInTheDocument()  // current streak
      expect(screen.getByText('5')).toBeInTheDocument()  // longest streak
    })
  })

  describe('Dialog Interactions', () => {
    it('should close dialog when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should close dialog when clicking outside', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      // Click on overlay
      await user.click(document.body)
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should handle escape key to close dialog', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      
      await user.keyboard('{Escape}')
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      expect(settingsButton).toHaveAttribute('aria-label')
      
      await user.click(settingsButton)
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('should trap focus within dialog', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /settings/i }))
      
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      
      // Focus should be trapped within the dialog
      const firstFocusable = screen.getByRole('switch', { name: /sound enabled/i })
      expect(firstFocusable).toHaveFocus()
    })

    it('should restore focus when dialog closes', async () => {
      const user = userEvent.setup()
      render(<GameSettings {...defaultProps} />)
      
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)
      
      await user.click(screen.getByRole('button', { name: /close/i }))
      
      expect(settingsButton).toHaveFocus()
    })
  })
})

describe('useGamePreferences Hook', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it('should return default preferences when none stored', () => {
    const TestComponent = () => {
      const [preferences] = useGamePreferences()
      return <div data-testid="preferences">{JSON.stringify(preferences)}</div>
    }
    
    render(<TestComponent />)
    
    const preferencesElement = screen.getByTestId('preferences')
    const preferences = JSON.parse(preferencesElement.textContent || '{}')
    
    expect(preferences).toEqual(global.testUtils.createMockPreferences())
  })

  it('should load preferences from localStorage', () => {
    const storedPreferences = {
      soundEnabled: false,
      soundVolume: 0.8,
      hintsEnabled: false,
      statisticsEnabled: false
    }
    
    mockLocalStorage.setItem('cassino-preferences', JSON.stringify(storedPreferences))
    
    const TestComponent = () => {
      const [preferences] = useGamePreferences()
      return <div data-testid="preferences">{JSON.stringify(preferences)}</div>
    }
    
    render(<TestComponent />)
    
    const preferencesElement = screen.getByTestId('preferences')
    const preferences = JSON.parse(preferencesElement.textContent || '{}')
    
    expect(preferences).toEqual(storedPreferences)
  })

  it('should save preferences to localStorage when changed', () => {
    const TestComponent = () => {
      const [preferences, setPreferences] = useGamePreferences()
      
      return (
        <div>
          <div data-testid="preferences">{JSON.stringify(preferences)}</div>
          <button
            onClick={() => setPreferences({ ...preferences, soundEnabled: false })}
            data-testid="change-preferences"
          >
            Change
          </button>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    fireEvent.click(screen.getByTestId('change-preferences'))
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'cassino-preferences',
      JSON.stringify({
        ...global.testUtils.createMockPreferences(),
        soundEnabled: false
      })
    )
  })

  it('should handle localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('localStorage error')
    })
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    const TestComponent = () => {
      const [preferences] = useGamePreferences()
      return <div data-testid="preferences">{JSON.stringify(preferences)}</div>
    }
    
    render(<TestComponent />)
    
    // Should fall back to defaults
    const preferencesElement = screen.getByTestId('preferences')
    const preferences = JSON.parse(preferencesElement.textContent || '{}')
    
    expect(preferences).toEqual(global.testUtils.createMockPreferences())
    expect(consoleSpy).toHaveBeenCalled()
    
    consoleSpy.mockRestore()
  })
})

describe('useGameStatistics Hook', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it('should return default statistics when none stored', () => {
    const TestComponent = () => {
      const [statistics] = useGameStatistics()
      return <div data-testid="statistics">{JSON.stringify(statistics)}</div>
    }
    
    render(<TestComponent />)
    
    const statisticsElement = screen.getByTestId('statistics')
    const statistics = JSON.parse(statisticsElement.textContent || '{}')
    
    expect(statistics).toEqual(global.testUtils.createMockStatistics())
  })

  it('should load statistics from localStorage', () => {
    const storedStatistics = global.testUtils.createMockStatistics({
      gamesPlayed: 5,
      gamesWon: 3,
      totalScore: 45
    })
    
    mockLocalStorage.setItem('cassino-statistics', JSON.stringify(storedStatistics))
    
    const TestComponent = () => {
      const [statistics] = useGameStatistics()
      return <div data-testid="statistics">{JSON.stringify(statistics)}</div>
    }
    
    render(<TestComponent />)
    
    const statisticsElement = screen.getByTestId('statistics')
    const statistics = JSON.parse(statisticsElement.textContent || '{}')
    
    expect(statistics).toEqual(storedStatistics)
  })

  it('should update statistics correctly', () => {
    const TestComponent = () => {
      const [statistics, updateStatistics] = useGameStatistics()
      
      return (
        <div>
          <div data-testid="statistics">{JSON.stringify(statistics)}</div>
          <button
            onClick={() => updateStatistics({ gamesPlayed: 1, gamesWon: 1 })}
            data-testid="update-statistics"
          >
            Update
          </button>
        </div>
      )
    }
    
    render(<TestComponent />)
    
    fireEvent.click(screen.getByTestId('update-statistics'))
    
    const statisticsElement = screen.getByTestId('statistics')
    const statistics = JSON.parse(statisticsElement.textContent || '{}')
    
    expect(statistics.gamesPlayed).toBe(1)
    expect(statistics.gamesWon).toBe(1)
  })

  it('should save statistics to localStorage when updated', () => {
    const TestComponent = () => {
      const [, updateStatistics] = useGameStatistics()
      
      return (
        <button
          onClick={() => updateStatistics({ gamesPlayed: 1, gamesWon: 1 })}
          data-testid="update-statistics"
        >
          Update
        </button>
      )
    }
    
    render(<TestComponent />)
    
    fireEvent.click(screen.getByTestId('update-statistics'))
    
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
      'cassino-statistics',
      expect.stringContaining('"gamesPlayed":1')
    )
  })
})