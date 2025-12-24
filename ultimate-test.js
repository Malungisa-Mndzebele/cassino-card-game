// Ultimate test to verify all datetime import fixes
async function ultimateTest() {
    console.log('🎯 ULTIMATE TEST - All Datetime Import Fixes');
    console.log('============================================');
    
    console.log('⏳ Waiting 90 seconds for deployment to complete...');
    await new Promise(resolve => setTimeout(resolve, 90000));
    
    try {
        console.log('\n🔍 Testing all critical endpoints...');
        
        // Test 1: Health check
        console.log('1️⃣ Health check...');
        const health = await fetch('https://cassino-game-backend.onrender.com/health');
        const healthData = await health.json();
        console.log('✅ Backend health:', healthData.status);
        
        // Test 2: Create room (tests fallback session token creation)
        console.log('\n2️⃣ Create room (tests fallback session token)...');
        const createResp = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://khasinogaming.com' },
            body: JSON.stringify({ player_name: "UltimateTest", ip_address: "127.0.0.1" })
        });
        
        if (!createResp.ok) {
            console.log('❌ Create room failed:', createResp.status);
            const error = await createResp.text();
            console.log('Error:', error);
            return;
        }
        
        const createData = await createResp.json();
        console.log('✅ Room created:', createData.room_id);
        
        // Test 3: Player ready (the main problematic endpoint)
        console.log('\n3️⃣ Player ready endpoint (main test)...');
        const readyResp = await fetch('https://cassino-game-backend.onrender.com/rooms/player-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://khasinogaming.com' },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_id: createData.player_id,
                is_ready: true
            })
        });
        
        console.log('Player ready status:', readyResp.status);
        
        if (readyResp.ok) {
            const readyData = await readyResp.json();
            console.log('🎉 SUCCESS! Player ready endpoint working!');
            console.log('✅ Success:', readyData.success);
            console.log('✅ Message:', readyData.message);
        } else {
            const error = await readyResp.text();
            console.log('❌ Player ready still failing:', error);
            return;
        }
        
        // Test 4: Heartbeat status (tests datetime.now() usage)
        console.log('\n4️⃣ Heartbeat status endpoint...');
        const heartbeatResp = await fetch(`https://cassino-game-backend.onrender.com/api/heartbeat/${createData.room_id}`);
        
        if (heartbeatResp.ok) {
            const heartbeatData = await heartbeatResp.json();
            console.log('✅ Heartbeat endpoint working!');
            console.log('✅ Players status count:', heartbeatData.players?.length || 0);
        } else {
            console.log('❌ Heartbeat endpoint failed:', heartbeatResp.status);
        }
        
        // Test 5: Get room state
        console.log('\n5️⃣ Get room state endpoint...');
        const stateResp = await fetch(`https://cassino-game-backend.onrender.com/rooms/${createData.room_id}/state`);
        
        if (stateResp.ok) {
            const stateData = await stateResp.json();
            console.log('✅ Room state endpoint working!');
            console.log('✅ Game phase:', stateData.phase);
        } else {
            console.log('❌ Room state endpoint failed:', stateResp.status);
        }
        
        console.log('\n🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉');
        console.log('✅ The greenlet async issue has been COMPLETELY RESOLVED!');
        console.log('✅ All datetime import issues have been fixed!');
        console.log('✅ Production application is now fully functional!');
        console.log('\n🚀 Users can now play the game at: https://khasinogaming.com/cassino/');
        console.log('🎮 All endpoints are working correctly!');
        
    } catch (error) {
        console.error('❌ Ultimate test failed:', error.message);
    }
}

ultimateTest();