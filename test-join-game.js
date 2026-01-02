/**
 * Test Game Joining Flow on Production API
 * Tests: create room, join room, ready up, start game, and leave room
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function testJoinGame() {
    console.log('🎮 Testing Game Joining Flow on Production API');
    console.log('=' .repeat(60));
    
    let player1Token, player2Token, roomId, player1Id, player2Id;
    
    try {
        // Step 1: Create a room
        console.log('\n1. Creating room...');
        const createResponse = await fetch(`${API_URL}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: 'TestPlayer1' })
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`Failed to create room: ${createResponse.status} - ${error}`);
        }
        
        const createData = await createResponse.json();
        roomId = createData.room_id;
        player1Id = createData.player_id;
        player1Token = createData.session_token;
        
        console.log(`   ✅ Room created: ${roomId}`);
        console.log(`   ✅ Player 1 ID: ${player1Id}`);
        console.log(`   ✅ Session token received: ${player1Token ? 'Yes' : 'No'}`);
        
        // Step 2: Join with second player
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
            const error = await joinResponse.text();
            throw new Error(`Failed to join room: ${joinResponse.status} - ${error}`);
        }
        
        const joinData = await joinResponse.json();
        player2Id = joinData.player_id;
        player2Token = joinData.session_token;
        
        console.log(`   ✅ Player 2 ID: ${player2Id}`);
        console.log(`   ✅ Session token received: ${player2Token ? 'Yes' : 'No'}`);
        
        // Step 3: Get game state
        console.log('\n3. Getting game state...');
        const stateResponse = await fetch(`${API_URL}/rooms/${roomId}/state`);
        
        if (!stateResponse.ok) {
            throw new Error(`Failed to get state: ${stateResponse.status}`);
        }
        
        const gameState = await stateResponse.json();
        console.log(`   ✅ Phase: ${gameState.phase}`);
        console.log(`   ✅ Players: ${gameState.players?.length || 0}`);
        console.log(`   ✅ Player names: ${gameState.players?.map(p => p.name).join(', ')}`);
        
        // Step 4: Both players ready
        console.log('\n4. Setting both players ready...');
        
        const ready1 = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${player1Token}`
            },
            body: JSON.stringify({ 
                room_id: roomId, 
                player_id: player1Id,
                is_ready: true 
            })
        });
        
        if (!ready1.ok) {
            const error = await ready1.text();
            throw new Error(`Player 1 ready failed: ${ready1.status} - ${error}`);
        }
        console.log(`   ✅ Player 1 ready`);
        
        const ready2 = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${player2Token}`
            },
            body: JSON.stringify({ 
                room_id: roomId, 
                player_id: player2Id,
                is_ready: true 
            })
        });
        
        if (!ready2.ok) {
            const error = await ready2.text();
            throw new Error(`Player 2 ready failed: ${ready2.status} - ${error}`);
        }
        console.log(`   ✅ Player 2 ready`);
        
        // Check phase after both ready
        const ready2Data = await ready2.json();
        console.log(`   ✅ Phase after ready: ${ready2Data.game_state?.phase}`);
        
        // Step 5: Start the game
        console.log('\n5. Starting game (dealing cards)...');
        const startResponse = await fetch(`${API_URL}/game/start`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${player1Token}`
            },
            body: JSON.stringify({ 
                room_id: roomId, 
                player_id: player1Id
            })
        });
        
        if (!startResponse.ok) {
            const error = await startResponse.text();
            throw new Error(`Failed to start game: ${startResponse.status} - ${error}`);
        }
        
        const startData = await startResponse.json();
        console.log(`   ✅ Game started: ${startData.success}`);
        console.log(`   ✅ Phase: ${startData.game_state?.phase}`);
        console.log(`   ✅ Player 1 cards: ${startData.game_state?.player1_hand?.length || 0}`);
        console.log(`   ✅ Player 2 cards: ${startData.game_state?.player2_hand?.length || 0}`);
        console.log(`   ✅ Table cards: ${startData.game_state?.table_cards?.length || 0}`);
        
        // Step 6: Test leave room
        console.log('\n6. Testing leave room (Player 2 leaves)...');
        const leaveResponse = await fetch(`${API_URL}/rooms/leave`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${player2Token}`
            },
            body: JSON.stringify({ 
                room_id: roomId, 
                player_id: player2Id
            })
        });
        
        if (!leaveResponse.ok) {
            const error = await leaveResponse.text();
            throw new Error(`Failed to leave room: ${leaveResponse.status} - ${error}`);
        }
        
        const leaveData = await leaveResponse.json();
        console.log(`   ✅ Leave successful: ${leaveData.success}`);
        console.log(`   ✅ Message: ${leaveData.message}`);
        
        // Step 7: Check game state after leave (Player 1 should win by forfeit)
        console.log('\n7. Checking game state after player left...');
        const finalStateResponse = await fetch(`${API_URL}/rooms/${roomId}/state`);
        
        if (finalStateResponse.ok) {
            const finalState = await finalStateResponse.json();
            console.log(`   ✅ Phase: ${finalState.phase}`);
            console.log(`   ✅ Game completed: ${finalState.game_completed}`);
            console.log(`   ✅ Winner: Player ${finalState.winner}`);
        } else {
            console.log(`   ⚠️ Could not get final state (room may be cleaned up)`);
        }
        
        console.log('\n' + '=' .repeat(60));
        console.log('✅ All game joining tests passed!');
        
        return { success: true, roomId };
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the test
testJoinGame().then(result => {
    console.log('\nTest result:', result.success ? 'PASSED' : 'FAILED');
    process.exit(result.success ? 0 : 1);
});
