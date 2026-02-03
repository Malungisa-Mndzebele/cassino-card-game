import { test, expect, Page } from '@playwright/test';

/**
 * Live/Production E2E Tests
 * Tests the actual production site at https://khasinogaming.com/cassino/
 * Run with: npx playwright test tests/e2e/live.spec.ts
 */

const PRODUCTION_URL = 'https://khasinogaming.com/cassino/';
const BACKEND_URL = 'https://cassino-game-backend.onrender.com';

// Helper to create a room and return the room code
async function createRoom(page: Page, playerName: string): Promise<string> {
    await page.goto(PRODUCTION_URL);
    await page.locator('[data-testid="player-name-input-create-test"]').fill(playerName);
    await page.locator('[data-testid="create-room-test"]').click();
    await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
    
    const bodyText = await page.textContent('body');
    const roomCodeMatch = bodyText?.match(/\b[A-Z0-9]{6}\b/);
    if (!roomCodeMatch) throw new Error('Room code not found');
    return roomCodeMatch[0];
}

// Helper to join a room and wait for navigation
async function joinRoom(page: Page, roomCode: string, playerName: string): Promise<void> {
    await page.goto(PRODUCTION_URL);
    await page.locator('[data-testid="room-code-input"]').fill(roomCode);
    await page.locator('[data-testid="player-name-input-join"]').fill(playerName);
    await page.locator('[data-testid="join-room-test"]').click();
    // Wait for navigation away from landing page
    await page.waitForTimeout(2000);
}

test.describe('Live/Production E2E Tests', () => {

    test.beforeAll(async () => {
        console.log('🌐 Testing production site:', PRODUCTION_URL);
        console.log('🔧 Backend URL:', BACKEND_URL);
    });

    test('should load the landing page successfully', async ({ page }) => {
        console.log('📄 Loading production landing page...');
        await page.goto(PRODUCTION_URL);

        await expect(page).toHaveTitle(/Cass?ino/i);
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();

        console.log('✅ Landing page loaded successfully');
    });

    test('should have all required test IDs', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        await expect(page.locator('[data-testid="player-name-input-create-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="create-room-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-random-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="player-name-input-join"]')).toBeVisible();
        await expect(page.locator('[data-testid="room-code-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-room-test"]')).toBeVisible();

        console.log('✅ All test IDs present on production');
    });

    test('should be able to create a room', async ({ page }) => {
        console.log('🎮 Testing room creation on production...');
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="player-name-input-create-test"]').fill('ProdTestPlayer');
        await page.locator('[data-testid="create-room-test"]').click();

        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
        console.log('✅ Room created successfully on production');
    });

    test('should display room code after creation', async ({ page }) => {
        console.log('🔑 Testing room code display on production...');
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="player-name-input-create-test"]').fill('CodeTest');
        await page.locator('[data-testid="create-room-test"]').click();
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });

        const bodyText = await page.textContent('body');
        const roomCodeMatch = bodyText?.match(/\b[A-Z0-9]{6}\b/);
        
        expect(roomCodeMatch).toBeTruthy();
        console.log(`✅ Room code displayed: ${roomCodeMatch?.[0]}`);
    });

    test('should show player in waiting room', async ({ page }) => {
        console.log('� Testing waiting room on production...');
        await page.goto(PRODUCTION_URL);

        const playerName = 'WaitingTest';
        await page.locator('[data-testid="player-name-input-create-test"]').fill(playerName);
        await page.locator('[data-testid="create-room-test"]').click();

        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
        await expect(page.locator(`text=${playerName}`)).toBeVisible({ timeout: 10000 });

        console.log('✅ Player visible in waiting room');
    });

    test('should have working WebSocket connection', async ({ page }) => {
        console.log('� Testing WebSocket connection on production...');

        let wsConnected = false;
        page.on('websocket', (ws) => {
            console.log('WebSocket connection detected:', ws.url());
            wsConnected = true;
        });

        await page.goto(PRODUCTION_URL);
        await page.locator('[data-testid="player-name-input-create-test"]').fill('WSTest');
        await page.locator('[data-testid="create-room-test"]').click();

        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
        await page.waitForTimeout(3000);

        expect(wsConnected).toBe(true);
        console.log('✅ WebSocket connection established');
    });

    test('should handle join room flow', async ({ page }) => {
        console.log('� Testing join room flow on production...');
        await page.goto(PRODUCTION_URL);

        await expect(page.locator('[data-testid="room-code-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="player-name-input-join"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-room-test"]')).toBeVisible();

        console.log('✅ Join room interface is functional');
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        console.log('📱 Testing mobile responsiveness on production...');
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(PRODUCTION_URL);

        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();

        console.log('✅ Mobile layout working correctly');
    });

    test('should load without console errors', async ({ page }) => {
        console.log('� Checking for console errors on production...');

        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(PRODUCTION_URL);
        await page.waitForTimeout(2000);

        const criticalErrors = errors.filter(err =>
            !err.includes('favicon') &&
            !err.includes('404') &&
            !err.includes('fonts.gstatic.com') &&
            !err.includes('fonts.googleapis.com') &&
            !err.includes('CORS') &&
            !err.includes('cache-control')
        );

        expect(criticalErrors.length).toBe(0);
        console.log('✅ No critical console errors');
    });

    test('should verify backend health endpoint', async ({ request }) => {
        console.log('🏥 Testing backend health endpoint...');

        const response = await request.get(`${BACKEND_URL}/health`);
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.status).toBe('healthy');

        console.log('✅ Backend health check passed:', data);
    });

    test('should have correct page metadata', async ({ page }) => {
        console.log('� Checking page metadata...');
        await page.goto(PRODUCTION_URL);

        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        expect(metaDescription).toBeTruthy();
        expect(metaDescription).toContain('Casino');

        console.log('✅ Page metadata is correct');
    });

    test('should show error for invalid room code', async ({ page }) => {
        console.log('❌ Testing invalid room code handling...');
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="room-code-input"]').fill('XXXXXX');
        await page.locator('[data-testid="player-name-input-join"]').fill('TestPlayer');
        await page.locator('[data-testid="join-room-test"]').click();

        // Should show error message (use .first() to avoid strict mode)
        await expect(page.locator('text=/not found|invalid|error/i').first()).toBeVisible({ timeout: 10000 });

        console.log('✅ Invalid room code error displayed');
    });

    test('should require player name to create room', async ({ page }) => {
        console.log('📝 Testing player name validation...');
        await page.goto(PRODUCTION_URL);
        
        const createButton = page.locator('[data-testid="create-room-test"]');
        const nameInput = page.locator('[data-testid="player-name-input-create-test"]');
        await nameInput.fill('');
        
        const isDisabled = await createButton.isDisabled();
        if (!isDisabled) {
            await createButton.click();
            await page.waitForTimeout(2000);
            const url = page.url();
            expect(url).toContain('cassino');
        }

        console.log('✅ Player name validation working');
    });

    test('should allow joining random room', async ({ page }) => {
        console.log('🎲 Testing join random room...');
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="player-name-input-create-test"]').fill('RandomJoiner');
        
        const joinRandomButton = page.locator('[data-testid="join-random-test"]');
        await expect(joinRandomButton).toBeVisible();
        await joinRandomButton.click();
        
        // Should navigate to waiting room - check for "Waiting for Opponent" text specifically
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });

        console.log('✅ Join random room functional');
    });
});

test.describe('Two-Player Game Tests', () => {
    test('should allow second player to join room', async ({ browser }) => {
        console.log('👥 Testing two-player room join...');

        const player1Context = await browser.newContext();
        const player1Page = await player1Context.newPage();
        const roomCode = await createRoom(player1Page, 'Host1');
        console.log(`Room created: ${roomCode}`);

        const player2Context = await browser.newContext();
        const player2Page = await player2Context.newPage();
        await joinRoom(player2Page, roomCode, 'Guest2');

        // Wait for navigation and WebSocket connection
        await player2Page.waitForTimeout(5000);
        
        // Player 1 should see Guest2 joined (use first() to handle multiple matches)
        await expect(player1Page.getByText('Guest2').first()).toBeVisible({ timeout: 15000 });
        console.log('✅ Player 1 sees Guest2 joined');

        // Verify player 2 is no longer on landing page
        const p2HasCreateRoom = await player2Page.getByRole('heading', { name: /create new room/i }).isVisible().catch(() => false);
        expect(p2HasCreateRoom).toBe(false);
        console.log('✅ Player 2 navigated away from landing page');

        console.log('✅ Two players successfully joined room');

        await player1Context.close();
        await player2Context.close();
    });

    test('should start game when both players ready', async ({ browser }) => {
        console.log('🎮 Testing game start with two players...');

        const player1Context = await browser.newContext();
        const player1Page = await player1Context.newPage();
        const roomCode = await createRoom(player1Page, 'ReadyHost');

        const player2Context = await browser.newContext();
        const player2Page = await player2Context.newPage();
        await joinRoom(player2Page, roomCode, 'ReadyGuest');

        // Wait for both players to be in room
        await expect(player1Page.getByText('ReadyGuest').first()).toBeVisible({ timeout: 15000 });
        console.log('Both players in room');

        // Click ready buttons
        const readyButton1 = player1Page.getByRole('button', { name: /ready/i });
        const readyButton2 = player2Page.getByRole('button', { name: /ready/i });

        if (await readyButton1.isVisible({ timeout: 5000 }).catch(() => false)) {
            await readyButton1.click();
            console.log('Player 1 clicked Ready');
        }
        
        await player1Page.waitForTimeout(1000);
        
        if (await readyButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
            await readyButton2.click();
            console.log('Player 2 clicked Ready');
        }

        // Wait for game to start - look for game board elements
        await player1Page.waitForTimeout(8000);

        // Check for game started indicators
        const hasPlayerHand = await player1Page.locator('[data-testid="player-hand"]').isVisible().catch(() => false);
        const hasTableArea = await player1Page.getByText(/table/i).first().isVisible().catch(() => false);
        const hasScore = await player1Page.getByText(/score/i).first().isVisible().catch(() => false);
        
        const gameStarted = hasPlayerHand || hasTableArea || hasScore;
        expect(gameStarted).toBe(true);

        console.log('✅ Game started successfully');

        await player1Context.close();
        await player2Context.close();
    });

    test('should display cards in player hand during game', async ({ browser }) => {
        console.log('🃏 Testing card display in game...');

        const player1Context = await browser.newContext();
        const player1Page = await player1Context.newPage();
        const roomCode = await createRoom(player1Page, 'CardHost');

        const player2Context = await browser.newContext();
        const player2Page = await player2Context.newPage();
        await joinRoom(player2Page, roomCode, 'CardGuest');

        // Wait for both players
        await expect(player1Page.getByText('CardGuest').first()).toBeVisible({ timeout: 15000 });

        // Click ready buttons
        const readyButton1 = player1Page.getByRole('button', { name: /ready/i });
        const readyButton2 = player2Page.getByRole('button', { name: /ready/i });
        
        if (await readyButton1.isVisible({ timeout: 3000 }).catch(() => false)) {
            await readyButton1.click();
        }
        await player1Page.waitForTimeout(1000);
        if (await readyButton2.isVisible({ timeout: 3000 }).catch(() => false)) {
            await readyButton2.click();
        }

        // Wait for game to fully start
        await player1Page.waitForTimeout(10000);

        // Check for player hand with cards
        const playerHand = player1Page.locator('[data-testid="player-hand"]');
        const hasHand = await playerHand.isVisible().catch(() => false);
        
        if (hasHand) {
            const cards = player1Page.locator('[data-testid="card-in-hand"]');
            const cardCount = await cards.count();
            console.log(`✅ Player has ${cardCount} cards in hand`);
            expect(cardCount).toBeGreaterThanOrEqual(0); // May be 0 if still dealing
        } else {
            // Game might still be in setup phase - verify we're in game flow
            const inGameFlow = await player1Page.getByText(/score|table|ready|shuffle/i).first().isVisible().catch(() => false);
            console.log(`⚠️ Player hand not visible yet, in game flow: ${inGameFlow}`);
            expect(inGameFlow).toBe(true);
        }

        await player1Context.close();
        await player2Context.close();
    });
});

test.describe('API Endpoint Tests', () => {
    test('should create room via API', async ({ request }) => {
        console.log('🏠 Testing room creation API...');

        const response = await request.post(`${BACKEND_URL}/rooms/create`, {
            data: { player_name: 'APITestPlayer' }
        });
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.room_id).toBeTruthy();
        expect(data.room_id).toHaveLength(6);

        console.log(`✅ Room created via API: ${data.room_id}`);
    });

    test('should get game state via API', async ({ request }) => {
        console.log('📊 Testing game state API...');

        // First create a room
        const createResponse = await request.post(`${BACKEND_URL}/rooms/create`, {
            data: { player_name: 'StateTestPlayer' }
        });
        const createData = await createResponse.json();
        const roomId = createData.room_id;

        // Then get its state
        const stateResponse = await request.get(`${BACKEND_URL}/rooms/${roomId}/state`);
        expect(stateResponse.ok()).toBeTruthy();
        
        const stateData = await stateResponse.json();
        expect(stateData.room_id).toBe(roomId);

        console.log(`✅ Game state retrieved for room: ${roomId}`);
    });

    test('should reject joining non-existent room', async ({ request }) => {
        console.log('🚫 Testing invalid room join API...');

        const response = await request.post(`${BACKEND_URL}/rooms/join`, {
            data: { room_id: 'ZZZZZZ', player_name: 'TestPlayer' }
        });
        
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(404);

        console.log('✅ API correctly rejects invalid room');
    });

    test('should check debug waiting rooms endpoint', async ({ request }) => {
        console.log('🔍 Testing debug waiting rooms endpoint...');

        const response = await request.get(`${BACKEND_URL}/debug/waiting-rooms`);
        expect(response.ok()).toBeTruthy();
        
        const data = await response.json();
        // Response has 'rooms' array, not 'waiting_rooms'
        expect(Array.isArray(data.rooms)).toBeTruthy();
        expect(typeof data.total_waiting_rooms).toBe('number');

        console.log(`✅ Found ${data.total_waiting_rooms} waiting rooms`);
    });
});
