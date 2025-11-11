import { test, expect } from '@playwright/test';

/**
 * Basic Production Site Check
 * Verifies what's actually deployed at the production URL
 */

test.describe('Production Site Basic Check', () => {
  
  test('should load Casino Card Game landing page', async ({ page }) => {
    console.log('🌐 Testing: https://khasinogaming.com/cassino/');
    
    const response = await page.goto('https://khasinogaming.com/cassino/');
    console.log(`📍 Response URL: ${response?.url()}`);
    console.log(`📍 Final page URL: ${page.url()}`);
    console.log(`📍 Response status: ${response?.status()}`);
    
    // Wait for network to be idle
    await page.waitForLoadState('networkidle');
    
    // Check page title
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    expect(title).toContain('Cassino');
    
    // Check for main heading
    const heading = page.getByRole('heading', { name: /casino card game/i });
    await expect(heading).toBeVisible();
    console.log('✅ Main heading found');
    
    // Check for subtitle
    const subtitle = page.getByText(/classic card game.*real-time multiplayer/i);
    await expect(subtitle).toBeVisible();
    console.log('✅ Subtitle found');
    
    console.log('✅ Landing page loaded successfully');
  });

  test('should have Create New Room section', async ({ page }) => {
    await page.goto('https://khasinogaming.com/cassino/');
    
    // Check for "Create New Room" heading
    const createHeading = page.getByRole('heading', { name: /create new room/i });
    await expect(createHeading).toBeVisible();
    console.log('✅ "Create New Room" heading found');
    
    // Check for create room description
    const createDesc = page.getByText(/start a new game and invite friends/i);
    await expect(createDesc).toBeVisible();
    console.log('✅ Create room description found');
    
    // Check for player name input
    const nameInput = page.locator('input[placeholder*="name" i]').first();
    await expect(nameInput).toBeVisible();
    console.log('✅ Player name input found');
    
    // Check for create button
    const createButton = page.getByRole('button', { name: /create/i }).first();
    await expect(createButton).toBeVisible();
    console.log('✅ Create button found');
  });

  test('should have Join Existing Room section', async ({ page }) => {
    await page.goto('https://khasinogaming.com/cassino/');
    
    // Check for "Join Existing Room" heading
    const joinHeading = page.getByRole('heading', { name: /join existing room/i });
    await expect(joinHeading).toBeVisible();
    console.log('✅ "Join Existing Room" heading found');
    
    // Check for join room description
    const joinDesc = page.getByText(/enter a room code to join/i);
    await expect(joinDesc).toBeVisible();
    console.log('✅ Join room description found');
    
    // Check for room code input
    const roomCodeInput = page.locator('input[placeholder*="code" i], input[placeholder*="room" i]');
    await expect(roomCodeInput.first()).toBeVisible();
    console.log('✅ Room code input found');
    
    // Check for join button
    const joinButton = page.getByRole('button', { name: /join/i }).first();
    await expect(joinButton).toBeVisible();
    console.log('✅ Join button found');
  });

  test('should have correct styling and layout', async ({ page }) => {
    await page.goto('https://khasinogaming.com/cassino/');
    
    // Check for root container
    const root = page.locator('#root');
    await expect(root).toBeVisible();
    console.log('✅ Root container found');
    
    // Take screenshot for visual verification
    await page.screenshot({ path: 'test-results/production-landing-page.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/production-landing-page.png');
    
    // Check that both sections are visible (2-column layout)
    const createSection = page.getByRole('heading', { name: /create new room/i });
    const joinSection = page.getByRole('heading', { name: /join existing room/i });
    await expect(createSection).toBeVisible();
    await expect(joinSection).toBeVisible();
    console.log(`✅ Found both Create & Join sections`);
  });
});
