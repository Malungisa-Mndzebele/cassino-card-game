import { test, expect } from '@playwright/test';

/**
 * Live Deployment Verification Tests
 * Tests the actual production site at khasinogaming.com
 */

test.describe('Live Deployment Tests', () => {
  
  test('should load the landing page successfully', async ({ page }) => {
    console.log('🌐 Testing live site: https://khasinogaming.com/cassino/');
    
    await page.goto('/');
    
    // Check page loads - accept either "Casino" or "Cassino" spelling
    await expect(page).toHaveTitle(/Cassi?no/i);
    
    // Check main elements are visible - using actual text from component
    await expect(page.getByText(/Create New Room/i)).toBeVisible();
    await expect(page.getByText(/Join Existing Room/i)).toBeVisible();
    
    console.log('✅ Landing page loaded successfully');
  });

  test('should be able to create a room', async ({ page }) => {
    console.log('🎮 Testing room creation...');
    
    await page.goto('/');
    
    // Fill in player name using test ID
    const nameInput = page.locator('[data-testid="player-name-input-create-test"]');
    await nameInput.fill('TestPlayer');
    
    // Click create room button using test ID
    const createButton = page.locator('[data-testid="create-room-test"]');
    await createButton.click();
    
    // Wait for room code to appear
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Room created successfully');
  });

  test('should display room code after creation', async ({ page }) => {
    console.log('🔑 Testing room code display...');
    
    await page.goto('/');
    
    // Create room using test IDs
    await page.locator('[data-testid="player-name-input-create-test"]').fill('CodeTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    // Check for room code (6-character code based on component)
    const roomCodeElement = page.locator('text=/[A-Z0-9]{6}/');
    await expect(roomCodeElement).toBeVisible({ timeout: 10000 });
    
    const roomCode = await roomCodeElement.textContent();
    console.log(`✅ Room code displayed: ${roomCode}`);
  });

  test('should show player in waiting room', async ({ page }) => {
    console.log('👥 Testing waiting room...');
    
    await page.goto('/');
    
    const playerName = 'WaitingTest';
    await page.locator('[data-testid="player-name-input-create-test"]').fill(playerName);
    await page.locator('[data-testid="create-room-test"]').click();
    
    // Check player appears in room
    await expect(page.getByText(playerName)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Player visible in waiting room');
  });

  test('should have working WebSocket connection', async ({ page }) => {
    console.log('🔌 Testing WebSocket connection...');
    
    let wsConnected = false;
    
    // Listen for WebSocket connections
    page.on('websocket', () => {
      console.log('WebSocket connection detected');
      wsConnected = true;
    });
    
    await page.goto('/');
    await page.locator('[data-testid="player-name-input-create-test"]').fill('WSTest');
    await page.locator('[data-testid="create-room-test"]').click();
    
    // Wait a bit for WebSocket to connect
    await page.waitForTimeout(3000);
    
    expect(wsConnected).toBe(true);
    console.log('✅ WebSocket connection established');
  });

  test('should handle join room flow', async ({ page }) => {
    console.log('🚪 Testing join room flow...');
    
    await page.goto('/');
    
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
    console.log('📱 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check elements are still visible - using actual text from component
    await expect(page.getByText(/Create New Room/i)).toBeVisible();
    await expect(page.getByText(/Join Existing Room/i)).toBeVisible();
    
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
      !err.includes('404')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ Console errors found:', criticalErrors);
    } else {
      console.log('✅ No critical console errors');
    }
    
    expect(criticalErrors.length).toBe(0);
  });
});
