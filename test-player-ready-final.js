#!/usr/bin/env node

/**
 * Final test for player-ready endpoint after async/await fixes
 */

const API_BASE = 'https://cassino-game-backend.onrender.com';

async function testPlayerReady() {
    console.log('🎯 FINAL PLAYER READY TEST');
    console.log('==========================');
    
    try {
        // 1. Health check
        console.log('1️⃣ Health check...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const health = await healthResponse.json();
        console.log(`✅ Backend health: ${health.status}`);
        
        // 2. Create room
        console.log('2️⃣ Creating room...');
        const createResponse = await fetch(`${API_BASE}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'TestPlayer1'
            })
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`Create room failed: ${createResponse.status} - ${error}`);
        }
        
        const createData = await createResponse.json();
        console.log(`✅ Room created: ${createData.room_id}`);
        
        // 3. Test player ready endpoint (the critical test)
        console.log('3️⃣ Testing player ready endpoint...');
        const readyResponse = await fetch(`${API_BASE}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_id: createData.player_id,
                is_ready: true
            })
        });
        
        console.log(`Player ready status: ${readyResponse.status}`);
        
        if (!readyResponse.ok) {
            const errorText = await readyResponse.text();
            console.log(`❌ Player ready failed: ${errorText}`);
            
            try {
                const errorJson = JSON.parse(errorText);
                console.log(`Error details: ${JSON.stringify(errorJson, null, 2)}`);
            } catch (e) {
                console.log(`Raw error: ${errorText}`);
            }
            
            return false;
        }
        
        const readyData = await readyResponse.json();
        console.log('✅ Player ready endpoint working!');
        console.log(`Response: ${JSON.stringify(readyData, null, 2)}`);
        
        return true;
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return false;
    }
}

// Run the test
testPlayerReady().then(success => {
    if (success) {
        console.log('\n🎉 ALL ASYNC/AWAIT FIXES SUCCESSFUL!');
        console.log('The player-ready endpoint is now working correctly.');
    } else {
        console.log('\n💥 Test failed - more fixes needed');
    }
    process.exit(success ? 0 : 1);
});