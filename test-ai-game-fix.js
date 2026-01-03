/**
 * Test AI game fix - verify cards are dealt on creation
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function testAIGameFix() {
    console.log('=== Testing AI Game Fix ===\n');
    console.log('API URL:', API_URL);
    
    // Step 1: Create AI game
    console.log('\n1. Creating AI game...');
    const createResponse = await fetch(`${API_URL}/rooms/create-ai-game`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            player_name: 'TestPlayer',
            difficulty: 'easy'
        })
    });
    
    if (!createResponse.ok) {
        const error = await createResponse.text();
        console.error('Failed to create AI game:', error);
        return;
    }
    
    const createData = await createResponse.json();
    console.log('   Room ID:', createData.room_id);
    console.log('   Player ID:', createData.player_id);
    
    // Check game state from creation response
    const gameState = createData.game_state;
    console.log('\n2. Checking game state from creation response...');
    console.log('   Phase:', gameState?.phase);
    console.log('   Round:', gameState?.round);
    console.log('   Current Turn:', gameState?.current_turn);
    console.log('   Game Started:', gameState?.game_started);
    console.log('   Dealing Complete:', gameState?.dealing_complete);
    console.log('   Player 1 Hand:', gameState?.player1_hand?.length || 0, 'cards');
    console.log('   Player 2 Hand:', gameState?.player2_hand?.length || 0, 'cards');
    console.log('   Table Cards:', gameState?.table_cards?.length || 0, 'cards');
    
    // Show cards
    if (gameState?.player1_hand?.length > 0) {
        console.log('\n   Your hand:', gameState.player1_hand.map(c => `${c.rank}${c.suit[0]}`).join(', '));
    }
    if (gameState?.table_cards?.length > 0) {
        console.log('   Table:', gameState.table_cards.map(c => `${c.rank}${c.suit[0]}`).join(', '));
    }
    
    // Verify fix
    console.log('\n3. Verification:');
    const isFixed = gameState?.phase === 'round1' && 
                    gameState?.player1_hand?.length > 0 &&
                    gameState?.table_cards?.length === 4;
    
    if (isFixed) {
        console.log('   ✅ FIX VERIFIED: AI game now starts with cards dealt!');
        console.log('   Phase:', gameState.phase);
        console.log('   Cards in hand:', gameState.player1_hand.length);
        console.log('   Cards on table:', gameState.table_cards.length);
        
        // Try a trail action
        console.log('\n4. Testing trail action...');
        const cardToPlay = gameState.player1_hand[0];
        console.log('   Playing card:', cardToPlay.rank, 'of', cardToPlay.suit);
        
        const trailResponse = await fetch(`${API_URL}/game/play-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_id: createData.player_id,
                card_id: cardToPlay.id,
                action: 'trail',
                target_cards: []
            })
        });
        
        if (trailResponse.ok) {
            const trailData = await trailResponse.json();
            console.log('   ✅ Trail action successful!');
            console.log('   New phase:', trailData.game_state?.phase);
            console.log('   Current turn:', trailData.game_state?.current_turn);
            console.log('   Table cards:', trailData.game_state?.table_cards?.length);
        } else {
            console.log('   ❌ Trail action failed:', await trailResponse.text());
        }
    } else {
        console.log('   ❌ FIX NOT YET DEPLOYED');
        console.log('   Expected: phase=round1, 4 cards in hand, 4 cards on table');
        console.log('   Got: phase=' + gameState?.phase + ', ' + 
                    (gameState?.player1_hand?.length || 0) + ' cards in hand, ' +
                    (gameState?.table_cards?.length || 0) + ' cards on table');
    }
    
    console.log('\n=== Test Complete ===');
}

testAIGameFix().catch(console.error);
