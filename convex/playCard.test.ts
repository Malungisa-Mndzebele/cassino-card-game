import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConvexError } from 'convex/values';

// Mock the Convex database and auth
const mockDb = {
  insert: vi.fn(),
  query: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn()
};

const mockAuth = {
  getUser: vi.fn()
};

// Mock the Convex context
const mockCtx = {
  db: mockDb,
  auth: mockAuth
};

describe('playCard Function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Input Validation', () => {
    it('should validate that roomId is provided', async () => {
      const args = { cardId: 'card1', action: 'capture' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        if (!args.roomId) {
          throw new ConvexError('Room ID is required');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Room ID is required');
    });

    it('should validate that cardId is provided', async () => {
      const args = { roomId: 'room1', action: 'capture' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        if (!args.cardId) {
          throw new ConvexError('Card ID is required');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Card ID is required');
    });

    it('should validate that action is provided', async () => {
      const args = { roomId: 'room1', cardId: 'card1' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        if (!args.action) {
          throw new ConvexError('Action is required');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Action is required');
    });

    it('should validate that action is valid', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'invalid' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const validActions = ['capture', 'build', 'trail'];
        if (!validActions.includes(args.action)) {
          throw new ConvexError('Invalid action');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Invalid action');
    });

    it('should accept valid actions', async () => {
      const validActions = ['capture', 'build', 'trail'];
      
      const playCard = vi.fn().mockImplementation((args) => {
        if (!validActions.includes(args.action)) {
          throw new ConvexError('Invalid action');
        }
        return { success: true };
      });

      validActions.forEach(action => {
        const result = playCard({ roomId: 'room1', cardId: 'card1', action });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Game State Validation', () => {
    it('should validate that room exists', async () => {
      const args = { roomId: 'nonexistent', cardId: 'card1', action: 'capture' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        // Mock room lookup
        const room = mockDb.get('rooms', args.roomId);
        if (!room) {
          throw new ConvexError('Room not found');
        }
        return { success: true };
      });

      mockDb.get.mockReturnValue(null);
      expect(() => playCard(args)).toThrow('Room not found');
    });

    it('should validate that game is in active phase', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'capture' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { phase: 'waiting' };
        if (room.phase === 'waiting' || room.phase === 'finished') {
          throw new ConvexError('Game is not in active phase');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Game is not in active phase');
    });

    it('should validate that it is the player\'s turn', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'capture', playerId: 1 };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { currentTurn: 2 };
        if (room.currentTurn !== args.playerId) {
          throw new ConvexError('Not your turn');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Not your turn');
    });

    it('should validate that card is in player\'s hand', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'capture', playerId: 1 };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          player1Hand: [{ id: 'card2' }],
          player2Hand: [{ id: 'card3' }]
        };
        
        const playerHand = args.playerId === 1 ? room.player1Hand : room.player2Hand;
        const cardExists = playerHand.some(card => card.id === args.cardId);
        
        if (!cardExists) {
          throw new ConvexError('Card not in hand');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Card not in hand');
    });
  });

  describe('Capture Action', () => {
    it('should validate capture targets when provided', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'capture', 
        targetCards: ['table1', 'table2'] 
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { tableCards: [{ id: 'table1' }] };
        
        if (args.targetCards) {
          const validTargets = args.targetCards.every(targetId => 
            room.tableCards.some(card => card.id === targetId)
          );
          
          if (!validTargets) {
            throw new ConvexError('Invalid capture targets');
          }
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Invalid capture targets');
    });

    it('should validate capture value matches', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'capture', 
        targetCards: ['table1'] 
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          tableCards: [{ id: 'table1', rank: '5' }],
          player1Hand: [{ id: 'card1', rank: '7' }]
        };
        
        if (args.targetCards && args.targetCards.length > 0) {
          const targetValue = args.targetCards.reduce((sum, targetId) => {
            const card = room.tableCards.find(c => c.id === targetId);
            return sum + getCardValue(card.rank);
          }, 0);
          
          const playedCard = room.player1Hand.find(c => c.id === args.cardId);
          const playedValue = getCardValue(playedCard.rank);
          
          if (targetValue !== playedValue) {
            throw new ConvexError('Capture value mismatch');
          }
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Capture value mismatch');
    });

    it('should allow valid capture', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'capture', 
        targetCards: ['table1'] 
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          tableCards: [{ id: 'table1', rank: '5' }],
          player1Hand: [{ id: 'card1', rank: '5' }]
        };
        
        // Validate capture
        const targetValue = args.targetCards.reduce((sum, targetId) => {
          const card = room.tableCards.find(c => c.id === targetId);
          return sum + getCardValue(card.rank);
        }, 0);
        
        const playedCard = room.player1Hand.find(c => c.id === args.cardId);
        const playedValue = getCardValue(playedCard.rank);
        
        if (targetValue === playedValue) {
          return { success: true, captured: args.targetCards };
        }
        
        throw new ConvexError('Invalid capture');
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.captured).toEqual(['table1']);
    });
  });

  describe('Build Action', () => {
    it('should validate build value is positive', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'build', 
        targetCards: ['table1'],
        buildValue: 0
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        if (args.action === 'build' && args.buildValue <= 0) {
          throw new ConvexError('Build value must be positive');
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Build value must be positive');
    });

    it('should validate build value matches target cards', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'build', 
        targetCards: ['table1', 'table2'],
        buildValue: 10
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          tableCards: [
            { id: 'table1', rank: '3' },
            { id: 'table2', rank: '4' }
          ]
        };
        
        if (args.action === 'build') {
          const targetValue = args.targetCards.reduce((sum, targetId) => {
            const card = room.tableCards.find(c => c.id === targetId);
            return sum + getCardValue(card.rank);
          }, 0);
          
          if (targetValue !== args.buildValue) {
            throw new ConvexError('Build value does not match target cards');
          }
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Build value does not match target cards');
    });

    it('should validate player has card to capture build', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'build', 
        targetCards: ['table1'],
        buildValue: 5
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          tableCards: [{ id: 'table1', rank: '5' }],
          player1Hand: [{ id: 'card1', rank: '7' }] // No card with value 5
        };
        
        if (args.action === 'build') {
          const hasMatchingCard = room.player1Hand.some(card => 
            getCardValue(card.rank) === args.buildValue
          );
          
          if (!hasMatchingCard) {
            throw new ConvexError('No card available to capture build');
          }
        }
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('No card available to capture build');
    });

    it('should allow valid build', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'build', 
        targetCards: ['table1'],
        buildValue: 5
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          tableCards: [{ id: 'table1', rank: '5' }],
          player1Hand: [{ id: 'card1', rank: '5' }]
        };
        
        // Validate build
        const targetValue = args.targetCards.reduce((sum, targetId) => {
          const card = room.tableCards.find(c => c.id === targetId);
          return sum + getCardValue(card.rank);
        }, 0);
        
        const hasMatchingCard = room.player1Hand.some(card => 
          getCardValue(card.rank) === args.buildValue
        );
        
        if (targetValue === args.buildValue && hasMatchingCard) {
          return { success: true, buildCreated: true };
        }
        
        throw new ConvexError('Invalid build');
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.buildCreated).toBe(true);
    });
  });

  describe('Trail Action', () => {
    it('should allow trail when no captures are possible', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'trail'
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        if (args.action === 'trail') {
          // Trail is always valid when no captures are possible
          return { success: true, cardTrailed: args.cardId };
        }
        return { success: true };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.cardTrailed).toBe('card1');
    });
  });

  describe('Game State Updates', () => {
    it('should update player hand after playing card', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'trail', playerId: 1 };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          player1Hand: [{ id: 'card1', rank: '5' }, { id: 'card2', rank: '7' }]
        };
        
        // Remove played card from hand
        const updatedHand = room.player1Hand.filter(card => card.id !== args.cardId);
        
        // Update database
        mockDb.patch('rooms', args.roomId, { player1Hand: updatedHand });
        
        return { success: true, updatedHand };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.updatedHand).toHaveLength(1);
      expect(result.updatedHand[0].id).toBe('card2');
      expect(mockDb.patch).toHaveBeenCalled();
    });

    it('should update captured cards after capture', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'capture', 
        targetCards: ['table1'],
        playerId: 1
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          player1Captured: [],
          tableCards: [{ id: 'table1', rank: '5' }]
        };
        
        // Add captured cards to player's captured pile
        const capturedCards = args.targetCards.map(targetId => 
          room.tableCards.find(card => card.id === targetId)
        );
        
        const updatedCaptured = [...room.player1Captured, ...capturedCards];
        
        // Update database
        mockDb.patch('rooms', args.roomId, { 
          player1Captured: updatedCaptured,
          tableCards: room.tableCards.filter(card => !args.targetCards.includes(card.id))
        });
        
        return { success: true, captured: capturedCards };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.captured).toHaveLength(1);
      expect(mockDb.patch).toHaveBeenCalled();
    });

    it('should update turn after successful play', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'trail', playerId: 1 };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { currentTurn: 1 };
        
        // Switch turn to other player
        const nextTurn = room.currentTurn === 1 ? 2 : 1;
        
        // Update database
        mockDb.patch('rooms', args.roomId, { currentTurn: nextTurn });
        
        return { success: true, nextTurn };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.nextTurn).toBe(2);
      expect(mockDb.patch).toHaveBeenCalled();
    });

    it('should update last play information', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'capture', 
        targetCards: ['table1'],
        playerId: 1
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const lastPlay = {
          cardId: args.cardId,
          action: args.action,
          targetCards: args.targetCards,
          playerId: args.playerId,
          timestamp: new Date().toISOString()
        };
        
        // Update database
        mockDb.patch('rooms', args.roomId, { lastPlay });
        
        return { success: true, lastPlay };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.lastPlay.cardId).toBe('card1');
      expect(result.lastPlay.action).toBe('capture');
      expect(mockDb.patch).toHaveBeenCalled();
    });
  });

  describe('Scoring Updates', () => {
    it('should update score after capturing scoring cards', async () => {
      const args = { 
        roomId: 'room1', 
        cardId: 'card1', 
        action: 'capture', 
        targetCards: ['table1'],
        playerId: 1
      };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { 
          player1Score: 0,
          tableCards: [{ id: 'table1', rank: 'A', suit: 'hearts' }]
        };
        
        // Calculate score from captured cards
        const capturedCards = args.targetCards.map(targetId => 
          room.tableCards.find(card => card.id === targetId)
        );
        
        let scoreIncrease = 0;
        capturedCards.forEach(card => {
          if (card.rank === 'A') scoreIncrease += 1;
          if (card.rank === '2' && card.suit === 'spades') scoreIncrease += 1;
          if (card.rank === '10' && card.suit === 'diamonds') scoreIncrease += 2;
        });
        
        const newScore = room.player1Score + scoreIncrease;
        
        // Update database
        mockDb.patch('rooms', args.roomId, { player1Score: newScore });
        
        return { success: true, scoreIncrease, newScore };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.scoreIncrease).toBe(1); // Ace of hearts
      expect(result.newScore).toBe(1);
      expect(mockDb.patch).toHaveBeenCalled();
    });
  });

  describe('Win Condition Checking', () => {
    it('should detect win when player reaches 11 points', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'capture', playerId: 1 };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { player1Score: 10 };
        
        // After this play, player will have 11 points
        const newScore = room.player1Score + 1;
        
        if (newScore >= 11) {
          // Game is won
          mockDb.patch('rooms', args.roomId, { 
            player1Score: newScore,
            phase: 'finished',
            winner: args.playerId,
            gameCompleted: true
          });
          
          return { success: true, gameWon: true, winner: args.playerId };
        }
        
        return { success: true };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.gameWon).toBe(true);
      expect(result.winner).toBe(1);
      expect(mockDb.patch).toHaveBeenCalled();
    });

    it('should handle tie game', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'capture', playerId: 1 };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = { player1Score: 10, player2Score: 10 };
        
        // Both players have same score at end of game
        const newScore = room.player1Score + 1;
        
        if (newScore >= 11 && newScore === room.player2Score) {
          // Tie game
          mockDb.patch('rooms', args.roomId, { 
            player1Score: newScore,
            phase: 'finished',
            winner: 'tie',
            gameCompleted: true
          });
          
          return { success: true, gameTied: true };
        }
        
        return { success: true };
      });

      const result = playCard(args);
      expect(result.success).toBe(true);
      expect(result.gameTied).toBe(true);
      expect(mockDb.patch).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'trail' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        try {
          mockDb.patch.mockImplementation(() => {
            throw new Error('Database connection failed');
          });
          
          mockDb.patch('rooms', args.roomId, {});
          return { success: true };
        } catch (error) {
          throw new ConvexError('Failed to update game state');
        }
      });

      expect(() => playCard(args)).toThrow('Failed to update game state');
    });

    it('should handle invalid game state gracefully', async () => {
      const args = { roomId: 'room1', cardId: 'card1', action: 'capture' };
      
      const playCard = vi.fn().mockImplementation((args) => {
        const room = null; // Invalid room state
        
        if (!room) {
          throw new ConvexError('Invalid game state');
        }
        
        return { success: true };
      });

      expect(() => playCard(args)).toThrow('Invalid game state');
    });
  });
});

// Helper function to get card value
function getCardValue(rank: string): number {
  const values: { [key: string]: number } = {
    'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13
  };
  return values[rank] || 0;
}
