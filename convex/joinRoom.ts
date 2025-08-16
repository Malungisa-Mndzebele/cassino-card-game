import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, Player, MutationCtx } from './types';

export const joinRoom = mutation({
  args: { roomId: v.string(), playerName: v.string() },
  handler: async (
    ctx: MutationCtx,
    args: { roomId: string; playerName: string }
  ): Promise<{ playerId: number; gameState: GameState }> => {
    // Find the room by roomId
    const room = await ctx.db.query('rooms').withIndex('by_roomId', q => q.eq('roomId', args.roomId)).first();
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.players.length >= 2) {
      throw new Error('Room is full');
    }
    const playerId = room.players.length + 1;
    const newPlayer: Player = { id: playerId, name: args.playerName };
    const updatedPlayers: Player[] = [...room.players, newPlayer];
    // Update the game state and players array
    const updatedGameState: GameState = {
      ...room.gameState,
      players: updatedPlayers,
      phase: updatedPlayers.length === 2 ? 'countdown' : room.gameState.phase,
      countdownStartTime: updatedPlayers.length === 2 ? Date.now() : room.gameState.countdownStartTime,
      lastUpdate: new Date().toISOString(),
    };
    await ctx.db.patch(room._id, { players: updatedPlayers, gameState: updatedGameState });
    return { playerId, gameState: updatedGameState };
  },
});
