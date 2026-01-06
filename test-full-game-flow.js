// Comprehensive test for full game flow
const API_URL = 'http://localhost:8000';

async function fetchJson(url, options = {}) {
    const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    const text = await res.text();
    try {
        return { ok: res.ok, status: res.status, data: JSON.parse(text) };
    } catch {
        return { ok: res.ok, status: res.status, data: text };
    }
}

async function testFullGameFlow() {
    console.log('🎮 FULL GAME FLOW TEST\n');
    console.log('='.repeat(60));
    
    // Step 1: Create room
    console.log('\n📦 Step 1: Create Room');
    const createRes = await fetchJson(`${API_URL}/rooms/create`, {
        method: 'POST',
        body: JSON.stringify({ player_name: 'Alice' })
    });
    
    if (!createRes.ok) {
        console.log(`   ❌ Failed: ${createRes.status} - ${JSON.stringify(createRes.data)}`);
        return;
    }
    
    const roomId = createRes.data.room_id;
    const player1Id = createRes.data.player_id;
    console.log(`   ✅ Room created: ${roomId}`);
    console.log(`   ✅ Player1 ID: ${player1Id}`);
    
    // Step 2: Join room
    console.log('\n👥 Step 2: Join Room');
    const joinRes = await fetchJson(`${API_URL}/rooms/join`, {
        method: 'POST',
        body: JSON.stringify({ room_id: roomId, player_name: 'Bob' })
    });
    
    if (!joinRes.ok) {
        console.log(`   ❌ Failed: ${joinRes.status} - ${JSON.stringify(joinRes.data)}`);
        return;
    }
    
    const player2Id = joinRes.data.player_id;
    console.log(`   ✅ Player2 joined: ${player2Id}`);
    
    // Step 3: Both players ready
    console.log('\n✋ Step 3: Set Players Ready');
    
    const ready1Res = await fetchJson(`${API_URL}/rooms/player-ready`, {
        method: 'POST',
        body: JSON.stringify({ room_id: roomId, player_id: player1Id, is_ready: true })
    });
    console.log(`   Player1 ready: ${ready1Res.ok ? '✅' : '❌'} ${!ready1Res.ok ? JSON.stringify(ready1Res.data) : ''}`);
    
    const ready2Res = await fetchJson(`${API_URL}/rooms/player-ready`, {
        method: 'POST',
        body: JSON.stringify({ room_id: roomId, player_id: player2Id, is_ready: true })
    });
    console.log(`   Player2 ready: ${ready2Res.ok ? '✅' : '❌'} ${!ready2Res.ok ? JSON.stringify(ready2Res.data) : ''}`);
    
    // Step 4: Start shuffle
    console.log('\n🔀 Step 4: Start Shuffle');
    const shuffleRes = await fetchJson(`${API_URL}/game/start-shuffle`, {
        method: 'POST',
        body: JSON.stringify({ room_id: roomId, player_id: player1Id })
    });
    
    if (!shuffleRes.ok) {
        console.log(`   ❌ Failed: ${shuffleRes.status} - ${JSON.stringify(shuffleRes.data)}`);
        return;
    }
    console.log(`   ✅ Shuffle complete`);
    console.log(`   - Phase: ${shuffleRes.data.game_state?.phase}`);
    console.log(`   - Deck size: ${shuffleRes.data.game_state?.deck?.length}`);
    
    // Step 5: Select face-up cards (deal)
    console.log('\n🃏 Step 5: Select Face-Up Cards (Deal)');
    const deck = shuffleRes.data.game_state?.deck || [];
    if (deck.length < 4) {
        console.log(`   ❌ Not enough cards in deck: ${deck.length}`);
        return;
    }
    
    const faceUpCardIds = deck.slice(0, 4).map(c => c.id);
    console.log(`   - Selected cards: ${faceUpCardIds.join(', ')}`);
    
    const selectRes = await fetchJson(`${API_URL}/game/select-face-up-cards`, {
        method: 'POST',
        body: JSON.stringify({ 
            room_id: roomId, 
            player_id: player1Id,
            card_ids: faceUpCardIds
        })
    });
    
    if (!selectRes.ok) {
        console.log(`   ❌ Failed: ${selectRes.status} - ${JSON.stringify(selectRes.data)}`);
        return;
    }
    
    const gameState = selectRes.data.game_state;
    console.log(`   ✅ Cards dealt`);
    console.log(`   - Phase: ${gameState?.phase}`);
    console.log(`   - Current turn: Player ${gameState?.current_turn}`);
    console.log(`   - Player1 hand: ${gameState?.player1_hand?.length} cards`);
    console.log(`   - Player2 hand: ${gameState?.player2_hand?.length} cards`);
    console.log(`   - Table cards: ${gameState?.table_cards?.length} cards`);
    
    // Step 6: Play cards (trail actions)
    console.log('\n🎯 Step 6: Play Cards');
    
    let currentState = gameState;
    let turnCount = 0;
    const maxTurns = 8; // 4 cards per player
    
    while (turnCount < maxTurns && currentState?.player1_hand?.length > 0) {
        const currentPlayer = currentState.current_turn;
        const playerId = currentPlayer === 1 ? player1Id : player2Id;
        const hand = currentPlayer === 1 ? currentState.player1_hand : currentState.player2_hand;
        
        if (!hand || hand.length === 0) {
            console.log(`   ⚠️ Player ${currentPlayer} has no cards`);
            break;
        }
        
        const cardToPlay = hand[0];
        console.log(`   Turn ${turnCount + 1}: Player ${currentPlayer} plays ${cardToPlay.rank} of ${cardToPlay.suit}`);
        
        const playRes = await fetchJson(`${API_URL}/game/play-card`, {
            method: 'POST',
            body: JSON.stringify({
                room_id: roomId,
                player_id: playerId,
                card_id: cardToPlay.id,
                action: 'trail'
            })
        });
        
        if (!playRes.ok) {
            console.log(`      ❌ Failed: ${playRes.status} - ${JSON.stringify(playRes.data)}`);
            break;
        }
        
        currentState = playRes.data.game_state;
        console.log(`      ✅ Success - Table now has ${currentState?.table_cards?.length} cards`);
        turnCount++;
    }
    
    // Step 7: Check final state
    console.log('\n📊 Step 7: Final State');
    const finalStateRes = await fetchJson(`${API_URL}/rooms/${roomId}/state`);
    
    if (finalStateRes.ok) {
        const final = finalStateRes.data;
        console.log(`   - Phase: ${final.phase}`);
        console.log(`   - Player1 hand: ${final.player1_hand?.length} cards`);
        console.log(`   - Player2 hand: ${final.player2_hand?.length} cards`);
        console.log(`   - Table cards: ${final.table_cards?.length} cards`);
        console.log(`   - Player1 captured: ${final.player1_captured?.length} cards`);
        console.log(`   - Player2 captured: ${final.player2_captured?.length} cards`);
        console.log(`   - Player1 score: ${final.player1_score}`);
        console.log(`   - Player2 score: ${final.player2_score}`);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ FULL GAME FLOW TEST COMPLETED!');
    console.log('='.repeat(60));
}

testFullGameFlow().catch(err => {
    console.error('❌ Test failed:', err.message);
    console.error(err.stack);
    process.exit(1);
});
