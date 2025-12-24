#!/usr/bin/env node

/**
 * Test multiplayer flow - create room, join room, quick match
 */

const API_BASE = 'https://cassino-game-backend.onrender.com';

async function testMultiplayerFlow() {
    console.log('🎮 MULTIPLAYER FLOW TEST');
    console.log('========================\n');
    
    try {
        // 1. Health check
        console.log('1️⃣ Health check...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const health = await healthResponse.json();
        console.log(`   Status: ${health.status}`);
        console.log(`   Database: ${health.database}`);
        console.log(`   Redis: ${health.redis}\n`);
        
        // 2. Create room (Player 1)
        console.log('2️⃣ Player 1 creates room...');
        const createResponse = await fetch(`${API_BASE}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'Player1'
            })
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.text();
            console.log(`   ❌ Create failed: ${createResponse.status} - ${error}`);
            return;
        }
        
        const createData = await createResponse.json();
        console.log(`   ✅ Room created: ${createData.room_id}`);
        console.log(`   Player ID: ${createData.player_id}`);
        console.log(`   Session token: ${createData.session_token ? 'Yes' : 'No'}\n`);
        
        // 3. Verify room exists by getting state
        console.log('3️⃣ Verify room exists (get state)...');
        const stateResponse = await fetch(`${API_BASE}/rooms/${createData.room_id}/state`);
        
        if (!stateResponse.ok) {
            const error = await stateResponse.text();
            console.log(`   ❌ Get state failed: ${stateResponse.status} - ${error}`);
            console.log('   🔴 ISSUE: Room not persisting in database!\n');
        } else {
            const stateData = await stateResponse.json();
            console.log(`   ✅ Room found!`);
            console.log(`   Phase: ${stateData.phase}`);
            console.log(`   Players: ${stateData.players?.length || 0}\n`);
        }
        
        // 4. Player 2 joins the room
        console.log('4️⃣ Player 2 joins room...');
        const joinResponse = await fetch(`${API_BASE}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_name: 'Player2'
            })
        });
        
        if (!joinResponse.ok) {
            const error = await joinResponse.text();
            console.log(`   ❌ Join failed: ${joinResponse.status} - ${error}`);
            console.log('   🔴 ISSUE: Room lookup failing!\n');
        } else {
            const joinData = await joinResponse.json();
            console.log(`   ✅ Joined successfully!`);
            console.log(`   Player ID: ${joinData.player_id}`);
            console.log(`   Players in room: ${joinData.game_state?.players?.length || 0}\n`);
        }
        
        // 5. Test Quick Match
        console.log('5️⃣ Testing Quick Match...');
        
        // Player A creates via quick match
        console.log('   Player A quick match...');
        const quickMatchA = await fetch(`${API_BASE}/rooms/join-random`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'QuickPlayerA'
            })
        });
        
        if (!quickMatchA.ok) {
            const error = await quickMatchA.text();
            console.log(`   ❌ Quick match A failed: ${quickMatchA.status} - ${error}`);
            return;
        }
        
        const quickDataA = await quickMatchA.json();
        console.log(`   Room A: ${quickDataA.game_state?.room_id}`);
        console.log(`   Players: ${quickDataA.game_state?.players?.length || 0}`);
        
        // Player B quick match (should join Player A's room)
        console.log('   Player B quick match...');
        const quickMatchB = await fetch(`${API_BASE}/rooms/join-random`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'QuickPlayerB'
            })
        });
        
        if (!quickMatchB.ok) {
            const error = await quickMatchB.text();
            console.log(`   ❌ Quick match B failed: ${quickMatchB.status} - ${error}`);
            return;
        }
        
        const quickDataB = await quickMatchB.json();
        console.log(`   Room B: ${quickDataB.game_state?.room_id}`);
        console.log(`   Players: ${quickDataB.game_state?.players?.length || 0}`);
        
        // Check if they matched
        if (quickDataA.game_state?.room_id === quickDataB.game_state?.room_id) {
            console.log(`   ✅ MATCHED! Both in room ${quickDataA.game_state?.room_id}\n`);
        } else {
            console.log(`   ❌ NOT MATCHED! Different rooms`);
            console.log(`   🔴 ISSUE: Quick match not finding waiting rooms!\n`);
        }
        
        // 6. Test WebSocket connection
        console.log('6️⃣ Testing WebSocket...');
        console.log(`   WebSocket URL: wss://cassino-game-backend.onrender.com/ws/${createData.room_id}`);
        console.log('   (WebSocket test requires browser environment)\n');
        
        console.log('📊 SUMMARY');
        console.log('==========');
        console.log('Room creation: Working');
        console.log('Room lookup: Check above');
        console.log('Room join: Check above');
        console.log('Quick match: Check above');
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
    }
}

testMultiplayerFlow();