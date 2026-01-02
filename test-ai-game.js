// Test AI Game Mode
const API_URL = 'https://cassino-game-backend.onrender.com';

async function testAIGame() {
    console.log('🤖 Testing AI Game Mode...\n');
    
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
        
        // If both ready, start the game
        if (readyData.game_state?.player1_ready && readyData.game_state?.player2_ready) {
            console.log('\n4. Starting game...');
            const startResponse = await fetch(`${API_URL}/game/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: roomId,
                    player_id: playerId
                })
            });
            
            if (!startResponse.ok) {
                const error = await startResponse.text();
                console.log('❌ Failed to start game:', error);
                return;
            }
            
            const startData = await startResponse.json();
            console.log('✅ Game started!');
            console.log('   Phase:', startData.game_state?.phase);
            console.log('   Current Turn:', startData.game_state?.current_turn);
            console.log('   Player 1 Hand:', startData.game_state?.player1_hand?.length, 'cards');
            console.log('   Player 2 Hand:', startData.game_state?.player2_hand?.length, 'cards');
            console.log('   Table Cards:', startData.game_state?.table_cards?.length, 'cards');
            
            // Show player's hand
            if (startData.game_state?.player1_hand) {
                console.log('\n   Your hand:');
                startData.game_state.player1_hand.forEach(card => {
                    console.log(`     - ${card.rank} of ${card.suit}`);
                });
            }
            
            // Show table cards
            if (startData.game_state?.table_cards) {
                console.log('\n   Table cards:');
                startData.game_state.table_cards.forEach(card => {
                    console.log(`     - ${card.rank} of ${card.suit}`);
                });
            }
        }
        
        console.log('\n✅ AI Game test completed successfully!');
        console.log('   The game is ready to play at:', `${API_URL}/rooms/${roomId}`);
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

// Test different difficulties
async function testAllDifficulties() {
    console.log('🎮 Testing all AI difficulties...\n');
    
    for (const difficulty of ['easy', 'medium', 'hard']) {
        console.log(`\n--- Testing ${difficulty.toUpperCase()} difficulty ---`);
        
        try {
            const response = await fetch(`${API_URL}/rooms/create-ai-game`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    player_name: `Player_${difficulty}`,
                    difficulty: difficulty
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log(`✅ ${difficulty}: Room ${data.room_id} created`);
            } else {
                const error = await response.text();
                console.log(`❌ ${difficulty}: Failed - ${error}`);
            }
        } catch (error) {
            console.log(`❌ ${difficulty}: Error - ${error.message}`);
        }
    }
}

// Run tests
testAIGame();
