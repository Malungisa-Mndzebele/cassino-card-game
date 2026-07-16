import { describe, it, expect } from 'vitest';
import {
    type EngineCard,
    getCardValue,
    getCardValues,
    createDeck,
    dealInitialCards,
    canMakeValueWithAces,
    validateCapture,
    validateBuild,
    validateComponent,
    validateMultiComponentBuild,
    executeCapture,
    executeMultiComponentBuild,
    validateTableBuild,
    calculateScore,
    calculateBonusScores,
    determineWinner
} from './gameEngine';

const card = (rank: string, suit: string): EngineCard => ({
    id: `${rank}_${suit}`,
    rank,
    suit,
    value: getCardValue(rank)
});

describe('gameEngine — ported from game_logic.py', () => {
    describe('card values', () => {
        it('scores face cards and aces correctly', () => {
            expect(getCardValue('A')).toBe(1);
            expect(getCardValue('K')).toBe(13);
            expect(getCardValue('Q')).toBe(12);
            expect(getCardValue('J')).toBe(11);
            expect(getCardValue('7')).toBe(7);
        });

        it('gives aces dual values', () => {
            expect(getCardValues(card('A', 'hearts'))).toEqual([1, 14]);
            expect(getCardValues(card('7', 'spades'))).toEqual([7]);
        });
    });

    describe('deck & deal', () => {
        it('creates a full 52-card deck', () => {
            const deck = createDeck(() => 0.5);
            expect(deck).toHaveLength(52);
            expect(new Set(deck.map((c) => c.id)).size).toBe(52);
        });

        it('deals 4 table / 12 + 12 hands / 24 remaining', () => {
            const deck = createDeck(() => 0.42);
            const { tableCards, player1Hand, player2Hand, remainingDeck } = dealInitialCards(deck);
            expect(tableCards).toHaveLength(4);
            expect(player1Hand).toHaveLength(12);
            expect(player2Hand).toHaveLength(12);
            expect(remainingDeck).toHaveLength(24);
        });
    });

    describe('sums with aces', () => {
        it('finds subset sums using ace dual values', () => {
            const cards = [card('A', 'spades'), card('3', 'diamonds')];
            expect(canMakeValueWithAces(cards, 4)).toBe(true); // A(1)+3
            expect(canMakeValueWithAces(cards, 17)).toBe(true); // A(14)+3
            expect(canMakeValueWithAces(cards, 9)).toBe(false);
        });
    });

    describe('capture', () => {
        it('validates sum captures (3 + 5 = 8)', () => {
            const hand = card('8', 'hearts');
            const table = [card('3', 'spades'), card('5', 'diamonds')];
            expect(validateCapture(hand, table, [])).toBe(true);
        });

        it('rejects impossible captures', () => {
            const hand = card('8', 'hearts');
            const table = [card('2', 'spades'), card('5', 'diamonds')];
            expect(validateCapture(hand, table, [])).toBe(false);
        });

        it('captures hand card first, then targets', () => {
            const hand = card('5', 'clubs');
            const target = [card('5', 'diamonds')];
            const { capturedCards, remainingTableCards } = executeCapture(hand, target, [], []);
            expect(capturedCards[0].id).toBe('5_clubs');
            expect(capturedCards).toHaveLength(2);
            expect(remainingTableCards).toEqual([]);
        });
    });

    describe('build', () => {
        it('validates a combining build when a capturing card is held', () => {
            const hand = card('3', 'hearts');
            const target = [card('5', 'diamonds')];
            const playerHand = [hand, card('8', 'clubs')];
            expect(validateBuild(hand, target, 8, playerHand, [])).toBe(true);
        });

        it('rejects a build with no capturing card in hand', () => {
            const hand = card('3', 'hearts');
            const target = [card('5', 'diamonds')];
            const playerHand = [hand, card('9', 'clubs')];
            expect(validateBuild(hand, target, 8, playerHand, [])).toBe(false);
        });
    });

    describe('components / multi-component build', () => {
        it('validates a component summing to target with ace', () => {
            const cards = [card('A', 'spades'), card('3', 'diamonds')];
            const { isValid, aceValuesUsed } = validateComponent(cards, 4, null);
            expect(isValid).toBe(true);
            expect(aceValuesUsed['A_spades']).toBe(1);
        });

        it('validates and executes a multi-component build', () => {
            const hand = card('5', 'hearts');
            const comp1 = [card('3', 'spades'), card('2', 'diamonds')];
            const comp2 = [hand];
            const playerHand = [hand, card('5', 'clubs')];
            const table = [card('3', 'spades'), card('2', 'diamonds')];

            const val = validateMultiComponentBuild(hand, [comp1, comp2], 5, playerHand, table, []);
            expect(val.isValid).toBe(true);

            const { newBuild } = executeMultiComponentBuild(hand, [comp1, comp2], 5, 1, [], 123);
            expect(newBuild.is_multi_component).toBe(true);
            expect(newBuild.components).toHaveLength(2);
            expect(newBuild.value).toBe(5);
        });
    });

    describe('table build', () => {
        it('requires 2+ cards, a capturing card, and a matching sum', () => {
            const table = [card('3', 'spades'), card('4', 'diamonds')];
            expect(validateTableBuild(table, 7, [card('7', 'hearts')])).toBe(true);
            expect(validateTableBuild(table, 7, [card('9', 'hearts')])).toBe(false);
            expect(validateTableBuild([card('7', 'spades')], 7, [card('7', 'hearts')])).toBe(false);
        });
    });

    describe('scoring & winner', () => {
        it('scores aces, 2♠, and 10♦', () => {
            const captured = [card('A', 'hearts'), card('A', 'spades'), card('2', 'spades'), card('10', 'diamonds')];
            expect(calculateScore(captured)).toBe(5); // 2 aces + 1 + 2
        });

        it('awards bonus for most cards and most spades', () => {
            const p1 = Array.from({ length: 27 }, (_, i) => card(String((i % 9) + 1), 'hearts'));
            const p2 = Array.from({ length: 25 }, (_, i) => card(String((i % 9) + 1), 'clubs'));
            const [p1Bonus, p2Bonus] = calculateBonusScores(p1, p2);
            expect(p1Bonus).toBe(2 + 1); // most cards + tie spades (0-0)
            expect(p2Bonus).toBe(0 + 1);
        });

        it('determines the winner with card tiebreaker', () => {
            expect(determineWinner(8, 6, 27, 25)).toBe(1);
            expect(determineWinner(7, 7, 28, 24)).toBe(1);
            expect(determineWinner(7, 7, 26, 26)).toBeNull();
        });
    });
});
