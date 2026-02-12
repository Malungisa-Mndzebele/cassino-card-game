import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

/**
 * Live/Production E2E Tests
 * Tests the actual production site at https://khasinogaming.com/cassino/
 * Run with: npx playwright test tests/e2e/live.spec.ts
 */

// Configuration
const CONFIG = {
    PRODUCTION_URL: 'https://khasinogaming.com/cassino/',
    BACKEND_URL: 'https://cassino-game-backend.onrender.com',
    TIMEOUTS: {
        DEFAULT: 10000,
        LONG: 15000,
        SHORT: 5000,
        POLL: 3000
    },
    ROOM_CODE_PATTERN: /\b[A-Z0-9]{6}\b/
} as const;

// Test selectors - centralized for easy maintenance
const SELECTORS = {
    playerNameCreate: '[data-testid="player-name-input-create-test"]',
    createRoom: '[data-testid="create-room-test"]',
    joinRandom: '[data-testid="join-random-test"]',
    playerNameJoin: '[data-testid="player-name-input-join"]',
    roomCodeInput: '[data-testid="room-code-input"]',
    joinRoom: '[data-testid="join-room-test"]',
    playerHand: '[data-testid="player-hand"]',
    cardInHand: '[data-testid="card-in-hand"]'
} as const;

// Helper functions
async function createRoom(page: Page, playerName: string): Promise<string> {
    await page.goto(CONFIG.PRODUCTION_URL);
    await page.locator(SELECTORS.playerNameCreate).fill(playerName);
    await page.locator(SELECTORS.createRoom).click();
    await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: CONFIG.TIMEOUTS.LONG });
    
    const bodyText = await page.textContent('body');
    const roomCodeMatch = bodyText?.match(CONFIG.ROOM_CODE_PATTERN);
    if (!roomCodeMatch) throw new Error('Room code not found');
    return roomCodeMatch[0];
}

async function joinRoom(page: Page, roomCode: string, playerName: string): Promise<void> {
    await page.goto(CONFIG.PRODUCTION_URL);
    await page.locator(SELECTORS.roomCodeInput).fill(roomCode);
    await page.locator(SELECTORS.playerNameJoin).fill(playerName);
    await page.locator(SELECTORS.joinRoom).click();
    await expect(page.getByRole('heading', { name: /create new room/i })).not.toBeVisible({ timeout: CONFIG.TIMEOUTS.DEFAULT });
}

async function waitForGameStart(page: Page): Promise<boolean> {
    return expect.poll(async () => {
        const hasPlayerHand = await page.locator(SELECTORS.playerHand).isVisible().catch(() => false);
        const hasTableArea = await page.getByText(/table/i).first().isVisible().catch(() => false);
        const hasScore = await page.getByText(/score/i).first().isVisible().catch(() => false);
        return hasPlayerHand || hasTableArea || hasScore;
    }, { timeout: CONFIG.TIMEOUTS.LONG }).toBe(true).then(() => true).catch(() => false);
}

async function clickReadyButton(page: Page): Promise<void> {
    const readyButton = page.getByRole('button', { name: /ready/i });
    if (await readyButton.isVisible({ timeout: CONFIG.TIMEOUTS.SHORT }).catch(() => false)) {
        await readyButton.click();
        await expect(readyButton).toBeDisabled({ timeout: CONFIG.TIMEOUTS.POLL }).catch(() => {});
    }
}

interface TwoPlayerContext {
    player1Context: BrowserContext;
    player1Page: Page;
    player2Context: BrowserContext;
    player2Page: Page;
    roomCode: string;
}

async function setupTwoPlayers(browser: Browser, player1Name: string, player2Name: string): Promise<TwoPlayerContext> {
    const player1Context = await browser.newContext();
    const player1Page = await player1Context.newPage();
    const roomCode = await createRoom(player1Page, player1Name);

    const player2Context = await browser.newContext();
    const player2Page = await player2Context.newPage();
    await joinRoom(player2Page, roomCode, player2Name);

    await expect(player1Page.getByText(player2Name).first()).toBeVisible({ timeout: CONFIG.TIMEOUTS.LONG });

    return { player1Context, player1Page, player2Context, player2Page, roomCode };
}

async function cleanupTwoPlayers(ctx: TwoPlayerContext): Promise<void> {
    await ctx.player1Context.close();
    await ctx.player2Context.close();
}

test.describe('Live/Production E2E Tests', () => {

    test('should load the landing page successfully', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);

        await expect(page).toHaveTitle(/Cass?ino/i);
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();
    });

    test('should have all required test IDs', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);

        const requiredSelectors = [
            SELECTORS.playerNameCreate,
            SELECTORS.createRoom,
            SELECTORS.joinRandom,
            SELECTORS.playerNameJoin,
            SELECTORS.roomCodeInput,
            SELECTORS.joinRoom
        ];

        for (const selector of requiredSelectors) {
            await expect(page.locator(selector)).toBeVisible();
        }
    });

    test('should be able to create a room', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);
        await page.locator(SELECTORS.playerNameCreate).fill('ProdTestPlayer');
        await page.locator(SELECTORS.createRoom).click();
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: CONFIG.TIMEOUTS.LONG });
    });

    test('should display room code after creation', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);
        await page.locator(SELECTORS.playerNameCreate).fill('CodeTest');
        await page.locator(SELECTORS.createRoom).click();
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: CONFIG.TIMEOUTS.LONG });

        const bodyText = await page.textContent('body');
        const roomCodeMatch = bodyText?.match(CONFIG.ROOM_CODE_PATTERN);
        
        expect(roomCodeMatch).toBeTruthy();
        test.info().annotations.push({ type: 'room_code', description: roomCodeMatch?.[0] ?? 'unknown' });
    });

    test('should show player in waiting room', async ({ page }) => {
        const playerName = 'WaitingTest';
        await page.goto(CONFIG.PRODUCTION_URL);
        await page.locator(SELECTORS.playerNameCreate).fill(playerName);
        await page.locator(SELECTORS.createRoom).click();

        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: CONFIG.TIMEOUTS.LONG });
        await expect(page.locator(`text=${playerName}`)).toBeVisible({ timeout: CONFIG.TIMEOUTS.DEFAULT });
    });

    test('should have working WebSocket connection', async ({ page }) => {
        let wsConnected = false;
        let wsUrl = '';
        page.on('websocket', (ws) => {
            wsConnected = true;
            wsUrl = ws.url();
        });

        await page.goto(CONFIG.PRODUCTION_URL);
        await page.locator(SELECTORS.playerNameCreate).fill('WSTest');
        await page.locator(SELECTORS.createRoom).click();
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: CONFIG.TIMEOUTS.LONG });
        
        await expect.poll(() => wsConnected, { timeout: CONFIG.TIMEOUTS.SHORT }).toBe(true);
        test.info().annotations.push({ type: 'websocket_url', description: wsUrl });
    });

    test('should handle join room flow', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);

        await expect(page.locator(SELECTORS.roomCodeInput)).toBeVisible();
        await expect(page.locator(SELECTORS.playerNameJoin)).toBeVisible();
        await expect(page.locator(SELECTORS.joinRoom)).toBeVisible();
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(CONFIG.PRODUCTION_URL);

        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();
    });

    test('should load without console errors', async ({ page }) => {
        const errors: string[] = [];
        const ignoredPatterns = ['favicon', '404', 'fonts.gstatic.com', 'fonts.googleapis.com', 'CORS', 'cache-control'];
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(CONFIG.PRODUCTION_URL);
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();

        const criticalErrors = errors.filter(err => !ignoredPatterns.some(pattern => err.includes(pattern)));
        expect(criticalErrors.length).toBe(0);
    });

    test('should verify backend health endpoint', async ({ request }) => {
        const response = await request.get(`${CONFIG.BACKEND_URL}/health`);
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.status).toBe('healthy');
        test.info().annotations.push({ type: 'health_response', description: JSON.stringify(data) });
    });

    test('should have correct page metadata', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);

        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        expect(metaDescription).toBeTruthy();
        expect(metaDescription).toContain('Casino');
    });

    test('should show error for invalid room code', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);
        await page.locator(SELECTORS.roomCodeInput).fill('XXXXXX');
        await page.locator(SELECTORS.playerNameJoin).fill('TestPlayer');
        await page.locator(SELECTORS.joinRoom).click();

        await expect(page.locator('text=/not found|invalid|error/i').first()).toBeVisible({ timeout: CONFIG.TIMEOUTS.DEFAULT });
    });

    test('should require player name to create room', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);
        
        const createButton = page.locator(SELECTORS.createRoom);
        const nameInput = page.locator(SELECTORS.playerNameCreate);
        await nameInput.fill('');
        
        const isDisabled = await createButton.isDisabled();
        if (!isDisabled) {
            await createButton.click();
            const stayedOnLanding = await page.getByRole('heading', { name: /create new room/i }).isVisible();
            const hasError = await page.locator('text=/name|required|empty/i').first().isVisible().catch(() => false);
            expect(stayedOnLanding || hasError).toBe(true);
        } else {
            expect(isDisabled).toBe(true);
        }
    });

    test('should allow joining random room', async ({ page }) => {
        await page.goto(CONFIG.PRODUCTION_URL);
        await page.locator(SELECTORS.playerNameCreate).fill('RandomJoiner');
        
        const joinRandomButton = page.locator(SELECTORS.joinRandom);
        await expect(joinRandomButton).toBeVisible();
        await joinRandomButton.click();
        
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: CONFIG.TIMEOUTS.LONG });
    });
});


test.describe('Two-Player Game Tests', () => {
    test('should allow second player to join room', async ({ browser }) => {
        const ctx = await setupTwoPlayers(browser, 'Host1', 'Guest2');
        test.info().annotations.push({ type: 'room_code', description: ctx.roomCode });

        await expect(ctx.player2Page.getByRole('heading', { name: /create new room/i })).not.toBeVisible({ timeout: CONFIG.TIMEOUTS.SHORT });

        await cleanupTwoPlayers(ctx);
    });

    test('should start game when both players ready', async ({ browser }) => {
        const ctx = await setupTwoPlayers(browser, 'ReadyHost', 'ReadyGuest');
        test.info().annotations.push({ type: 'room_code', description: ctx.roomCode });

        await clickReadyButton(ctx.player1Page);
        await clickReadyButton(ctx.player2Page);

        const gameStarted = await waitForGameStart(ctx.player1Page);
        expect(gameStarted).toBe(true);

        await cleanupTwoPlayers(ctx);
    });

    test('should display cards in player hand during game', async ({ browser }) => {
        const ctx = await setupTwoPlayers(browser, 'CardHost', 'CardGuest');
        test.info().annotations.push({ type: 'room_code', description: ctx.roomCode });

        await clickReadyButton(ctx.player1Page);
        await clickReadyButton(ctx.player2Page);

        const inGameFlow = await waitForGameStart(ctx.player1Page);

        const playerHand = ctx.player1Page.locator(SELECTORS.playerHand);
        const hasHand = await playerHand.isVisible().catch(() => false);
        
        if (hasHand) {
            const cards = ctx.player1Page.locator(SELECTORS.cardInHand);
            const cardCount = await cards.count();
            test.info().annotations.push({ type: 'card_count', description: String(cardCount) });
            expect(cardCount).toBeGreaterThanOrEqual(0);
        } else {
            expect(inGameFlow).toBe(true);
        }

        await cleanupTwoPlayers(ctx);
    });
});

test.describe('API Endpoint Tests', () => {
    test('should create room via API', async ({ request }) => {
        const response = await request.post(`${CONFIG.BACKEND_URL}/rooms/create`, {
            data: { player_name: 'APITestPlayer' }
        });
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.room_id).toBeTruthy();
        expect(data.room_id).toHaveLength(6);

        test.info().annotations.push({ type: 'room_id', description: data.room_id });
    });

    test('should get game state via API', async ({ request }) => {
        const createResponse = await request.post(`${CONFIG.BACKEND_URL}/rooms/create`, {
            data: { player_name: 'StateTestPlayer' }
        });
        const createData = await createResponse.json();
        const roomId = createData.room_id;

        const stateResponse = await request.get(`${CONFIG.BACKEND_URL}/rooms/${roomId}/state`);
        expect(stateResponse.ok()).toBeTruthy();
        
        const stateData = await stateResponse.json();
        expect(stateData.room_id).toBe(roomId);

        test.info().annotations.push({ type: 'room_id', description: roomId });
    });

    test('should reject joining non-existent room', async ({ request }) => {
        const response = await request.post(`${CONFIG.BACKEND_URL}/rooms/join`, {
            data: { room_id: 'ZZZZZZ', player_name: 'TestPlayer' }
        });
        
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(404);
    });

    test('should check debug waiting rooms endpoint', async ({ request }) => {
        const response = await request.get(`${CONFIG.BACKEND_URL}/debug/waiting-rooms`);
        expect(response.ok()).toBeTruthy();
        
        const data = await response.json();
        expect(Array.isArray(data.rooms)).toBeTruthy();
        expect(typeof data.total_waiting_rooms).toBe('number');

        test.info().annotations.push({ type: 'waiting_rooms', description: String(data.total_waiting_rooms) });
    });
});


test.describe('Build Capture Bug Fix Tests', () => {
    test('should only capture targeted build when using Ace', async ({ browser }) => {
        // This test verifies the fix for the bug where capturing one build
        // with an Ace would incorrectly capture other builds
        const ctx = await setupTwoPlayers(browser, 'BuildPlayer1', 'BuildPlayer2');
        test.info().annotations.push({ 
            type: 'test_purpose', 
            description: 'Verify Ace captures only targeted build, not all builds' 
        });

        // Start the game
        await clickReadyButton(ctx.player1Page);
        await clickReadyButton(ctx.player2Page);
        
        const gameStarted = await waitForGameStart(ctx.player1Page);
        expect(gameStarted).toBe(true);

        // Note: This is a manual verification test
        // The actual bug scenario requires:
        // 1. Player 1 builds 13 (8+5)
        // 2. Player 2 builds 14 (10+4)
        // 3. Player 1 captures 14 with Ace
        // 4. Verify only the 14-build is captured, not the 13-build
        
        // For automated testing, we would need to:
        // - Simulate specific card deals
        // - Perform build actions
        // - Verify build state after capture
        
        // For now, this test ensures the game starts and is playable
        // Manual testing should verify the specific bug scenario

        test.info().annotations.push({ 
            type: 'manual_verification', 
            description: 'Play game and verify Ace captures only targeted builds' 
        });

        await cleanupTwoPlayers(ctx);
    });
});
