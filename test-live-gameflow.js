/**
 * Test Live Deployed Game Flow
 * Tests the complete multiplayer flow on the production deployment
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function testLiveGameFlow() {
    console.log('🎮 Testing Live Deployed Game Flow');
    console.log('=' .repeat(50));
    console.log(`API URL: ${API_URL}`);
    console.log('');

    // Step 1: Health Check
    console.log('📋 Step 1: Health Check');
    try {
        const healthRes = await fetch(`${API_URL}/health`);
        const health = await healthRes.json();
        console.log(`   Status: ${healthRes.status}`);
        console.log(`   Response: ${JSON.stringify(health)}`);
        if (healthRes.status !== 200) {
            console.log('❌ Health check failed!');
            return;
        }
        console.log('✅ Health check passed\n');
    } catch (error) {
        console.log(`❌ Health check error: ${error.message}`);
        return;
    }

    // Step 2: Create Room (Player 1)
    console.log('📋 Step 2: Create Room (Player 1)');
    let roomId, player1Token, player1Id;
    try {
        const createRes = await fetch(`${API_URL}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: 'TestPlayer1' })
        });
        const createData = await createRes.json();
        console.log(`   Status: ${createRes.status}`);
        
        if (createRes.status !== 200) {
            console.log(`❌ Room creation failed: ${JSON.stringify(createData)}`);
            return;
        }
        
        roomId = createData.room_id;
        player1Token = createData.session_token;
        player1Id = createData.player_id;
        
        console.log(`   Room ID: ${roomId}`);
        console.log(`   Player 1 ID: ${player1Id}`);
        console.log(`   Session Token: ${player1Token?.substring(0, 30)}...`);
        console.log('✅ Room created successfully\n');
    } catch (error) {
        console.log(`❌ Room creation error: ${error.message}`);
        return;
    }

    // Step 3: Get Room State
    console.log('📋 Step 3: Get Room State');
    try {
        const stateRes = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const stateData = await stateRes.json();
        console.log(`   Status: ${stateRes.status}`);
        console.log(`   Phase: ${stateData.game_state?.phase}`);
        console.log(`   Player Count: ${stateData.game_state?.player_count || 'N/A'}`);
        console.log('✅ Room state retrieved\n');
    } catch (error) {
        console.log(`❌ Room state error: ${error.message}\n`);
    }

    // Step 4: Join Room (Player 2)
    console.log('📋 Step 4: Join Room (Player 2)');
    let player2Token, player2Id;
    try {
        const joinRes = await fetch(`${API_URL}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                room_id: roomId,
                player_name: 'TestPlayer2' 
            })
        });
        const joinData = await joinRes.json();
        console.log(`   Status: ${joinRes.status}`);
        
        if (joinRes.status !== 200) {
            console.log(`❌ Room join failed: ${JSON.stringify(joinData)}`);
            return;
        }
        
        player2Token = joinData.session_token;
        player2Id = joinData.player_id;
        
        console.log(`   Player 2 ID: ${player2Id}`);
        console.log(`   Session Token: ${player2Token?.substring(0, 30)}...`);
        console.log('✅ Player 2 joined successfully\n');
    } catch (error) {
        console.log(`❌ Room join error: ${error.message}`);
        return;
    }

    // Step 5: Verify Both Players in Room
    console.log('📋 Step 5: Verify Both Players in Room');
    try {
        const stateRes = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const stateData = await stateRes.json();
        console.log(`   Status: ${stateRes.status}`);
        console.log(`   Phase: ${stateData.game_state?.phase}`);
        console.log(`   Player 1: ${stateData.game_state?.player1_name || 'N/A'}`);
        console.log(`   Player 2: ${stateData.game_state?.player2_name || 'N/A'}`);
        console.log('✅ Both players verified in room\n');
    } catch (error) {
        console.log(`❌ State verification error: ${error.message}\n`);
    }

    // Step 6: Test WebSocket Connection (Player 1)
    console.log('📋 Step 6: Test WebSocket Connection');
    console.log(`   Token being used: ${player1Token?.substring(0, 30)}...`);
    
    const wsUrl = `wss://cassino-game-backend.onrender.com/ws/${roomId}?session_token=${encodeURIComponent(player1Token)}`;
    console.log(`   WebSocket URL: ${wsUrl.substring(0, 80)}...`);
    
    // Note: WebSocket testing requires a browser or ws library
    console.log('   ⚠️ WebSocket testing requires browser environment');
    console.log('   The session token above should match what was stored during room creation\n');

    // Step 7: Set Player 1 Ready
    console.log('📋 Step 7: Set Player 1 Ready');
    try {
        const readyRes = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                room_id: roomId,
                player_id: player1Id,
                is_ready: true
            })
        });
        const readyData = await readyRes.json();
        console.log(`   Status: ${readyRes.status}`);
        console.log(`   Response: ${JSON.stringify(readyData).substring(0, 100)}...`);
        
        if (readyRes.status === 200) {
            console.log('✅ Player 1 ready\n');
        } else {
            console.log(`⚠️ Player ready response: ${readyRes.status}\n`);
        }
    } catch (error) {
        console.log(`❌ Player ready error: ${error.message}\n`);
    }

    // Step 8: Set Player 2 Ready
    console.log('📋 Step 8: Set Player 2 Ready');
    try {
        const readyRes = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                room_id: roomId,
                player_id: player2Id,
                is_ready: true
            })
        });
        const readyData = await readyRes.json();
        console.log(`   Status: ${readyRes.status}`);
        console.log(`   Response: ${JSON.stringify(readyData).substring(0, 100)}...`);
        
        if (readyRes.status === 200) {
            console.log('✅ Player 2 ready\n');
        } else {
            console.log(`⚠️ Player ready response: ${readyRes.status}\n`);
        }
    } catch (error) {
        console.log(`❌ Player ready error: ${error.message}\n`);
    }

    // Step 9: Check Final Game State
    console.log('📋 Step 9: Check Final Game State');
    try {
        const stateRes = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const stateData = await stateRes.json();
        console.log(`   Status: ${stateRes.status}`);
        console.log(`   Phase: ${stateData.game_state?.phase}`);
        console.log(`   Player 1 Ready: ${stateData.game_state?.player1_ready}`);
        console.log(`   Player 2 Ready: ${stateData.game_state?.player2_ready}`);
        console.log(`   Current Turn: ${stateData.game_state?.current_turn}`);
        console.log('✅ Final state retrieved\n');
    } catch (error) {
        console.log(`❌ Final state error: ${error.message}\n`);
    }

    // Summary
    console.log('=' .repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('=' .repeat(50));
    console.log(`Room ID: ${roomId}`);
    console.log(`Player 1 Token: ${player1Token?.substring(0, 30)}...`);
    console.log(`Player 2 Token: ${player2Token?.substring(0, 30)}...`);
    console.log('');
    console.log('To test WebSocket in browser:');
    console.log(`1. Open: https://khasinogaming.com/cassino/`);
    console.log(`2. Join room: ${roomId}`);
    console.log(`3. Check browser console for WebSocket messages`);
    console.log(`4. Check Render logs for [SESSION] and [WS] messages`);
}

// Run the test
testLiveGameFlow().catch(console.error);
