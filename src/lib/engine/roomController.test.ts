import { describe, it, expect } from 'vitest';
import { RoomController } from './roomController';

describe('RoomController — game flow', () => {
    it('runs create → join → ready → deal', () => {
        const rc = new RoomController('ROOM01');
        let state = rc.createRoom('Alice');
        expect(state.players).toHaveLength(1);
        expect(state.players[0].id).toBe('1');
        expect(state.phase).toBe('waiting');

        state = rc.addGuest('Bob');
        expect(state.players).toHaveLength(2);
        expect(state.players[1].id).toBe('2');

        rc.setReady(1, true);
        state = rc.setReady(2, true);
        // Both ready auto-transitions to dealer.
        expect(state.phase).toBe('dealer');

        state = rc.startGame();
        expect(state.phase).toBe('round1');
        expect(state.player1_hand).toHaveLength(12);
        expect(state.player2_hand).toHaveLength(12);
        expect(state.table_cards).toHaveLength(4);
        expect(state.current_turn).toBe(1);
    });

    it('rejects out-of-turn plays', () => {
        const rc = new RoomController();
        rc.createRoom('Alice');
        rc.addGuest('Bob');
        rc.setReady(1, true);
        rc.setReady(2, true);
        rc.startGame();
        // It's player 1's turn; player 2 cannot play.
        const p2card = rc.player2Hand[0];
        expect(() => rc.playCard({ playerId: 2, cardId: p2card.id, action: 'trail' })).toThrow();
    });

    it('trails a card and switches turns', () => {
        const rc = new RoomController();
        rc.createRoom('Alice');
        rc.addGuest('Bob');
        rc.setReady(1, true);
        rc.setReady(2, true);
        rc.startGame();

        const before = rc.tableCards.length;
        const p1card = rc.player1Hand[0];
        const state = rc.playCard({ playerId: 1, cardId: p1card.id, action: 'trail' });
        expect(state.table_cards).toHaveLength(before + 1);
        expect(state.current_turn).toBe(2);
        expect(state.player1_hand).toHaveLength(11);
    });

    it('serializes player ids as strings and version increments', () => {
        const rc = new RoomController();
        const s1 = rc.createRoom('Alice');
        expect(typeof s1.players[0].id).toBe('string');
        const v1 = s1.version;
        const s2 = rc.addGuest('Bob');
        expect(s2.version).toBeGreaterThan(v1);
    });
});
