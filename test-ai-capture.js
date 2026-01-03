/**
 * Test AI game capture action
 */

const API_URL = 'https://cassino-game-backend.onrender.com';

async function testAICapture() {
    console.log('=== Testing AI Game Capture ===\n');
    
    // Step 1: Create AI game
    console.log('1. Creating AI game...');
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
    console.log('   Session Token:', createData.session_token?.substring(0, 30) + '...');
    
    const roomId = createData.room_id;
    const playerId = createData.player_id;
    const sessionToken = createData.session_token;
    
    // Step 2: Get game state
    console.log('\n2. Getting game state...');
    const stateResponse = await fetch(`${API_URL}/rooms/${roomId}/state`);
    
    if (!stateResponse.ok) {
        console.error('Failed to get game state:', await stateResponse.text());
        return;
    }
    
    const stateData = await stateResponse.json();
    console.log('   Phase:', stateData.game_state?.phase);
    console.log('   Current Player:', stateData.game_state?.current_player);
    console.log('   Table Cards:', stateData.game_state?.table_cards?.length || 0);
    console.log('   Player Hand:', stateData.game_state?.player1_hand?.length || 0, 'cards');
    
    // Show cards
    if (stateData.game_state?.player1_hand) {
        console.log('   Your hand:', stateData.game_state.player1_hand.map(c => `${c.rank}${c.suit[0]}`).join(', '));
    }
    if (stateData.game_state?.table_cards) {
        console.log('   Table:', stateData.game_state.table_cards.map(c => `${c.rank}${c.suit[0]}`).join(', '));
    }
    
    // Step 3: Try to play a card (trail action - simplest)
    console.log('\n3. Testing trail action...');
    
    const hand = stateData.game_state?.player1_hand || [];
    if (hand.length === 0) {
        console.log('   No cards in hand, cannot test');
        return;
    }
    
    const cardToPlay = hand[0];
    console.log('   Playing card:', cardToPlay.rank, 'of', cardToPlay.suit);
    
    const trailResponse = await fetch(`${API_URL}/game/play-card`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
        },
        body: JSON.stringify({
            room_id: roomId,
            player_id: playerId,
            card_id: cardToPlay.id,
            action: 'trail',
            target_cards: []
        })
    });
    
    console.log('   Response status:', trailResponse.status);
    
    if (!trailResponse.ok) {
        const errorText = await trailResponse.text();
        console.error('   Trail action failed:', errorText);
        
        // Try without Authorization header
        console.log('\n4. Retrying without Authorization header...');
        const retryResponse = await fetch(`${API_URL}/game/play-card`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: roomId,
                player_id: playerId,
                card_id: cardToPlay.id,
                action: 'trail',
                target_cards: []
            })
        });
        
        console.log('   Retry status:', retryResponse.status);
        if (!retryResponse.ok) {
            console.error('   Retry failed:', await retryResponse.text());
        } else {
            const retryData = await retryResponse.json();
            console.log('   Retry success:', retryData.success);
        }
    } else {
        const trailData = await trailResponse.json();
        console.log('   Trail success:', trailData.success);
        console.log('   New phase:', trailData.game_state?.phase);
    }
    
    console.log('\n=== Test Complete ===');
}

testAICapture().catch(console.error);
