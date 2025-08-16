import { mutation } from './_generated/server';
import { v } from 'convex/values';
function createDeck() {
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    let deck = [];
    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ suit, rank, id: `${rank}_${suit}` });
        }
    }
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}
export const startShuffle = mutation({
    args: { roomId: v.string(), playerId: v.number() },
    handler: async (ctx, args) => {
        const room = await ctx.db.query('rooms').filter(q => q.eq(q.field('roomId'), args.roomId)).first();
        if (!room)
            throw new Error('Room not found');
        let gameState = { ...room.gameState };
        if (args.playerId !== 1)
            throw new Error('Only Player 1 can start shuffle');
        if (gameState.phase !== 'countdown')
            throw new Error('Cannot shuffle at this time');
        gameState.deck = createDeck();
        gameState.phase = 'cardSelection';
        gameState.shuffleComplete = true;
        gameState.lastUpdate = new Date().toISOString();
        await ctx.db.patch(room._id, { gameState });
        return { gameState };
    },
});
