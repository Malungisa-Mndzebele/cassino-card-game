/**
 * Casino Card Game engine — browser port of backend/game_logic.py.
 *
 * Pure, side-effect-free rules: deck/deal, capture/build/trail validation and
 * execution (including multi-component builds and Ace dual values), scoring and
 * win conditions. Kept faithful to the Python implementation so behavior matches
 * the previous server-authoritative game exactly.
 */

export interface EngineCard {
    id: string;
    suit: string;
    rank: string;
    value: number;
}

export interface EngineComponent {
    cards: EngineCard[];
    sum_value: number;
    ace_values_used: Record<string, number>;
}

export interface EngineBuild {
    id: string;
    cards: EngineCard[];
    value: number;
    owner: number;
    components: EngineComponent[];
    is_multi_component: boolean;
}

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** Primary numeric value of a rank (A=1, J=11, Q=12, K=13, 2-10 face value). */
export function getCardValue(rank: string): number {
    const faceValues: Record<string, number> = { A: 1, K: 13, Q: 12, J: 11 };
    if (rank in faceValues) return faceValues[rank];
    return parseInt(rank, 10);
}

/** All possible values for a card (Aces can be 1 or 14). */
export function getCardValues(card: EngineCard): number[] {
    if (card.rank === 'A') return [1, 14];
    return [card.value];
}

/** Fisher–Yates shuffle using a supplied RNG (defaults to Math.random). */
function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/** Create a shuffled 52-card deck. */
export function createDeck(rng: () => number = Math.random): EngineCard[] {
    const deck: EngineCard[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ id: `${rank}_${suit}`, suit, rank, value: getCardValue(rank) });
        }
    }
    return shuffle(deck, rng);
}

export interface InitialDeal {
    tableCards: EngineCard[];
    player1Hand: EngineCard[];
    player2Hand: EngineCard[];
    remainingDeck: EngineCard[];
}

/** Deal 4 to table, 12 to each player, 24 remain for round 2. */
export function dealInitialCards(deck: EngineCard[]): InitialDeal {
    if (deck.length < 28) throw new Error('Not enough cards in deck');
    return {
        tableCards: deck.slice(0, 4),
        player1Hand: deck.slice(4, 16),
        player2Hand: deck.slice(16, 28),
        remainingDeck: deck.slice(28)
    };
}

export interface RoundDeal {
    player1Hand: EngineCard[];
    player2Hand: EngineCard[];
    remainingDeck: EngineCard[];
}

/** Deal 12 more cards to each player for round 2 (or split what's left). */
export function dealRoundCards(
    deck: EngineCard[],
    player1Hand: EngineCard[],
    player2Hand: EngineCard[]
): RoundDeal {
    let newP1: EngineCard[];
    let newP2: EngineCard[];
    let remaining: EngineCard[];
    if (deck.length < 24) {
        const perPlayer = Math.floor(deck.length / 2);
        newP1 = deck.slice(0, perPlayer);
        newP2 = deck.slice(perPlayer, perPlayer * 2);
        remaining = deck.slice(perPlayer * 2);
    } else {
        newP1 = deck.slice(0, 12);
        newP2 = deck.slice(12, 24);
        remaining = deck.slice(24);
    }
    return {
        player1Hand: [...player1Hand, ...newP1],
        player2Hand: [...player2Hand, ...newP2],
        remainingDeck: remaining
    };
}

/** Check if cards can sum to target with different Ace value assignments. */
function checkSumWithAceVariations(cards: EngineCard[], targetValue: number): boolean {
    const aceIndices: number[] = [];
    cards.forEach((c, i) => {
        if (c.rank === 'A') aceIndices.push(i);
    });

    if (aceIndices.length === 0) {
        return cards.reduce((s, c) => s + c.value, 0) === targetValue;
    }

    for (let aceCombo = 0; aceCombo < 2 ** aceIndices.length; aceCombo++) {
        let total = 0;
        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            if (card.rank === 'A') {
                const aceIdx = aceIndices.indexOf(i);
                total += aceCombo & (1 << aceIdx) ? 14 : 1;
            } else {
                total += card.value;
            }
        }
        if (total === targetValue) return true;
    }
    return false;
}

/** True if any subset of cards sums to targetValue, respecting Ace dual values. */
export function canMakeValueWithAces(cards: EngineCard[], targetValue: number): boolean {
    if (cards.length === 0) return targetValue === 0;
    for (let i = 1; i < 2 ** cards.length; i++) {
        const combo: EngineCard[] = [];
        for (let j = 0; j < cards.length; j++) {
            if (i & (1 << j)) combo.push(cards[j]);
        }
        if (checkSumWithAceVariations(combo, targetValue)) return true;
    }
    return false;
}

/** Validate a capture: direct match, sum of table cards, or matching build value. */
export function validateCapture(
    handCard: EngineCard,
    targetCards: EngineCard[],
    builds: EngineBuild[]
): boolean {
    const handValues = getCardValues(handCard);
    for (const handValue of handValues) {
        for (const card of targetCards) {
            if (getCardValues(card).includes(handValue)) return true;
        }
        if (canMakeValueWithAces(targetCards, handValue)) return true;
        for (const build of builds) {
            if (build.value === handValue) return true;
        }
    }
    return false;
}

/** Validate a build (simple, combining, or augmenting an existing build). */
export function validateBuild(
    handCard: EngineCard,
    targetCards: EngineCard[],
    buildValue: number,
    playerHand: EngineCard[],
    targetBuilds: EngineBuild[] = []
): boolean {
    const handValues = getCardValues(handCard);

    // Must hold another card that can capture the build value.
    let hasCapturingCard = false;
    for (const card of playerHand) {
        if (card.id !== handCard.id && getCardValues(card).includes(buildValue)) {
            hasCapturingCard = true;
            break;
        }
    }
    if (!hasCapturingCard) return false;

    if (targetBuilds.length > 0) {
        for (const build of targetBuilds) {
            if (build.value !== buildValue) return false;
        }
        for (const handValue of handValues) {
            const needed = buildValue - handValue;
            if (needed === 0) {
                if (targetCards.length === 0) return true;
                continue;
            }
            if (needed < 0) continue;
            if (canMakeValueWithAces(targetCards, needed)) return true;
        }
        return false;
    }

    // Simple build: hand card alone declares the build value.
    if (targetCards.length === 0) return handValues.includes(buildValue);

    // Combining build: can't build a value equal to the hand card's own value.
    if (handValues.includes(buildValue)) return false;

    for (const handValue of handValues) {
        const needed = buildValue - handValue;
        if (needed <= 0) continue;
        if (canMakeValueWithAces(targetCards, needed)) return true;
    }
    return false;
}

/** Validate that a component's cards sum to target, returning Ace assignments. */
export function validateComponent(
    componentCards: EngineCard[],
    targetValue: number,
    handCard: EngineCard | null = null
): { isValid: boolean; error: string | null; aceValuesUsed: Record<string, number> } {
    if (componentCards.length === 0) {
        return { isValid: false, error: 'Component contains no cards', aceValuesUsed: {} };
    }
    if (handCard !== null) {
        const ids = new Set(componentCards.map((c) => c.id));
        if (!ids.has(handCard.id)) {
            return { isValid: false, error: `Hand card ${handCard.id} not found in component`, aceValuesUsed: {} };
        }
    }

    const aceCards = componentCards.filter((c) => c.rank === 'A');
    const nonAceCards = componentCards.filter((c) => c.rank !== 'A');
    const nonAceSum = nonAceCards.reduce((s, c) => s + c.value, 0);

    if (aceCards.length === 0) {
        if (nonAceSum === targetValue) return { isValid: true, error: null, aceValuesUsed: {} };
        return {
            isValid: false,
            error: `Component sum ${nonAceSum} does not match target value ${targetValue}`,
            aceValuesUsed: {}
        };
    }

    for (let aceCombo = 0; aceCombo < 2 ** aceCards.length; aceCombo++) {
        let total = nonAceSum;
        const aceValuesUsed: Record<string, number> = {};
        for (let i = 0; i < aceCards.length; i++) {
            const aceValue = aceCombo & (1 << i) ? 14 : 1;
            total += aceValue;
            aceValuesUsed[aceCards[i].id] = aceValue;
        }
        if (total === targetValue) return { isValid: true, error: null, aceValuesUsed };
    }
    return {
        isValid: false,
        error: `Component cards cannot sum to target value ${targetValue}`,
        aceValuesUsed: {}
    };
}

/** Validate a multi-component build. */
export function validateMultiComponentBuild(
    handCard: EngineCard,
    components: EngineCard[][],
    buildValue: number,
    playerHand: EngineCard[],
    tableCards: EngineCard[],
    targetBuilds: EngineBuild[] = []
): { isValid: boolean; error: string | null } {
    if (components.length === 0) return { isValid: false, error: 'No components provided' };

    let hasCapturingCard = false;
    for (const card of playerHand) {
        if (card.id !== handCard.id && getCardValues(card).includes(buildValue)) {
            hasCapturingCard = true;
            break;
        }
    }
    if (!hasCapturingCard) {
        return { isValid: false, error: `No card in hand can capture build value ${buildValue}` };
    }

    if (targetBuilds.length > 0) {
        for (const build of targetBuilds) {
            if (build.value !== buildValue) {
                return { isValid: false, error: `Target build has value ${build.value}, expected ${buildValue}` };
            }
        }
    }

    let handCardComponentCount = 0;
    const availableTableIds = new Set(tableCards.map((c) => c.id));

    for (let i = 0; i < components.length; i++) {
        const componentCards = components[i];
        const { isValid, error } = validateComponent(componentCards, buildValue, null);
        if (!isValid) return { isValid: false, error: `Component ${i + 1}: ${error}` };

        const componentIds = new Set(componentCards.map((c) => c.id));
        if (componentIds.has(handCard.id)) handCardComponentCount++;

        for (const card of componentCards) {
            if (card.id !== handCard.id && !availableTableIds.has(card.id)) {
                return { isValid: false, error: `Card ${card.id} in component ${i + 1} is not available on table` };
            }
        }
    }

    if (handCardComponentCount === 0) {
        return { isValid: false, error: 'Hand card must be included in exactly one component' };
    }
    if (handCardComponentCount > 1) {
        return {
            isValid: false,
            error: `Hand card appears in ${handCardComponentCount} components, must be in exactly one`
        };
    }
    return { isValid: true, error: null };
}

export interface CaptureResult {
    capturedCards: EngineCard[];
    remainingBuilds: EngineBuild[];
    remainingTableCards: EngineCard[];
}

/** Execute a capture. capturedCards has the hand card first, then targets. */
export function executeCapture(
    handCard: EngineCard,
    targetCards: EngineCard[],
    targetBuilds: EngineBuild[],
    allBuilds: EngineBuild[]
): CaptureResult {
    const capturedCards: EngineCard[] = [handCard, ...targetCards];
    const targetBuildIds = new Set(targetBuilds.map((b) => b.id));
    for (const build of targetBuilds) capturedCards.push(...build.cards);
    const remainingBuilds = allBuilds.filter((b) => !targetBuildIds.has(b.id));
    return { capturedCards, remainingBuilds, remainingTableCards: [] };
}

/** Execute a single-component build. */
export function executeBuild(
    handCard: EngineCard,
    targetCards: EngineCard[],
    buildValue: number,
    playerId: number,
    targetBuilds: EngineBuild[] = []
): { remainingTableCards: EngineCard[]; newBuild: EngineBuild } {
    const buildCards: EngineCard[] = [handCard, ...targetCards];
    for (const build of targetBuilds) buildCards.push(...build.cards);

    let buildId = `build_${playerId}_${buildCards.length}_${buildValue}`;
    if (targetBuilds.length > 0) buildId += '_aug';

    const newBuild: EngineBuild = {
        id: buildId,
        cards: buildCards,
        value: buildValue,
        owner: playerId,
        components: [],
        is_multi_component: false
    };
    return { remainingTableCards: [], newBuild };
}

/** Execute a multi-component build. `nowMs` supplies the id timestamp. */
export function executeMultiComponentBuild(
    _handCard: EngineCard,
    components: EngineCard[][],
    buildValue: number,
    playerId: number,
    targetBuilds: EngineBuild[] = [],
    nowMs = 0
): { remainingTableCards: EngineCard[]; newBuild: EngineBuild } {
    const buildComponents: EngineComponent[] = [];
    const allBuildCards: EngineCard[] = [];

    for (const componentCards of components) {
        const { isValid, error, aceValuesUsed } = validateComponent(componentCards, buildValue, null);
        if (!isValid) throw new Error(`Invalid component in executeMultiComponentBuild: ${error}`);
        buildComponents.push({ cards: componentCards, sum_value: buildValue, ace_values_used: aceValuesUsed });
        allBuildCards.push(...componentCards);
    }

    if (targetBuilds.length > 0) {
        for (const build of targetBuilds) {
            if (build.components && build.components.length > 0) {
                buildComponents.push(...build.components);
            } else {
                buildComponents.push({ cards: build.cards, sum_value: build.value, ace_values_used: {} });
            }
            allBuildCards.push(...build.cards);
        }
    }

    let buildId = `build_${playerId}_${allBuildCards.length}_${buildValue}_${nowMs}`;
    if (targetBuilds.length > 0) buildId += '_aug';

    const newBuild: EngineBuild = {
        id: buildId,
        cards: allBuildCards,
        value: buildValue,
        owner: playerId,
        components: buildComponents,
        is_multi_component: true
    };
    return { remainingTableCards: [], newBuild };
}

/** Execute a trail — the hand card goes to the table. */
export function executeTrail(handCard: EngineCard): EngineCard[] {
    return [handCard];
}

/** Validate a table-only build (combine table cards, no hand card played). */
export function validateTableBuild(
    targetCards: EngineCard[],
    buildValue: number,
    playerHand: EngineCard[]
): boolean {
    if (targetCards.length < 2) return false;
    let hasCapturingCard = false;
    for (const card of playerHand) {
        if (getCardValues(card).includes(buildValue)) {
            hasCapturingCard = true;
            break;
        }
    }
    if (!hasCapturingCard) return false;
    return canMakeValueWithAces(targetCards, buildValue);
}

/** Execute a table-only build. */
export function executeTableBuild(
    targetCards: EngineCard[],
    buildValue: number,
    playerId: number
): EngineBuild {
    return {
        id: `build_${playerId}_${targetCards.length}_${buildValue}_table`,
        cards: targetCards,
        value: buildValue,
        owner: playerId,
        components: [],
        is_multi_component: false
    };
}

/** Base score: 1 per Ace, +1 for 2♠, +2 for 10♦. */
export function calculateScore(capturedCards: EngineCard[]): number {
    let score = 0;
    score += capturedCards.filter((c) => c.rank === 'A').length;
    if (capturedCards.some((c) => c.rank === '2' && c.suit === 'spades')) score += 1;
    if (capturedCards.some((c) => c.rank === '10' && c.suit === 'diamonds')) score += 2;
    return score;
}

/** Bonus: most cards (2, split 1/1 on tie), most spades (2, split 1/1 on tie). */
export function calculateBonusScores(
    player1Captured: EngineCard[],
    player2Captured: EngineCard[]
): [number, number] {
    const p1Cards = player1Captured.length;
    const p2Cards = player2Captured.length;
    const p1Spades = player1Captured.filter((c) => c.suit === 'spades').length;
    const p2Spades = player2Captured.filter((c) => c.suit === 'spades').length;

    let p1Bonus = 0;
    let p2Bonus = 0;

    if (p1Cards > p2Cards) p1Bonus += 2;
    else if (p2Cards > p1Cards) p2Bonus += 2;
    else {
        p1Bonus += 1;
        p2Bonus += 1;
    }

    if (p1Spades > p2Spades) p1Bonus += 2;
    else if (p2Spades > p1Spades) p2Bonus += 2;
    else {
        p1Bonus += 1;
        p2Bonus += 1;
    }
    return [p1Bonus, p2Bonus];
}

/** 1 or 2 for the winner, or null for a complete tie. */
export function determineWinner(
    player1Score: number,
    player2Score: number,
    player1Cards: number,
    player2Cards: number
): number | null {
    if (player1Score > player2Score) return 1;
    if (player2Score > player1Score) return 2;
    if (player1Cards > player2Cards) return 1;
    if (player2Cards > player1Cards) return 2;
    return null;
}

/** Round is complete when both hands are empty. */
export function isRoundComplete(player1Hand: EngineCard[], player2Hand: EngineCard[]): boolean {
    return player1Hand.length === 0 && player2Hand.length === 0;
}
