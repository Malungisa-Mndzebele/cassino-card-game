import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, MutationCtx } from './types';

export const updateCountdown = mutation({
  args: { roomId: v.string() },
  handler: async (
    ctx: MutationCtx,
    args: { roomId: string }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').withIndex('by_roomId', q => q.eq('roomId', args.roomId)).first();
    if (!room) {
      throw new Error('Room not found');
    }

    const gameState = room.gameState;
    
    // Only update if we're in countdown phase and have a start time
    if (gameState.phase === 'countdown' && gameState.countdownStartTime) {
      const elapsed = (Date.now() - gameState.countdownStartTime) / 1000;
      const remaining = Math.max(0, 30 - elapsed);
      
      const updatedGameState: GameState = {
        ...gameState,
        countdownRemaining: remaining,
        lastUpdate: new Date().toISOString(),
      };

      // If countdown reaches zero, transition to readyToShuffle phase
      if (remaining <= 0) {
        updatedGameState.phase = 'readyToShuffle';
        updatedGameState.countdownRemaining = undefined;
      }

      await ctx.db.patch(room._id, { gameState: updatedGameState });
      return { gameState: updatedGameState };
    }

    return { gameState };
  },
});
