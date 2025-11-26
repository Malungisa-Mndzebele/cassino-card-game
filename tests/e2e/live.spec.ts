import { test, expect } from '@playwright/test';

/**
 * Live/Production E2E Tests
 * Tests the actual production site at https://khasinogaming.com/cassino/
 * These tests verify the deployed application
 * Run with: npx playwright test tests/e2e/live.spec.ts
 */

const PRODUCTION_URL = 'https://khasinogaming.com/cassino/';
const BACKEND_URL = 'https://cassino-game-backend.fly.dev';

test.describe('Live/Production E2E Tests', () => {

    test.beforeAll(async () => {
        console.log('🌐 Testing production site:', PRODUCTION_URL);
        console.log('🔧 Backend URL:', BACKEND_URL);
    });

    test('should load the landing page successfully', async ({ page }) => {
        console.log('📄 Loading production landing page...');

        await page.goto(PRODUCTION_URL);

        // Check page loads - accept either "Casino" or "Cassino" spelling
        await expect(page).toHaveTitle(/Cass?ino/i);

        // Check main elements are visible
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();

        console.log('✅ Landing page loaded successfully');
    });

    test('should have all required test IDs', async ({ page }) => {
        await page.goto(PRODUCTION_URL);

        // Check all test IDs are present
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

        // Fill in player name using test ID
        const nameInput = page.locator('[data-testid="player-name-input-create-test"]');
        await nameInput.fill('ProdTestPlayer');

        // Click create room button using test ID
        const createButton = page.locator('[data-testid="create-room-test"]');
        await createButton.click();

        // Wait for room to be created
        await expect(page.getByRole('heading', { name: /room created/i })).toBeVisible({ timeout: 15000 });

        console.log('✅ Room created successfully on production');
    });

    test('should display room code after creation', async ({ page }) => {
        console.log('🔑 Testing room code display on production...');

        await page.goto(PRODUCTION_URL);

        // Create room using test IDs
        await page.locator('[data-testid="player-name-input-create-test"]').fill('CodeTest');
        await page.locator('[data-testid="create-room-test"]').click();

        // Wait for room created heading
        await expect(page.getByRole('heading', { name: /room created/i })).toBeVisible({ timeout: 15000 });

        // Check for room code (6-character code)
        const bodyText = await page.textContent('body');
        const roomCodeMatch = bodyText?.match(/\b[A-Z0-9]{6}\b/);

        expect(roomCodeMatch).toBeTruthy();
        const roomCode = roomCodeMatch?.[0];
        console.log(`✅ Room code displayed: ${roomCode}`);
    });

    test('should show player in waiting room', async ({ page }) => {
        console.log('👥 Testing waiting room on production...');

        await page.goto(PRODUCTION_URL);

        const playerName = 'WaitingTest';
        await page.locator('[data-testid="player-name-input-create-test"]').fill(playerName);
        await page.locator('[data-testid="create-room-test"]').click();

        // Wait for room to be created
        await expect(page.getByRole('heading', { name: /room created/i })).toBeVisible({ timeout: 15000 });

        // Check player appears in room
        const bodyText = await page.textContent('body');
        expect(bodyText).toContain(playerName);

        console.log('✅ Player visible in waiting room');
    });

    test('should have working WebSocket connection', async ({ page }) => {
        console.log('🔌 Testing WebSocket connection on production...');

        let wsConnected = false;

        // Listen for WebSocket connections
        page.on('websocket', (ws) => {
            console.log('WebSocket connection detected:', ws.url());
            wsConnected = true;
        });

        await page.goto(PRODUCTION_URL);
        await page.locator('[data-testid="player-name-input-create-test"]').fill('WSTest');
        await page.locator('[data-testid="create-room-test"]').click();

        // Wait for room creation
        await expect(page.getByRole('heading', { name: /room created/i })).toBeVisible({ timeout: 15000 });

        // Wait a bit for WebSocket to connect
        await page.waitForTimeout(3000);

        expect(wsConnected).toBe(true);
        console.log('✅ WebSocket connection established');
    });

    test('should handle join room flow', async ({ page }) => {
        console.log('🚪 Testing join room flow on production...');

        await page.goto(PRODUCTION_URL);

        // Check join room inputs are visible using test IDs
        const roomCodeInput = page.locator('[data-testid="room-code-input"]');
        await expect(roomCodeInput).toBeVisible();

        const nameInput = page.locator('[data-testid="player-name-input-join"]');
        await expect(nameInput).toBeVisible();

        const joinButton = page.locator('[data-testid="join-room-test"]');
        await expect(joinButton).toBeVisible();

        console.log('✅ Join room interface is functional');
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        console.log('📱 Testing mobile responsiveness on production...');

        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto(PRODUCTION_URL);

        // Check elements are still visible
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();

        console.log('✅ Mobile layout working correctly');
    });

    test('should load without console errors', async ({ page }) => {
        console.log('🐛 Checking for console errors on production...');

        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto(PRODUCTION_URL);
        await page.waitForTimeout(2000);

        // Filter out known acceptable errors
        const criticalErrors = errors.filter(err =>
            !err.includes('favicon') &&
            !err.includes('404')
        );

        if (criticalErrors.length > 0) {
            console.log('⚠️ Console errors found:', criticalErrors);
        } else {
            console.log('✅ No critical console errors');
        }

        expect(criticalErrors.length).toBe(0);
    });

    test('should verify backend health endpoint', async ({ request }) => {
        console.log('🏥 Testing backend health endpoint...');

        try {
            const response = await request.get(`${BACKEND_URL}/health`);

            expect(response.ok()).toBeTruthy();
            expect(response.status()).toBe(200);

            const data = await response.json();
            expect(data.status).toBe('healthy');

            console.log('✅ Backend health check passed:', data);
        } catch (error) {
            console.log('⚠️ Backend health check failed - backend may not be deployed');
            throw error;
        }
    });

    test('should have correct page metadata', async ({ page }) => {
        console.log('📋 Checking page metadata...');

        await page.goto(PRODUCTION_URL);

        // Check meta description
        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        expect(metaDescription).toBeTruthy();
        expect(metaDescription).toContain('Casino');

        console.log('✅ Page metadata is correct');
    });
});
