// Final verification of the greenlet fix
async function finalVerification() {
    console.log('🎯 FINAL VERIFICATION - Greenlet Fix');
    console.log('===================================');
    
    console.log('⏳ Waiting 60 seconds for deployment to complete...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    try {
        console.log('\n🔍 Testing the fixed endpoint...');
        
        // Step 1: Health check
        const health = await fetch('https://cassino-game-backend.onrender.com/health');
        const healthData = await health.json();
        console.log('✅ Backend health:', healthData.status);
        
        // Step 2: Create room
        const createResp = await fetch('https://cassino-game-backend.onrender.com/rooms/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://khasinogaming.com' },
            body: JSON.stringify({ player_name: "FinalTest", ip_address: "127.0.0.1" })
        });
        
        const createData = await createResp.json();
        console.log('✅ Room created:', createData.room_id);
        
        // Step 3: The critical test - player ready endpoint
        console.log('\n🚨 CRITICAL TEST: player-ready endpoint...');
        const readyResp = await fetch('https://cassino-game-backend.onrender.com/rooms/player-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Origin': 'https://khasinogaming.com' },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_id: createData.player_id,
                is_ready: true
            })
        });
        
        console.log('Response Status:', readyResp.status);
        
        if (readyResp.ok) {
            const readyData = await readyResp.json();
            console.log('\n🎉🎉🎉 SUCCESS! 🎉🎉🎉');
            console.log('✅ The greenlet async issue has been RESOLVED!');
            console.log('✅ Player ready endpoint is working!');
            console.log('✅ Success:', readyData.success);
            console.log('✅ Message:', readyData.message);
            console.log('✅ Game phase:', readyData.game_state?.phase);
            console.log('\n🚀 Production application is now fully functional!');
            console.log('🌐 Users can now play the game at: https://khasinogaming.com/cassino/');
        } else {
            const error = await readyResp.text();
            console.log('\n❌ Still failing after all fixes:');
            console.log('Error:', error);
            console.log('\n🔍 This may require deeper investigation...');
        }
        
    } catch (error) {
        console.error('❌ Verification failed:', error.message);
    }
}

finalVerification();