import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../../App'

// Integration tests for complete game flows
describe('Complete Game Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock successful API responses for different game phases
    global.testUtils.mockFetch({
      success: true,
      roomId: 'test-room',
      gameState: global.testUtils.createMockGameState()
    })
  })

  describe('Room Creation and Joining Flow', () => {
    it('should complete full room creation and joining process', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Initial state - should show room manager
      expect(screen.getByTestId('room-manager')).toBeInTheDocument()
      
      // Enter player name
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Mock room creation response
      global.testUtils.mockFetch({
        success: true,
        roomId: 'ROOM123',
        gameState: global.testUtils.createMockGameState({ roomId: 'ROOM123' })
      })
      
      // Mock auto-join response
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({ 
          roomId: 'ROOM123',
          players: [{ id: 1, name: 'Player 1' }]
        })
      })
      
      // Create room
      await user.click(screen.getByTestId('create-room'))
      
      // Should transition to waiting state
      await waitFor(() => {
        expect(screen.getByText('Waiting for players...')).toBeInTheDocument()
      })
      
      expect(screen.getByText('1/2 players joined')).toBeInTheDocument()
      expect(screen.getByText('ROOM123')).toBeInTheDocument()
    })

    it('should handle second player joining', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Setup for joining existing room
      await user.type(screen.getByTestId('room-id-input'), 'ROOM123')
      await user.type(screen.getByTestId('player-name-input'), 'Player 2')
      
      // Mock join response with both players
      global.testUtils.mockFetch({
        success: true,
        playerId: 2,
        gameState: global.testUtils.createMockGameState({
          roomId: 'ROOM123',
          players: [
            { id: 1, name: 'Player 1' },
            { id: 2, name: 'Player 2' }
          ],
          phase: 'ceremonial'
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByText('Player 1 vs Player 2')).toBeInTheDocument()
      })
    })
  })

  describe('Game Setup Phase', () => {
    beforeEach(async () => {
      // Setup connected state with both players
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({
          players: [
            { id: 1, name: 'Player 1' },
            { id: 2, name: 'Player 2' }
          ],
          phase: 'ceremonial'
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument()
      })
    })

    it('should complete ceremonial phase', async () => {
      const user = userEvent.setup()
      
      // Mock shuffle response
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({
          phase: 'ceremonial',
          shuffleComplete: true
        })
      })
      
      await user.click(screen.getByTestId('start-shuffle'))
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/start-shuffle'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('should handle card selection phase', async () => {
      const user = userEvent.setup()
      
      // Mock card selection response
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({
          phase: 'cardSelection',
          shuffleComplete: true
        })
      })
      
      await user.click(screen.getByTestId('select-cards'))
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/select-face-up-cards'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            roomId: expect.any(String),
            playerId: 1,
            cardIds: ['card1']
          })
        })
      )
    })
  })

  describe('Gameplay Phase', () => {
    beforeEach(async () => {
      // Setup game in progress
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({
          phase: 'round1',
          currentTurn: 1,
          player1Hand: [
            global.testUtils.createMockCard('hearts', 'A'),
            global.testUtils.createMockCard('spades', '5')
          ],
          tableCards: [
            global.testUtils.createMockCard('clubs', '3'),
            global.testUtils.createMockCard('diamonds', 'A')
          ]
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByText('Game Phase: round1')).toBeInTheDocument()
      })
    })

    it('should handle card play actions', async () => {
      const user = userEvent.setup()
      
      // Mock card play response
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({
          phase: 'round1',
          currentTurn: 2, // Turn switches to opponent
          lastPlay: { action: 'capture', player: 1 }
        })
      })
      
      await user.click(screen.getByTestId('play-card'))
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/play-card'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            roomId: expect.any(String),
            playerId: 1,
            cardId: 'card1',
            action: 'capture'
          })
        })
      )
    })

    it('should progress through game rounds', async () => {
      // Mock progression from round1 to round2
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({
          phase: 'round2',
          round: 2
        })
      })
      
      // Polling should update the phase
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100))
      })
      
      await waitFor(() => {
        expect(screen.getByText('Round 2')).toBeInTheDocument()
      })
    })
  })

  describe('Game Completion', () => {
    it('should handle game end and show results', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Mock game finished state
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({
          phase: 'finished',
          player1Score: 7,
          player2Score: 4,
          winner: 1,
          player1Captured: [
            global.testUtils.createMockCard('hearts', 'A'),
            global.testUtils.createMockCard('spades', '2'),
            global.testUtils.createMockCard('diamonds', '10')
          ]
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByText('7/11')).toBeInTheDocument() // Final score
        expect(screen.getByText('Phase: Finished')).toBeInTheDocument()
      })
    })

    it('should allow game reset', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Setup finished game
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({
          phase: 'finished',
          winner: 1
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      // Mock reset response
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({
          phase: 'waiting',
          player1Score: 0,
          player2Score: 0,
          winner: null
        })
      })
      
      await user.click(screen.getByTestId('reset-game'))
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/reset-game'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle API errors gracefully throughout the game', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Mock API error
      global.testUtils.mockFetch({
        success: false,
        error: 'Server error occurred'
      })
      
      await user.click(screen.getByTestId('create-room'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Server error occurred')
      })
    })

    it('should handle network failures', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Mock network error
      global.testUtils.mockFetchError('Network error')
      
      await user.click(screen.getByTestId('create-room'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to create room')
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should handle polling updates correctly', async () => {
      jest.useFakeTimers()
      
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Mock initial connection
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({
          phase: 'waiting',
          players: [{ id: 1, name: 'Player 1' }]
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      // Clear previous calls
      jest.clearAllMocks()
      
      // Mock polling response with updated state
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({
          phase: 'ceremonial',
          players: [
            { id: 1, name: 'Player 1' },
            { id: 2, name: 'Player 2' }
          ]
        })
      })
      
      // Advance timer to trigger polling
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/game/'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer')
            })
          })
        )
      })
      
      jest.useRealTimers()
    })

    it('should update UI when game state changes via polling', async () => {
      jest.useFakeTimers()
      
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Initial connection
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({
          phase: 'waiting',
          players: [{ id: 1, name: 'Player 1' }]
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByText('1/2 players joined')).toBeInTheDocument()
      })
      
      // Mock state change via polling
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({
          phase: 'ceremonial',
          players: [
            { id: 1, name: 'Player 1' },
            { id: 2, name: 'Player 2' }
          ]
        })
      })
      
      // Trigger polling
      act(() => {
        jest.advanceTimersByTime(1000)
      })
      
      await waitFor(() => {
        expect(screen.getByText('Player 1 vs Player 2')).toBeInTheDocument()
      })
      
      jest.useRealTimers()
    })
  })

  describe('Statistics Integration', () => {
    it('should update statistics when game completes', async () => {
      const user = userEvent.setup()
      
      // Mock localStorage for statistics
      const initialStats = global.testUtils.createMockStatistics({
        gamesPlayed: 5,
        gamesWon: 3
      })
      
      window.localStorage.setItem('cassino-statistics', JSON.stringify(initialStats))
      
      render(<App />)
      
      await user.type(screen.getByTestId('player-name-input'), 'Player 1')
      
      // Mock joining and then game completion
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({
          phase: 'finished',
          player1Score: 8,
          player2Score: 3,
          winner: 1
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      // Statistics should be updated in localStorage
      await waitFor(() => {
        const storedStats = JSON.parse(window.localStorage.getItem('cassino-statistics') || '{}')
        expect(storedStats.gamesPlayed).toBe(6) // Incremented
        expect(storedStats.gamesWon).toBe(4)    // Incremented (won)
      })
    })
  })
})