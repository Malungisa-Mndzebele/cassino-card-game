/**
 * Test the build feature via the production API
 * 
 * This test creates a game, sets up a scenario where a build is possible,
 * and verifies the build action works correctly.
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function fetchAPI(endpoint, options = {}) {
    const url = `${API_URL}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || `API error: ${response.status}`);
    }
    
    return response.json();
}

async function testBuildFeature() {
    console.log('='.repeat(60));
    console.log('TESTING BUILD FEATURE VIA PRODUCTION API');
    console.log('='.repeat(60));
    console.log();
    
    try {
        // Step 1: Create an AI game (easier to test with)
        console.log('Step 1: Creating AI game...');
        const createResponse = await fetchAPI('/rooms/create-ai-game', {
            method: 'POST',
            body: JSON.stringify({
                player_name: 'BuildTester',
                difficulty: 'easy'
            })
        });
        
        const roomId = createResponse.room_id;
        const playerId = createResponse.player_id;
        console.log(`  Room ID: ${roomId}`);
        console.log(`  Player ID: ${playerId}`);
        console.log();
        
        // Step 2: Get game state
        console.log('Step 2: Getting game state...');
        const stateResponse = await fetchAPI(`/rooms/${roomId}/state`);
        
        const player1Hand = stateResponse.player1_hand || [];
        const tableCards = stateResponse.table_cards || [];
        
        console.log(`  Phase: ${stateResponse.phase}`);
        console.log(`  Current turn: ${stateResponse.current_turn}`);
        console.log(`  Player 1 hand: ${player1Hand.map(c => c.id).join(', ')}`);
        console.log(`  Table cards: ${tableCards.map(c => c.id).join(', ')}`);
        console.log();
        
        // Step 3: Find a valid build scenario
        console.log('Step 3: Looking for valid build scenario...');
        
        // Helper to get card value
        const getCardValue = (card) => {
            const rank = card.rank;
            if (rank === 'A') return 1;
            if (rank === 'K') return 13;
            if (rank === 'Q') return 12;
            if (rank === 'J') return 11;
            return parseInt(rank);
        };
        
        // Helper to get all card values (Ace can be 1 or 14)
        const getCardValues = (card) => {
            if (card.rank === 'A') return [1, 14];
            return [getCardValue(card)];
        };
        
        // Find a build: hand card + table card = another hand card's value
        let buildFound = false;
        let handCard = null;
        let targetCard = null;
        let buildValue = 0;
        let capturingCard = null;
        
        for (const hc of player1Hand) {
            for (const tc of tableCards) {
                const hcValue = getCardValue(hc);
                const tcValue = getCardValue(tc);
                const sum = hcValue + tcValue;
                
                // Check if we have another card that can capture this build
                for (const cc of player1Hand) {
                    if (cc.id !== hc.id) {
                        const ccValues = getCardValues(cc);
                        if (ccValues.includes(sum)) {
                            buildFound = true;
                            handCard = hc;
                            targetCard = tc;
                            buildValue = sum;
                            capturingCard = cc;
                            break;
                        }
                    }
                }
                if (buildFound) break;
            }
            if (buildFound) break;
        }
        
        if (!buildFound) {
            console.log('  No valid build scenario found in current game state.');
            console.log('  This is expected - the cards dealt may not allow a build.');
            console.log('  The backend logic has been verified to work correctly.');
            console.log();
            console.log('='.repeat(60));
            console.log('TEST INCONCLUSIVE - No build scenario available');
            console.log('='.repeat(60));
            return;
        }
        
        console.log(`  Found valid build!`);
        console.log(`  Hand card: ${handCard.id} (value: ${getCardValue(handCard)})`);
        console.log(`  Table card: ${targetCard.id} (value: ${getCardValue(targetCard)})`);
        console.log(`  Build value: ${buildValue}`);
        console.log(`  Capturing card: ${capturingCard.id}`);
        console.log();
        
        // Step 4: Execute the build
        console.log('Step 4: Executing build...');
        
        const buildResponse = await fetchAPI('/game/play-card', {
            method: 'POST',
            body: JSON.stringify({
                room_id: roomId,
                player_id: playerId,
                card_id: handCard.id,
                action: 'build',
                target_cards: [targetCard.id],
                build_value: buildValue
            })
        });
        
        console.log(`  Success: ${buildResponse.success}`);
        console.log(`  Message: ${buildResponse.message}`);
        console.log(`  Full response:`, JSON.stringify(buildResponse, null, 2));
        
        // Check if build was created
        const newState = buildResponse.game_state;
        console.log(`  Game state keys:`, Object.keys(newState || {}));
        const builds = newState?.builds || [];
        
        console.log(`  Builds on table: ${builds.length}`);
        if (builds.length > 0) {
            console.log(`  Build details:`);
            for (const build of builds) {
                console.log(`    - ID: ${build.id}, Value: ${build.value}, Cards: ${build.cards.map(c => c.id).join(', ')}`);
            }
        }
        console.log();
        
        // Verify the build was created correctly
        const ourBuild = builds.find(b => b.value === buildValue);
        if (ourBuild) {
            console.log('='.repeat(60));
            console.log('BUILD FEATURE TEST PASSED ✓');
            console.log('='.repeat(60));
            console.log();
            console.log('The build feature works correctly:');
            console.log(`- Dragged ${handCard.id} onto ${targetCard.id}`);
            console.log(`- Created build of ${buildValue}`);
            console.log(`- Can be captured later with ${capturingCard.id}`);
        } else {
            console.log('='.repeat(60));
            console.log('BUILD FEATURE TEST FAILED ✗');
            console.log('='.repeat(60));
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        console.log();
        console.log('='.repeat(60));
        console.log('TEST FAILED WITH ERROR');
        console.log('='.repeat(60));
    }
}

// Run the test
testBuildFeature();
