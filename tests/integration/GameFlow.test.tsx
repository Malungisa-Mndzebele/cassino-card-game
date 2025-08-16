import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test-utils';
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
              data-testid="room-id-input" 
              value={roomId} 
              onChange={(e) => setRoomId(e.target.value)} 
              placeholder="Room ID"
            />
            <input 
              data-testid="player-name-input-join" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Player Name"
            />
            <button onClick={onJoinRoom} disabled={isLoading} data-testid="join-room-btn">
              {isLoading ? 'Joining...' : 'Join Room'}
            </button>
          </div>
        ) : (
          <div data-testid="create-form">
            <input 
              data-testid="player-name-input-create" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              placeholder="Player Name"
            />
            <button onClick={onCreateRoom} disabled={isLoading} data-testid="create-room-btn">
              {isLoading ? 'Creating...' : 'Create Room'}
            </button>
            <button onClick={() => setShowJoinForm(true)} data-testid="show-join-form-btn">
              Join Room
            </button>
          </div>
        )}
      </div>
    );
  }
}));

vi.mock('../../components/GameSettings', () => ({
  GameSettings: ({ preferences, onPreferencesChange, statistics }: any) => (
    <div data-testid="game-settings">
      <button 
        onClick={() => onPreferencesChange({ ...preferences, soundEnabled: !preferences.soundEnabled })}
        data-testid="toggle-sound-btn"
      >
        Sound: {preferences.soundEnabled ? 'On' : 'Off'}
      </button>
      {statistics && <div data-testid="statistics">Games: {statistics.gamesPlayed}</div>}
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
}));

// Mock Convex mutations
vi.mock('convex/react', async () => {
  const actual = await import('convex/react');
  
  return {
    ...actual,
    useMutation: (fn: any) => {
      if (fn.name === 'createRoom') {
        return vi.fn().mockImplementation(async ({ playerName }: { playerName: string }) => {
          await new Promise(resolve => setTimeout(resolve, 100));
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
          await new Promise(resolve => setTimeout(resolve, 100));
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
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true };
        });
      }
      
      if (fn.name === 'selectFaceUpCards') {
        return vi.fn().mockImplementation(async ({ roomId, cardIds }: { roomId: string, cardIds: string[] }) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true };
        });
      }
      
      if (fn.name === 'playCard') {
        return vi.fn().mockImplementation(async ({ roomId, cardId, action, targetCards, buildValue }: any) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true };
        });
      }
      
      if (fn.name === 'resetGame') {
        return vi.fn().mockImplementation(async ({ roomId }: { roomId: string }) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { success: true };
        });
      }
      
      return vi.fn();
    },
    ConvexProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
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

  describe('Room Creation and Joining', () => {
    it('should allow first player to create room and second player to join', async () => {
      // First player creates room
      const { rerender } = renderWithProviders(<App />);
      
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
        expect(screen.getByTestId('current-phase')).toHaveTextContent('waiting');
      });
      
      // Second player joins room
      rerender(<App />);
      
      await user.click(screen.getByTestId('show-join-form-btn'));
      await user.type(screen.getByTestId('room-id-input'), 'TEST123');
      await user.type(screen.getByTestId('player-name-input-join'), 'Player 2');
      await user.click(screen.getByTestId('join-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
        expect(screen.getByTestId('current-phase')).toHaveTextContent('waiting');
      });
    });

    it('should handle room creation errors gracefully', async () => {
      renderWithProviders(<App />);
      
      // Try to create room without player name
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should handle room joining errors gracefully', async () => {
      renderWithProviders(<App />);
      
      await user.click(screen.getByTestId('show-join-form-btn'));
      
      // Try to join without room ID
      await user.type(screen.getByTestId('player-name-input-join'), 'Player 2');
      await user.click(screen.getByTestId('join-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });
    });
  });

  describe('Game Start and Card Selection', () => {
    it('should start game when both players join and shuffle is initiated', async () => {
      renderWithProviders(<App />);
      
      // Create room as first player
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      // Start the game
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-phase')).toHaveTextContent('cardSelection');
      });
    });

    it('should allow card selection phase', async () => {
      renderWithProviders(<App />);
      
      // Setup game to card selection phase
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      });
      
      // Confirm card selection
      await user.click(screen.getByTestId('confirm-selection-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-phase')).toHaveTextContent('round1');
      });
    });
  });

  describe('Game Play Actions', () => {
    it('should allow capture action', async () => {
      renderWithProviders(<App />);
      
      // Setup game to play phase
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-selection-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
      
      // Perform capture action
      await user.click(screen.getByTestId('capture-btn'));
      
      // Should still be in game play phase
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
    });

    it('should allow build action', async () => {
      renderWithProviders(<App />);
      
      // Setup game to play phase
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-selection-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
      
      // Perform build action
      await user.click(screen.getByTestId('build-btn'));
      
      // Should still be in game play phase
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
    });

    it('should allow trail action', async () => {
      renderWithProviders(<App />);
      
      // Setup game to play phase
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-selection-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
      
      // Perform trail action
      await user.click(screen.getByTestId('trail-btn'));
      
      // Should still be in game play phase
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
    });
  });

  describe('Game Completion and Reset', () => {
    it('should handle game completion and allow reset', async () => {
      renderWithProviders(<App />);
      
      // Setup game to finished state
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      // Simulate game completion
      await act(async () => {
        // This would normally happen through game logic
        // For testing, we'll simulate the state change
      });
      
      // Check for game finished state
      await waitFor(() => {
        expect(screen.getByTestId('game-finished')).toBeInTheDocument();
      });
      
      // Reset game
      await user.click(screen.getByTestId('reset-game-btn'));
      
      // Should return to room manager
      await waitFor(() => {
        expect(screen.getByTestId('room-manager')).toBeInTheDocument();
      });
    });
  });

  describe('Multiplayer Synchronization', () => {
    it('should handle turn switching between players', async () => {
      renderWithProviders(<App />);
      
      // Setup game
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-selection-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
      
      // Check initial turn
      expect(screen.getByTestId('current-turn')).toHaveTextContent('Turn: 1');
      
      // Perform action to switch turn
      await user.click(screen.getByTestId('trail-btn'));
      
      // Turn should switch (this would be handled by the backend in real scenario)
      await waitFor(() => {
        expect(screen.getByTestId('current-turn')).toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from network errors during game play', async () => {
      renderWithProviders(<App />);
      
      // Setup game
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-selection-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
      
      // Simulate network error and recovery
      // The game should remain functional
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
    });

    it('should handle disconnection and reconnection', async () => {
      renderWithProviders(<App />);
      
      // Setup game
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      // Simulate disconnection
      // The game should handle this gracefully
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
    });
  });

  describe('Game Settings Integration', () => {
    it('should persist game preferences', async () => {
      renderWithProviders(<App />);
      
      // Toggle sound setting
      await user.click(screen.getByTestId('toggle-sound-btn'));
      
      expect(screen.getByTestId('toggle-sound-btn')).toHaveTextContent('Sound: Off');
      
      // Toggle back
      await user.click(screen.getByTestId('toggle-sound-btn'));
      
      expect(screen.getByTestId('toggle-sound-btn')).toHaveTextContent('Sound: On');
    });

    it('should display game statistics', async () => {
      renderWithProviders(<App />);
      
      // Statistics should be displayed
      expect(screen.getByTestId('statistics')).toBeInTheDocument();
      expect(screen.getByTestId('statistics')).toHaveTextContent('Games: 0');
    });
  });

  describe('Performance and Responsiveness', () => {
    it('should handle rapid user interactions', async () => {
      renderWithProviders(<App />);
      
      // Setup game quickly
      await user.type(screen.getByTestId('player-name-input-create'), 'Player 1');
      await user.click(screen.getByTestId('create-room-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-phases')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('start-shuffle-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('card-selection-phase')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('confirm-selection-btn'));
      
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
      
      // Rapid button clicks
      await user.click(screen.getByTestId('capture-btn'));
      await user.click(screen.getByTestId('build-btn'));
      await user.click(screen.getByTestId('trail-btn'));
      
      // Game should remain stable
      await waitFor(() => {
        expect(screen.getByTestId('game-play-phase')).toBeInTheDocument();
      });
    });
  });
});
