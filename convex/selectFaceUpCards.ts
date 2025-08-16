import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, Card, MutationCtx } from './types';

export const selectFaceUpCards = mutation({
  args: { roomId: v.string(), playerId: v.number(), cardIds: v.array(v.string()) },
  handler: async (
    ctx: MutationCtx,
    args: { roomId: string; playerId: number; cardIds: string[] }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').withIndex('by_roomId', q => q.eq('roomId', args.roomId)).first();
    if (!room) throw new Error('Room not found');
    let gameState: GameState = { ...room.gameState };
    if (args.playerId !== 1) throw new Error('Only Player 1 can select face-up cards');
    if (gameState.phase !== 'cardSelection') throw new Error('Cannot select cards at this time');
    if (!args.cardIds || args.cardIds.length !== 4) throw new Error('Must select exactly 4 cards');
    // Remove selected cards from deck and add to table
    gameState.tableCards = [];
    for (const cardId of args.cardIds) {
      const cardIndex: number = gameState.deck.findIndex((card: Card) => card.id === cardId);
      if (cardIndex === -1) throw new Error('Card not found in deck');
      const card: Card | undefined = gameState.deck.splice(cardIndex, 1)[0];
      if (!card) throw new Error('Card extraction failed');
      gameState.tableCards.push(card);
    }
    gameState.phase = 'dealing';
    gameState.cardSelectionComplete = true;
    gameState.lastUpdate = new Date().toISOString();
    await ctx.db.patch(room._id, { gameState });
    return { gameState };
  },
});
