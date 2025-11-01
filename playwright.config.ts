import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000, // Increased timeout for full game flow
  expect: {
    timeout: 10_000, // Increased expectation timeout
  },
  use: {
    baseURL: 'http://localhost:5173/cassino/',
    trace: 'on-first-retry',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  // Start frontend preview server
  webServer: {
    command: 'npm run preview',
    port: 5173,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      NODE_ENV: 'production'
    }
  },
  // Note: Backend should be started separately before running E2E tests
  // Run: npm run start:backend (in another terminal)
  // Or set up in CI/CD pipeline
})


