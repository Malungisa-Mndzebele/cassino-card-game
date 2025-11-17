// Demo: Two players playing Casino Card Game
const http = require('http');

console.log('🎮 Casino Card Game - Two Player Demo\n');
console.log('═══════════════════════════════════════════════════\n');

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 8000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(responseData));
        } catch (e) {
          resolve(responseData);
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function playGame() {
  try {
    // Step 1: Player 1 creates a room
    console.log('👤 Player 1: Creating room...');
    const createResponse = await makeRequest('POST', '/rooms/create', {
      player_name: 'Alice'
    });
    
    const roomId = createResponse.room_id;
    const player1Id = createResponse.player_id;
    
    console.log(`   ✅ Room created: ${roomId}`);
    console.log(`   🎫 Player 1 ID: ${player1Id}\n`);
    
    // Step 2: Player 2 joins the room
    console.log('👤 Player 2: Joining room...');
    const joinResponse = await makeRequest('POST', '/rooms/join', {
      room_id: roomId,
      player_name: 'Bob'
    });
    
    const player2Id = joinResponse.player_id;
    console.log(`   ✅ Joined room: ${roomId}`);
    console.log(`   🎫 Player 2 ID: ${player2Id}\n`);
    
    // Step 3: Get initial game state
    console.log('📊 Getting game state...');
    const gameState = await makeRequest('GET', `/rooms/${roomId}`);
    console.log(`   Phase: ${gameState.game_phase || 'N/A'}`);
    console.log(`   Status: ${gameState.status || 'N/A'}`);
    if (gameState.players) {
      console.log(`   Players: ${gameState.players.length}/2\n`);
    } else {
      console.log(`   Players: 2/2\n`);
    }
    
    // Step 4: Both players mark ready
    console.log('✋ Player 1: Marking ready...');
    await makeRequest('POST', `/rooms/${roomId}/ready`, {
      player_id: player1Id,
      ready: true
    });
    console.log('   ✅ Player 1 is ready\n');
    
    console.log('✋ Player 2: Marking ready...');
    await makeRequest('POST', `/rooms/${roomId}/ready`, {
      player_id: player2Id,
      ready: true
    });
    console.log('   ✅ Player 2 is ready\n');
    
    // Step 5: Check if game started
    await new Promise(resolve => setTimeout(resolve, 500));
    const updatedState = await makeRequest('GET', `/rooms/${roomId}`);
    console.log('🎲 Game Status After Ready:');
    console.log(`   Phase: ${updatedState.game_phase}`);
    console.log(`   Game Started: ${updatedState.game_started}`);
    console.log(`   Player 1 Ready: ${updatedState.player1_ready}`);
    console.log(`   Player 2 Ready: ${updatedState.player2_ready}\n`);
    
    // Step 6: Dealer shuffles (if in dealer phase)
    if (updatedState.game_phase === 'dealer') {
      console.log('🃏 Dealer: Shuffling deck...');
      await makeRequest('POST', `/game/${roomId}/shuffle`, {
        player_id: player1Id
      });
      console.log('   ✅ Deck shuffled\n');
      
      await new Promise(resolve => setTimeout(resolve, 500));
      const afterShuffle = await makeRequest('GET', `/rooms/${roomId}`);
      console.log(`   Phase after shuffle: ${afterShuffle.game_phase}\n`);
    }
    
    // Step 7: Show game information
    const finalState = await makeRequest('GET', `/rooms/${roomId}`);
    console.log('═══════════════════════════════════════════════════');
    console.log('📋 Final Game State:');
    console.log(`   Room ID: ${roomId}`);
    console.log(`   Phase: ${finalState.game_phase}`);
    console.log(`   Round: ${finalState.round_number}`);
    console.log(`   Current Turn: Player ${finalState.current_turn}`);
    console.log(`   Player 1 (Alice) Score: ${finalState.player1_score}`);
    console.log(`   Player 2 (Bob) Score: ${finalState.player2_score}`);
    
    if (finalState.player1_hand) {
      console.log(`   Player 1 Hand: ${finalState.player1_hand.length} cards`);
    }
    if (finalState.player2_hand) {
      console.log(`   Player 2 Hand: ${finalState.player2_hand.length} cards`);
    }
    if (finalState.table_cards) {
      console.log(`   Table Cards: ${finalState.table_cards.length} cards`);
    }
    
    console.log('═══════════════════════════════════════════════════\n');
    
    console.log('🎉 Demo Complete!');
    console.log('\n💡 The game is now ready for players to make moves.');
    console.log('   Players can capture, build, or trail cards.');
    console.log('   Open http://localhost:5173/cassino/ to play visually!\n');
    console.log(`   Room Code: ${roomId}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

playGame();
