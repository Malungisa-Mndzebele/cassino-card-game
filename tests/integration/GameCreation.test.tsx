import React from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach, onTestFinished } from 'vitest';
import '@testing-library/jest-dom';
import App from '../../App';
import { renderWithProviders } from '../test-utils';

// Custom test logger
const log = {
  info: (...args: any[]) => console.log('\x1b[36m%s\x1b[0m', '🔵', ...args),
  success: (...args: any[]) => console.log('\x1b[32m%s\x1b[0m', '✅', ...args),
  error: (...args: any[]) => console.log('\x1b[31m%s\x1b[0m', '❌', ...args),
  warn: (...args: any[]) => console.log('\x1b[33m%s\x1b[0m', '⚠️', ...args)
};

// Add test reporters
beforeEach((context) => {
  log.info(`Starting test: ${context.task.name}`);
  log.info('Test setup complete');
});

afterEach((context) => {
  if (context.task.result?.state === 'pass') {
    log.success(`Test passed: ${context.task.name}`);
  } else if (context.task.result?.state === 'fail') {
    log.error(`Test failed: ${context.task.name}`);
    if (context.task.result?.errors) {
      context.task.result.errors.forEach((error: any) => {
        log.error('Error:', error.message);
        if (error.stack) log.error('Stack:', error.stack);
      });
    }
  }
});

// Mock all required components
vi.mock('../../components/GamePhases', () => ({
  GamePhases: ({ gameState }: any) => (
    <div data-testid="game-phases">
      <span>Current Phase: {gameState?.phase}</span>
      <span>Room ID: {gameState?.roomId}</span>
      <span>Player Name: {gameState?.players[0]?.name}</span>
    </div>
  )
}));

vi.mock('../../components/SoundSystem', () => ({
  SoundSystem: () => <div data-testid="sound-system">Sound System</div>,
  soundManager: {
    setMasterVolume: vi.fn()
  }
}));

vi.mock('../../components/RoomManager', () => ({
  RoomManager: ({
    playerName,
    setPlayerName,
    onCreateRoom,
    error
  }: any) => (
    <form role="form" aria-label="game setup">
      <label htmlFor="playerName">Name</label>
      <input
        id="playerName"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />
      <button onClick={onCreateRoom}>Create Room</button>
      {error && <div>{error}</div>}
    </form>
  )
}));

vi.mock('../../components/GameSettings', () => ({
  GameSettings: () => <div data-testid="game-settings">Game Settings</div>,
  useGamePreferences: () => [{soundEnabled: true, soundVolume: 1}, vi.fn()],
  useGameStatistics: () => [{
    gamesPlayed: 0,
    gamesWon: 0,
    gamesLost: 0,
    totalScore: 0,
    bestScore: 0
  }, vi.fn()]
}));

// Mock Convex hooks and API
const mockCreateRoom = vi.fn();
const mockJoinRoom = vi.fn();

vi.mock('../../convexClient', () => ({
  convex: {},
  useMutation: (mutation: any) => {
    if (mutation.name === 'createRoom') {
      return mockCreateRoom;
    }
    if (mutation.name === 'joinRoom') {
      return mockJoinRoom;
    }
    return vi.fn();
  }
}));

beforeEach(() => {
  // Set up default mock implementation for createRoom
  mockCreateRoom.mockImplementation(async ({ playerName }) => ({
    roomId: 'test-room-123',
    playerId: 1,
    gameState: {
      roomId: 'test-room-123',
      players: [{ id: 1, name: playerName }],
      phase: 'setup',
      deck: [],
      player1Hand: [],
      player2Hand: [],
      tableCards: [],
      builds: [],
      player1Captured: [],
      player2Captured: [],
      currentTurn: 1,
      round: 1,
      countdownStartTime: null,
      gameStarted: false,
      shuffleComplete: false,
      cardSelectionComplete: false,
      dealingComplete: false,
      player1Score: 0,
      player2Score: 0,
      winner: null,
      lastPlay: null,
      lastUpdate: new Date().toISOString()
    }
  }));
});

describe('Game Creation', () => {
  console.log('Starting Game Creation test suite');
  
  beforeEach(() => {
    console.log('Setting up test...');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create a new game and set up initial game state', async () => {
    const user = userEvent.setup();
    
    // Render the app with debug output
    log.info('Rendering App...');
    const { container } = renderWithProviders(<App />);

    try {
      // Wait for the initial render and verify components
      log.info('Waiting for initial render...');
      await waitFor(() => {
        const form = screen.getByRole('form', { name: /game setup/i });
        expect(form).toBeInTheDocument();
        log.success('Found game setup form');
      });

      // Enter player name
      log.info('Entering player name...');
      const playerNameInput = screen.getByLabelText(/name/i);
      await user.clear(playerNameInput);
      await user.type(playerNameInput, 'Test Player');

      // Verify player name was entered
      expect(playerNameInput).toHaveValue('Test Player');

      // Click create room button
      log.info('Creating room...');
      const createButton = screen.getByRole('button', { name: /create.*room/i });
      await user.click(createButton);

      // Wait for and verify game creation
      log.info('Verifying game creation...');
      await waitFor(() => {
        // Game phases component should be present
        const gamePhases = screen.getByTestId('game-phases');
        expect(gamePhases).toBeInTheDocument();
        log.success('Game phases component found');

        // Room ID should be visible
        expect(within(gamePhases).getByText(/test-room-123/)).toBeInTheDocument();
        log.success('Room ID verified');

        // Player name should be visible
        expect(within(gamePhases).getByText(/Test Player/)).toBeInTheDocument();
        log.success('Player name verified');

        // Game should be in setup phase
        expect(within(gamePhases).getByText(/setup/)).toBeInTheDocument();
        log.success('Game phase verified');
      });

      // Verify required components are present
      log.info('Checking required components...');
      expect(screen.getByTestId('sound-system')).toBeInTheDocument();
      expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      log.success('All required components present');

      // Verify createRoom was called correctly
      expect(mockCreateRoom).toHaveBeenCalledWith({
        playerName: 'Test Player'
      });
      log.success('CreateRoom mutation verified');

    } catch (error) {
      log.error('Test failed with error:', error);
      log.error('Current DOM state:');
      screen.debug();
      throw error;
    }
  });

  it('should handle game creation errors', async () => {
    const user = userEvent.setup();
    
    // Override createRoom mock to throw error
    mockCreateRoom.mockRejectedValueOnce(new Error('Failed to create room'));
    
    try {
      // Render the app
      log.info('Rendering App for error test...');
      const { container } = renderWithProviders(<App />);

      // Wait for form to be available
      log.info('Waiting for form...');
      await waitFor(() => {
        const form = screen.getByRole('form', { name: /game setup/i });
        expect(form).toBeInTheDocument();
        log.success('Form found');
      });

      // Enter player name
      log.info('Entering player name...');
      const playerNameInput = screen.getByLabelText(/name/i);
      await user.clear(playerNameInput);
      await user.type(playerNameInput, 'Test Player');
      log.success('Player name entered');

      // Try to create room
      log.info('Attempting to create room (should fail)...');
      const createButton = screen.getByRole('button', { name: /create.*room/i });
      await user.click(createButton);

      // Verify error handling
      log.info('Verifying error state...');
      await waitFor(() => {
        const errorMessage = screen.getByText(/failed to create room/i);
        expect(errorMessage).toBeInTheDocument();
        log.success('Error message displayed');
      });

      // Should still be showing the form
      const form = screen.getByRole('form', { name: /game setup/i });
      expect(form).toBeInTheDocument();
      log.success('Form still present');

      // Verify createRoom was called
      expect(mockCreateRoom).toHaveBeenCalledWith({
        playerName: 'Test Player'
      });
      log.success('CreateRoom mutation called correctly');

    } catch (error) {
      log.error('Error test failed:', error);
      log.error('Current DOM state:');
      screen.debug();
      throw error;
    }
  });
});
