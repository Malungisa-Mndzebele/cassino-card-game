// Simple CORS test using Node.js built-in fetch (Node 18+)
async function testCORS() {
    console.log('🔍 Testing CORS Configuration...');
    console.log('================================');
    
    try {
        // Test 1: Health check
        console.log('\n🏥 Testing health endpoint...');
        const healthResponse = await fetch('https://cassino-game-backend.onrender.com/health');
        const healthData = await healthResponse.json();
        console.log('✅ Health status:', healthResponse.status, healthData);
        
        // Test 2: CORS preflight
        console.log('\n🌐 Testing CORS preflight...');
        const corsResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/join', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://khasinogaming.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type'
            }
        });
        
        console.log('CORS preflight status:', corsResponse.status);
        console.log('CORS headers:');
        for (const [key, value] of corsResponse.headers.entries()) {
            if (key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        // Test 3: Actual POST request
        console.log('\n📝 Testing actual POST request...');
        const postResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://khasinogaming.com'
            },
            body: JSON.stringify({
                player_name: "CORSTestPlayer",
                ip_address: "127.0.0.1"
            })
        });
        
        console.log('POST request status:', postResponse.status);
        console.log('POST response CORS headers:');
        for (const [key, value] of postResponse.headers.entries()) {
            if (key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        if (postResponse.ok) {
            const data = await postResponse.json();
            console.log('✅ POST request successful - Room ID:', data.room_id);
        } else {
            const errorText = await postResponse.text();
            console.log('❌ POST request failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCORS();