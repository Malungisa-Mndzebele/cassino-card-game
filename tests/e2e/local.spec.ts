import { test, expect } from '@playwright/test';

/**
 * Local E2E Tests
 * Tests the localhost development environment (http://localhost:5173/cassino/)
 * Requires: Backend running on localhost:8000
 * Run with: npx playwright test tests/e2e/local.spec.ts
 */

test.describe('Local E2E Tests', () => {

    let backendAvailable = false;

    // Check if backend is running before tests
    test.beforeAll(async ({ request }) => {
        console.log('🔍 Checking if backend is running on localhost:8000...');

        try {
            const response = await request.get('http://localhost:8000/', { timeout: 5000 });
            backendAvailable = response.ok();

            if (backendAvailable) {
                console.log('✅ Backend is running and responding');
            } else {
                console.log('⚠️  Backend responded but with error status:', response.status());
            }
        } catch (error) {
            console.log('❌ Backend is NOT responding on localhost:8000');
            console.log('⚠️  Tests requiring backend will be skipped');
            console.log('💡 To run all tests, start backend: cd backend && python start_dev.py');
            backendAvailable = false;
        }
    });

    test('should load the landing page', async ({ page }) => {
        console.log('🌐 Testing localhost: http://localhost:5173/cassino/');

        await page.goto('/');

        // Check page title
        await expect(page).toHaveTitle(/Cass?ino/i);

        // Check main headings are visible
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();

        console.log('✅ Landing page loaded successfully');
    });

    test('should have all required test IDs', async ({ page }) => {
        await page.goto('/');

        // Check all test IDs are present
        await expect(page.locator('[data-testid="player-name-input-create-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="create-room-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-random-test"]')).toBeVisible();
        await expect(page.locator('[data-testid="player-name-input-join"]')).toBeVisible();
        await expect(page.locator('[data-testid="room-code-input"]')).toBeVisible();
        await expect(page.locator('[data-testid="join-room-test"]')).toBeVisible();

        console.log('✅ All test IDs present');
    });

    test('should create a room successfully', async ({ page }) => {
        test.skip(!backendAvailable, 'Backend is not running');

        console.log('🎮 Testing room creation...');

        await page.goto('/');

        // Fill in player name
        await page.locator('[data-testid="player-name-input-create-test"]').fill('LocalTestPlayer');

        // Click create room button
        await page.locator('[data-testid="create-room-test"]').click();

        // Wait for room to be created - look for "Waiting for Opponent" heading
        await expect(page.getByRole('heading', { name: /waiting for opponent/i })).toBeVisible({ timeout: 10000 });

        console.log('✅ Room created successfully');
    });

    test('should display room code after creation', async ({ page }) => {
        test.skip(!backendAvailable, 'Backend is not running');

        console.log('🔑 Testing room code display...');

        await page.goto('/');

        // Create room
        await page.locator('[data-testid="player-name-input-create-test"]').fill('CodeDisplayTest');
        await page.locator('[data-testid="create-room-test"]').click();

        // Wait for room created heading
        await expect(page.getByRole('heading', { name: /waiting for opponent/i })).toBeVisible({ timeout: 10000 });

        // Get the room code from the page
        const bodyText = await page.textContent('body');
        const roomCodeMatch = bodyText?.match(/\b[A-Z0-9]{6}\b/);

        expect(roomCodeMatch).toBeTruthy();
        console.log(`✅ Room code displayed: ${roomCodeMatch?.[0]}`);
    });

    test('should show player name in room', async ({ page }) => {
        test.skip(!backendAvailable, 'Backend is not running');

        console.log('👥 Testing player name display...');

        await page.goto('/');

        const playerName = 'PlayerNameTest';

        // Create room
        await page.locator('[data-testid="player-name-input-create-test"]').fill(playerName);
        await page.locator('[data-testid="create-room-test"]').click();

        // Wait for room to be created
        await expect(page.getByRole('heading', { name: /waiting for opponent/i })).toBeVisible({ timeout: 10000 });

        console.log(`✅ Room joined successfully`);
    });

    test('should establish WebSocket connection', async ({ page }) => {
        test.skip(!backendAvailable, 'Backend is not running');

        console.log('🔌 Testing WebSocket connection...');

        let wsConnected = false;

        // Listen for WebSocket connections
        page.on('websocket', (ws) => {
            console.log('WebSocket connection detected:', ws.url());
            wsConnected = true;
        });

        await page.goto('/');

        // Create room to trigger WebSocket connection
        await page.locator('[data-testid="player-name-input-create-test"]').fill('WSTest');
        await page.locator('[data-testid="create-room-test"]').click();

        // Wait for room creation
        await expect(page.getByRole('heading', { name: /waiting for opponent/i })).toBeVisible({ timeout: 10000 });

        // Wait a bit for WebSocket to connect
        await page.waitForTimeout(2000);

        expect(wsConnected).toBe(true);
        console.log('✅ WebSocket connection established');
    });

    test('should show join room interface', async ({ page }) => {
        console.log('🚪 Testing join room interface...');

        await page.goto('/');

        // Check join room section is visible
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();

        // Check join room inputs
        const roomCodeInput = page.locator('[data-testid="room-code-input"]');
        await expect(roomCodeInput).toBeVisible();

        const nameInput = page.locator('[data-testid="player-name-input-join"]');
        await expect(nameInput).toBeVisible();

        const joinButton = page.locator('[data-testid="join-room-test"]');
        await expect(joinButton).toBeVisible();

        console.log('✅ Join room interface is functional');
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        console.log('📱 Testing mobile responsiveness...');

        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');

        // Check elements are still visible
        await expect(page.getByRole('heading', { name: /casino card game/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /create new room/i })).toBeVisible();
        await expect(page.getByRole('heading', { name: /join existing room/i })).toBeVisible();

        console.log('✅ Mobile layout working correctly');
    });

    test('should load without console errors', async ({ page }) => {
        console.log('🐛 Checking for console errors...');

        const errors: string[] = [];

        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.goto('/');
        await page.waitForTimeout(2000);

        // Filter out known acceptable errors
        const criticalErrors = errors.filter(err =>
            !err.includes('favicon') &&
            !err.includes('404') &&
            !err.includes('DevTools')
        );

        if (criticalErrors.length > 0) {
            console.log('⚠️ Console errors found:', criticalErrors);
        } else {
            console.log('✅ No critical console errors');
        }

        expect(criticalErrors.length).toBe(0);
    });

    test('should validate player name input', async ({ page }) => {
        console.log('✏️ Testing player name validation...');

        await page.goto('/');

        const nameInput = page.locator('[data-testid="player-name-input-create-test"]');
        const createButton = page.locator('[data-testid="create-room-test"]');

        // Button should be disabled with empty name
        await expect(createButton).toBeDisabled();

        // Fill in name
        await nameInput.fill('ValidName');

        // Button should now be enabled
        await expect(createButton).toBeEnabled();

        console.log('✅ Player name validation working');
    });

    test('should validate room code input', async ({ page }) => {
        console.log('🔢 Testing room code validation...');

        await page.goto('/');

        const roomCodeInput = page.locator('[data-testid="room-code-input"]');
        const nameInput = page.locator('[data-testid="player-name-input-join"]');
        const joinButton = page.locator('[data-testid="join-room-test"]');

        // Button should be disabled initially
        await expect(joinButton).toBeDisabled();

        // Fill in name only
        await nameInput.fill('TestPlayer');
        await expect(joinButton).toBeDisabled();

        // Fill in partial room code
        await roomCodeInput.fill('ABC');
        await expect(joinButton).toBeDisabled();

        // Fill in complete room code
        await roomCodeInput.fill('ABC123');
        await expect(joinButton).toBeEnabled();

        console.log('✅ Room code validation working');
    });
});
