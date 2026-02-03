import { defineConfig, devices } from '@playwright/test';

/**
 * Production environment test configuration
 * Tests against live deployment at khasinogaming.com
 */
export default defineConfig({
  testDir: './tests',
  testMatch: ['**/e2e/**/*.spec.ts'],
  // Exclude tests that are designed for localhost only
  testIgnore: [
    '**/e2e/local.spec.ts',
    '**/e2e/websocket-test.spec.ts',
    '**/e2e/random-join.spec.ts',
  ],
  fullyParallel: false,
  forbidOnly: true,
  retries: 2,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report/production' }],
    ['json', { outputFile: 'playwright-report/production-results.json' }],
    ['list']
  ],
  
  use: {
    baseURL: 'https://khasinogaming.com/cassino/',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    // Note: Removed Cache-Control headers as they cause CORS issues with Google Fonts
  },

  timeout: 120000,
  expect: {
    timeout: 10000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: undefined, // No local server - testing live site
});
