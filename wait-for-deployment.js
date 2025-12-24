#!/usr/bin/env node

/**
 * Wait for Render deployment to update and test the fix
 */

const API_BASE = 'https://cassino-game-backend.onrender.com';

async function testPlayerReady() {
    try {
        // Create room
        const createResponse = await fetch(`${API_BASE}/rooms/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                player_name: 'DeployTest'
            })
        });
        
        if (!createResponse.ok) {
            return { success: false, error: 'Create room failed' };
        }
        
        const createData = await createResponse.json();
        
        // Test player ready
        const readyResponse = await fetch(`${API_BASE}/rooms/player-ready`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                room_id: createData.room_id,
                player_id: createData.player_id,
                is_ready: true
            })
        });
        
        if (readyResponse.ok) {
            return { success: true, error: null };
        } else {
            const errorText = await readyResponse.text();
            return { success: false, error: errorText };
        }
        
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function waitForDeployment() {
    console.log('⏳ Waiting for Render deployment to update...');
    console.log('🔄 Testing every 30 seconds...\n');
    
    let attempts = 0;
    const maxAttempts = 10; // 5 minutes max
    
    while (attempts < maxAttempts) {
        attempts++;
        console.log(`🧪 Test attempt ${attempts}/${maxAttempts}...`);
        
        const result = await testPlayerReady();
        
        if (result.success) {
            console.log('🎉 SUCCESS! Deployment updated and player-ready endpoint is working!');
            return true;
        } else {
            console.log(`❌ Still failing: ${result.error.substring(0, 100)}...`);
            
            // Check what type of error we're getting
            if (result.error.includes('greenlet_spawn has not been called')) {
                console.log('   → Old datetime error (deployment not updated yet)');
            } else if (result.error.includes("'coroutine' object has no attribute 'model_dump'")) {
                console.log('   → New coroutine error (deployment updated but different issue)');
            } else {
                console.log('   → Different error');
            }
            
            if (attempts < maxAttempts) {
                console.log(`   ⏳ Waiting 30 seconds before next attempt...\n`);
                await new Promise(resolve => setTimeout(resolve, 30000));
            }
        }
    }
    
    console.log('⏰ Timeout reached. Deployment may be taking longer than expected.');
    return false;
}

// Run the wait loop
waitForDeployment().then(success => {
    if (success) {
        console.log('\n✅ All async/await fixes are working in production!');
    } else {
        console.log('\n⚠️  Deployment is taking longer than expected.');
        console.log('💡 You can check Render dashboard for deployment status.');
    }
    process.exit(success ? 0 : 1);
});