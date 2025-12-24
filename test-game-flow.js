/**
 * Game Flow Test
 * Tests the complete game flow from room creation to game start:
 * 1. Player 1 creates room
 * 2. Player 2 joins room
 * 3. Both players set ready
 * 4. Game auto-starts (dealer phase -> round1)
 * 5. Verify cards are dealt correctly
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function apiCall(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(`API Error: ${JSON.stringify(data)}`);
    }
    
    return data;
}

async function runGameFlowTest() {
    console.log('🎮 Game Flow Test');
    console.log('==================\n');
    
    let player1 = null;
    let player2 = null;
    let roomId = null;
    
    try {
        // Step 1: Player 1 creates room
        console.log('Step 1: Player 1 creates room...');
        const createResponse = await apiCall('/rooms/create', 'POST', {
            player_name: 'TestPlayer1',
            max_players: 2
        });
        
        roomId = createResponse.room_id;
        player1 = {
            id: createResponse.player_id,
            name: 'TestPlayer1',
            sessionToken: createResponse.session_token
        };
        
        console.log(`✅ Room created: ${roomId}`);
        console.log(`   Player 1 ID: ${player1.id}`);
        console.log(`   Phase: ${createResponse.game_state?.phase || 'waiting'}\n`);
        
        // Step 2: Player 2 joins room
        console.log('Step 2: Player 2 joins room...');
        const joinResponse = await apiCall('/rooms/join', 'POST', {
            room_id: roomId,
            player_name: 'TestPlayer2'
        });
        
        player2 = {
            id: joinResponse.player_id,
            name: 'TestPlayer2',
            sessionToken: joinResponse.session_token
        };
        
        console.log(`✅ Player 2 joined`);
        console.log(`   Player 2 ID: ${player2.id}`);
        console.log(`   Players in room: ${joinResponse.game_state?.players?.length || 0}\n`);
        
        // Step 3: Player 1 sets ready
        console.log('Step 3: Player 1 sets ready...');
        const ready1Response = await apiCall('/rooms/player-ready', 'POST', {
            room_id: roomId,
            player_id: player1.id,
            is_ready: true
        });
        
        console.log(`✅ Player 1 ready`);
        console.log(`   Player 1 Ready: ${ready1Response.game_state?.player1_ready}`);
        console.log(`   Player 2 Ready: ${ready1Response.game_state?.player2_ready}`);
        console.log(`   Phase: ${ready1Response.game_state?.phase}\n`);
        
        // Step 4: Player 2 sets ready (should trigger dealer phase)
        console.log('Step 4: Player 2 sets ready...');
        const ready2Response = await apiCall('/rooms/player-ready', 'POST', {
            room_id: roomId,
            player_id: player2.id,
            is_ready: true
        });
        
        console.log(`✅ Player 2 ready`);
        console.log(`   Player 1 Ready: ${ready2Response.game_state?.player1_ready}`);
        console.log(`   Player 2 Ready: ${ready2Response.game_state?.player2_ready}`);
        console.log(`   Phase: ${ready2Response.game_state?.phase}`);
        
        if (ready2Response.game_state?.phase !== 'dealer') {
            throw new Error(`Expected phase 'dealer', got '${ready2Response.game_state?.phase}'`);
        }
        console.log(`   ✅ Phase correctly transitioned to 'dealer'\n`);
        
        // Step 5: Start the game (simulates what happens after dealer animation)
        console.log('Step 5: Starting game (auto-start after dealer animation)...');
        const startResponse = await apiCall('/game/start', 'POST', {
            room_id: roomId,
            player_id: player1.id
        });
        
        console.log(`✅ Game started`);
        console.log(`   Phase: ${startResponse.game_state?.phase}`);
        console.log(`   Round: ${startResponse.game_state?.round}`);
        console.log(`   Current Turn: ${startResponse.game_state?.current_turn}`);
        
        if (startResponse.game_state?.phase !== 'round1') {
            throw new Error(`Expected phase 'round1', got '${startResponse.game_state?.phase}'`);
        }
        console.log(`   ✅ Phase correctly transitioned to 'round1'\n`);
        
        // Step 6: Verify cards were dealt
        console.log('Step 6: Verifying cards were dealt...');
        const stateResponse = await apiCall(`/rooms/${roomId}/state`);
        
        const player1Hand = stateResponse.player1_hand || [];
        const player2Hand = stateResponse.player2_hand || [];
        const tableCards = stateResponse.table_cards || [];
        const deck = stateResponse.deck || [];
        
        console.log(`   Player 1 hand: ${player1Hand.length} cards`);
        console.log(`   Player 2 hand: ${player2Hand.length} cards`);
        console.log(`   Table cards: ${tableCards.length} cards`);
        console.log(`   Remaining deck: ${deck.length} cards`);
        
        // Verify card counts (12 cards each player, 4 on table, 24 remaining)
        const expectedPlayer1Hand = 12;
        const expectedPlayer2Hand = 12;
        const expectedTableCards = 4;
        const expectedDeck = 24;
        
        let allCorrect = true;
        
        if (player1Hand.length !== expectedPlayer1Hand) {
            console.log(`   ❌ Player 1 hand: expected ${expectedPlayer1Hand}, got ${player1Hand.length}`);
            allCorrect = false;
        } else {
            console.log(`   ✅ Player 1 hand count correct`);
        }
        
        if (player2Hand.length !== expectedPlayer2Hand) {
            console.log(`   ❌ Player 2 hand: expected ${expectedPlayer2Hand}, got ${player2Hand.length}`);
            allCorrect = false;
        } else {
            console.log(`   ✅ Player 2 hand count correct`);
        }
        
        if (tableCards.length !== expectedTableCards) {
            console.log(`   ❌ Table cards: expected ${expectedTableCards}, got ${tableCards.length}`);
            allCorrect = false;
        } else {
            console.log(`   ✅ Table cards count correct`);
        }
        
        if (deck.length !== expectedDeck) {
            console.log(`   ❌ Deck: expected ${expectedDeck}, got ${deck.length}`);
            allCorrect = false;
        } else {
            console.log(`   ✅ Deck count correct`);
        }
        
        // Verify total cards = 52
        const totalCards = player1Hand.length + player2Hand.length + tableCards.length + deck.length;
        if (totalCards !== 52) {
            console.log(`   ❌ Total cards: expected 52, got ${totalCards}`);
            allCorrect = false;
        } else {
            console.log(`   ✅ Total cards = 52`);
        }
        
        console.log('');
        
        // Step 7: Verify game state flags
        console.log('Step 7: Verifying game state flags...');
        console.log(`   shuffle_complete: ${stateResponse.shuffle_complete}`);
        console.log(`   card_selection_complete: ${stateResponse.card_selection_complete}`);
        console.log(`   game_started: ${stateResponse.game_started}`);
        console.log(`   dealing_complete: ${stateResponse.dealing_complete}`);
        
        if (!stateResponse.shuffle_complete) {
            console.log(`   ❌ shuffle_complete should be true`);
            allCorrect = false;
        } else {
            console.log(`   ✅ shuffle_complete is true`);
        }
        
        if (!stateResponse.game_started) {
            console.log(`   ❌ game_started should be true`);
            allCorrect = false;
        } else {
            console.log(`   ✅ game_started is true`);
        }
        
        console.log('\n==================');
        if (allCorrect) {
            console.log('🎉 ALL TESTS PASSED!');
            console.log('==================\n');
            console.log('Game flow is working correctly:');
            console.log('1. ✅ Room creation');
            console.log('2. ✅ Player joining');
            console.log('3. ✅ Ready status');
            console.log('4. ✅ Dealer phase transition');
            console.log('5. ✅ Game auto-start');
            console.log('6. ✅ Card dealing (12 per player, 4 on table)');
            console.log('7. ✅ Game state flags');
        } else {
            console.log('❌ SOME TESTS FAILED');
            console.log('==================\n');
        }
        
        return allCorrect;
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        return false;
    }
}

// Run the test
runGameFlowTest()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });
