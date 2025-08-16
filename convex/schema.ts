import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  rooms: defineTable({
    roomId: v.string(),
    players: v.array(v.object({
      id: v.number(),
      name: v.string()
    })),
    createdAt: v.number(),
    gameState: v.any(), // Full game state object
  }).index("by_roomId", ["roomId"]),
});
