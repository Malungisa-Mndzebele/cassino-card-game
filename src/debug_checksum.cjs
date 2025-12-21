
const crypto = require('crypto');

async function computeChecksum(state) {
    // Create canonical representation (must match backend exactly)
    // Python backend uses sort_keys=True, so we must order keys alphabetically here
    const s = state;

    const canonical = {
        card_counts: {
            builds: s.builds?.length || 0,
            deck: s.deck?.length || 0,
            player1_captured: s.player1Captured?.length || 0,
            player1_hand: s.player1Hand?.length || 0,
            player2_captured: s.player2Captured?.length || 0,
            player2_hand: s.player2Hand?.length || 0,
            table_cards: s.tableCards?.length || 0
        },
        current_turn: s.currentTurn || 1,
        flags: {
            card_selection_complete: s.cardSelectionComplete || false,
            dealing_complete: s.dealingComplete || false,
            game_completed: s.gameCompleted || false,
            game_started: s.gameStarted || false,
            shuffle_complete: s.shuffleComplete || false
        },
        phase: s.phase,
        round_number: s.round || 0,
        scores: {
            player1: s.player1Score || 0,
            player2: s.player2Score || 0
        },
        version: s.version || 0
    };

    // Serialize to deterministic JSON string
    // Backend uses separators=(',', ':') which removes whitespace
    const jsonString = JSON.stringify(canonical);
    console.log(`Canonical JSON: ${jsonString}`);

    // Compute SHA-256 hash using Web Crypto API
    // Note: Node.js crypto module usage differs slightly from browser Web Crypto API, 
    // but for this debug script we use standard Node crypto
    const hash = crypto.createHash('sha256');
    hash.update(jsonString);
    return hash.digest('hex');
}

const state = {
    version: 0,
    phase: "waiting",
    currentTurn: 1,
    round: 0,
    deck: [],
    player1Hand: [],
    player2Hand: [],
    tableCards: [],
    player1Captured: [],
    player2Captured: [],
    builds: [],
    player1Score: 0,
    player2Score: 0,
    shuffleComplete: false,
    cardSelectionComplete: false,
    dealingComplete: false,
    gameStarted: false,
    gameCompleted: false
};

computeChecksum(state).then(checksum => {
    console.log(`Checksum: ${checksum}`);
});
