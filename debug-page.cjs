
const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    try {
        console.log('Navigating to https://khasinogaming.com/cassino/');
        await page.goto('https://khasinogaming.com/cassino/', { timeout: 30000 });

        // Wait for a bit for hydration
        await page.waitForTimeout(5000);

        const title = await page.title();
        console.log(`Page Title: ${title}`);

        // Check for the input
        const input = page.locator('[data-testid="player-name-input-create-test"]');
        const inputCount = await input.count();
        console.log(`Found ${inputCount} inputs with testid="player-name-input-create-test"`);

        if (inputCount > 0) {
            console.log('Attempting to fill input...');
            await input.fill('DebugPlayer');

            console.log('Clicking create button...');
            await page.locator('[data-testid="create-room-test"]').click();

            console.log('Waiting for room code...');
            // Wait a long time
            await page.waitForTimeout(10000);

            const content = await page.content();
            const index = content.indexOf('Share this room code');
            if (index !== -1) {
                console.log('HTML around Room Code:');
                console.log(content.substring(index, index + 1000));
            } else {
                console.log('Could not find "Share this room code" in content');
                console.log('Content snippet:', content.substring(0, 500));
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
