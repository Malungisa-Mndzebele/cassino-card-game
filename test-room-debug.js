#!/usr/bin/env node

/**
 * Debug room creation and lookup
 */

const API_BASE = 'https://cassino-game-backend.onrender.com';

async function debugRoomFlow() {
    console.log('🔍 ROOM DEBUG TEST');
    console.log('==================\n');
    
    try {
        // 1. Create room
        console.log('1️⃣ Creating room...');
        const createResponse = await fetch(`${API_BASE}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'DebugPlayer1'
            })
        });
        
        const createData = await createResponse.json();
        console.log(`   Status: ${createResponse.status}`);
        console.log(`   Room ID: ${createData.room_id}`);
        console.log(`   Player ID: ${createData.player_id}`);
        console.log(`   Full response:`, JSON.stringify(createData, null, 2).substring(0, 500));
        
        if (!createResponse.ok) {
            console.log('   ❌ Create failed');
            return;
        }
        
        const roomId = createData.room_id;
        
        // 2. Immediately get room state
        console.log('\n2️⃣ Getting room state immediately...');
        const stateResponse = await fetch(`${API_BASE}/rooms/${roomId}/state`);
        console.log(`   Status: ${stateResponse.status}`);
        
        if (stateResponse.ok) {
            const stateData = await stateResponse.json();
            console.log(`   ✅ Room found`);
            console.log(`   Phase: ${stateData.phase}`);
            console.log(`   Players: ${stateData.players?.length}`);
        } else {
            const error = await stateResponse.text();
            console.log(`   ❌ Room not found: ${error}`);
        }
        
        // 3. Try to join with exact room ID
        console.log('\n3️⃣ Joining with exact room ID...');
        const joinResponse = await fetch(`${API_BASE}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: roomId,
                player_name: 'DebugPlayer2'
            })
        });
        
        console.log(`   Status: ${joinResponse.status}`);
        const joinText = await joinResponse.text();
        console.log(`   Response: ${joinText.substring(0, 500)}`);
        
        if (joinResponse.ok) {
            console.log('   ✅ Join successful!');
        } else {
            console.log('   ❌ Join failed');
            
            // Try with uppercase
            console.log('\n4️⃣ Trying with uppercase room ID...');
            const upperJoinResponse = await fetch(`${API_BASE}/rooms/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId.toUpperCase(),
                    player_name: 'DebugPlayer2'
                })
            });
            console.log(`   Status: ${upperJoinResponse.status}`);
            const upperJoinText = await upperJoinResponse.text();
            console.log(`   Response: ${upperJoinText.substring(0, 300)}`);
            
            // Try with lowercase
            console.log('\n5️⃣ Trying with lowercase room ID...');
            const lowerJoinResponse = await fetch(`${API_BASE}/rooms/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId.toLowerCase(),
                    player_name: 'DebugPlayer2'
                })
            });
            console.log(`   Status: ${lowerJoinResponse.status}`);
            const lowerJoinText = await lowerJoinResponse.text();
            console.log(`   Response: ${lowerJoinText.substring(0, 300)}`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

debugRoomFlow();