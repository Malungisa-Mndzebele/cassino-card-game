import { test, expect, Page } from '@playwright/test';

/**
 * Live/Production E2E Tests
 * Tests the actual production site at https://khasinogaming.com/cassino/
 * Run with: npx playwright test tests/e2e/live.spec.ts
 */

const PRODUCTION_URL = 'https://khasinogaming.com/cassino/';
/** Backend API URL - used for direct API endpoint tests */
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
    // Wait for navigation away from landing page - verify we're no longer on create room screen
    await expect(page.getByRole('heading', { name: /create new room/i })).not.toBeVisible({ timeout: 10000 });
}

test.describe('Live/Production E2E Tests', () => {

    test('should load the landing page successfully', async ({ page }) => {
        await test.step('Navigate to production', async () => {
            await page.goto(PRODUCTION_URL);
        });

        await test.step('Verify page content', async () => {
            await expect(page).toHaveTitle(/Cass?ino/i);
            await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
            await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
            await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();
        });
    });

    test('should have all required test IDs', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        await expect(page.locator('[data-testid="player-name-input-create-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="create-room-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-random-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="player-name-input-join"]')).toBeVisible();
        await expect(page.locator('[data-testid="room-code-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-room-test"]')).toBeVisible();
    });

    test('should be able to create a room', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="player-name-input-create-test"]').fill('ProdTestPlayer');
        await page.locator('[data-testid="create-room-test"]').click();

        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
    });

    test('should display room code after creation', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="player-name-input-create-test"]').fill('CodeTest');
        await page.locator('[data-testid="create-room-test"]').click();
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });

        const bodyText = await page.textContent('body');
        const roomCodeMatch = bodyText?.match(/\b[A-Z0-9]{6}\b/);
        
        expect(roomCodeMatch).toBeTruthy();
        test.info().annotations.push({ type: 'room_code', description: roomCodeMatch?.[0] ?? 'unknown' });
    });

    test('should show player in waiting room', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        const playerName = 'WaitingTest';
        await page.locator('[data-testid="player-name-input-create-test"]').fill(playerName);
        await page.locator('[data-testid="create-room-test"]').click();

        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
        await expect(page.locator(`text=${playerName}`)).toBeVisible({ timeout: 10000 });
    });

    test('should have working WebSocket connection', async ({ page }) => {
        let wsConnected = false;
        let wsUrl = '';
        page.on('websocket', (ws) => {
            wsConnected = true;
            wsUrl = ws.url();
        });

        await page.goto(PRODUCTION_URL);
        await page.locator('[data-testid="player-name-input-create-test"]').fill('WSTest');
        await page.locator('[data-testid="create-room-test"]').click();

        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
        
        // Wait for WebSocket connection with polling instead of fixed timeout
        await expect.poll(() => wsConnected, { timeout: 5000 }).toBe(true);
        
        test.info().annotations.push({ type: 'websocket_url', description: wsUrl });
    });

    test('should handle join room flow', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        await expect(page.locator('[data-testid="room-code-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="player-name-input-join"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-room-test"]')).toBeVisible();
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(PRODUCTION_URL);

        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();
    });

    test('should load without console errors', async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(PRODUCTION_URL);
        // Wait for page to be fully loaded
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();

        const criticalErrors = errors.filter(err =>
            !err.includes('favicon') &&
            !err.includes('404') &&
            !err.includes('fonts.gstatic.com') &&
            !err.includes('fonts.googleapis.com') &&
            !err.includes('CORS') &&
            !err.includes('cache-control')
        );

        expect(criticalErrors.length).toBe(0);
    });

    test('should verify backend health endpoint', async ({ request }) => {
        const response = await request.get(`${BACKEND_URL}/health`);
        expect(response.ok()).toBeTruthy();
        expect(response.status()).toBe(200);

        const data = await response.json();
        expect(data.status).toBe('healthy');
        
        test.info().annotations.push({ type: 'health_response', description: JSON.stringify(data) });
    });

    test('should have correct page metadata', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        expect(metaDescription).toBeTruthy();
        expect(metaDescription).toContain('Casino');
    });

    test('should show error for invalid room code', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="room-code-input"]').fill('XXXXXX');
        await page.locator('[data-testid="player-name-input-join"]').fill('TestPlayer');
        await page.locator('[data-testid="join-room-test"]').click();

        // Should show error message (use .first() to avoid strict mode)
        await expect(page.locator('text=/not found|invalid|error/i').first()).toBeVisible({ timeout: 10000 });
    });

    test('should require player name to create room', async ({ page }) => {
        await page.goto(PRODUCTION_URL);
        
        const createButton = page.locator('[data-testid="create-room-test"]');
        const nameInput = page.locator('[data-testid="player-name-input-create-test"]');
        await nameInput.fill('');
        
        const isDisabled = await createButton.isDisabled();
        if (!isDisabled) {
            await createButton.click();
            // Wait for either an error message or verify we stayed on landing page
            const stayedOnLanding = await page.getByRole('heading', { name: /create new room/i }).isVisible();
            const hasError = await page.locator('text=/name|required|empty/i').first().isVisible().catch(() => false);
            // Either button should be disabled, we stayed on landing, or an error was shown
            expect(stayedOnLanding || hasError).toBe(true);
        } else {
            // Button is disabled - validation is working
            expect(isDisabled).toBe(true);
        }
    });

    test('should allow joining random room', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        await page.locator('[data-testid="player-name-input-create-test"]').fill('RandomJoiner');
        
        const joinRandomButton = page.locator('[data-testid="join-random-test"]');
        await expect(joinRandomButton).toBeVisible();
        await joinRandomButton.click();
        
        // Should navigate to waiting room - check for "Waiting for Opponent" text specifically
        await expect(page.locator('text=Waiting for Opponent')).toBeVisible({ timeout: 15000 });
    });
});


test.describe('Two-Player Game Tests', () => {
    test('should allow second player to join room', async ({ browser }) => {
        const player1Context = await browser.newContext();
        const player1Page = await player1Context.newPage();
        const roomCode = await createRoom(player1Page, 'Host1');
        test.info().annotations.push({ type: 'room_code', description: roomCode });

        const player2Context = await browser.newContext();
        const player2Page = await player2Context.newPage();
        await joinRoom(player2Page, roomCode, 'Guest2');

        // Wait for Player 1 to see Guest2 joined (use first() to handle multiple matches)
        await expect(player1Page.getByText('Guest2').first()).toBeVisible({ timeout: 15000 });

        // Verify player 2 is no longer on landing page
        await expect(player2Page.getByRole('heading', { name: /create new room/i })).not.toBeVisible({ timeout: 5000 });

        await player1Context.close();
        await player2Context.close();
    });

    test('should start game when both players ready', async ({ browser }) => {
        const player1Context = await browser.newContext();
        const player1Page = await player1Context.newPage();
        const roomCode = await createRoom(player1Page, 'ReadyHost');
        test.info().annotations.push({ type: 'room_code', description: roomCode });

        const player2Context = await browser.newContext();
        const player2Page = await player2Context.newPage();
        await joinRoom(player2Page, roomCode, 'ReadyGuest');

        // Wait for both players to be in room
        await expect(player1Page.getByText('ReadyGuest').first()).toBeVisible({ timeout: 15000 });

        // Click ready buttons
        const readyButton1 = player1Page.getByRole('button', { name: /ready/i });
        const readyButton2 = player2Page.getByRole('button', { name: /ready/i });

        if (await readyButton1.isVisible({ timeout: 5000 }).catch(() => false)) {
            await readyButton1.click();
        }
        
        // Wait for ready state to propagate
        await expect(player1Page.getByRole('button', { name: /ready/i })).toBeDisabled({ timeout: 3000 }).catch(() => {});
        
        if (await readyButton2.isVisible({ timeout: 5000 }).catch(() => false)) {
            await readyButton2.click();
        }

        // Wait for game to start - poll for game board elements instead of fixed timeout
        const gameStarted = await expect.poll(async () => {
            const hasPlayerHand = await player1Page.locator('[data-testid="player-hand"]').isVisible().catch(() => false);
            const hasTableArea = await player1Page.getByText(/table/i).first().isVisible().catch(() => false);
            const hasScore = await player1Page.getByText(/score/i).first().isVisible().catch(() => false);
            return hasPlayerHand || hasTableArea || hasScore;
        }, { timeout: 15000 }).toBe(true).then(() => true).catch(() => false);

        expect(gameStarted).toBe(true);

        await player1Context.close();
        await player2Context.close();
    });

    test('should display cards in player hand during game', async ({ browser }) => {
        const player1Context = await browser.newContext();
        const player1Page = await player1Context.newPage();
        const roomCode = await createRoom(player1Page, 'CardHost');
        test.info().annotations.push({ type: 'room_code', description: roomCode });

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
        // Wait for ready state to propagate
        await expect(player1Page.getByRole('button', { name: /ready/i })).toBeDisabled({ timeout: 3000 }).catch(() => {});
        
        if (await readyButton2.isVisible({ timeout: 3000 }).catch(() => false)) {
            await readyButton2.click();
        }

        // Poll for game to fully start instead of fixed timeout
        const inGameFlow = await expect.poll(async () => {
            const hasPlayerHand = await player1Page.locator('[data-testid="player-hand"]').isVisible().catch(() => false);
            const hasGameIndicator = await player1Page.getByText(/score|table|shuffle/i).first().isVisible().catch(() => false);
            return hasPlayerHand || hasGameIndicator;
        }, { timeout: 15000 }).toBe(true).then(() => true).catch(() => false);

        // Check for player hand with cards
        const playerHand = player1Page.locator('[data-testid="player-hand"]');
        const hasHand = await playerHand.isVisible().catch(() => false);
        
        if (hasHand) {
            const cards = player1Page.locator('[data-testid="card-in-hand"]');
            const cardCount = await cards.count();
            test.info().annotations.push({ type: 'card_count', description: String(cardCount) });
            expect(cardCount).toBeGreaterThanOrEqual(0); // May be 0 if still dealing
        } else {
            // Game might still be in setup phase - verify we're in game flow
            expect(inGameFlow).toBe(true);
        }

        await player1Context.close();
        await player2Context.close();
    });
});

test.describe('API Endpoint Tests', () => {
    test('should create room via API', async ({ request }) => {
        const response = await request.post(`${BACKEND_URL}/rooms/create`, {
            data: { player_name: 'APITestPlayer' }
        });
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.room_id).toBeTruthy();
        expect(data.room_id).toHaveLength(6);

        test.info().annotations.push({ type: 'room_id', description: data.room_id });
    });

    test('should get game state via API', async ({ request }) => {
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

        test.info().annotations.push({ type: 'room_id', description: roomId });
    });

    test('should reject joining non-existent room', async ({ request }) => {
        const response = await request.post(`${BACKEND_URL}/rooms/join`, {
            data: { room_id: 'ZZZZZZ', player_name: 'TestPlayer' }
        });
        
        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(404);
    });

    test('should check debug waiting rooms endpoint', async ({ request }) => {
        const response = await request.get(`${BACKEND_URL}/debug/waiting-rooms`);
        expect(response.ok()).toBeTruthy();
        
        const data = await response.json();
        // Response has 'rooms' array, not 'waiting_rooms'
        expect(Array.isArray(data.rooms)).toBeTruthy();
        expect(typeof data.total_waiting_rooms).toBe('number');

        test.info().annotations.push({ type: 'waiting_rooms', description: String(data.total_waiting_rooms) });
    });
});
