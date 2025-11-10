import { test, expect } from '@playwright/test';

/**
 * Live Deployment Verification Tests
 * Tests the actual production site at khasinogaming.com
 */

test.describe('Live Deployment Tests', () => {
  
  test('should load the landing page successfully', async ({ page }) => {
    console.log('🌐 Testing live site: https://khasinogaming.com/cassino/');
    
    await page.goto('/');
    
    // Check page loads
    await expect(page).toHaveTitle(/Casino/i);
    
    // Check main elements are visible
    await expect(page.getByText(/Create Room/i)).toBeVisible();
    await expect(page.getByText(/Join Room/i)).toBeVisible();
    
    console.log('✅ Landing page loaded successfully');
  });

  test('should be able to create a room', async ({ page }) => {
    console.log('🎮 Testing room creation...');
    
    await page.goto('/');
    
    // Fill in player name
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    await nameInput.fill('TestPlayer');
    
    // Click create room button
    const createButton = page.getByRole('button', { name: /create room/i });
    await createButton.click();
    
    // Wait for room code to appear
    await expect(page.getByText(/room code/i)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Room created successfully');
  });

  test('should display room code after creation', async ({ page }) => {
    console.log('🔑 Testing room code display...');
    
    await page.goto('/');
    
    // Create room
    await page.locator('input[placeholder*="name" i]').first().fill('CodeTest');
    await page.getByRole('button', { name: /create room/i }).click();
    
    // Check for room code (4-character code)
    const roomCodeElement = page.locator('text=/[A-Z0-9]{4}/');
    await expect(roomCodeElement).toBeVisible({ timeout: 10000 });
    
    const roomCode = await roomCodeElement.textContent();
    console.log(`✅ Room code displayed: ${roomCode}`);
  });

  test('should show player in waiting room', async ({ page }) => {
    console.log('👥 Testing waiting room...');
    
    await page.goto('/');
    
    const playerName = 'WaitingTest';
    await page.locator('input[placeholder*="name" i]').first().fill(playerName);
    await page.getByRole('button', { name: /create room/i }).click();
    
    // Check player appears in room
    await expect(page.getByText(playerName)).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Player visible in waiting room');
  });

  test('should have working WebSocket connection', async ({ page }) => {
    console.log('🔌 Testing WebSocket connection...');
    
    let wsConnected = false;
    
    // Listen for WebSocket connections
    page.on('websocket', ws => {
      console.log('WebSocket connection detected');
      wsConnected = true;
    });
    
    await page.goto('/');
    await page.locator('input[placeholder*="name" i]').first().fill('WSTest');
    await page.getByRole('button', { name: /create room/i }).click();
    
    // Wait a bit for WebSocket to connect
    await page.waitForTimeout(3000);
    
    expect(wsConnected).toBe(true);
    console.log('✅ WebSocket connection established');
  });

  test('should handle join room flow', async ({ page }) => {
    console.log('🚪 Testing join room flow...');
    
    await page.goto('/');
    
    // Switch to join room tab/section
    const joinInput = page.locator('input[placeholder*="code" i], input[placeholder*="room" i]').first();
    await expect(joinInput).toBeVisible();
    
    const nameInput = page.locator('input[placeholder*="name" i]').last();
    await expect(nameInput).toBeVisible();
    
    console.log('✅ Join room interface is functional');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    console.log('📱 Testing mobile responsiveness...');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check elements are still visible
    await expect(page.getByText(/Create Room/i)).toBeVisible();
    await expect(page.getByText(/Join Room/i)).toBeVisible();
    
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
