import { test, expect } from '@playwright/test';

test.use({
  baseURL: 'https://khasinogaming.com/cassino/',
});

test('quick production check', async ({ page }) => {
  console.log('Testing: https://khasinogaming.com/cassino/');
  
  try {
    await page.goto('/', { timeout: 30000 });
    console.log('✅ Page loaded');
    
    const title = await page.title();
    console.log('Page title:', title);
    
    const content = await page.content();
    console.log('Page has content:', content.length, 'characters');
    
    // Take screenshot
    await page.screenshot({ path: 'production-screenshot.png', fullPage: true });
    console.log('✅ Screenshot saved');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
});
