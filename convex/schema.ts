import { defineSchema, defineTable } from 'convex/schema';

export default defineSchema({
  rooms: defineTable({
    roomId: 'string',
    players: 'any', // Array of { id: number, name: string }
    createdAt: 'number',
    gameState: 'any', // Holds the full game state object
  }),
});
