// Test two players joining a room and both getting ready
// This simulates the live game experience

const API_URL = 'https://cassino-game-backend.onrender.com';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testTwoPlayersReady() {
    console.log('=== Testing Two Players Ready Flow ===\n');
    
    try {
        // Step 1: Player 1 creates a room
        console.log('1. Player 1 creating room...');
        const createResponse = await fetch(`${API_URL}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: 'TestPlayer1' })
        });
        
        if (!createResponse.ok) {
            throw new Error(`Create room failed: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        const roomId = createData.room_id;
        const player1Id = createData.player_id;
        const player1Token = createData.session_token;
        
        console.log(`   Room created: ${roomId}`);
        console.log(`   Player 1 ID: ${player1Id}`);
        console.log(`   Player 1 Token: ${player1Token ? 'received' : 'MISSING!'}`);
        
        // Step 2: Player 2 joins the room
        console.log('\n2. Player 2 joining room...');
        const joinResponse = await fetch(`${API_URL}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                room_id: roomId,
                player_name: 'TestPlayer2' 
            })
        });
        
        if (!joinResponse.ok) {
            throw new Error(`Join room failed: ${joinResponse.status}`);
        }
        
        const joinData = await joinResponse.json();
        const player2Id = joinData.player_id;
        const player2Token = joinData.session_token;
        
        console.log(`   Player 2 ID: ${player2Id}`);
        console.log(`   Player 2 Token: ${player2Token ? 'received' : 'MISSING!'}`);
        
        // Step 3: Check initial game state
        console.log('\n3. Checking initial game state...');
        const stateResponse = await fetch(`${API_URL}/game/state/${roomId}`);
        const stateData = await stateResponse.json();
        
        console.log(`   Phase: ${stateData.game_state?.phase || stateData.phase}`);
        console.log(`   Player 1 Ready: ${stateData.game_state?.player1_ready || stateData.player1_ready}`);
        console.log(`   Player 2 Ready: ${stateData.game_state?.player2_ready || stateData.player2_ready}`);
        
        // Step 4: Player 1 sets ready
        console.log('\n4. Player 1 setting ready...');
        const ready1Response = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: roomId,
                player_id: player1Id,
                is_ready: true
            })
        });
        
        if (!ready1Response.ok) {
            const errorText = await ready1Response.text();
            throw new Error(`Player 1 ready failed: ${ready1Response.status} - ${errorText}`);
        }
        
        const ready1Data = await ready1Response.json();
        console.log(`   Success: ${ready1Data.success}`);
        console.log(`   Phase after P1 ready: ${ready1Data.game_state?.phase}`);
        console.log(`   Player 1 Ready: ${ready1Data.game_state?.player1_ready}`);
        console.log(`   Player 2 Ready: ${ready1Data.game_state?.player2_ready}`);
        
        // Step 5: Player 2 sets ready
        console.log('\n5. Player 2 setting ready...');
        const ready2Response = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: roomId,
                player_id: player2Id,
                is_ready: true
            })
        });
        
        if (!ready2Response.ok) {
            const errorText = await ready2Response.text();
            throw new Error(`Player 2 ready failed: ${ready2Response.status} - ${errorText}`);
        }
        
        const ready2Data = await ready2Response.json();
        console.log(`   Success: ${ready2Data.success}`);
        console.log(`   Phase after P2 ready: ${ready2Data.game_state?.phase}`);
        console.log(`   Player 1 Ready: ${ready2Data.game_state?.player1_ready}`);
        console.log(`   Player 2 Ready: ${ready2Data.game_state?.player2_ready}`);
        
        // Step 6: Check final game state
        console.log('\n6. Checking final game state...');
        await sleep(500); // Small delay to let state propagate
        
        const finalStateResponse = await fetch(`${API_URL}/rooms/${roomId}/state`);
        if (!finalStateResponse.ok) {
            // Try alternate endpoint
            const altResponse = await fetch(`${API_URL}/game/state/${roomId}`);
            if (altResponse.ok) {
                const altData = await altResponse.json();
                console.log('   Using /game/state endpoint');
                console.log('   Response:', JSON.stringify(altData, null, 2).substring(0, 500));
            } else {
                console.log('   Could not fetch final state');
            }
        } else {
            const finalStateData = await finalStateResponse.json();
            const finalState = finalStateData.game_state || finalStateData;
            
            console.log(`   Final Phase: ${finalState.phase}`);
            console.log(`   Player 1 Ready: ${finalState.player1_ready}`);
            console.log(`   Player 2 Ready: ${finalState.player2_ready}`);
            console.log(`   Current Player: ${finalState.current_player}`);
            console.log(`   Round: ${finalState.round}`);
            
            // Check if cards were dealt
            if (finalState.player1_hand) {
                console.log(`   Player 1 Hand: ${finalState.player1_hand.length} cards`);
            }
            if (finalState.player2_hand) {
                console.log(`   Player 2 Hand: ${finalState.player2_hand.length} cards`);
            }
            if (finalState.table_cards) {
                console.log(`   Table Cards: ${finalState.table_cards.length} cards`);
            }
        }
        
        // Use the ready2Data which has the most recent state
        const finalState = ready2Data.game_state;
        
        // Verify both players would see the dealer animation
        console.log('\n=== VERIFICATION ===');
        if (finalState.phase === 'dealer') {
            console.log('✅ Phase is "dealer" - Both players should see the dealer animation!');
        } else if (finalState.phase === 'round1') {
            console.log('✅ Phase is "round1" - Game has started after dealer animation!');
        } else if (finalState.phase === 'waiting') {
            console.log('⚠️ Phase is still "waiting" - Something went wrong with ready state');
        } else {
            console.log(`ℹ️ Phase is "${finalState.phase}"`);
        }
        
        if (finalState.player1_ready && finalState.player2_ready) {
            console.log('✅ Both players are ready');
        } else {
            console.log('❌ Not all players are ready');
        }
        
        // Show what both players would see
        console.log('\n=== PLAYER EXPERIENCE ===');
        console.log('When both players are ready:');
        console.log(`  - Phase transitions to: "${finalState.phase}"`);
        console.log('  - Both players see the DealerAnimation component');
        console.log('  - Animation shows: Enter → Shuffle → Deal → Ready');
        console.log('  - After animation, game proceeds to round1');
        
        console.log('\n=== Test Complete ===');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

testTwoPlayersReady();
