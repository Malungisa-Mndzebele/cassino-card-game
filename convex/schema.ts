import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  rooms: defineTable({
    roomId: v.string(),
    players: v.any(), // Array of { id: number, name: string }
    createdAt: v.number(),
    gameState: v.any(), // Holds the full game state object
  }),
});
