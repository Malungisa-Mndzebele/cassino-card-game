// Direct API test to check room creation
const fetch = require('node-fetch');

async function testRoomCreation() {
    console.log('🎮 Testing Room Creation API Directly');
    console.log('====================================');
    
    try {
        // Test 1: Health check
        console.log('\n🏥 Testing health endpoint...');
        const healthResponse = await fetch('https://cassino-game-backend.onrender.com/health');
        const healthData = await healthResponse.json();
        console.log('Health status:', healthResponse.status, healthData);
        
        // Test 2: Room creation
        console.log('\n🎮 Testing room creation...');
        const roomData = {
            player_name: "TestPlayer",
            ip_address: "127.0.0.1"
        };
        
        const roomResponse = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://khasinogaming.com'
            },
            body: JSON.stringify(roomData)
        });
        
        console.log('Room creation status:', roomResponse.status);
        console.log('Response headers:', Object.fromEntries(roomResponse.headers.entries()));
        
        if (roomResponse.ok) {
            const roomResult = await roomResponse.json();
            console.log('✅ Room created successfully:', roomResult);
        } else {
            const errorText = await roomResponse.text();
            console.log('❌ Room creation failed:', errorText);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRoomCreation();