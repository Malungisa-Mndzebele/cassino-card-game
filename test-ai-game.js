// Test AI Game Mode
const API_URL = 'https://cassino-game-backend.onrender.com';

async function checkVersion() {
    try {
        const response = await fetch(`${API_URL}/`);
        const data = await response.json();
        return data.version;
    } catch (error) {
        return 'unknown';
    }
}

async function testAIGame() {
    console.log('🤖 Testing AI Game Mode...\n');
    
    // First check if the new version is deployed
    const version = await checkVersion();
    console.log(`Current API version: ${version}`);
    
    if (version !== '1.1.0') {
        console.log('\n⚠️  AI Game feature not yet deployed (requires version 1.1.0)');
        console.log('   The code is ready in git, but Render needs to deploy it.');
        console.log('   To deploy manually:');
        console.log('   1. Go to https://dashboard.render.com');
        console.log('   2. Find cassino-game-backend service');
        console.log('   3. Click "Manual Deploy" → "Deploy latest commit"');
        console.log('\n   Skipping AI game tests for now...\n');
        
        // Test regular multiplayer instead
        console.log('📋 Testing regular multiplayer flow instead...\n');
        await testMultiplayer();
        return;
    }
    
    // Test 1: Create AI game with medium difficulty
    console.log('1. Creating AI game (medium difficulty)...');
    try {
        const createResponse = await fetch(`${API_URL}/rooms/create-ai-game`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'TestPlayer',
                difficulty: 'medium'
            })
        });
        
        if (!createResponse.ok) {
            const error = await createResponse.text();
            console.log('❌ Failed to create AI game:', error);
            return;
        }
        
        const createData = await createResponse.json();
        console.log('✅ AI game created!');
        console.log('   Room ID:', createData.room_id);
        console.log('   Player ID:', createData.player_id);
        console.log('   Session Token:', createData.session_token?.substring(0, 30) + '...');
        
        const roomId = createData.room_id;
        const playerId = createData.player_id;
        
        // Check game state
        console.log('\n2. Checking game state...');
        const stateResponse = await fetch(`${API_URL}/rooms/${roomId}/state`);
        const stateData = await stateResponse.json();
        
        console.log('   Phase:', stateData.phase);
        console.log('   Players:', stateData.players?.length);
        console.log('   Is AI Game:', stateData.is_ai_game);
        console.log('   AI Difficulty:', stateData.ai_difficulty);
        
        if (stateData.players?.length === 2) {
            console.log('   Player 1:', stateData.players[0]?.name);
            console.log('   Player 2:', stateData.players[1]?.name);
        }
        
        // Test 3: Set player ready
        console.log('\n3. Setting player ready...');
        const readyResponse = await fetch(`${API_URL}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: roomId,
                player_id: playerId,
                is_ready: true
            })
        });
        
        if (!readyResponse.ok) {
            const error = await readyResponse.text();
            console.log('❌ Failed to set ready:', error);
            return;
        }
        
        const readyData = await readyResponse.json();
        console.log('✅ Player ready set!');
        console.log('   Player1 Ready:', readyData.game_state?.player1_ready);
        console.log('   Player2 Ready:', readyData.game_state?.player2_ready);
        console.log('   Phase:', readyData.game_state?.phase);
        
        console.log('\n✅ AI Game test completed successfully!');
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

async function testMultiplayer() {
    console.log('1. Health check...');
    try {
        const healthResponse = await fetch(`${API_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('   ✅ Status:', healthData.status);
        console.log('   Database:', healthData.database);
        console.log('   Redis:', healthData.redis);
    } catch (error) {
        console.log('   ❌ Health check failed:', error.message);
        return;
    }
    
    console.log('\n2. Creating room...');
    try {
        const createResponse = await fetch(`${API_URL}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_name: 'TestPlayer1' })
        });
        const createData = await createResponse.json();
        console.log('   ✅ Room created:', createData.room_id);
        console.log('   Player ID:', createData.player_id);
        
        const roomId = createData.room_id;
        
        console.log('\n3. Joining room...');
        const joinResponse = await fetch(`${API_URL}/rooms/join`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_id: roomId, player_name: 'TestPlayer2' })
        });
        const joinData = await joinResponse.json();
        console.log('   ✅ Player 2 joined');
        console.log('   Player ID:', joinData.player_id);
        
        console.log('\n✅ Multiplayer flow working correctly!');
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
}

// Run tests
testAIGame();
