/**
 * Browser-side authoritative room controller — port of the room/game handlers
 * in backend/main.py. Holds the authoritative game state for one room and
 * applies actions (ready, start, play-card, table-build, reset). The host peer
 * runs this; the guest sends action requests to it over the data channel.
 *
 * serialize() produces the same snake_case `game_state` shape the FastAPI
 * backend returned, so the existing transformGameState()/gameStore path is
 * unchanged.
 */

import {
    type EngineCard,
    type EngineBuild,
    createDeck,
    dealInitialCards,
    dealRoundCards,
    validateCapture,
    executeCapture,
    validateBuild,
    executeBuild,
    validateMultiComponentBuild,
    executeMultiComponentBuild,
    executeTrail,
    validateTableBuild,
    executeTableBuild,
    calculateScore,
    calculateBonusScores,
    determineWinner,
    isRoundComplete
} from './gameEngine';

export type Phase = 'waiting' | 'dealer' | 'round1' | 'round2' | 'finished';

export interface RoomPlayer {
    id: number; // 1 = host, 2 = guest
    name: string;
    ready: boolean;
}

export interface PlayCardParams {
    playerId: number;
    cardId: string;
    action: 'capture' | 'build' | 'trail';
    targetCards?: string[];
    buildValue?: number;
    components?: string[][];
    targetBuilds?: string[];
}

export class ActionError extends Error {}

/** Serialized game state matching the previous backend `game_state` dict.
 *  player ids are emitted as strings to match GameState['players'].id and the
 *  string playerId stored in gameStore (avoids strict-equality mismatches). */
export interface SerializedGameState {
    room_id: string;
    players: Array<{ id: string; name: string; ready: boolean }>;
    phase: Phase;
    round: number;
    deck: EngineCard[];
    player1_hand: EngineCard[];
    player2_hand: EngineCard[];
    table_cards: EngineCard[];
    builds: EngineBuild[];
    player1_captured: EngineCard[];
    player2_captured: EngineCard[];
    player1_score: number;
    player2_score: number;
    current_turn: number;
    card_selection_complete: boolean;
    shuffle_complete: boolean;
    game_started: boolean;
    last_play: unknown;
    last_action: string | null;
    last_update: string;
    game_completed: boolean;
    winner: number | null;
    dealing_complete: boolean;
    player1_ready: boolean;
    player2_ready: boolean;
    version: number;
    [key: string]: unknown;
}

/** Generate a 6-char room code (A–Z, 0–9). */
export function generateRoomId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
}

export class RoomController {
    roomId: string;
    players: RoomPlayer[] = [];
    phase: Phase = 'waiting';
    roundNumber = 0;
    currentTurn = 1;

    deck: EngineCard[] = [];
    tableCards: EngineCard[] = [];
    player1Hand: EngineCard[] = [];
    player2Hand: EngineCard[] = [];
    player1Captured: EngineCard[] = [];
    player2Captured: EngineCard[] = [];
    builds: EngineBuild[] = [];

    player1Score = 0;
    player2Score = 0;
    player1Ready = false;
    player2Ready = false;

    shuffleComplete = false;
    cardSelectionComplete = false;
    gameStarted = false;
    dealingComplete = false;
    gameCompleted = false;
    winner: number | null = null;

    lastPlay: unknown = null;
    lastAction: string | null = null;
    version = 0;

    constructor(roomId?: string) {
        this.roomId = roomId ?? generateRoomId();
    }

    // ---- lifecycle -------------------------------------------------------

    /** Create the room with the host as player 1. */
    createRoom(hostName: string): SerializedGameState {
        this.players = [{ id: 1, name: hostName, ready: false }];
        this.phase = 'waiting';
        this.bump();
        return this.serialize();
    }

    /** Add the guest as player 2. */
    addGuest(guestName: string): SerializedGameState {
        if (this.players.length >= 2) {
            // Replace the existing guest (reconnection) rather than error.
            this.players[1] = { id: 2, name: guestName, ready: false };
        } else {
            this.players.push({ id: 2, name: guestName, ready: false });
        }
        this.bump();
        return this.serialize();
    }

    // ---- ready / start ---------------------------------------------------

    setReady(playerId: number, ready: boolean): SerializedGameState {
        const player = this.players.find((p) => p.id === playerId);
        if (!player) throw new ActionError('Player not found in room');
        player.ready = ready;
        if (playerId === 1) this.player1Ready = ready;
        else if (playerId === 2) this.player2Ready = ready;
        this.bump();

        if (this.player1Ready && this.player2Ready && this.phase === 'waiting') {
            this.phase = 'dealer';
            this.bump();
        }
        return this.serialize();
    }

    startShuffle(): SerializedGameState {
        this.shuffleComplete = true;
        this.phase = 'dealer';
        this.bump();
        return this.serialize();
    }

    /** Deal cards and enter round 1. Used by both start-game and select-face-up. */
    startGame(): SerializedGameState {
        this.shuffleComplete = true;
        this.cardSelectionComplete = true;
        this.phase = 'round1';
        this.gameStarted = true;
        this.roundNumber = 1;
        this.currentTurn = 1;

        const deck = createDeck();
        const { tableCards, player1Hand, player2Hand, remainingDeck } = dealInitialCards(deck);
        this.deck = remainingDeck;
        this.tableCards = tableCards;
        this.player1Hand = player1Hand;
        this.player2Hand = player2Hand;
        this.dealingComplete = true;
        this.bump();
        return this.serialize();
    }

    selectFaceUpCards(playerId: number): SerializedGameState {
        if (playerId !== 1) throw new ActionError('Only Player 1 can select face-up cards');
        return this.startGame();
    }

    reset(): SerializedGameState {
        const players = this.players.map((p) => ({ ...p, ready: false }));
        Object.assign(this, new RoomController(this.roomId));
        this.players = players;
        this.bump();
        return this.serialize();
    }

    // ---- turn helpers ----------------------------------------------------

    private assertTurn(playerId: number): void {
        const expected = this.currentTurn; // 1 or 2 maps directly to player id
        if (playerId !== expected) throw new ActionError("Not this player's turn");
    }

    private handById(hand: EngineCard[], id: string): EngineCard | undefined {
        return hand.find((c) => c.id === id);
    }

    // ---- play card -------------------------------------------------------

    playCard(params: PlayCardParams): SerializedGameState {
        if (this.phase !== 'round1' && this.phase !== 'round2') {
            throw new ActionError('Game is not in progress');
        }
        this.assertTurn(params.playerId);

        const isPlayer1 = params.playerId === 1;
        const playerHand = isPlayer1 ? this.player1Hand : this.player2Hand;
        const playerCaptured = isPlayer1 ? this.player1Captured : this.player2Captured;
        const opponentCaptured = isPlayer1 ? this.player2Captured : this.player1Captured;

        const handCard = this.handById(playerHand, params.cardId);
        if (!handCard) throw new ActionError("Card not found in player's hand");

        const targetIds = params.targetCards || [];
        const action = params.action;

        if (action === 'capture') {
            const targetCards = this.tableCards.filter((c) => targetIds.includes(c.id));
            const targetBuilds = this.builds.filter((b) => targetIds.includes(b.id));

            if (!validateCapture(handCard, targetCards, targetBuilds)) {
                throw new ActionError('Invalid capture');
            }

            const { capturedCards, remainingBuilds } = executeCapture(
                handCard,
                targetCards,
                targetBuilds,
                this.builds
            );

            this.removeFromHand(isPlayer1, handCard);
            // captured table/build cards first, hand card on top (end of list).
            playerCaptured.push(...capturedCards.slice(1));
            playerCaptured.push(capturedCards[0]);
            this.tableCards = this.tableCards.filter((c) => !targetCards.some((t) => t.id === c.id));
            this.builds = remainingBuilds;
        } else if (action === 'build') {
            const targetCards = this.tableCards.filter((c) => targetIds.includes(c.id));

            // Opponent's top captured card may be dragged into a build.
            let opponentTopCard: EngineCard | null = null;
            if (opponentCaptured.length > 0 && targetIds.includes(opponentCaptured[opponentCaptured.length - 1].id)) {
                opponentTopCard = opponentCaptured[opponentCaptured.length - 1];
                targetCards.push(opponentTopCard);
            }

            const targetBuildIds = [...(params.targetBuilds || []), ...targetIds];
            const targetBuilds = this.builds.filter((b) => targetBuildIds.includes(b.id));

            let newBuild: EngineBuild;

            if (params.components && params.components.length > 0) {
                const availableMap = new Map<string, EngineCard>();
                for (const c of this.tableCards) availableMap.set(c.id, c);
                if (opponentTopCard) availableMap.set(opponentTopCard.id, opponentTopCard);
                availableMap.set(handCard.id, handCard);

                const buildComponents: EngineCard[][] = [];
                for (const componentIds of params.components) {
                    const list: EngineCard[] = [];
                    for (const cid of componentIds) {
                        const card = availableMap.get(cid);
                        if (!card) throw new ActionError(`Card ${cid} not found for build component`);
                        list.push(card);
                    }
                    buildComponents.push(list);
                }

                const val = validateMultiComponentBuild(
                    handCard,
                    buildComponents,
                    params.buildValue || 0,
                    playerHand,
                    [...this.tableCards, ...(opponentTopCard ? [opponentTopCard] : [])],
                    targetBuilds
                );
                if (!val.isValid) throw new ActionError(`Invalid multi-component build: ${val.error}`);

                const res = executeMultiComponentBuild(
                    handCard,
                    buildComponents,
                    params.buildValue || 0,
                    params.playerId,
                    targetBuilds,
                    Date.now()
                );
                newBuild = res.newBuild;

                this.removeFromHand(isPlayer1, handCard);
                const usedIds = new Set(newBuild.components.flatMap((comp) => comp.cards.map((c) => c.id)));
                this.tableCards = this.tableCards.filter((c) => !usedIds.has(c.id));
                if (opponentTopCard && usedIds.has(opponentTopCard.id)) {
                    this.removeFromCaptured(!isPlayer1, opponentTopCard);
                }
            } else {
                if (!validateBuild(handCard, targetCards, params.buildValue || 0, playerHand, targetBuilds)) {
                    throw new ActionError('Invalid build');
                }
                const res = executeBuild(handCard, targetCards, params.buildValue || 0, params.playerId, targetBuilds);
                newBuild = res.newBuild;

                this.removeFromHand(isPlayer1, handCard);
                this.tableCards = this.tableCards.filter((c) => !targetCards.some((t) => t.id === c.id));
                if (opponentTopCard) this.removeFromCaptured(!isPlayer1, opponentTopCard);
            }

            const usedBuildIds = new Set(targetBuilds.map((b) => b.id));
            this.builds = this.builds.filter((b) => !usedBuildIds.has(b.id));
            this.builds.push(newBuild);
        } else if (action === 'trail') {
            this.removeFromHand(isPlayer1, handCard);
            this.tableCards.push(...executeTrail(handCard));
        } else {
            throw new ActionError('Invalid action');
        }

        this.lastPlay = {
            card_id: params.cardId,
            action: params.action,
            target_cards: params.targetCards,
            build_value: params.buildValue,
            player_id: params.playerId,
            components: params.components,
            target_builds: params.targetBuilds
        };
        this.lastAction = params.action;

        this.advanceAfterPlay();
        this.bump();
        return this.serialize();
    }

    /** Table-only build. Does NOT consume a turn. */
    tableBuild(playerId: number, targetCards: string[], buildValue: number): SerializedGameState {
        if (this.phase !== 'round1' && this.phase !== 'round2') {
            throw new ActionError('Game is not in progress');
        }
        this.assertTurn(playerId);
        const isPlayer1 = playerId === 1;
        const playerHand = isPlayer1 ? this.player1Hand : this.player2Hand;
        const cards = this.tableCards.filter((c) => targetCards.includes(c.id));

        if (!validateTableBuild(cards, buildValue, playerHand)) {
            throw new ActionError('Invalid table build');
        }
        const newBuild = executeTableBuild(cards, buildValue, playerId);
        this.tableCards = this.tableCards.filter((c) => !targetCards.includes(c.id));
        this.builds.push(newBuild);
        this.lastAction = 'table-build';
        this.bump();
        return this.serialize();
    }

    // ---- internals -------------------------------------------------------

    private removeFromHand(isPlayer1: boolean, card: EngineCard): void {
        if (isPlayer1) this.player1Hand = this.player1Hand.filter((c) => c.id !== card.id);
        else this.player2Hand = this.player2Hand.filter((c) => c.id !== card.id);
    }

    private removeFromCaptured(isPlayer1: boolean, card: EngineCard): void {
        if (isPlayer1) this.player1Captured = this.player1Captured.filter((c) => c.id !== card.id);
        else this.player2Captured = this.player2Captured.filter((c) => c.id !== card.id);
    }

    /** Round transition / game completion / turn switch, mirroring play_card. */
    private advanceAfterPlay(): void {
        if (isRoundComplete(this.player1Hand, this.player2Hand)) {
            if (this.deck.length > 0 && this.roundNumber === 1) {
                const { player1Hand, player2Hand, remainingDeck } = dealRoundCards(
                    this.deck,
                    this.player1Hand,
                    this.player2Hand
                );
                this.player1Hand = player1Hand;
                this.player2Hand = player2Hand;
                this.deck = remainingDeck;
                this.roundNumber = 2;
                this.phase = 'round2';
                this.currentTurn = 1;
            } else {
                this.phase = 'finished';
                this.gameCompleted = true;
                const p1Base = calculateScore(this.player1Captured);
                const p2Base = calculateScore(this.player2Captured);
                const [p1Bonus, p2Bonus] = calculateBonusScores(this.player1Captured, this.player2Captured);
                this.player1Score = p1Base + p1Bonus;
                this.player2Score = p2Base + p2Bonus;
                this.winner = determineWinner(
                    this.player1Score,
                    this.player2Score,
                    this.player1Captured.length,
                    this.player2Captured.length
                );
            }
        } else {
            this.currentTurn = this.currentTurn === 1 ? 2 : 1;
        }
    }

    private bump(): void {
        this.version += 1;
    }

    serialize(): SerializedGameState {
        return {
            room_id: this.roomId,
            players: this.players.map((p) => ({ id: String(p.id), name: p.name, ready: p.ready })),
            phase: this.phase,
            round: this.roundNumber,
            deck: this.deck,
            player1_hand: this.player1Hand,
            player2_hand: this.player2Hand,
            table_cards: this.tableCards,
            builds: this.builds,
            player1_captured: this.player1Captured,
            player2_captured: this.player2Captured,
            player1_score: this.player1Score,
            player2_score: this.player2Score,
            current_turn: this.currentTurn,
            card_selection_complete: this.cardSelectionComplete,
            shuffle_complete: this.shuffleComplete,
            game_started: this.gameStarted,
            last_play: this.lastPlay,
            last_action: this.lastAction,
            last_update: new Date().toISOString(),
            game_completed: this.gameCompleted,
            winner: this.winner,
            dealing_complete: this.dealingComplete,
            player1_ready: this.player1Ready,
            player2_ready: this.player2Ready,
            version: this.version
        };
    }
}
