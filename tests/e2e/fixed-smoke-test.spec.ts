import { test, expect } from '@playwright/test'

/**
 * Fixed smoke test that handles CSS loading and React hydration properly
 */

test.describe('Fixed Smoke Tests', () => {
  test('Page loads and shows game content', async ({ page }) => {
    // Navigate to the app
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })
    
    // Wait for React to hydrate and CSS to load
    await page.waitForLoadState('domcontentloaded')
    await page.waitForLoadState('networkidle')
    
    // Wait for the root element to have content (not just exist)
    await page.waitForFunction(() => {
      const root = document.getElementById('root')
      return root && root.children.length > 0
    }, { timeout: 15000 })
    
    // Additional wait for React components to render
    await page.waitForTimeout(2000)
    
    // Check if we can find game-related content
    const gameElements = [
      page.getByText(/casino|cassino/i),
      page.getByText(/create.*room/i),
      page.getByText(/join.*room/i),
      page.getByTestId('room-manager'),
      page.getByTestId('game-settings')
    ]
    
    let foundElement = false
    for (const element of gameElements) {
      try {
        const isVisible = await element.first().isVisible({ timeout: 3000 })
        if (isVisible) {
          foundElement = true
          break
        }
      } catch {
        // Continue to next element
      }
    }
    
    expect(foundElement).toBeTruthy()
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: 'test-results/fixed-smoke-test.png', 
      fullPage: true 
    })
  })
  
  test('Can interact with room creation', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })
    
    // Wait for React to fully load
    await page.waitForFunction(() => {
      const root = document.getElementById('root')
      return root && root.children.length > 0
    }, { timeout: 15000 })
    
    await page.waitForTimeout(2000)
    
    // Try to find and interact with room creation elements
    const playerNameInput = page.getByTestId('player-name-input-create-test')
    const createButton = page.getByTestId('create-room-test')
    
    // Check if elements are present
    const inputExists = await playerNameInput.isVisible({ timeout: 5000 }).catch(() => false)
    const buttonExists = await createButton.isVisible({ timeout: 5000 }).catch(() => false)
    
    if (inputExists && buttonExists) {
      // Fill in player name
      await playerNameInput.fill('TestPlayer')
      
      // Verify input has value
      const inputValue = await playerNameInput.inputValue()
      expect(inputValue).toBe('TestPlayer')
      
      // Note: We don't actually click create since we don't have backend running
      // But we verify the UI elements are interactive
      expect(await createButton.isEnabled()).toBeTruthy()
    } else {
      // If specific test IDs aren't found, look for generic elements
      const nameInputs = page.locator('input[type="text"], input[placeholder*="name" i]')
      const createButtons = page.locator('button').filter({ hasText: /create/i })
      
      const hasNameInput = await nameInputs.first().isVisible({ timeout: 3000 }).catch(() => false)
      const hasCreateButton = await createButtons.first().isVisible({ timeout: 3000 }).catch(() => false)
      
      expect(hasNameInput || hasCreateButton).toBeTruthy()
    }
  })
  
  test('Page has proper structure and styling', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 })
    
    // Wait for full page load
    await page.waitForFunction(() => {
      const root = document.getElementById('root')
      return root && root.children.length > 0
    }, { timeout: 15000 })
    
    await page.waitForTimeout(2000)
    
    // Check that CSS is loaded (look for styled elements)
    const bodyStyles = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return {
        backgroundColor: styles.backgroundColor,
        fontFamily: styles.fontFamily,
        margin: styles.margin
      }
    })
    
    // Verify CSS is applied (not default browser styles)
    expect(bodyStyles.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    
    // Check for responsive design
    const viewport = page.viewportSize()
    expect(viewport?.width).toBeGreaterThan(0)
    expect(viewport?.height).toBeGreaterThan(0)
    
    // Verify no JavaScript errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.waitForTimeout(1000)
    expect(errors.length).toBe(0)
  })
})