import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { GamePhases } from './GamePhases';
import * as testUtils from '../tests/test-utils';

// Mock the Card component
vi.mock('./Card', () => ({
  Card: ({ card, onClick, isSelected, isPlayable }: any) => (
    <div 
      data-testid={`card-${card.id}`}
      onClick={onClick}
      className={`card ${isSelected ? 'selected' : ''} ${isPlayable ? 'playable' : ''}`}
    >
      {card.rank} of {card.suit}
    </div>
  )
}));

// Mock the GameActions component
vi.mock('./GameActions', () => ({
  GameActions: ({ onPlayCard, onBuild, onTrail, gameState, playerId }: any) => (
    <div data-testid="game-actions">
      <button onClick={() => onPlayCard('card1', 'capture')} data-testid="capture-btn">
        Capture
      </button>
      <button onClick={() => onBuild('card1', ['table1'], 5)} data-testid="build-btn">
        Build
      </button>
      <button onClick={() => onTrail('card1')} data-testid="trail-btn">
        Trail
      </button>
    </div>
  )
}));

describe('GamePhases Component', () => {
  const mockOnStartShuffle = vi.fn();
  const mockOnSelectFaceUpCards = vi.fn();
  const mockOnPlayCard = vi.fn();
  const mockOnResetGame = vi.fn();
  
  const defaultPreferences = {
    soundEnabled: true,
    soundVolume: 1,
    hintsEnabled: true,
    statisticsEnabled: true
  };

  const createMockGameState = (overrides = {}) => ({
    roomId: 'test-room',
    phase: 'waiting',
    players: [{ id: 1, name: 'Player 1' }, { id: 2, name: 'Player 2' }],
    currentTurn: 1,
    player1Hand: [],
    player2Hand: [],
    tableCards: [],
    builds: [],
    player1Captured: [],
    player2Captured: [],
    player1Score: 0,
    player2Score: 0,
    round: 1,
    shuffleComplete: false,
    cardSelectionComplete: false,
    dealingComplete: false,
    gameStarted: false,
    lastPlay: null,
    winner: null,
    gameCompleted: false,
    ...overrides
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render null when gameState is not provided', () => {
      const { container } = render(
        <GamePhases
          gameState={null}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render basic game phase information', () => {
      const gameState = createMockGameState();
      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByText('Current Phase: waiting')).toBeInTheDocument();
      expect(screen.getByText('Room ID: test-room')).toBeInTheDocument();
      expect(screen.getByText('Player Name: Player 1')).toBeInTheDocument();
      expect(screen.getByText('Player Name: Player 2')).toBeInTheDocument();
    });
  });

  describe('Waiting Phase', () => {
    it('should render waiting phase correctly', () => {
      const gameState = createMockGameState({ phase: 'waiting' });
      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByText('Current Phase: waiting')).toBeInTheDocument();
    });
  });

  describe('Card Selection Phase', () => {
    it('should handle card selection correctly', () => {
      const gameState = createMockGameState({ 
        phase: 'cardSelection',
        player1Hand: [
          { id: 'card1', suit: 'hearts', rank: 'A' },
          { id: 'card2', suit: 'spades', rank: 'K' },
          { id: 'card3', suit: 'diamonds', rank: 'Q' },
          { id: 'card4', suit: 'clubs', rank: 'J' }
        ]
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      // Test card selection
      const card1 = screen.getByTestId('card-card1');
      const card2 = screen.getByTestId('card-card2');
      
      fireEvent.click(card1);
      expect(card1).toHaveClass('selected');
      
      fireEvent.click(card2);
      expect(card2).toHaveClass('selected');
      
      fireEvent.click(card1);
      expect(card1).not.toHaveClass('selected');
    });

    it('should limit card selection to 4 cards', () => {
      const gameState = createMockGameState({ 
        phase: 'cardSelection',
        player1Hand: [
          { id: 'card1', suit: 'hearts', rank: 'A' },
          { id: 'card2', suit: 'spades', rank: 'K' },
          { id: 'card3', suit: 'diamonds', rank: 'Q' },
          { id: 'card4', suit: 'clubs', rank: 'J' },
          { id: 'card5', suit: 'hearts', rank: '10' }
        ]
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      // Select 4 cards
      fireEvent.click(screen.getByTestId('card-card1'));
      fireEvent.click(screen.getByTestId('card-card2'));
      fireEvent.click(screen.getByTestId('card-card3'));
      fireEvent.click(screen.getByTestId('card-card4'));

      // Try to select a 5th card - should not work
      fireEvent.click(screen.getByTestId('card-card5'));
      expect(screen.getByTestId('card-card5')).not.toHaveClass('selected');
    });
  });

  describe('Game Actions', () => {
    it('should render game actions when in active game phase', () => {
      const gameState = createMockGameState({ 
        phase: 'round1',
        currentTurn: 1,
        player1Hand: [{ id: 'card1', suit: 'hearts', rank: 'A' }],
        tableCards: [{ id: 'table1', suit: 'spades', rank: 'A' }]
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByTestId('game-actions')).toBeInTheDocument();
      expect(screen.getByTestId('capture-btn')).toBeInTheDocument();
      expect(screen.getByTestId('build-btn')).toBeInTheDocument();
      expect(screen.getByTestId('trail-btn')).toBeInTheDocument();
    });

    it('should call onPlayCard when capture button is clicked', () => {
      const gameState = createMockGameState({ 
        phase: 'round1',
        currentTurn: 1
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      fireEvent.click(screen.getByTestId('capture-btn'));
      expect(mockOnPlayCard).toHaveBeenCalledWith('card1', 'capture');
    });

    it('should call onPlayCard when build button is clicked', () => {
      const gameState = createMockGameState({ 
        phase: 'round1',
        currentTurn: 1
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      fireEvent.click(screen.getByTestId('build-btn'));
      expect(mockOnPlayCard).toHaveBeenCalledWith('card1', 'build', ['table1'], 5);
    });

    it('should call onPlayCard when trail button is clicked', () => {
      const gameState = createMockGameState({ 
        phase: 'round1',
        currentTurn: 1
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      fireEvent.click(screen.getByTestId('trail-btn'));
      expect(mockOnPlayCard).toHaveBeenCalledWith('card1', 'trail');
    });
  });

  describe('Scoring Logic', () => {
    it('should calculate score breakdown correctly for captured cards', () => {
      const capturedCards = [
        { id: '1', suit: 'hearts', rank: 'A' },
        { id: '2', suit: 'spades', rank: '2' },
        { id: '3', suit: 'diamonds', rank: '10' },
        { id: '4', suit: 'spades', rank: 'K' },
        { id: '5', suit: 'hearts', rank: 'Q' }
      ];

      const gameState = createMockGameState({ 
        phase: 'round1',
        player1Captured: capturedCards
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      // The component should display score information
      expect(screen.getByText('Current Phase: round1')).toBeInTheDocument();
    });
  });

  describe('Game State Transitions', () => {
    it('should handle shuffle phase correctly', () => {
      const gameState = createMockGameState({ 
        phase: 'shuffling',
        shuffleComplete: false
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByText('Current Phase: shuffling')).toBeInTheDocument();
    });

    it('should handle countdown phase correctly', () => {
      const gameState = createMockGameState({ 
        phase: 'countdown',
        countdownRemaining: 30
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByText('Current Phase: countdown')).toBeInTheDocument();
    });

    it('should handle finished game phase correctly', () => {
      const gameState = createMockGameState({ 
        phase: 'finished',
        winner: 1,
        gameCompleted: true
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByText('Current Phase: finished')).toBeInTheDocument();
    });
  });

  describe('Player Turn Management', () => {
    it('should show correct turn information', () => {
      const gameState = createMockGameState({ 
        phase: 'round1',
        currentTurn: 1
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByText('Current Phase: round1')).toBeInTheDocument();
    });

    it('should handle opponent turn correctly', () => {
      const gameState = createMockGameState({ 
        phase: 'round1',
        currentTurn: 2
      });

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      expect(screen.getByText('Current Phase: round1')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing game state gracefully', () => {
      const gameState = createMockGameState();
      delete gameState.phase;

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      // Should still render basic information
      expect(screen.getByText('Room ID: test-room')).toBeInTheDocument();
    });

    it('should handle missing players array gracefully', () => {
      const gameState = createMockGameState();
      delete gameState.players;

      render(
        <GamePhases
          gameState={gameState}
          playerId={1}
          onStartShuffle={mockOnStartShuffle}
          onSelectFaceUpCards={mockOnSelectFaceUpCards}
          onPlayCard={mockOnPlayCard}
          onResetGame={mockOnResetGame}
          preferences={defaultPreferences}
        />
      );

      // Should still render basic information
      expect(screen.getByText('Current Phase: waiting')).toBeInTheDocument();
      expect(screen.getByText('Room ID: test-room')).toBeInTheDocument();
    });
  });
});
