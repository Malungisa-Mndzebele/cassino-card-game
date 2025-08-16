import { query } from './_generated/server';
import { v } from 'convex/values';

import type { GameState } from './types';

export const getGameState = query({
  args: { roomId: v.string() },
  handler: async (
    ctx,
    args: { roomId: string }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').filter((q: any) => q.eq(q.field('roomId'), args.roomId)).first();
    if (!room) throw new Error('Room not found');
    return { gameState: room.gameState as GameState };
  },
});
