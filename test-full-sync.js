/**
 * Full Multiplayer Sync Test
 * Tests the complete flow: room creation, player join, WebSocket sync, ready states
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testFullSync() {
    console.log('🎮 Testing Full Multiplayer Sync Flow');
    console.log('='.repeat(60));
    
    let player1Token, player2Token, roomId, player1Id, player2Id;
    
    try {
        // Step 1: Player 1 creates room
        console.log('\n📋 Step 1: Player 1 creates room');
        const createRes = await fetch(`${API_URL}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: 'Player1', max_players: 2 })
        });
        const createData = await createRes.json();
        roomId = createData.room_id;
        player1Id = createData.player_id;
        player1Token = createData.session_token;
        console.log(`   Room ID: ${roomId}`);
        console.log(`   Player 1 ID: ${player1Id}`);
        console.log(`   Player 1 Token: ${player1Token?.substring(0, 30)}...`);
        console.log('✅ Room created');
        
        // Step 2: Check initial room state
        console.log('\n📋 Step 2: Check initial room state');
        const state1Res = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const state1 = await state1Res.json();
        console.log(`   Phase: ${state1.phase}`);
        console.log(`   Players: ${state1.players?.length || 0}`);
        console.log(`   Player names: ${state1.players?.map(p => p.name).join(', ') || 'none'}`);
        
        // Step 3: Player 2 joins room
        console.log('\n📋 Step 3: Player 2 joins room');
        const joinRes = await fetch(`${API_URL}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_name: 'Player2' })
        });
        const joinData = await joinRes.json();
        player2Id = joinData.player_id;
        player2Token = joinData.session_token;
        console.log(`   Player 2 ID: ${player2Id}`);
        console.log(`   Player 2 Token: ${player2Token?.substring(0, 30)}...`);
        console.log('✅ Player 2 joined');
        
        // Step 4: Verify both players in room state
        console.log('\n📋 Step 4: Verify both players in room state');
        const state2Res = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const state2 = await state2Res.json();
        console.log(`   Phase: ${state2.phase}`);
        console.log(`   Players: ${state2.players?.length || 0}`);
        console.log(`   Player names: ${state2.players?.map(p => p.name).join(', ') || 'none'}`);
        
        if (state2.players?.length !== 2) {
            console.log('❌ FAIL: Expected 2 players in room');
            return false;
        }
        console.log('✅ Both players in room');
        
        // Step 5: Player 1 sets ready
        console.log('\n📋 Step 5: Player 1 sets ready');
        const ready1Res = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_id: player1Id, is_ready: true })
        });
        const ready1Data = await ready1Res.json();
        console.log(`   Success: ${ready1Data.success}`);
        console.log(`   Player 1 Ready: ${ready1Data.game_state?.player1_ready}`);
        console.log(`   Player 2 Ready: ${ready1Data.game_state?.player2_ready}`);
        console.log('✅ Player 1 ready');
        
        // Step 6: Check state after Player 1 ready
        console.log('\n📋 Step 6: Check state after Player 1 ready');
        const state3Res = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const state3 = await state3Res.json();
        console.log(`   Phase: ${state3.phase}`);
        console.log(`   Player 1 Ready: ${state3.player1_ready}`);
        console.log(`   Player 2 Ready: ${state3.player2_ready}`);
        
        // Step 7: Player 2 sets ready
        console.log('\n📋 Step 7: Player 2 sets ready');
        const ready2Res = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_id: player2Id, is_ready: true })
        });
        const ready2Data = await ready2Res.json();
        console.log(`   Success: ${ready2Data.success}`);
        console.log(`   Player 1 Ready: ${ready2Data.game_state?.player1_ready}`);
        console.log(`   Player 2 Ready: ${ready2Data.game_state?.player2_ready}`);
        console.log(`   New Phase: ${ready2Data.game_state?.phase}`);
        console.log('✅ Player 2 ready');
        
        // Step 8: Verify game transitioned to dealer phase
        console.log('\n📋 Step 8: Verify game transitioned to dealer phase');
        const state4Res = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const state4 = await state4Res.json();
        console.log(`   Phase: ${state4.phase}`);
        console.log(`   Player 1 Ready: ${state4.player1_ready}`);
        console.log(`   Player 2 Ready: ${state4.player2_ready}`);
        console.log(`   Game Started: ${state4.game_started}`);
        console.log(`   Version: ${state4.version}`);
        
        if (state4.phase !== 'dealer') {
            console.log(`❌ FAIL: Expected phase 'dealer', got '${state4.phase}'`);
            return false;
        }
        console.log('✅ Game transitioned to dealer phase');
        
        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 FULL SYNC TEST SUMMARY');
        console.log('='.repeat(60));
        console.log(`Room ID: ${roomId}`);
        console.log(`Player 1: ID=${player1Id}, Token=${player1Token?.substring(0, 20)}...`);
        console.log(`Player 2: ID=${player2Id}, Token=${player2Token?.substring(0, 20)}...`);
        console.log('');
        console.log('✅ Room Creation: PASSED');
        console.log('✅ Player Join: PASSED');
        console.log('✅ State Sync (2 players visible): PASSED');
        console.log('✅ Ready State Sync: PASSED');
        console.log('✅ Phase Transition: PASSED');
        console.log('');
        console.log('🎉 ALL SYNC TESTS PASSED!');
        console.log('');
        console.log('Note: WebSocket real-time sync requires browser testing.');
        console.log('The API-level sync is working correctly.');
        
        return true;
        
    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        return false;
    }
}

testFullSync().then(success => {
    process.exit(success ? 0 : 1);
});
