import { query } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, QueryCtx } from './types';

export const getGameState = query({
  args: { roomId: v.string() },
  handler: async (
    ctx: QueryCtx,
    args: { roomId: string }
  ): Promise<{ gameState: GameState }> => {
    console.log('🔍 getGameState called with roomId:', args.roomId);
    const room = await ctx.db.query('rooms').withIndex('by_roomId', q => q.eq('roomId', args.roomId)).first();
    if (!room) throw new Error('Room not found');
    console.log('📊 Room found:', {
      players: room.players.length,
      phase: room.gameState.phase,
      roomId: room.gameState.roomId
    });
    return { gameState: room.gameState };
  },
});
