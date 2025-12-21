// Manual Production Test Script
// Tests the live deployment manually

const { chromium } = require('playwright');

async function testProductionDeployment() {
    console.log('🎮 Testing Live Casino Card Game Deployment');
    console.log('==========================================');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        // Test 1: Load production site
        console.log('\n📄 Test 1: Loading production site...');
        await page.goto('https://khasinogaming.com/cassino/', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });
        console.log('✅ Production site loaded');
        
        // Test 2: Check backend health
        console.log('\n🏥 Test 2: Checking backend health...');
        const healthResponse = await page.evaluate(async () => {
            try {
                const response = await fetch('https://cassino-game-backend.onrender.com/health');
                return await response.json();
            } catch (error) {
                return { error: error.message };
            }
        });
        console.log('Backend health:', JSON.stringify(healthResponse, null, 2));
        
        // Test 3: Check UI elements
        console.log('\n🎯 Test 3: Checking UI elements...');
        const elements = await page.evaluate(() => {
            return {
                title: document.title,
                hasCreateButton: !!document.querySelector('[data-testid="create-room-test"]'),
                hasJoinButton: !!document.querySelector('[data-testid="join-room-test"]'),
                hasPlayerNameInput: !!document.querySelector('[data-testid="player-name-input-create-test"]'),
                bodyText: document.body.innerText.substring(0, 200)
            };
        });
        console.log('UI Elements:', JSON.stringify(elements, null, 2));
        
        // Test 4: Try to create a room
        console.log('\n🎮 Test 4: Testing room creation...');
        
        // Fill player name
        const nameInput = page.locator('[data-testid="player-name-input-create-test"]');
        if (await nameInput.isVisible()) {
            await nameInput.fill('TestPlayer');
            console.log('✅ Player name filled');
        } else {
            console.log('❌ Player name input not found');
        }
        
        // Click create room button
        const createButton = page.locator('[data-testid="create-room-test"]');
        if (await createButton.isVisible()) {
            const isEnabled = await createButton.isEnabled();
            console.log(`Create button enabled: ${isEnabled}`);
            
            if (isEnabled) {
                await createButton.click();
                console.log('✅ Create room button clicked');
                
                // Wait for response
                await page.waitForTimeout(5000);
                
                // Check for room creation result
                const roomResult = await page.evaluate(() => {
                    return {
                        url: window.location.href,
                        hasRoomCode: !!document.querySelector('[data-testid="room-code"]'),
                        hasWaitingText: document.body.innerText.includes('Waiting'),
                        bodyText: document.body.innerText.substring(0, 300)
                    };
                });
                console.log('Room creation result:', JSON.stringify(roomResult, null, 2));
            } else {
                console.log('❌ Create button is disabled');
            }
        } else {
            console.log('❌ Create room button not found');
        }
        
        // Test 5: Check network requests
        console.log('\n🌐 Test 5: Monitoring network requests...');
        page.on('response', response => {
            if (response.url().includes('cassino-game-backend')) {
                console.log(`API Response: ${response.status()} ${response.url()}`);
            }
        });
        
        // Wait a bit more to see any network activity
        await page.waitForTimeout(3000);
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    } finally {
        console.log('\n🏁 Test completed. Browser will stay open for manual inspection.');
        console.log('Press Ctrl+C to close when done.');
        
        // Keep browser open for manual inspection
        await new Promise(() => {}); // Keep running
    }
}

testProductionDeployment().catch(console.error);