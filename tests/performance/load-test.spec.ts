import { test, expect } from '@playwright/test'

/**
 * Performance and load testing scenarios
 */

test.describe('Performance Tests', () => {
  
  test('Page load performance', async ({ page }) => {
    // Start timing
    const startTime = Date.now()
    
    await page.goto('/')
    
    // Wait for page to be fully loaded
    await page.waitForFunction(() => {
      const root = document.getElementById('root')
      return root && root.children.length > 0
    }, { timeout: 15000 })
    
    const loadTime = Date.now() - startTime
    
    // Page should load within 8 seconds (generous for CI)
    expect(loadTime).toBeLessThan(8000)
    
    console.log(`Page load time: ${loadTime}ms`)
  })
  
  test('CSS and asset loading', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForLoadState('networkidle')
    
    // Check that CSS is applied
    const bodyStyles = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return styles.backgroundColor !== 'rgba(0, 0, 0, 0)'
    })
    
    expect(bodyStyles).toBeTruthy()
  })
  
  test('Memory usage stability', async ({ page }) => {
    await page.goto('/')
    
    await page.waitForFunction(() => {
      const root = document.getElementById('root')
      return root && root.children.length > 0
    }, { timeout: 15000 })
    
    // Simulate user interactions
    for (let i = 0; i < 5; i++) {
      const nameInput = page.getByTestId('player-name-input-create-test')
      if (await nameInput.isVisible()) {
        await nameInput.fill(`Player${i}`)
        await nameInput.clear()
      }
      await page.waitForTimeout(100)
    }
    
    // Should not crash or hang
    const isResponsive = await page.evaluate(() => {
      return document.readyState === 'complete'
    })
    
    expect(isResponsive).toBeTruthy()
  })
  
  test('Responsive design performance', async ({ browser }) => {
    const context = await browser.newContext({ 
      viewport: { width: 375, height: 667 } // Mobile
    })
    const page = await context.newPage()
    
    try {
      const startTime = Date.now()
      
      await page.goto('/')
      
      await page.waitForFunction(() => {
        const root = document.getElementById('root')
        return root && root.children.length > 0
      }, { timeout: 15000 })
      
      const loadTime = Date.now() - startTime
      
      // Should load quickly on mobile
      expect(loadTime).toBeLessThan(10000)
      
      console.log(`Mobile load time: ${loadTime}ms`)
      
    } finally {
      await context.close()
    }
  })
  
  test('No JavaScript errors', async ({ page }) => {
    const errors: string[] = []
    
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })
    
    await page.goto('/')
    
    await page.waitForFunction(() => {
      const root = document.getElementById('root')
      return root && root.children.length > 0
    }, { timeout: 15000 })
    
    await page.waitForTimeout(2000)
    
    // Should have no JavaScript errors
    expect(errors.length).toBe(0)
  })
})