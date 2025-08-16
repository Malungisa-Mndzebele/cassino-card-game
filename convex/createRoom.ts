import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { GameState, Player, MutationCtx } from './types';

export const createRoom = mutation({
  args: { playerName: v.string() },
  handler: async (
    ctx: MutationCtx,
    args: { playerName: string }
  ): Promise<{ roomId: string; gameState: GameState }> => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const initialGameState: GameState = {
      roomId,
      players: [{ id: 1, name: args.playerName }],
      deck: [],
      player1Hand: [],
      player2Hand: [],
      tableCards: [],
      builds: [],
      player1Captured: [],
      player2Captured: [],
      currentTurn: 1,
      phase: 'waiting',
      round: 0,
      countdownStartTime: null,
      gameStarted: false,
      shuffleComplete: false,
      cardSelectionComplete: false,
      dealingComplete: false,
      player1Score: 0,
      player2Score: 0,
      winner: null as number | 'tie' | null,
      lastPlay: null,
      lastAction: null,
      lastUpdate: new Date().toISOString(),
      gameCompleted: false,
      player1Ready: false,
      player2Ready: false,
    };
    const room = await ctx.db.insert('rooms', {
      roomId,
      players: initialGameState.players,
      createdAt: Date.now(),
      gameState: initialGameState,
    });
    return { roomId, gameState: initialGameState };
  },
});
