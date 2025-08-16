import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, Player } from './types';

export const joinRoom = mutation({
  args: { roomId: v.string(), playerName: v.string() },
  handler: async (
    ctx,
    args: { roomId: string; playerName: string }
  ): Promise<{ playerId: number; gameState: GameState }> => {
    // Find the room by roomId
    const room = await ctx.db.query('rooms').filter((q: any) => q.eq(q.field('roomId'), args.roomId)).first();
    if (!room) {
      throw new Error('Room not found');
    }
    if (room.players.length >= 2) {
      throw new Error('Room is full');
    }
    const playerId = room.players.length + 1;
    const newPlayer: Player = { id: playerId, name: args.playerName };
    const updatedPlayers: Player[] = [...(room.players as Player[]), newPlayer];
    // Update the game state and players array
    const currentState = room.gameState as GameState;
    const updatedGameState: GameState = {
      ...currentState,
      players: updatedPlayers,
      phase: updatedPlayers.length === 2 ? 'countdown' : currentState.phase,
      countdownStartTime: updatedPlayers.length === 2 ? new Date().toISOString() : currentState.countdownStartTime,
      lastUpdate: new Date().toISOString(),
    };
    await ctx.db.patch(room._id, { players: updatedPlayers, gameState: updatedGameState });
    return { playerId, gameState: updatedGameState };
  },
});
