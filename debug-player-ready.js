// Debug the player-ready endpoint with detailed error info
async function debugPlayerReady() {
    console.log('🔍 Debugging Player Ready Endpoint');
    console.log('==================================');
    
    try {
        // Create room first
        console.log('\n1️⃣ Creating room...');
        const createRes = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: "DebugUser", ip_address: "127.0.0.1" })
        });
        
        if (!createRes.ok) {
            const errorText = await createRes.text();
            throw new Error(`Create failed: ${createRes.status} - ${errorText}`);
        }
        
        const createData = await createRes.json();
        console.log('✅ Room created:', createData.room_id);
        console.log('✅ Player ID:', createData.player_id);
        
        // Test player ready with detailed error handling
        console.log('\n2️⃣ Testing player ready with debug info...');
        const readyRes = await fetch('https://cassino-game-backend.onrender.com/rooms/player-ready', {
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
        
        console.log('Response status:', readyRes.status);
        console.log('Response headers:');
        for (const [key, value] of readyRes.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        const responseText = await readyRes.text();
        console.log('Response body:', responseText);
        
        if (readyRes.ok) {
            console.log('✅ Player ready endpoint working!');
        } else {
            console.log('❌ Player ready endpoint still failing');
            
            // Try to parse error details
            try {
                const errorData = JSON.parse(responseText);
                console.log('Error details:', errorData);
            } catch (e) {
                console.log('Raw error response:', responseText);
            }
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugPlayerReady();