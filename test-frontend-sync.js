/**
 * Test Frontend State Sync
 * 
 * This test verifies that the frontend can see all game state:
 * - Room creation and joining
 * - Player ready status
 * - Game start with cards dealt
 * - Table cards (4 cards)
 * - Player hands (12 cards each)
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFrontendSync() {
    console.log('='.repeat(60));
    console.log('FRONTEND STATE SYNC TEST');
    console.log('='.repeat(60));
    console.log(`API: ${API_URL}`);
    console.log('');

    try {
        // Step 1: Create a room
        console.log('1. Creating room...');
        const createRes = await fetch(`${API_URL}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: 'TestPlayer1' })
        });
        
        if (!createRes.ok) {
            throw new Error(`Failed to create room: ${createRes.status}`);
        }
        
        const createData = await createRes.json();
        const roomId = createData.room_id;
        const player1Id = createData.player_id;
        console.log(`   ✓ Room created: ${roomId}`);
        console.log(`   ✓ Player 1 ID: ${player1Id}`);

        // Step 2: Join with second player
        console.log('\n2. Joining with second player...');
        const joinRes = await fetch(`${API_URL}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_name: 'TestPlayer2' })
        });
        
        if (!joinRes.ok) {
            throw new Error(`Failed to join room: ${joinRes.status}`);
        }
        
        const joinData = await joinRes.json();
        const player2Id = joinData.player_id;
        console.log(`   ✓ Player 2 joined: ${player2Id}`);

        // Step 3: Both players ready
        console.log('\n3. Setting both players ready...');
        
        const ready1Res = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_id: player1Id, is_ready: true })
        });
        console.log(`   ✓ Player 1 ready: ${ready1Res.ok}`);

        const ready2Res = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_id: player2Id, is_ready: true })
        });
        console.log(`   ✓ Player 2 ready: ${ready2Res.ok}`);

        // Step 4: Start the game (shuffle + deal)
        console.log('\n4. Starting game (shuffle + deal)...');
        const startRes = await fetch(`${API_URL}/game/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_id: player1Id })
        });
        
        if (!startRes.ok) {
            const errorText = await startRes.text();
            throw new Error(`Failed to start game: ${startRes.status} - ${errorText}`);
        }
        
        const startData = await startRes.json();
        console.log(`   ✓ Game started: ${startData.success}`);

        // Step 5: Get game state and verify cards
        console.log('\n5. Fetching game state...');
        const stateRes = await fetch(`${API_URL}/rooms/${roomId}/state`);
        
        if (!stateRes.ok) {
            throw new Error(`Failed to get state: ${stateRes.status}`);
        }
        
        const gameState = await stateRes.json();
        
        console.log('\n' + '='.repeat(60));
        console.log('GAME STATE VERIFICATION');
        console.log('='.repeat(60));
        
        // Verify phase
        console.log(`\nPhase: ${gameState.phase}`);
        const phaseOk = gameState.phase === 'round1' || gameState.phase === 'playing';
        console.log(`   ${phaseOk ? '✓' : '✗'} Phase is correct`);

        // Verify table cards
        const tableCards = gameState.table_cards || [];
        console.log(`\nTable Cards: ${tableCards.length}`);
        console.log(`   ${tableCards.length === 4 ? '✓' : '✗'} Expected 4 cards on table`);
        if (tableCards.length > 0) {
            console.log('   Cards:', tableCards.map(c => `${c.rank}${c.suit[0]}`).join(', '));
        }

        // Verify player 1 hand
        const player1Hand = gameState.player1_hand || [];
        console.log(`\nPlayer 1 Hand: ${player1Hand.length} cards`);
        console.log(`   ${player1Hand.length === 12 ? '✓' : '✗'} Expected 12 cards`);
        if (player1Hand.length > 0) {
            console.log('   Cards:', player1Hand.map(c => `${c.rank}${c.suit[0]}`).join(', '));
        }

        // Verify player 2 hand
        const player2Hand = gameState.player2_hand || [];
        console.log(`\nPlayer 2 Hand: ${player2Hand.length} cards`);
        console.log(`   ${player2Hand.length === 12 ? '✓' : '✗'} Expected 12 cards`);
        if (player2Hand.length > 0) {
            console.log('   Cards:', player2Hand.map(c => `${c.rank}${c.suit[0]}`).join(', '));
        }

        // Verify deck
        const deck = gameState.deck || [];
        console.log(`\nDeck: ${deck.length} cards remaining`);
        console.log(`   ${deck.length === 24 ? '✓' : '✗'} Expected 24 cards in deck (52 - 4 - 12 - 12)`);

        // Verify current turn
        console.log(`\nCurrent Turn: Player ${gameState.current_turn}`);
        console.log(`   ${gameState.current_turn === 1 || gameState.current_turn === 2 ? '✓' : '✗'} Valid turn`);

        // Verify players
        const players = gameState.players || [];
        console.log(`\nPlayers: ${players.length}`);
        players.forEach((p, i) => {
            console.log(`   Player ${i + 1}: ${p.name} (ID: ${p.id}, Ready: ${p.ready})`);
        });

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('SUMMARY');
        console.log('='.repeat(60));
        
        const allPassed = 
            phaseOk &&
            tableCards.length === 4 &&
            player1Hand.length === 12 &&
            player2Hand.length === 12 &&
            deck.length === 24;
        
        if (allPassed) {
            console.log('\n✅ ALL TESTS PASSED!');
            console.log('\nThe frontend should be able to see:');
            console.log('   - 4 cards on the table');
            console.log('   - 12 cards in each player\'s hand');
            console.log('   - Current turn indicator');
            console.log('   - Player names and ready status');
        } else {
            console.log('\n❌ SOME TESTS FAILED');
            console.log('Check the details above for issues.');
        }

        // Return the state for further inspection
        return {
            success: allPassed,
            roomId,
            gameState
        };

    } catch (error) {
        console.error('\n❌ TEST FAILED:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the test
testFrontendSync().then(result => {
    console.log('\n' + '='.repeat(60));
    process.exit(result.success ? 0 : 1);
});
