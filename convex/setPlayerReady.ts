import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, MutationCtx } from './types';

export const setPlayerReady = mutation({
  args: { 
    roomId: v.string(), 
    playerId: v.number(), 
    isReady: v.boolean() 
  },
  handler: async (
    ctx: MutationCtx,
    args: { roomId: string; playerId: number; isReady: boolean }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').withIndex('by_roomId', q => q.eq('roomId', args.roomId)).first();
    if (!room) {
      throw new Error('Room not found');
    }

    const updatedGameState: GameState = {
      ...room.gameState,
      ...(args.playerId === 1 
        ? { player1Ready: args.isReady }
        : { player2Ready: args.isReady }
      ),
      lastUpdate: new Date().toISOString(),
    };

    // If both players are ready, transition to countdown phase
    if (updatedGameState.player1Ready && updatedGameState.player2Ready) {
      updatedGameState.phase = 'countdown';
      updatedGameState.countdownStartTime = Date.now();
      updatedGameState.countdownRemaining = 30; // 30 second countdown
    }

    await ctx.db.patch(room._id, { gameState: updatedGameState });
    return { gameState: updatedGameState };
  },
});
