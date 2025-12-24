#!/usr/bin/env node

/**
 * Test to check if the latest deployment is actually running
 */

const API_BASE = 'https://cassino-game-backend.onrender.com';

async function testDeploymentVersion() {
    console.log('🔍 DEPLOYMENT VERSION CHECK');
    console.log('===========================');
    
    try {
        // Test a simple endpoint that should work
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const health = await healthResponse.json();
        console.log(`✅ Health: ${health.status}`);
        
        // Test create room (this should work)
        console.log('2️⃣ Testing create room...');
        const createResponse = await fetch(`${API_BASE}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'VersionTest'
            })
        });
        
        if (createResponse.ok) {
            const createData = await createResponse.json();
            console.log(`✅ Create room works: ${createData.room_id}`);
            
            // Now test the problematic endpoint
            console.log('3️⃣ Testing player-ready (the failing endpoint)...');
            const readyResponse = await fetch(`${API_BASE}/rooms/player-ready`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    room_id: createData.room_id,
                    player_id: createData.player_id,
                    is_ready: true
                })
            });
            
            console.log(`Player ready status: ${readyResponse.status}`);
            
            if (readyResponse.ok) {
                console.log('🎉 FIXED! Player ready endpoint is working!');
                return true;
            } else {
                const errorText = await readyResponse.text();
                console.log(`❌ Still failing: ${errorText}`);
                
                // Check if it's still the same error
                if (errorText.includes("'coroutine' object has no attribute 'model_dump'")) {
                    console.log('🔄 Same error - deployment may not have updated yet');
                } else if (errorText.includes("greenlet_spawn has not been called")) {
                    console.log('🔄 Old datetime error - deployment definitely not updated');
                } else {
                    console.log('🆕 New error - deployment updated but different issue');
                }
                return false;
            }
        } else {
            console.log(`❌ Create room failed: ${createResponse.status}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Test failed: ${error.message}`);
        return false;
    }
}

// Run the test
testDeploymentVersion().then(success => {
    if (success) {
        console.log('\n✅ Deployment is working correctly!');
    } else {
        console.log('\n⏳ Deployment may still be updating...');
        console.log('💡 Render deployments can take 2-3 minutes to fully update');
    }
    process.exit(success ? 0 : 1);
});