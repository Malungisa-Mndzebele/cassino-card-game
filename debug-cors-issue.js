// Debug the CORS issue that's happening again
async function debugCorsIssue() {
    console.log('🚨 DEBUGGING CORS ISSUE');
    console.log('======================');
    
    try {
        // Test 1: Check if backend is responding at all
        console.log('1️⃣ Testing backend health...');
        const healthResponse = await fetch('https://cassino-game-backend.onrender.com/health', {
            method: 'GET'
        });
        
        console.log('Health response status:', healthResponse.status);
        console.log('Health response headers:');
        for (const [key, value] of healthResponse.headers.entries()) {
            console.log(`  ${key}: ${value}`);
        }
        
        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Backend is responding:', healthData);
        } else {
            console.log('❌ Backend health check failed');
            return;
        }
        
        // Test 2: Check CORS preflight
        console.log('\n2️⃣ Testing CORS preflight...');
        const corsResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/join', {
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://khasinogaming.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'content-type'
            }
        });
        
        console.log('CORS preflight status:', corsResponse.status);
        console.log('CORS preflight headers:');
        for (const [key, value] of corsResponse.headers.entries()) {
            if (key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        // Test 3: Try actual POST request
        console.log('\n3️⃣ Testing actual POST request...');
        const postResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://khasinogaming.com'
            },
            body: JSON.stringify({
                player_name: "CORSDebugTest",
                ip_address: "127.0.0.1"
            })
        });
        
        console.log('POST response status:', postResponse.status);
        console.log('POST response headers:');
        for (const [key, value] of postResponse.headers.entries()) {
            if (key.toLowerCase().includes('access-control')) {
                console.log(`  ${key}: ${value}`);
            }
        }
        
        if (postResponse.ok) {
            const data = await postResponse.json();
            console.log('✅ POST request successful');
        } else {
            const errorText = await postResponse.text();
            console.log('❌ POST request failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Debug failed:', error.message);
    }
}

debugCorsIssue();