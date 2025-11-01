import { test, expect } from '@playwright/test'

/**
 * Simple smoke test to verify basic functionality works
 * This is a minimal test that checks if the page loads
 */

test.describe('Smoke Tests', () => {
  test('Page loads and shows landing page', async ({ page }) => {
    // Navigate to the app
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    
    // Wait for React to render
    await page.waitForSelector('#root', { timeout: 15000 })
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
    
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Check if page has content
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText!.length).toBeGreaterThan(0)
    
    // Check if we see game-related content
    const hasGameContent = await page.getByText(/casino|cassino|game|create|join/i).first().isVisible({ timeout: 5000 }).catch(() => false)
    expect(hasGameContent).toBeTruthy()
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'test-results/smoke-test-landing.png', fullPage: true })
  })
  
  test('Can find room manager or create button', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForSelector('#root', { timeout: 15000 })
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Try multiple ways to find the room manager
    const roomManagerById = await page.getByTestId('room-manager').isVisible({ timeout: 5000 }).catch(() => false)
    const createButton = await page.getByText(/create.*room|create.*game/i).first().isVisible({ timeout: 5000 }).catch(() => false)
    const joinButton = await page.getByText(/join.*room|join.*game/i).first().isVisible({ timeout: 5000 }).catch(() => false)
    
    expect(roomManagerById || createButton || joinButton).toBeTruthy()
  })
})

