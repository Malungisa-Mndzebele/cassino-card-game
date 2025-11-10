import { test, expect } from '@playwright/test';

/**
 * Basic Production Site Check
 * Verifies what's actually deployed at the production URL
 */

test.describe('Production Site Basic Check', () => {
  
  test('should load production site and report what is there', async ({ page }) => {
    console.log('🌐 Checking production site: https://khasinogaming.com/cassino/');
    
    await page.goto('/');
    
    // Get the actual title
    const title = await page.title();
    console.log(`📄 Page title: "${title}"`);
    
    // Get the page content to see what's actually there
    const bodyText = await page.locator('body').textContent();
    console.log(`📝 Page contains ${bodyText?.length || 0} characters`);
    
    // Check for any of our app's key elements
    const hasCreateRoom = await page.getByText(/create/i).count() > 0;
    const hasJoinRoom = await page.getByText(/join/i).count() > 0;
    const hasRoomCode = await page.locator('input').count() > 0;
    
    console.log(`🎮 Has "create" text: ${hasCreateRoom}`);
    console.log(`🚪 Has "join" text: ${hasJoinRoom}`);
    console.log(`📝 Has input fields: ${hasRoomCode}`);
    
    // Take a screenshot for manual inspection
    await page.screenshot({ path: 'test-results/production-site-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved to test-results/production-site-screenshot.png');
    
    // This test always passes - it's just for inspection
    expect(title).toBeTruthy();
  });

  test('should check if Casino Card Game app is present', async ({ page }) => {
    await page.goto('/');
    
    // Look for any signs of our Casino Card Game app
    const indicators = {
      'Casino Card Game text': await page.getByText(/casino card game/i).count() > 0,
      'Room Manager': await page.locator('[data-testid="room-manager"]').count() > 0,
      'Create button': await page.getByRole('button', { name: /create/i }).count() > 0,
      'Join button': await page.getByRole('button', { name: /join/i }).count() > 0,
      'Name input': await page.locator('input[placeholder*="name" i]').count() > 0,
    };
    
    console.log('\n🔍 App Presence Indicators:');
    for (const [key, value] of Object.entries(indicators)) {
      console.log(`  ${value ? '✅' : '❌'} ${key}`);
    }
    
    const appPresent = Object.values(indicators).some(v => v);
    console.log(`\n${appPresent ? '✅ Casino Card Game app IS present' : '❌ Casino Card Game app NOT found'}`);
    
    // This test passes regardless - it's informational
    expect(true).toBe(true);
  });
});
