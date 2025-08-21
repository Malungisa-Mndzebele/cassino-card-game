import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils.tsx';
import App from '../../App';
import * as testUtils from '../test-utils';

// Mock all external dependencies
vi.mock('../../components/SoundSystem', () => ({
  SoundSystem: ({ onSoundReady }: any) => {
    React.useEffect(() => {
      onSoundReady?.();
    }, [onSoundReady]);
    return <div data-testid="sound-system">Sound System</div>;
  },
  soundManager: {
    setMasterVolume: vi.fn(),
    playSound: vi.fn()
  }
}));

vi.mock('../../components/GamePhases', () => ({
  GamePhases: ({ gameState, playerId, onStartShuffle, onSelectFaceUpCards, onPlayCard, onResetGame, preferences }: any) => {
    if (!gameState || !gameState.phase) return null;
    
    return (
      <div data-testid="game-phases">
        <div data-testid="current-phase">{gameState.phase}</div>
        <div data-testid="current-turn">Turn: {gameState.currentTurn}</div>
        <div data-testid="player-id">Player: {playerId}</div>
        
        {gameState.phase === 'waiting' && (
          <div data-testid="waiting-phase">
            <div>Players: {gameState.players?.length || 0}/2</div>
            <button onClick={onStartShuffle} data-testid="start-shuffle-btn">
              Start Game
            </button>
          </div>
        )}
        
        {gameState.phase === 'cardSelection' && (
          <div data-testid="card-selection-phase">
            <div>Select 4 cards to keep face up</div>
            <button onClick={() => onSelectFaceUpCards(['card1', 'card2', 'card3', 'card4'])} data-testid="confirm-selection-btn">
              Confirm Selection
            </button>
          </div>
        )}
        
        {gameState.phase === 'round1' && (
          <div data-testid="game-play-phase">
            <div>Round 1 - Playing cards</div>
            <button onClick={() => onPlayCard('card1', 'capture', ['table1'])} data-testid="capture-btn">
              Capture
            </button>
            <button onClick={() => onPlayCard('card1', 'build', ['table1'], 5)} data-testid="build-btn">
              Build
            </button>
            <button onClick={() => onPlayCard('card1', 'trail')} data-testid="trail-btn">
              Trail
            </button>
          </div>
        )}
        
        {gameState.phase === 'finished' && (
          <div data-testid="game-finished">
            <div>Game Over!</div>
            <div>Winner: {gameState.winner}</div>
            <button onClick={onResetGame} data-testid="reset-game-btn">
              New Game
            </button>
          </div>
        )}
      </div>
    );
  }
}));

vi.mock('../../components/RoomManager', () => ({
  RoomManager: ({ roomId, setRoomId, playerName, setPlayerName, onCreateRoom, onJoinRoom, error, isLoading }: any) => {
    const [showJoinForm, setShowJoinForm] = React.useState(false);
    
    return (
      <div data-testid="room-manager">
        {error && <div data-testid="error-message">{error}</div>}
        
        {showJoinForm ? (
          <div data-testid="join-form">
            <input 
              data-testid="room-id-input-test" 
              value={roomId} 
              onChange={(e) => setRoomId(e.target.value)} 
              placeholder="Room ID"
            />
            <input 
              data-testid="player-name-input-create-test" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Player Name"
            />
            <button onClick={onJoinRoom} disabled={isLoading} data-testid="join-room-submit-test">
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        ) : (
          <div data-testid="create-form">
            <input 
              data-testid="player-name-input-create-test" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Player Name"
            />
            <button onClick={onCreateRoom} disabled={isLoading} data-testid="create-room-test">
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
            <button onClick={() => setShowJoinForm(true)} data-testid="show-join-form-test">
              Join Room
            </button>
          </div>
        )}
      </div>
    );
  }
}));

vi.mock('../../components/GameSettings', () => ({
  GameSettings: ({ preferences, onPreferencesChange, statistics }: any) => {
    const [soundEnabled, setSoundEnabled] = React.useState(preferences?.soundEnabled ?? true);
    
    const toggleSound = () => {
      const newSoundEnabled = !soundEnabled;
      setSoundEnabled(newSoundEnabled);
      onPreferencesChange?.({ ...preferences, soundEnabled: newSoundEnabled });
    };
    
    return (
      <div>
        <button 
          onClick={toggleSound}
          data-testid="toggle-sound-btn"
        >
          Sound: {soundEnabled ? 'On' : 'Off'}
        </button>
      </div>
    );
  },
  useGamePreferences: (defaultPrefs?: any) => {
    const prefs = defaultPrefs || testUtils.createMockPreferences();
    return [prefs, vi.fn()] as const;
  },
  useGameStatistics: () => {
    const stats = testUtils.createMockStatistics();
    return [stats, vi.fn(), vi.fn()] as const;
  }
}));

// Mock API client
vi.mock('../../apiClient', async () => {
  const actual = await import('../../apiClient');
  
  return {
    ...actual,
         useMutation: (fn: any) => {
       if (fn.name === 'createRoom') {
         return vi.fn().mockImplementation(async ({ playerName }: { playerName: string }) => {
           // Check if there's a global error set
           if (globalThis.mockError) {
             throw new Error(globalThis.mockError);
           }
           return {
             roomId: 'TEST123',
             playerId: 1,
             gameState: testUtils.createMockGameState({
               roomId: 'TEST123',
               phase: 'waiting',
               players: [{ id: 1, name: playerName }]
             })
           };
         });
       }
      
      if (fn.name === 'joinRoom') {
        return vi.fn().mockImplementation(async ({ roomId, playerName }: { roomId: string, playerName: string }) => {
          return {
            playerId: 2,
            gameState: testUtils.createMockGameState({
              roomId,
              phase: 'waiting',
              players: [
                { id: 1, name: 'Host Player' },
                { id: 2, name: playerName }
              ]
            })
          };
        });
      }
      
      if (fn.name === 'startShuffle') {
        return vi.fn().mockImplementation(async ({ roomId }: { roomId: string }) => {
          return { success: true };
        });
      }
      
      if (fn.name === 'selectFaceUpCards') {
        return vi.fn().mockImplementation(async ({ roomId, cardIds }: { roomId: string, cardIds: string[] }) => {
          return { success: true };
        });
      }
      
      if (fn.name === 'playCard') {
        return vi.fn().mockImplementation(async ({ roomId, cardId, action, targetCards, buildValue }: any) => {
          return { success: true };
        });
      }
      
      if (fn.name === 'resetGame') {
        return vi.fn().mockImplementation(async ({ roomId }: { roomId: string }) => {
          return { success: true };
        });
      }
      
      return vi.fn();
    },
    useQuery: (fn: any) => {
      if (fn.name === 'getGameState') {
        return testUtils.createMockGameState({
          roomId: 'TEST123',
          phase: 'waiting',
          players: [{ id: 1, name: 'Test Player' }]
        });
      }
      return null;
    },
  };
});

describe('Complete Game Flow Integration', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Basic App Rendering', () => {
    it('should render the app with all main components', async () => {
      renderWithProviders(<App />);
      
      // Check that main components are rendered
      expect(screen.getByTestId('sound-system')).toBeInTheDocument();
      expect(screen.getByTestId('room-manager')).toBeInTheDocument();
      expect(screen.getByTestId('game-settings')).toBeInTheDocument();
    });

    it('should show room creation form by default', async () => {
      renderWithProviders(<App />);
      
      expect(screen.getByTestId('create-form')).toBeInTheDocument();
      expect(screen.getByTestId('player-name-input-create-test')).toBeInTheDocument();
      expect(screen.getByTestId('create-room-test')).toBeInTheDocument();
      expect(screen.getByTestId('show-join-form-test')).toBeInTheDocument();
    });
  });

  describe('Room Management', () => {
    it('should allow switching between create and join forms', async () => {
      renderWithProviders(<App />);
      
      // Initially show create form
      expect(screen.getByTestId('create-form')).toBeInTheDocument();
      
      // Click to show join form
      await user.click(screen.getByTestId('show-join-form-test'));
      
      // Should now show join form
      expect(screen.getByTestId('join-form')).toBeInTheDocument();
              expect(screen.getByTestId('room-id-input-test')).toBeInTheDocument();
              expect(screen.getByTestId('join-room-submit-test')).toBeInTheDocument();
    });

    it('should handle player name input', async () => {
      renderWithProviders(<App />);
      
      const playerNameInput = screen.getByTestId('player-name-input-create-test');
      await user.type(playerNameInput, 'Test Player');
      
      expect(playerNameInput).toHaveValue('Test Player');
    });

    it('should handle room ID input', async () => {
      renderWithProviders(<App />);
      
      // Switch to join form
      await user.click(screen.getByTestId('show-join-form-test'));
      
              const roomIdInput = screen.getByTestId('room-id-input-test');
      await user.type(roomIdInput, 'ABC123');
      
      expect(roomIdInput).toHaveValue('ABC123');
    });
  });

  describe('Game Settings', () => {
    it('should toggle sound setting', async () => {
      renderWithProviders(<App />);
      
      const soundButton = screen.getByTestId('toggle-sound-btn');
      
      // Initially should be on
      expect(soundButton).toHaveTextContent('Sound: On');
      
      // Toggle off
      await user.click(soundButton);
      expect(soundButton).toHaveTextContent('Sound: Off');
      
      // Toggle back on
      await user.click(soundButton);
      expect(soundButton).toHaveTextContent('Sound: On');
    });

    it('should display game statistics', async () => {
      renderWithProviders(<App />);
      
      expect(screen.getByTestId('statistics')).toBeInTheDocument();
      expect(screen.getByTestId('statistics')).toHaveTextContent('Games: 0');
    });
  });

  describe('Game Phases Component', () => {
    it('should render game phases when game state is provided', async () => {
      // Mock a game state
      const mockGameState = testUtils.createMockGameState({
        roomId: 'TEST123',
        phase: 'waiting',
        players: [{ id: 1, name: 'Player 1' }]
      });

      // Render GamePhases component directly
      const { GamePhases } = await import('../../components/GamePhases');
      render(
        <GamePhases
          gameState={mockGameState}
          playerId={1}
          onStartShuffle={vi.fn()}
          onSelectFaceUpCards={vi.fn()}
          onPlayCard={vi.fn()}
          onResetGame={vi.fn()}
        />
      );

      expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      expect(screen.getByTestId('current-phase')).toHaveTextContent('waiting');
    });

    it('should render waiting phase correctly', async () => {
      const mockGameState = testUtils.createMockGameState({
        roomId: 'TEST123',
        phase: 'waiting',
        players: [{ id: 1, name: 'Player 1' }]
      });

      const { GamePhases } = await import('../../components/GamePhases');
      render(
        <GamePhases
          gameState={mockGameState}
          playerId={1}
          onStartShuffle={vi.fn()}
          onSelectFaceUpCards={vi.fn()}
          onPlayCard={vi.fn()}
          onResetGame={vi.fn()}
        />
      );

      expect(screen.getByTestId('waiting-phase')).toBeInTheDocument();
      expect(screen.getByTestId('start-shuffle-btn')).toBeInTheDocument();
    });

    it('should render card selection phase correctly', async () => {
      const mockGameState = testUtils.createMockGameState({
        roomId: 'TEST123',
        phase: 'cardSelection',
        players: [{ id: 1, name: 'Player 1' }]
      });

      const { GamePhases } = await import('../../components/GamePhases');
      render(
        <GamePhases
          gameState={mockGameState}
          playerId={1}
          onStartShuffle={vi.fn()}
          onSelectFaceUpCards={vi.fn()}
          onPlayCard={vi.fn()}
          onResetGame={vi.fn()}
        />
      );

      expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      expect(screen.getByTestId('confirm-selection-btn')).toBeInTheDocument();
    });

    it('should render game play phase correctly', async () => {
      const mockGameState = testUtils.createMockGameState({
        roomId: 'TEST123',
        phase: 'round1',
        players: [{ id: 1, name: 'Player 1' }]
      });

      const { GamePhases } = await import('../../components/GamePhases');
      render(
        <GamePhases
          gameState={mockGameState}
          playerId={1}
          onStartShuffle={vi.fn()}
          onSelectFaceUpCards={vi.fn()}
          onPlayCard={vi.fn()}
          onResetGame={vi.fn()}
        />
      );

      expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      expect(screen.getByTestId('capture-btn')).toBeInTheDocument();
      expect(screen.getByTestId('build-btn')).toBeInTheDocument();
      expect(screen.getByTestId('trail-btn')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing game state gracefully', async () => {
      const { GamePhases } = await import('../../components/GamePhases');
      const { container } = render(
        <GamePhases
          gameState={null}
          playerId={1}
          onStartShuffle={vi.fn()}
          onSelectFaceUpCards={vi.fn()}
          onPlayCard={vi.fn()}
          onResetGame={vi.fn()}
        />
      );

      // Should render nothing when gameState is null
      expect(container.firstChild).toBeNull();
    });

         it('should handle network errors gracefully', async () => {
       renderWithProviders(<App />);
       
       // Simulate a network error by setting the global error
       globalThis.mockError = 'Network error';
       
       // Try to create a room
       await user.type(screen.getByTestId('player-name-input-create-test'), 'Player 1');
       await user.click(screen.getByTestId('create-room-test'));
       
               // Should show error message
        await waitFor(() => {
          const errorMessages = screen.getAllByTestId('error-message');
          expect(errorMessages.length).toBeGreaterThan(0);
          expect(errorMessages[0]).toHaveTextContent('Network error');
        });
       
       // Clean up global error
       delete globalThis.mockError;
     });
  });

  describe('Component Integration', () => {
    it('should integrate all components properly', async () => {
      renderWithProviders(<App />);
      
      // All main components should be present
      expect(screen.getByTestId('sound-system')).toBeInTheDocument();
      expect(screen.getByTestId('room-manager')).toBeInTheDocument();
      expect(screen.getByTestId('game-settings')).toBeInTheDocument();
      
      // Room manager should be in create mode
      expect(screen.getByTestId('create-form')).toBeInTheDocument();
      
      // Game settings should be functional
      const soundButton = screen.getByTestId('toggle-sound-btn');
      expect(soundButton).toBeInTheDocument();
      
      // Statistics should be displayed
      expect(screen.getByTestId('statistics')).toBeInTheDocument();
    });
  });
});
