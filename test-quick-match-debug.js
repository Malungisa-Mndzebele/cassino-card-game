#!/usr/bin/env node

/**
 * Debug quick match functionality
 */

const API_BASE = 'https://cassino-game-backend.onrender.com';

async function debugQuickMatch() {
    console.log('🔍 QUICK MATCH DEBUG');
    console.log('====================\n');
    
    try {
        // 1. Check waiting rooms before any action
        console.log('1️⃣ Checking waiting rooms (before)...');
        let waitingResponse = await fetch(`${API_BASE}/debug/waiting-rooms`);
        if (waitingResponse.ok) {
            const waitingData = await waitingResponse.json();
            console.log(`   Total waiting rooms: ${waitingData.total_waiting_rooms}`);
            console.log(`   Rooms with space: ${waitingData.rooms_with_space}`);
            console.log(`   Rooms:`, JSON.stringify(waitingData.rooms, null, 2));
        } else {
            console.log(`   Debug endpoint not available yet (${waitingResponse.status})`);
        }
        
        // 2. Player A does quick match
        console.log('\n2️⃣ Player A quick match...');
        const quickMatchA = await fetch(`${API_BASE}/rooms/join-random`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'QuickA_' + Date.now()
            })
        });
        
        const dataA = await quickMatchA.json();
        const roomA = dataA.game_state?.room_id;
        console.log(`   Room: ${roomA}`);
        console.log(`   Players: ${dataA.game_state?.players?.length}`);
        
        // 3. Check waiting rooms after Player A
        console.log('\n3️⃣ Checking waiting rooms (after Player A)...');
        waitingResponse = await fetch(`${API_BASE}/debug/waiting-rooms`);
        if (waitingResponse.ok) {
            const waitingData = await waitingResponse.json();
            console.log(`   Total waiting rooms: ${waitingData.total_waiting_rooms}`);
            console.log(`   Rooms with space: ${waitingData.rooms_with_space}`);
            
            // Check if Player A's room is in the list
            const playerARoom = waitingData.rooms.find(r => r.room_id === roomA);
            if (playerARoom) {
                console.log(`   ✅ Player A's room (${roomA}) is in waiting list`);
                console.log(`      Players: ${playerARoom.player_count}`);
            } else {
                console.log(`   ❌ Player A's room (${roomA}) NOT in waiting list!`);
            }
        }
        
        // 4. Wait a moment for database to sync
        console.log('\n4️⃣ Waiting 2 seconds for database sync...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 5. Check waiting rooms again
        console.log('\n5️⃣ Checking waiting rooms (after wait)...');
        waitingResponse = await fetch(`${API_BASE}/debug/waiting-rooms`);
        if (waitingResponse.ok) {
            const waitingData = await waitingResponse.json();
            console.log(`   Total waiting rooms: ${waitingData.total_waiting_rooms}`);
            console.log(`   Rooms with space: ${waitingData.rooms_with_space}`);
        }
        
        // 6. Player B does quick match
        console.log('\n6️⃣ Player B quick match...');
        const quickMatchB = await fetch(`${API_BASE}/rooms/join-random`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'QuickB_' + Date.now()
            })
        });
        
        const dataB = await quickMatchB.json();
        const roomB = dataB.game_state?.room_id;
        console.log(`   Room: ${roomB}`);
        console.log(`   Players: ${dataB.game_state?.players?.length}`);
        
        // 7. Check if matched
        console.log('\n📊 RESULT');
        console.log('=========');
        if (roomA === roomB) {
            console.log(`✅ MATCHED! Both players in room ${roomA}`);
        } else {
            console.log(`❌ NOT MATCHED!`);
            console.log(`   Player A: ${roomA}`);
            console.log(`   Player B: ${roomB}`);
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

debugQuickMatch();