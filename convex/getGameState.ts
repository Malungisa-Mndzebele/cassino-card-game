import { query } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, QueryCtx } from './types';

export const getGameState = query({
  args: { roomId: v.string() },
  handler: async (
    ctx: QueryCtx,
    args: { roomId: string }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').withIndex('by_roomId', q => q.eq('roomId', args.roomId)).first();
    if (!room) throw new Error('Room not found');
    return { gameState: room.gameState };
  },
});
