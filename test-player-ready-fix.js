// Test the player-ready endpoint fix
async function testPlayerReadyFix() {
    console.log('🔧 Testing Player Ready Endpoint Fix...');
    console.log('=====================================');
    
    try {
        // Step 1: Create a room
        console.log('\n1️⃣ Creating a room...');
        const createResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://khasinogaming.com'
            },
            body: JSON.stringify({
                player_name: "TestPlayer1",
                ip_address: "127.0.0.1"
            })
        });
        
        if (!createResponse.ok) {
            throw new Error(`Create room failed: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        console.log('✅ Room created:', createData.room_id);
        console.log('✅ Player ID:', createData.player_id);
        
        // Step 2: Test player ready endpoint (this was failing before)
        console.log('\n2️⃣ Testing player ready endpoint...');
        const readyResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/player-ready', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://khasinogaming.com'
            },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_id: createData.player_id,
                is_ready: true
            })
        });
        
        console.log('Player ready response status:', readyResponse.status);
        
        if (readyResponse.ok) {
            const readyData = await readyResponse.json();
            console.log('✅ Player ready endpoint working!');
            console.log('✅ Success:', readyData.success);
            console.log('✅ Message:', readyData.message);
            console.log('✅ Game phase:', readyData.game_state?.phase);
        } else {
            const errorText = await readyResponse.text();
            console.log('❌ Player ready endpoint failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Wait a bit for deployment to complete, then test
console.log('⏳ Waiting 30 seconds for deployment to complete...');
setTimeout(testPlayerReadyFix, 30000);