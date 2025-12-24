// Verify the greenlet async fix
async function verifyFix() {
    console.log('🔧 Verifying Greenlet Async Fix...');
    console.log('==================================');
    
    // Wait for deployment to complete
    console.log('⏳ Waiting 45 seconds for deployment...');
    await new Promise(resolve => setTimeout(resolve, 45000));
    
    try {
        // Step 1: Check health
        console.log('\n1️⃣ Checking backend health...');
        const healthResponse = await fetch('https://cassino-game-backend.onrender.com/health');
        const healthData = await healthResponse.json();
        console.log('✅ Backend health:', healthData.status);
        
        // Step 2: Create room
        console.log('\n2️⃣ Creating test room...');
        const createResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://khasinogaming.com'
            },
            body: JSON.stringify({
                player_name: "FixTestPlayer",
                ip_address: "127.0.0.1"
            })
        });
        
        if (!createResponse.ok) {
            throw new Error(`Create room failed: ${createResponse.status}`);
        }
        
        const createData = await createResponse.json();
        console.log('✅ Room created:', createData.room_id);
        
        // Step 3: Test the problematic player-ready endpoint
        console.log('\n3️⃣ Testing player-ready endpoint (was failing)...');
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
        
        console.log('Response status:', readyResponse.status);
        
        if (readyResponse.ok) {
            const readyData = await readyResponse.json();
            console.log('🎉 SUCCESS! Player ready endpoint is working!');
            console.log('✅ Success:', readyData.success);
            console.log('✅ Message:', readyData.message);
            console.log('✅ Game phase:', readyData.game_state?.phase);
            console.log('\n🚀 The greenlet async issue has been resolved!');
        } else {
            const errorText = await readyResponse.text();
            console.log('❌ Still failing:', errorText);
            
            // Try to parse error details
            try {
                const errorData = JSON.parse(errorText);
                console.log('Error details:', errorData);
            } catch (e) {
                console.log('Raw error:', errorText);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

verifyFix();