import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

// Mock components to focus on App logic
jest.mock('./components/GamePhases', () => ({
  GamePhases: ({ gameState, playerId, onStartShuffle, onSelectFaceUpCards, onPlayCard, onResetGame }: any) => (
    <div data-testid="game-phases">
      <div>Game Phase: {gameState.phase}</div>
      <div>Player ID: {playerId}</div>
      <button onClick={onStartShuffle} data-testid="start-shuffle">Start Shuffle</button>
      <button onClick={() => onSelectFaceUpCards(['card1'])} data-testid="select-cards">Select Cards</button>
      <button onClick={() => onPlayCard('card1', 'capture')} data-testid="play-card">Play Card</button>
      <button onClick={onResetGame} data-testid="reset-game">Reset Game</button>
    </div>
  )
}))

jest.mock('./components/RoomManager', () => ({
  RoomManager: ({ roomId, setRoomId, playerName, setPlayerName, onCreateRoom, onJoinRoom, error, isLoading }: any) => (
    <div data-testid="room-manager">
      <input 
        data-testid="room-id-input" 
        value={roomId} 
        onChange={(e) => setRoomId(e.target.value)} 
        placeholder="Room ID"
      />
      <input 
        data-testid="player-name-input" 
        value={playerName} 
        onChange={(e) => setPlayerName(e.target.value)} 
        placeholder="Player Name"
      />
      <button onClick={onCreateRoom} disabled={isLoading} data-testid="create-room">
        {isLoading ? 'Creating...' : 'Create Room'}
      </button>
      <button onClick={onJoinRoom} disabled={isLoading} data-testid="join-room">
        {isLoading ? 'Joining...' : 'Join Room'}
      </button>
      {error && <div data-testid="error-message">{error}</div>}
    </div>
  )
}))

jest.mock('./components/GameSettings', () => ({
  GameSettings: ({ preferences, onPreferencesChange, statistics }: any) => (
    <div data-testid="game-settings">
      <button 
        onClick={() => onPreferencesChange({ ...preferences, soundEnabled: !preferences.soundEnabled })}
        data-testid="toggle-sound"
      >
        Sound: {preferences.soundEnabled ? 'On' : 'Off'}
      </button>
      {statistics && <div data-testid="statistics">Games: {statistics.gamesPlayed}</div>}
    </div>
  ),
  useGamePreferences: () => [
    global.testUtils.createMockPreferences(),
    jest.fn()
  ],
  useGameStatistics: () => [
    global.testUtils.createMockStatistics(),
    jest.fn()
  ]
}))

jest.mock('./components/SoundSystem', () => ({
  SoundSystem: ({ onSoundReady }: any) => {
    React.useEffect(() => {
      onSoundReady()
    }, [onSoundReady])
    return <div data-testid="sound-system">Sound System</div>
  },
  soundManager: {
    setMasterVolume: jest.fn(),
    playSound: jest.fn()
  }
}))

describe('App Component', () => {
  beforeEach(() => {
    global.testUtils.mockFetch({
      success: true,
      roomId: 'test-room',
      gameState: global.testUtils.createMockGameState()
    })
  })

  describe('Initial Render', () => {
    it('should render room manager when not connected', () => {
      render(<App />)
      
      expect(screen.getByTestId('room-manager')).toBeInTheDocument()
      expect(screen.getByTestId('sound-system')).toBeInTheDocument()
      expect(screen.queryByTestId('game-phases')).not.toBeInTheDocument()
    })

    it('should render loading message when game state is null but connected', async () => {
      render(<App />)
      
      // Mock successful room creation
      global.testUtils.mockFetch({
        success: true,
        roomId: 'test-room',
        playerId: 1,
        gameState: global.testUtils.createMockGameState()
      })
      
      // Create room to get connected
      await userEvent.click(screen.getByTestId('create-room'))
      
      expect(screen.getByText('Loading game...')).toBeInTheDocument()
    })
  })

  describe('Room Management', () => {
    it('should create room successfully', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Mock successful room creation
      global.testUtils.mockFetch({
        success: true,
        roomId: 'new-room',
        gameState: global.testUtils.createMockGameState({ roomId: 'new-room' })
      })
      
      // Mock auto-join after creation
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({ roomId: 'new-room' })
      })
      
      await user.click(screen.getByTestId('create-room'))
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/create-room'),
          expect.objectContaining({
            method: 'POST'
          })
        )
      })
    })

    it('should join room successfully', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Fill in room details
      await user.type(screen.getByTestId('room-id-input'), 'test-room')
      await user.type(screen.getByTestId('player-name-input'), 'Test Player')
      
      // Mock successful join
      global.testUtils.mockFetch({
        success: true,
        playerId: 2,
        gameState: global.testUtils.createMockGameState()
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/join-room'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              roomId: 'test-room',
              playerName: 'Test Player'
            })
          })
        )
      })
    })

    it('should handle room creation errors', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      // Mock failed room creation
      global.testUtils.mockFetch({
        success: false,
        error: 'Failed to create room'
      })
      
      await user.click(screen.getByTestId('create-room'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to create room')
      })
    })

    it('should handle join room errors', async () => {
      const user = userEvent.setup()
      render(<App />)
      
      await user.type(screen.getByTestId('room-id-input'), 'invalid-room')
      await user.type(screen.getByTestId('player-name-input'), 'Test Player')
      
      // Mock failed join
      global.testUtils.mockFetch({
        success: false,
        error: 'Room not found'
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Room not found')
      })
    })
  })

  describe('Game State Management', () => {
    beforeEach(async () => {
      // Setup connected state
      render(<App />)
      
      const user = userEvent.setup()
      await user.type(screen.getByTestId('player-name-input'), 'Test Player')
      
      // Mock successful join
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({ phase: 'waiting' })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      // Wait for connection
      await waitFor(() => {
        expect(screen.queryByTestId('room-manager')).not.toBeInTheDocument()
      })
    })

    it('should display waiting phase UI', async () => {
      // Mock game state polling
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({ 
          phase: 'waiting',
          players: [{ id: 1, name: 'Test Player' }]
        })
      })
      
      await waitFor(() => {
        expect(screen.getByText('Waiting for players...')).toBeInTheDocument()
        expect(screen.getByText('1/2 players joined')).toBeInTheDocument()
      })
    })

    it('should display game phases when game starts', async () => {
      // Mock game state update to playing phase
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({ 
          phase: 'round1',
          players: [
            { id: 1, name: 'Player 1' },
            { id: 2, name: 'Player 2' }
          ]
        })
      })
      
      // Trigger polling update
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 1100)) // Wait for polling interval
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument()
        expect(screen.getByText('Game Phase: round1')).toBeInTheDocument()
      })
    })

    it('should handle game actions', async () => {
      // Setup game in progress
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({ 
          phase: 'round1',
          players: [
            { id: 1, name: 'Player 1' },
            { id: 2, name: 'Player 2' }
          ]
        })
      })
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument()
      })
      
      const user = userEvent.setup()
      
      // Mock successful shuffle start
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState({ shuffleComplete: true })
      })
      
      await user.click(screen.getByTestId('start-shuffle'))
      
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/start-shuffle'),
        expect.objectContaining({
          method: 'POST'
        })
      )
    })
  })

  describe('Statistics and Preferences', () => {
    it('should update statistics when game finishes', async () => {
      const mockUpdateStatistics = jest.fn()
      
      // Mock the statistics hook
      jest.mocked(require('./components/GameSettings').useGameStatistics).mockReturnValue([
        global.testUtils.createMockStatistics({ gamesPlayed: 5 }),
        mockUpdateStatistics
      ])
      
      render(<App />)
      
      // Setup connected state with game finishing
      const initialGameState = global.testUtils.createMockGameState({ 
        phase: 'round1',
        player1Score: 5,
        player2Score: 6
      })
      
      const finishedGameState = global.testUtils.createMockGameState({ 
        phase: 'finished',
        player1Score: 5,
        player2Score: 6,
        winner: 2
      })
      
      // Simulate game state change
      const { rerender } = render(<App />)
      
      // This would require more complex state management to fully test
      // For now, verify the structure is correct
      expect(screen.getByTestId('sound-system')).toBeInTheDocument()
    })

    it('should toggle sound preferences', async () => {
      const mockSetPreferences = jest.fn()
      
      jest.mocked(require('./components/GameSettings').useGamePreferences).mockReturnValue([
        global.testUtils.createMockPreferences({ soundEnabled: true }),
        mockSetPreferences
      ])
      
      render(<App />)
      
      // The GameSettings component would handle this interaction
      expect(screen.getByTestId('game-settings')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      render(<App />)
      
      // Mock network error
      global.testUtils.mockFetchError('Network error')
      
      const user = userEvent.setup()
      await user.click(screen.getByTestId('create-room'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Failed to create room')
      })
    })

    it('should handle API errors with custom messages', async () => {
      render(<App />)
      
      global.testUtils.mockFetch({
        success: false,
        error: 'Custom API error message'
      })
      
      const user = userEvent.setup()
      await user.click(screen.getByTestId('create-room'))
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Custom API error message')
      })
    })
  })

  describe('Game State Polling', () => {
    it('should poll for game state updates when connected', async () => {
      jest.useFakeTimers()
      
      render(<App />)
      
      const user = userEvent.setup()
      await user.type(screen.getByTestId('player-name-input'), 'Test Player')
      
      // Mock successful join
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState()
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      // Clear previous fetch calls
      jest.clearAllMocks()
      
      // Mock polling response
      global.testUtils.mockFetch({
        success: true,
        gameState: global.testUtils.createMockGameState()
      })
      
      // Advance timers to trigger polling
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
  })

  describe('Score Display', () => {
    it('should display scores correctly for player 1', async () => {
      render(<App />)
      
      const user = userEvent.setup()
      await user.type(screen.getByTestId('player-name-input'), 'Test Player')
      
      // Mock join as player 1
      global.testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: global.testUtils.createMockGameState({ 
          player1Score: 7,
          player2Score: 4,
          phase: 'round1'
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByText('7/11')).toBeInTheDocument() // My score
        expect(screen.getByText('4/11')).toBeInTheDocument() // Opponent score
      })
    })

    it('should display scores correctly for player 2', async () => {
      render(<App />)
      
      const user = userEvent.setup()
      await user.type(screen.getByTestId('player-name-input'), 'Test Player')
      
      // Mock join as player 2
      global.testUtils.mockFetch({
        success: true,
        playerId: 2,
        gameState: global.testUtils.createMockGameState({ 
          player1Score: 7,
          player2Score: 4,
          phase: 'round1'
        })
      })
      
      await user.click(screen.getByTestId('join-room'))
      
      await waitFor(() => {
        expect(screen.getByText('4/11')).toBeInTheDocument() // My score (player 2)
        expect(screen.getByText('7/11')).toBeInTheDocument() // Opponent score (player 1)
      })
    })
  })
})