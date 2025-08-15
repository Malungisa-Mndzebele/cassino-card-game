import { query } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, Db } from './types';

export const getGameState = query({
  args: { roomId: v.string() },
  handler: async (
    ctx: Db,
    args: { roomId: string }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').filter(q => q.eq(q.field('roomId'), args.roomId)).first();
    if (!room) throw new Error('Room not found');
    return { gameState: room.gameState };
  },
});
