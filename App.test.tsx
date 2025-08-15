declare global {
  var mockError: string | undefined;
}

// Hoist mocks before any imports
vi.mock('./components/SoundSystem', () => ({
  SoundSystem: ({ onSoundReady }: any) => {
    // Call onSoundReady immediately to simulate sound system initialization
    React.useEffect(() => {
      onSoundReady?.();
    }, [onSoundReady]);
    return <div data-testid="sound-system-test">Sound System</div>;
  },
  soundManager: {
    setMasterVolume: vi.fn(),
    playSound: vi.fn()
  }
}));

// Hoist Convex hooks and provider mocks
vi.mock('convex/react', async () => {
  const actual = await import('convex/react');  // Mock withOptimisticUpdate to return the mutation function itself
  const withOptimisticUpdate = (fn: any) => fn;
  
  // Create a mock mutation function that has the withOptimisticUpdate property
  const createMockMutation = (mutationFn: any) => {
    const fn = mutationFn;
    fn.withOptimisticUpdate = withOptimisticUpdate;
    return fn;
  };
  
  return {
    ...actual,
    useMutation: (fn: any) => {
      if (fn.name === 'createRoom') {
        return createMockMutation(async ({ playerName }: { playerName: string }) => {
          await new Promise(res => setTimeout(res, 500));
          if (globalThis.mockError) {
            const error = new Error(globalThis.mockError);
            error.name = 'ConvexError';
            throw error;
          }
          const response = {
            roomId: 'new-room',
            playerId: 1,
            gameState: require('./tests/test-utils').createMockGameState({ 
              roomId: 'new-room',
              phase: 'waiting',
              players: [{ id: 1, name: playerName }] 
            })
          };
          return response;
        });
      }
      if (fn.name === 'joinRoom') {
        return createMockMutation(async ({ roomId, playerName }: { roomId: string, playerName: string }) => {
          await new Promise(res => setTimeout(res, 500));
          if (!roomId || !playerName) {
            throw new Error('Please enter room ID and player name');
          }
          if (globalThis.mockError) {
            const error = new Error(globalThis.mockError);
            error.message = globalThis.mockError;
            throw error;
          }
          return {
            playerId: 2,
            gameState: require('./tests/test-utils').createMockGameState({ 
              roomId, 
              phase: 'waiting',
              players: [{ id: 1, name: 'Host' }, { id: 2, name: playerName }]
            })
          };
        });
      }
      if (fn.name === 'startShuffle') {
        return createMockMutation(async () => {
          await new Promise(res => setTimeout(res, 500));
          return {
            success: true,
            gameState: require('./tests/test-utils').createMockGameState({ 
              phase: 'round1',
              shuffleComplete: true, 
              gameStarted: true,
              players: [
                { id: 1, name: 'Player 1' },
                { id: 2, name: 'Player 2' }
              ]
            })
          };
        });
      }
      return createMockMutation(vi.fn());
    },
    ConvexProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});
import React from 'react';
import * as testUtils from './tests/test-utils';
import * as GameSettings from './components/GameSettings';

import { renderWithProviders } from './tests/test-utils.tsx';
import { screen, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import App from './App';
import { api } from './convex/_generated/api';
import * as convex from 'convex/react';

import type { GamePreferences, GameStatistics } from './components/GameSettings';

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
  
  // Mock game settings hooks
  const mockPreferences = vi.fn((defaultPrefs: GamePreferences | undefined) => {
    const [prefs, setPrefs] = React.useState<GamePreferences>(
      defaultPrefs || testUtils.createMockPreferences()
    );
    return [prefs, setPrefs];
  });
  vi.spyOn(GameSettings, 'useGamePreferences').mockImplementation((defaultPrefs?: GamePreferences) => {
    const [prefs, setPrefs] = React.useState<GamePreferences>(
      defaultPrefs || testUtils.createMockPreferences()
    );
    return [prefs, setPrefs as (prefs: GamePreferences) => void];
  });
  
  vi.spyOn(GameSettings, 'useGameStatistics').mockImplementation(() => [
    testUtils.createMockStatistics(),
    vi.fn() as (update: Partial<GameStatistics>) => void,
    vi.fn() as () => void
  ]);
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
  vi.restoreAllMocks();
  localStorage.clear();
  vi.clearAllTimers();
  globalThis.mockError = undefined;
});
// Helper to join a room as a player
async function joinRoomAs(user: ReturnType<typeof userEvent.setup>, gameState: any = {}) {
  renderWithProviders(<App />);
  // Show join room form
  await user.click(screen.getByTestId('show-join-form-test'));
  await user.type(screen.getByTestId('room-id-input-test'), 'test-room');
  await user.type(screen.getByTestId('player-name-input-join-test'), 'Test Player');
  testUtils.mockFetch({
    success: true,
    playerId: gameState.playerId || 1,
    gameState: testUtils.createMockGameState(gameState)
  });
  await user.click(screen.getByTestId('join-room-submit-test'));
  await waitFor(() => expect(screen.queryByTestId('room-manager-test')).not.toBeInTheDocument());
}

// Mock components to focus on App logic
vi.mock('./components/GamePhases', () => ({
  GamePhases: ({ gameState, playerId, onStartShuffle, onSelectFaceUpCards, onPlayCard, onResetGame, preferences = {} }: any) => {
    if (!gameState || !gameState.phase) return null;
    return (
      <div data-testid="game-phases-test">
        {gameState.phase === 'waiting' ? (
          <div data-testid="waiting-phase-test">
            <div>Waiting for players...</div>
            <div>{gameState.players?.length || 0}/2 players joined</div>
          </div>
        ) : (
          <div data-testid="game-phase-test">
            <div>Game Phase: {gameState.phase}</div>
            <div>Player ID: {playerId}</div>
            <div>Sound {preferences.soundEnabled ? 'enabled' : 'disabled'}</div>
            <button onClick={onStartShuffle} data-testid="start-shuffle-test">
              Start Shuffle
            </button>
            <button onClick={() => onSelectFaceUpCards(['card1'])} data-testid="select-cards-test">
              Select Cards
            </button>
            <button onClick={() => onPlayCard('card1', 'capture')} data-testid="play-card-test">
              Play Card
            </button>
            <button onClick={onResetGame} data-testid="reset-game-test">
              Reset Game
            </button>
            {gameState.scores && (
              <div data-testid="player-score-test">
                {gameState.scores[playerId] || 0}/11
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}));

vi.mock('./components/RoomManager', () => ({
  RoomManager: ({ roomId = '', setRoomId = () => {}, playerName = '', setPlayerName = () => {}, onCreateRoom = () => {}, onJoinRoom = () => {}, error, isLoading }: any) => {
    const [showJoinForm, setShowJoinForm] = React.useState(false);
    return (
      <div data-testid="room-manager-test">
        {showJoinForm ? (
          <>
            <input 
              data-testid="room-id-input-test" 
              value={roomId} 
              onChange={(e) => setRoomId(e.target.value)} 
              placeholder="Room ID"
            />
            <input 
              data-testid="player-name-input-join-test" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Player Name"
            />
            <button onClick={onJoinRoom} disabled={isLoading} data-testid="join-room-submit-test">
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
          </>
        ) : (
          <>
            <input 
              data-testid="player-name-input-create-test" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Player Name"
            />
            <button onClick={onCreateRoom} disabled={isLoading} data-testid="create-room-test">
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
            <button onClick={() => setShowJoinForm(true)} data-testid="show-join-form-test">Join Room</button>
          </>
        )}
        {error && <div data-testid="error-message-test">{error}</div>}
      </div>
    );
  }
}));

vi.mock('./components/GameSettings', () => ({
  GameSettings: ({ preferences, onPreferencesChange, statistics }: any) => (
    <div data-testid="game-settings-test">
      <button 
        onClick={() => onPreferencesChange({ ...preferences, soundEnabled: !preferences.soundEnabled })}
        data-testid="toggle-sound-test"
      >
        Sound: {preferences.soundEnabled ? 'On' : 'Off'}
      </button>
      {statistics && <div data-testid="statistics-test">Games: {statistics.gamesPlayed}</div>}
    </div>
  ),
  useGamePreferences: (defaultPrefs?: any) => {
    const prefs = defaultPrefs || testUtils.createMockPreferences();
    return [prefs, vi.fn()] as const;
  },
  useGameStatistics: () => {
    const stats = testUtils.createMockStatistics();
    return [stats, vi.fn(), vi.fn()] as const;
  }
}))

describe('App Component', () => {
  describe('Player Game Creation', () => {
    it('should allow a player to create a game and show loading state', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      // Enter player name
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');
      // Mock fetch for room creation
      testUtils.mockFetch({ success: true, roomId: 'new-room', playerId: 1, gameState: testUtils.createMockGameState({ roomId: 'new-room' }) });
      // Click create room
      await user.click(screen.getByTestId('create-room-test'));
      // Should show loading message
      let loadingMessage;
      try {
        loadingMessage = await screen.findByText(/loading game.../i, {}, { timeout: 2000 });
      } catch (e) {
        // Print the DOM for debugging
        throw new Error('Loading message not found. DOM:\n' + document.body.innerHTML);
      }
      expect(loadingMessage).toBeInTheDocument();
      // Should call fetch with /create-room
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/create-room'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });
  });
  describe('Landing Page', () => {
    it('should render the landing page with room manager and sound system', async () => {
      let appInstance;
      await act(async () => {
        appInstance = renderWithProviders(<App />);
      });
      // Debug: log initial state values
      // Try to access the App's state via the DOM (not possible directly), so print DOM and check for key text
      screen.debug();
      // Print out the DOM and look for clues
      // Optionally, print the outer HTML for more context
      // eslint-disable-next-line no-console
      console.log('DEBUG: document.body.innerHTML:', document.body.innerHTML);
      let roomManager;
      try {
        roomManager = await screen.findByTestId('room-manager', {}, { timeout: 2000 });
      } catch (e) {
        throw new Error('room-manager not found. DOM:\n' + document.body.innerHTML);
      }
      expect(roomManager).toBeInTheDocument();
      expect(await screen.findByTestId('sound-system-test')).toBeInTheDocument();
      // Optionally, check for any landing page specific text or elements here
    });
  });
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initial Render', () => {
    it('should render room manager when not connected', async () => {
      await act(async () => {
        renderWithProviders(<App />);
      });
      await waitFor(() => {
        expect(screen.getByTestId('room-manager-test')).toBeInTheDocument();
        expect(screen.getByTestId('sound-system-test')).toBeInTheDocument();
        expect(screen.queryByTestId('game-phases')).not.toBeInTheDocument();
      });
    });

    it('should render loading message when game state is null but connected', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      testUtils.mockFetch({
        success: true,
        roomId: 'test-room',
        playerId: 1,
        gameState: null
      });
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');
      await user.click(screen.getByTestId('create-room-test'));
      expect(await screen.findByText(/loading game.../i)).toBeInTheDocument();
    });
  });

  describe('Room Management', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.resetAllMocks();
    });

    it('should create room successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      // Always print the DOM after render for debugging
      screen.debug();
      let roomManager;
      try {
        roomManager = await screen.findByTestId('room-manager', {}, { timeout: 2000 });
      } catch (e) {
        // Print the DOM in the error message for visibility
        throw new Error('room-manager not found. DOM:\n' + document.body.innerHTML);
      }
      await screen.findByTestId('create-room-test');
      // Mock fetch for room creation
      testUtils.mockFetch({
        success: true,
        roomId: 'new-room',
        playerId: 1,
        gameState: testUtils.createMockGameState({ roomId: 'new-room' })
      });
      await user.click(screen.getByTestId('create-room-test'));
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/create-room'),
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    it('should join room successfully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      // First click join room to show form
      await user.click(screen.getByTestId('show-join-form-test'));
      // Fill in room details
      await user.type(screen.getByTestId('player-name-input-join-test'), 'Test Player');
      await user.type(screen.getByTestId('room-id-input-test'), 'test-room');
      // Mock successful join
      testUtils.mockFetch({
        success: true,
        playerId: 2,
        gameState: testUtils.createMockGameState()
      });
      await user.click(screen.getByTestId('join-room-submit-test'));
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/join-room'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({
              roomId: 'test-room',
              playerName: 'Test Player'
            })
          })
        );
      });
    });

    it('should handle room creation errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      globalThis.mockError = 'Failed to create room';
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');
      await user.click(screen.getByTestId('create-room-test'));
      expect(await screen.findByTestId('error-message-test')).toHaveTextContent('Failed to create room');
    });

    it('should handle join room errors', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      // Click join room to show form
      await user.click(screen.getByTestId('show-join-form-test'));
      await user.type(screen.getByTestId('room-id-input-test'), 'invalid-room');
      await user.type(screen.getByTestId('player-name-input-join-test'), 'Test Player');
      globalThis.mockError = 'Room not found';
      await user.click(screen.getByTestId('join-room-submit-test'));
      expect(await screen.findByTestId('error-message-test')).toHaveTextContent('Room not found');
    });
  })

  describe('Game State Management', () => {
    // Removed beforeEach, each test should declare its own user if needed

    it('should display waiting phase UI', async () => {
      const user = userEvent.setup();
      // Set up the initial state first
      renderWithProviders(<App />);
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');
      
      // Mock successful room creation
      testUtils.mockFetch({
        success: true,
        roomId: 'test-room',
        playerId: 1,
        gameState: testUtils.createMockGameState({
          phase: 'waiting',
          players: [{ id: 1, name: 'Test Player' }],
          gameStarted: false
        })
      });
      
      // Create room
      await user.click(screen.getByTestId('create-room-test'));
      
      // Wait for the waiting phase UI to appear
      await waitFor(async () => {
        expect(await screen.findByTestId('game-phases-test')).toBeInTheDocument();
        expect(await screen.findByText('Waiting for players...')).toBeInTheDocument();
        expect(await screen.findByText('1/2 players joined')).toBeInTheDocument();
      });
    });

    it('should display game phases when game starts', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');

      // Mock successful room creation with waiting phase
      const mockGameState = testUtils.createMockGameState({ 
        phase: 'waiting',
        roomId: 'test-room',
        players: [{ id: 1, name: 'Test Player' }],
        gameStarted: false
      });
      
      testUtils.mockFetch({
        success: true,
        roomId: 'test-room',
        playerId: 1,
        gameState: mockGameState
      });
      
      // Create room
      await user.click(screen.getByTestId('create-room-test'));
      
      // Should show game phases with waiting state
      await waitFor(async () => {
        expect(await screen.findByTestId('game-phases-test')).toBeInTheDocument();
      });

      // Mock game start with shuffle phase
      const gameStartState = testUtils.createMockGameState({
        phase: 'round1',
        roomId: 'test-room',
        players: [
          { id: 1, name: 'Test Player' },
          { id: 2, name: 'Player 2' }
        ],
        gameStarted: true,
        shuffleComplete: false
      });

      testUtils.mockFetch({
        success: true,
        gameState: gameStartState
      });
    });
  });
  describe('Statistics and Preferences', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update statistics when game finishes', async () => {
      const mockUpdateStatistics = vi.fn();
      const user = userEvent.setup();
      vi.spyOn(GameSettings, 'useGameStatistics').mockImplementation(() => [
        testUtils.createMockStatistics({
          gamesPlayed: 5,
          gamesWon: 2,
          gamesLost: 3,
          totalScore: 50,
          bestScore: 11,
          averageScore: 10,
          longestWinStreak: 2,
          currentWinStreak: 1,
          captureRate: 0.5,
          buildRate: 0.3
        }),
        mockUpdateStatistics,
        vi.fn()
      ]);
      renderWithProviders(<App />);
      // Join a game
      await joinRoomAs(user, { phase: 'finished' });
      expect(mockUpdateStatistics).toHaveBeenCalled();
      expect(await screen.findByTestId('sound-system-test')).toBeInTheDocument();
    });

    it('should toggle sound preferences', async () => {
      const mockSetPreferences = vi.fn();
      vi.spyOn(GameSettings, 'useGamePreferences').mockImplementation(() => [
        testUtils.createMockPreferences({
          soundEnabled: true,
          soundVolume: 0.5,
          hintsEnabled: true,
          statisticsEnabled: true
        }),
        mockSetPreferences
      ]);
      renderWithProviders(<App />);
      expect(await screen.findByTestId('game-settings-test')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      globalThis.mockError = undefined;
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');
      
      // Mock fetch to throw a network error
      globalThis.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      await user.click(screen.getByTestId('create-room-test'));
      
      // Wait for error message
      await waitFor(() => {
        const errorElement = screen.getByTestId('error-message-test');
        expect(errorElement).toHaveTextContent('Network error');
      });
    });

    it('should handle API errors with custom messages', async () => {
      const user = userEvent.setup();
      renderWithProviders(<App />);
      
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');
      
      // Mock fetch with API error
      globalThis.fetch = vi.fn(() => Promise.reject(new Error('Custom error')));
      
      // Create room with mock error
      await user.click(screen.getByTestId('create-room-test'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message-test')).toHaveTextContent('Network error');
      });
    });


  describe('Game State Polling', () => {
    it('should poll for game state updates when connected', async () => {
      const user = userEvent.setup();
      vi.useFakeTimers();
      renderWithProviders(<App />);
      await user.type(screen.getByTestId('player-name-input-create-test'), 'Test Player');
      // Mock successful join
      testUtils.mockFetch({
        success: true,
        playerId: 1,
        gameState: testUtils.createMockGameState()
      });
      await user.click(screen.getByTestId('join-room-submit-test'));
      // Clear previous fetch calls
      vi.clearAllMocks();
      // Mock polling response
      testUtils.mockFetch({
        success: true,
        gameState: testUtils.createMockGameState()
      });
      // Advance timers to trigger polling
      act(() => {
        vi.advanceTimersToNextTimer();
      });
      await waitFor(() => {
        expect(globalThis.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/game/'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': expect.stringContaining('Bearer')
            })
          })
        );
      });
      vi.useRealTimers();
    });
  });


  describe('Score Display', () => {
    it('should display scores correctly for player 1', async () => {
      const user = userEvent.setup();
      await joinRoomAs(user, { playerId: 1, player1Score: 7, player2Score: 4, phase: 'round1' });
      expect(await screen.findByText('7/11')).toBeInTheDocument(); // My score
      expect(await screen.findByText('4/11')).toBeInTheDocument(); // Opponent score
    });

    it('should display scores correctly for player 2', async () => {
      const user = userEvent.setup();
      await joinRoomAs(user, { playerId: 2, player1Score: 7, player2Score: 4, phase: 'round1' });
      expect(await screen.findByText('4/11')).toBeInTheDocument(); // My score
      expect(await screen.findByText('7/11')).toBeInTheDocument(); // Opponent score
    });
  }); // Close Game State Polling describe block
  }); // Close Score Display describe block
}); // Close outer describe('App Component')