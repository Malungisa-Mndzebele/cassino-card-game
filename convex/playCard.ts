import { mutation } from './_generated/server';
import { v } from 'convex/values';

import type { Card, Build, GameState } from './types';

function getCardValue(rank: string): number {
  if (rank === 'A') return 14;
  if (rank === 'K') return 13;
  if (rank === 'Q') return 12;
  if (rank === 'J') return 11;
  return parseInt(rank);
}

export const playCard = mutation({
  args: {
    roomId: v.string(),
    playerId: v.number(),
    cardId: v.string(),
    action: v.string(),
    targetCards: v.optional(v.array(v.string())),
    buildValue: v.optional(v.number()),
  },
  handler: async (
    ctx,
    args: {
      roomId: string;
      playerId: number;
      cardId: string;
      action: string;
      targetCards?: string[];
      buildValue?: number;
    }
  ): Promise<{ gameState: GameState }> => {
    const room = await ctx.db.query('rooms').filter((q) => q.eq(q.field('roomId'), args.roomId)).first();
    if (!room) throw new Error('Room not found');
    let gameState: GameState = { ...room.gameState as GameState };
    // Validate playing phase
    if (gameState.phase !== 'round1' && gameState.phase !== 'round2') {
      throw new Error('Not in playing phase');
    }
    if (gameState.currentTurn !== args.playerId) {
      throw new Error('Not your turn');
    }
    // Find and validate card in player's hand
    const playerHand: Card[] = args.playerId === 1 ? gameState.player1Hand : gameState.player2Hand;
    const cardIndex = playerHand.findIndex((card: Card) => card.id === args.cardId);
    if (cardIndex === -1) {
      throw new Error('Card not found in hand');
    }
    const playedCard: Card = playerHand[cardIndex];
    const playedCardValue = getCardValue(playedCard.rank);
    if (args.action === 'capture') {
      // Capture cards from table that sum to the played card value
      let captureValue = 0;
      const cardsToCapture = [];
      for (const targetCardId of args.targetCards || []) {
        const tableCard = gameState.tableCards.find(card => card.id === targetCardId);
        if (tableCard) {
          captureValue += getCardValue(tableCard.rank);
          cardsToCapture.push(tableCard);
        }
      }
      if (captureValue !== playedCardValue) {
        throw new Error('Capture value must match played card value');
      }
      // Remove captured cards from table
      for (const card of cardsToCapture as Card[]) {
        const index = gameState.tableCards.findIndex((c: Card) => c.id === card.id);
        if (index !== -1) {
          gameState.tableCards.splice(index, 1);
        }
      }
      // Add captured cards and played card to player's captured pile
      const capturedPile: Card[] = args.playerId === 1 ? gameState.player1Captured : gameState.player2Captured;
      capturedPile.push(playedCard, ...cardsToCapture);
      gameState.lastPlay = {
        playerId: args.playerId,
        action: 'capture',
        card: playedCard,
        capturedCards: cardsToCapture,
        value: captureValue,
      };
    } else if (args.action === 'build') {
      // Create a build on the table
      if (!args.buildValue || args.buildValue < 2 || args.buildValue > 14) {
        throw new Error('Build value must be between 2 and 14');
      }
      // Verify player has a card that can capture this build (excluding the card being played)
      const capturingCards = playerHand.filter((card: Card) => getCardValue(card.rank) === args.buildValue && card.id !== args.cardId);
      if (capturingCards.length === 0) {
        const availableValues = playerHand
          .filter((card: Card) => card.id !== args.cardId)
          .map((card: Card) => getCardValue(card.rank))
          .sort((a: number, b: number) => a - b);
        throw new Error(`You cannot build ${args.buildValue} because you don't have a ${args.buildValue}-value card in hand to capture it. Available values: ${availableValues.join(', ')}`);
      }
      let totalValue = playedCardValue;
      const buildCards: Card[] = [playedCard];
      for (const targetCardId of args.targetCards || []) {
        const tableCard = gameState.tableCards.find(card => card.id === targetCardId);
        if (tableCard) {
          totalValue += getCardValue(tableCard.rank);
          buildCards.push(tableCard);
          // Remove from table
          const index = gameState.tableCards.findIndex((c: Card) => c.id === tableCard.id);
          if (index !== -1) {
            gameState.tableCards.splice(index, 1);
          }
        }
      }
      if (totalValue !== args.buildValue) {
        throw new Error(`Build total (${totalValue}) must match declared value (${args.buildValue}). Adjust your selection or build value.`);
      }
      // Add build to table
      gameState.builds.push({
        id: `build-${Date.now()}`,
        cards: buildCards,
        value: args.buildValue!,
        owner: args.playerId,
      } as Build);
      gameState.lastPlay = {
        playerId: args.playerId,
        action: 'build',
        card: playedCard,
        buildValue: args.buildValue,
        buildCards,
      };
    } else {
      // Trail - just play the card to the table
      gameState.tableCards.push(playedCard as Card);
      gameState.lastPlay = {
        playerId: args.playerId,
        action: 'trail',
        card: playedCard,
      };
    }
    // Remove played card from hand
    playerHand.splice(cardIndex, 1);
    // Switch turns
    gameState.currentTurn = gameState.currentTurn === 1 ? 2 : 1;
    // Check if hands are empty (need to deal more cards or finish game)
    const totalHandCards: number = gameState.player1Hand.length + gameState.player2Hand.length;
    if (totalHandCards === 0) {
      if (gameState.deck.length > 0) {
        if (gameState.round === 1) {
          gameState.phase = 'dealingRound2';
          gameState.round = 2;
          // Deal 4 cards to each player for round 2
          for (let i = 0; i < 8 && gameState.deck.length > 0; i++) {
            const card = gameState.deck.pop();
            if (card) {
              if (i % 2 === 0) {
                gameState.player1Hand.push(card);
              } else {
                gameState.player2Hand.push(card);
              }
            }
          }
          gameState.phase = 'round2';
          gameState.currentTurn = 1;
        } else {
          // Continue round 2, deal more cards
          for (let i = 0; i < 8 && gameState.deck.length > 0; i++) {
            const card = gameState.deck.pop();
            if (card) {
              if (i % 2 === 0) {
                gameState.player1Hand.push(card);
              } else {
                gameState.player2Hand.push(card);
              }
            }
          }
        }
      } else {
        // Game finished - last player captures remaining table cards
        const lastPlayer = args.playerId;
        const remainingCards: Card[] = [...gameState.tableCards];
        gameState.builds.forEach((build: Build) => remainingCards.push(...build.cards));
        if (lastPlayer === 1) {
          gameState.player1Captured.push(...remainingCards.filter(Boolean));
        } else {
          gameState.player2Captured.push(...remainingCards.filter(Boolean));
        }
        gameState.tableCards = [];
        gameState.builds = [];
        gameState.phase = 'finished';
        // Calculate final scores
        // (Simple scoring: 1 point per card, adjust as needed)
        const player1Score = gameState.player1Captured.length;
        const player2Score = gameState.player2Captured.length;
        gameState.player1Score = player1Score;
        gameState.player2Score = player2Score;
        if (player1Score > player2Score) {
          gameState.winner = 1;
        } else if (player2Score > player1Score) {
          gameState.winner = 2;
        } else {
          gameState.winner = 'tie';
        }
      }
    }
    // Update live scores (simple version: cards captured)
    gameState.player1Score = gameState.player1Captured.length;
    gameState.player2Score = gameState.player2Captured.length;
    gameState.lastUpdate = new Date().toISOString();
    await ctx.db.patch(room._id, { gameState });
    return { gameState };

  },
});
