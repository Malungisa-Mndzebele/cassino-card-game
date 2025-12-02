import { test, expect, Page } from '@playwright/test';

test.describe('Bug Fixes - Two Player Game State Sync', () => {
    let player1Page: Page;
    let player2Page: Page;
    let roomCode: string;

    test.beforeEach(async ({ browser }) => {
        // Create two separate browser contexts for two players
        const context1 = await browser.newContext();
        const context2 = await browser.newContext();
        
        player1Page = await context1.newPage();
        player2Page = await context2.newPage();
    });

    test.afterEach(async () => {
        await player1Page.close();
        await player2Page.close();
    });

    test('BUG #1: Player 1 sees Player 2 join in real-time', async () => {
        // Player 1 creates room
        await player1Page.goto('http://localhost:5173');
        await player1Page.fill('[data-testid="player-name-input-create-test"]', 'Player1');
        await player1Page.click('[data-testid="create-room-test"]');

        // Wait for room creation and get room code
        await player1Page.waitForSelector('text=Waiting for Opponent', { timeout: 10000 });
        const roomCodeElement = await player1Page.locator('.text-5xl.font-bold.tracking-widest').first();
        roomCode = await roomCodeElement.textContent() || '';
        expect(roomCode).toHaveLength(6);

        console.log(`Room created: ${roomCode}`);

        // Verify Player 1 sees waiting screen
        await expect(player1Page.locator('text=Waiting for Opponent')).toBeVisible();

        // Player 2 joins the room
        await player2Page.goto('http://localhost:5173');
        await player2Page.fill('[data-testid="player-name-input-join"]', 'Player2');
        await player2Page.fill('[data-testid="room-code-input"]', roomCode);
        await player2Page.click('[data-testid="join-room-test"]');

        // Wait for Player 2 to see ready screen
        await player2Page.waitForSelector('text=Get Ready!', { timeout: 10000 });
        await expect(player2Page.locator('text=Get Ready!')).toBeVisible();

        console.log('Player 2 joined successfully');

        // BUG FIX VERIFICATION: Player 1 should now see "Get Ready!" screen
        await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });
        await expect(player1Page.locator('text=Get Ready!')).toBeVisible();

        console.log('Player 1 sees Get Ready screen - BUG #1 FIXED ✓');

        // Verify both players are visible on both screens
        await expect(player1Page.locator('text=Player1')).toBeVisible();
        await expect(player1Page.locator('text=Player2')).toBeVisible();
        await expect(player2Page.locator('text=Player1')).toBeVisible();
        await expect(player2Page.locator('text=Player2')).toBeVisible();

        console.log('Both players visible on both screens ✓');
    });

    test('BUG #2: Session persists after page refresh (F5)', async () => {
        // Player 1 creates room
        await player1Page.goto('http://localhost:5173');
        await player1Page.fill('[data-testid="player-name-input-create-test"]', 'Player1');
        await player1Page.click('[data-testid="create-room-test"]');

        // Wait for room creation
        await player1Page.waitForSelector('text=Waiting for Opponent', { timeout: 10000 });
        const roomCodeElement = await player1Page.locator('.text-5xl.font-bold.tracking-widest').first();
        roomCode = await roomCodeElement.textContent() || '';

        console.log(`Room created: ${roomCode}`);

        // Player 2 joins
        await player2Page.goto('http://localhost:5173');
        await player2Page.fill('[data-testid="player-name-input-join"]', 'Player2');
        await player2Page.fill('[data-testid="room-code-input"]', roomCode);
        await player2Page.click('[data-testid="join-room-test"]');

        // Wait for both players to be in ready screen
        await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });
        await player2Page.waitForSelector('text=Get Ready!', { timeout: 10000 });

        console.log('Both players in ready screen');

        // BUG FIX VERIFICATION: Refresh Player 1's page
        await player1Page.reload();
        console.log('Player 1 page refreshed');

        // Player 1 should automatically reconnect and see the ready screen
        await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });
        await expect(player1Page.locator('text=Get Ready!')).toBeVisible();

        console.log('Player 1 reconnected after refresh - BUG #2 FIXED ✓');

        // Verify both players still visible
        await expect(player1Page.locator('text=Player1')).toBeVisible();
        await expect(player1Page.locator('text=Player2')).toBeVisible();

        console.log('Session state restored correctly ✓');

        // Verify room code is the same
        const reconnectedRoomCode = await player1Page.evaluate(() => {
            return localStorage.getItem('cassino_room_id');
        });
        expect(reconnectedRoomCode).toBe(roomCode);

        console.log('Room code persisted in localStorage ✓');
    });

    test('BUG #2: Session persists after hard refresh (Ctrl+F5)', async () => {
        // Player 1 creates room
        await player1Page.goto('http://localhost:5173');
        await player1Page.fill('[data-testid="player-name-input-create-test"]', 'Player1');
        await player1Page.click('[data-testid="create-room-test"]');

        await player1Page.waitForSelector('text=Waiting for Opponent', { timeout: 10000 });
        const roomCodeElement = await player1Page.locator('.text-5xl.font-bold.tracking-widest').first();
        roomCode = await roomCodeElement.textContent() || '';

        // Player 2 joins
        await player2Page.goto('http://localhost:5173');
        await player2Page.fill('[data-testid="player-name-input-join"]', 'Player2');
        await player2Page.fill('[data-testid="room-code-input"]', roomCode);
        await player2Page.click('[data-testid="join-room-test"]');

        await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });

        console.log('Both players in ready screen');

        // Hard refresh (bypass cache)
        await player1Page.reload({ waitUntil: 'networkidle' });
        console.log('Player 1 page hard refreshed');

        // Should still reconnect
        await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });
        await expect(player1Page.locator('text=Get Ready!')).toBeVisible();

        console.log('Player 1 reconnected after hard refresh ✓');
    });

    test('Ready status syncs between players', async () => {
        // Setup: Both players in room
        await player1Page.goto('http://localhost:5173');
        await player1Page.fill('[data-testid="player-name-input-create-test"]', 'Player1');
        await player1Page.click('[data-testid="create-room-test"]');

        await player1Page.waitForSelector('text=Waiting for Opponent', { timeout: 10000 });
        const roomCodeElement = await player1Page.locator('.text-5xl.font-bold.tracking-widest').first();
        roomCode = await roomCodeElement.textContent() || '';

        await player2Page.goto('http://localhost:5173');
        await player2Page.fill('[data-testid="player-name-input-join"]', 'Player2');
        await player2Page.fill('[data-testid="room-code-input"]', roomCode);
        await player2Page.click('[data-testid="join-room-test"]');

        await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });
        await player2Page.waitForSelector('text=Get Ready!', { timeout: 10000 });

        console.log('Both players in ready screen');

        // Initially both should be "Not Ready"
        await expect(player1Page.locator('text=⏳ Not Ready').first()).toBeVisible();
        await expect(player2Page.locator('text=⏳ Not Ready').first()).toBeVisible();

        console.log('Both players initially not ready ✓');

        // Player 1 clicks ready
        const player1ReadyButton = player1Page.locator('button:has-text("Ready")').first();
        await player1ReadyButton.click();

        console.log('Player 1 clicked ready button');

        // Wait for ready status to sync
        await player1Page.waitForSelector('text=✓ Ready', { timeout: 5000 });
        await player2Page.waitForSelector('text=✓ Ready', { timeout: 5000 });

        // Both players should see Player 1 as ready
        const player1ReadyIndicators = await player1Page.locator('text=✓ Ready').count();
        const player2ReadyIndicators = await player2Page.locator('text=✓ Ready').count();

        expect(player1ReadyIndicators).toBeGreaterThan(0);
        expect(player2ReadyIndicators).toBeGreaterThan(0);

        console.log('Ready status synced between players ✓');
    });

    test('Leave room clears session', async () => {
        // Player 1 creates room
        await player1Page.goto('http://localhost:5173');
        await player1Page.fill('[data-testid="player-name-input-create-test"]', 'Player1');
        await player1Page.click('[data-testid="create-room-test"]');

        await player1Page.waitForSelector('text=Waiting for Opponent', { timeout: 10000 });

        // Verify session is stored
        const roomIdBefore = await player1Page.evaluate(() => {
            return localStorage.getItem('cassino_room_id');
        });
        expect(roomIdBefore).toBeTruthy();

        console.log('Session stored in localStorage ✓');

        // Click leave room button
        await player1Page.click('button:has-text("Leave Room")');

        // Should return to home screen
        await player1Page.waitForSelector('text=Create New Room', { timeout: 5000 });
        await expect(player1Page.locator('text=Create New Room')).toBeVisible();

        console.log('Returned to home screen ✓');

        // Verify session is cleared
        const roomIdAfter = await player1Page.evaluate(() => {
            return localStorage.getItem('cassino_room_id');
        });
        expect(roomIdAfter).toBeNull();

        const playerIdAfter = await player1Page.evaluate(() => {
            return localStorage.getItem('cassino_player_id');
        });
        expect(playerIdAfter).toBeNull();

        console.log('Session cleared from localStorage ✓');

        // Player name should still be saved
        const playerName = await player1Page.evaluate(() => {
            return localStorage.getItem('cassino_player_name');
        });
        expect(playerName).toBe('Player1');

        console.log('Player name preserved ✓');
    });

    test('Multiple refreshes maintain session', async () => {
        // Setup
        await player1Page.goto('http://localhost:5173');
        await player1Page.fill('[data-testid="player-name-input-create-test"]', 'Player1');
        await player1Page.click('[data-testid="create-room-test"]');

        await player1Page.waitForSelector('text=Waiting for Opponent', { timeout: 10000 });
        const roomCodeElement = await player1Page.locator('.text-5xl.font-bold.tracking-widest').first();
        roomCode = await roomCodeElement.textContent() || '';

        await player2Page.goto('http://localhost:5173');
        await player2Page.fill('[data-testid="player-name-input-join"]', 'Player2');
        await player2Page.fill('[data-testid="room-code-input"]', roomCode);
        await player2Page.click('[data-testid="join-room-test"]');

        await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });

        console.log('Initial setup complete');

        // Refresh multiple times
        for (let i = 1; i <= 3; i++) {
            console.log(`Refresh attempt ${i}`);
            await player1Page.reload();
            await player1Page.waitForSelector('text=Get Ready!', { timeout: 10000 });
            await expect(player1Page.locator('text=Get Ready!')).toBeVisible();
            console.log(`Refresh ${i} successful ✓`);
        }

        console.log('Multiple refreshes successful ✓');
    });

    test('WebSocket reconnects after disconnect', async () => {
        // Setup
        await player1Page.goto('http://localhost:5173');
        await player1Page.fill('[data-testid="player-name-input-create-test"]', 'Player1');
        await player1Page.click('[data-testid="create-room-test"]');

        await player1Page.waitForSelector('text=Waiting for Opponent', { timeout: 10000 });

        // Check initial connection status
        await expect(player1Page.locator('text=🟢 Connected').or(player1Page.locator('text=Connected'))).toBeVisible({ timeout: 10000 });

        console.log('Initial WebSocket connected ✓');

        // Simulate network interruption by going offline
        await player1Page.context().setOffline(true);
        console.log('Network set to offline');

        // Wait a bit
        await player1Page.waitForTimeout(2000);

        // Go back online
        await player1Page.context().setOffline(false);
        console.log('Network back online');

        // Should reconnect
        await expect(player1Page.locator('text=🟢 Connected').or(player1Page.locator('text=Connected'))).toBeVisible({ timeout: 15000 });

        console.log('WebSocket reconnected after network interruption ✓');
    });
});
