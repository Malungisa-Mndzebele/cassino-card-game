import { mutation } from './_generated/server';
import { v } from 'convex/values';
import type { GameState, Card } from './types';



function createDeck(): Card[] {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let deck = [];
  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, id: `${rank}_${suit}` });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export const resetGame = mutation({
  args: { roomId: v.string() },
  handler: async (
    ctx,
    args: { roomId: string }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').filter((q: any) => q.eq(q.field('roomId'), args.roomId)).first();
    if (!room) throw new Error('Room not found');
    let gameState: GameState = { ...room.gameState as GameState };
    const deck: Card[] = createDeck();
    gameState.deck = deck;
    gameState.player1Hand = [];
    gameState.player2Hand = [];
    gameState.tableCards = [];
    gameState.builds = [];
    gameState.player1Captured = [];
    gameState.player2Captured = [];
    gameState.phase = 'countdown';
    gameState.round = 0;
    gameState.shuffleComplete = false;
    gameState.cardSelectionComplete = false;
    gameState.dealingComplete = false;
    gameState.currentTurn = 1;
    gameState.player1Score = 0;
    gameState.player2Score = 0;
    gameState.winner = null;
    gameState.lastPlay = null;
    gameState.lastUpdate = new Date().toISOString();
    await ctx.db.patch(room._id, { gameState });
    return { gameState };
  },
});
