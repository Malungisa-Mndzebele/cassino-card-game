import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, Player, MutationCtx } from './types';

export const joinRoom = mutation({
  args: { roomId: v.string(), playerName: v.string() },
  handler: async (
    ctx: MutationCtx,
    args: { roomId: string; playerName: string }
  ): Promise<{ playerId: number; gameState: GameState }> => {
    console.log('🚀 joinRoom mutation called:', { roomId: args.roomId, playerName: args.playerName });
    
    // Find the room by roomId
    const room = await ctx.db.query('rooms').withIndex('by_roomId', q => q.eq('roomId', args.roomId)).first();
    if (!room) {
      console.log('❌ Room not found:', args.roomId);
      throw new Error('Room not found');
    }
    
    console.log('📊 Current room state:', {
      roomId: room.roomId,
      currentPlayers: room.players.length,
      currentPhase: room.gameState.phase,
      playerNames: room.players.map(p => p.name)
    });
    
    if (room.players.length >= 2) {
      console.log('❌ Room is full:', room.players.length);
      throw new Error('Room is full');
    }
    
    const playerId = room.players.length + 1;
    const newPlayer: Player = { id: playerId, name: args.playerName };
    const updatedPlayers: Player[] = [...room.players, newPlayer];
    
    console.log('👥 Updated players:', {
      newPlayer,
      totalPlayers: updatedPlayers.length,
      allPlayers: updatedPlayers.map(p => ({ id: p.id, name: p.name }))
    });
    
    // Update the game state and players array
    const updatedGameState: GameState = {
      ...room.gameState,
      players: updatedPlayers,
      phase: updatedPlayers.length === 2 ? 'dealer' : room.gameState.phase,
      countdownStartTime: null, // Reset countdown start time
      lastUpdate: new Date().toISOString(),
    };
    
    console.log('🎯 Updated game state:', {
      phase: updatedGameState.phase,
      players: updatedGameState.players.length,
      shouldTransitionToDealer: updatedPlayers.length === 2
    });
    
    await ctx.db.patch(room._id, { players: updatedPlayers, gameState: updatedGameState });
    console.log('✅ Room updated successfully');
    
    return { playerId, gameState: updatedGameState };
  },
});
