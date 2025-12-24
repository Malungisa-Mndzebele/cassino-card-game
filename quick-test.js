// Quick test of the player-ready endpoint
async function quickTest() {
    console.log('🚀 Quick Test - Player Ready Endpoint');
    console.log('====================================');
    
    try {
        // Test 1: Health check
        console.log('1️⃣ Health check...');
        const health = await fetch('https://cassino-game-backend.onrender.com/health');
        const healthData = await health.json();
        console.log('✅ Backend status:', healthData.status);
        
        // Test 2: Create room
        console.log('\n2️⃣ Creating room...');
        const createResp = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://khasinogaming.com' },
            body: JSON.stringify({ player_name: "QuickTest", ip_address: "127.0.0.1" })
        });
        
        if (!createResp.ok) {
            console.log('❌ Create failed:', createResp.status);
            return;
        }
        
        const createData = await createResp.json();
        console.log('✅ Room created:', createData.room_id);
        
        // Test 3: Player ready (the critical test)
        console.log('\n3️⃣ Testing player-ready endpoint...');
        const readyResp = await fetch('https://cassino-game-backend.onrender.com/rooms/player-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://khasinogaming.com' },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_id: createData.player_id,
                is_ready: true
            })
        });
        
        console.log('Status:', readyResp.status);
        
        if (readyResp.ok) {
            const readyData = await readyResp.json();
            console.log('🎉 SUCCESS! Fix is working!');
            console.log('✅ Response:', readyData.success);
            console.log('✅ Message:', readyData.message);
        } else {
            const error = await readyResp.text();
            console.log('❌ Still failing:', error);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

quickTest();