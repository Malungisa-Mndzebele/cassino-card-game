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
  // Start frontend dev server (or reuse existing)
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true, // Reuse existing dev server
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
  // Note: Backend should be started separately before running E2E tests
  // Run: npm run start:backend (in another terminal)
  // Or set up in CI/CD pipeline
})


