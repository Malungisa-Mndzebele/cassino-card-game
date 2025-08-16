import { defineSchema, defineTable } from 'convex/schema';
export default defineSchema({
    rooms: defineTable({
        roomId: 'string',
        players: 'array', // Array of { id: number, name: string }
        createdAt: 'number',
        gameState: 'object', // Holds the full game state object
    }),
});
