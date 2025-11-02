import { test, expect, BrowserContext } from '@playwright/test'
import { createRoom } from './game-play-helpers'

/**
 * Test random room join feature
 */
test.describe('Random Room Join', () => {
  // Verify backend is accessible before running tests
  test.beforeAll(async ({ request }) => {
    try {
      const response = await request.get('http://localhost:8000/health', { timeout: 5000 })
      if (!response.ok()) {
        throw new Error(`Backend health check failed: ${response.status()}`)
      }
      console.log('✅ Backend is running and accessible')
    } catch (error) {
      console.error('❌ Backend health check failed:', error)
      throw new Error('Backend is not running! Please start it with: npm run start:backend (or cd backend && python startup.py)')
    }
  })

  test('Player can join a random game without room code', async ({ browser }) => {
    test.setTimeout(60000)
    const player1Context = await browser.newContext()
    const player2Context = await browser.newContext()
    
    const player1Page = await player1Context.newPage()
    const player2Page = await player2Context.newPage()
    
    try {
      // STEP 1: Player 1 creates a room
      console.log('🎮 Step 1: Player 1 creating room...')
      await player1Page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 })
      await player1Page.waitForSelector('#root', { timeout: 15000 })
      await player1Page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Wait for room manager to be visible
      await player1Page.getByTestId('room-manager').waitFor({ timeout: 10000 }).catch(() => {})
      
      await player1Page.getByTestId('player-name-input-create-test').fill('Alice')
      await player1Page.getByTestId('create-room-test').click()
      
      // Wait for room creation - check if we left the landing page
      await player1Page.waitForFunction(() => {
        return !document.querySelector('[data-testid="room-manager"]') || document.querySelector('[data-testid="room-manager"]')?.checkVisibility() === false
      }, { timeout: 10000 }).catch(() => {})
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Verify player 1 is in waiting phase
      const player1Waiting = await player1Page.getByText(/waiting|room|players|ready/i).first().isVisible().catch(() => false)
      expect(player1Waiting).toBeTruthy()
      
      // STEP 2: Player 2 joins via random join
      console.log('🎮 Step 2: Player 2 joining random room...')
      await player2Page.goto('/', { waitUntil: 'domcontentloaded', timeout: 20000 })
      await player2Page.waitForSelector('#root', { timeout: 15000 })
      await player2Page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Wait for room manager to be visible
      await player2Page.getByTestId('room-manager').waitFor({ timeout: 10000 }).catch(() => {})
      
      // Enter player name
      await player2Page.getByTestId('player-name-input-create-test').fill('Bob')
      
      // Wait a bit for button to be enabled
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Click "Join Random Game" button
      const joinRandomButton = player2Page.getByTestId('join-random-game-test')
      await expect(joinRandomButton).toBeVisible({ timeout: 10000 })
      
      // Check for any error messages before clicking
      const errorBeforeClick = await player2Page.getByText(/error|failed/i).first().isVisible({ timeout: 1000 }).catch(() => false)
      if (errorBeforeClick) {
        const errorText = await player2Page.getByText(/error|failed/i).first().textContent().catch(() => 'Unknown error')
        console.warn('⚠️ Error detected before click:', errorText)
      }
      
      await joinRandomButton.click()
      
      // Wait a bit for the click to register
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check for loading state or error messages
      const isLoading = await player2Page.getByText(/loading|joining|creating/i).first().isVisible({ timeout: 2000 }).catch(() => false)
      if (isLoading) {
        console.log('✅ Join request is processing...')
      }
      
      // Wait for join to complete - check for errors or success
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      // Check for error messages after click
      const errorAfterClick = await player2Page.getByText(/error|failed|cannot/i).first().isVisible({ timeout: 2000 }).catch(() => false)
      if (errorAfterClick) {
        const errorText = await player2Page.getByText(/error|failed|cannot/i).first().textContent().catch(() => 'Unknown error')
        console.error('❌ Error after join random click:', errorText)
        
        // Take screenshot for debugging
        await player2Page.screenshot({ path: 'test-results/random-join-error.png', fullPage: true }).catch(() => {})
        
        // Check console logs
        const consoleMessages = await player2Page.evaluate(() => {
          return Array.from((window as any).console.messages || []).slice(-10)
        }).catch(() => [])
        console.log('Console messages:', consoleMessages)
      }
      
      // STEP 3: Verify player 2 successfully joined a room (not on landing page anymore)
      // Give extra time for state to update
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Check if we left the landing page (joined a room)
      const player2OnLandingCheck = await player2Page.getByTestId('room-manager').isVisible({ timeout: 5000 }).catch(() => true)
      
      // If still on landing, check for errors in console or page
      if (player2OnLandingCheck) {
        // Take screenshot for debugging
        await player2Page.screenshot({ path: 'test-results/random-join-still-on-landing.png', fullPage: true }).catch(() => {})
        
        // Check console for errors
        const consoleErrors = await player2Page.evaluate(() => {
          // Try to get console errors if available
          return (window as any).console?.errors || []
        }).catch(() => [])
        
        if (consoleErrors && consoleErrors.length > 0) {
          console.error('❌ Console errors found:', consoleErrors)
        }
        
        // Check for any visible error messages
        const visibleError = await player2Page.locator('text=/error|failed|cannot|unable/i').first().isVisible({ timeout: 2000 }).catch(() => false)
        
        if (visibleError) {
          const errorText = await player2Page.locator('text=/error|failed|cannot|unable/i').first().textContent().catch(() => 'Unknown error')
          throw new Error(`Join random failed with error: ${errorText}`)
        }
        
        // Check URL to see if we're still on the landing page
        const currentUrl = player2Page.url()
        console.log('🔍 Player 2 current URL:', currentUrl)
        
        // If still on landing page and no error visible, the join may have failed silently
        // But let's be more lenient - check if they're at least in some game view
        const inGameView = await Promise.race([
          player2Page.getByText(/waiting|ready|room|players|dealer|round/i).first().isVisible().then(() => true),
          player2Page.getByTestId('casino-room-view').isVisible().then(() => true),
          player2Page.getByTestId('poker-table-view').isVisible().then(() => true)
        ]).catch(() => false)
        
        if (!inGameView) {
          throw new Error('Player 2 is still on landing page after clicking Join Random Game - join may have failed silently')
        } else {
          console.log('✅ Player 2 is in game view (not on landing page)')
        }
      }
      
      // Player 2 should NOT be on landing page (they joined a room)
      expect(player2OnLandingCheck).toBeFalsy()
      
      // Verify player 1 is also not on landing (they created a room)
      const player1OnLanding = await player1Page.getByTestId('room-manager').isVisible({ timeout: 3000 }).catch(() => true)
      expect(player1OnLanding).toBeFalsy()
      
      // Both players should see some game UI (waiting, ready, room info, etc.)
      const player1HasGameUI = await player1Page.getByText(/waiting|ready|room|players|dealer/i).first().isVisible({ timeout: 3000 }).catch(() => false)
      const player2HasGameUI = await player2Page.getByText(/waiting|ready|room|players|dealer/i).first().isVisible({ timeout: 3000 }).catch(() => false)
      
      // At least one player should see game UI
      expect(player1HasGameUI || player2HasGameUI).toBeTruthy()
      
      console.log('✅ Random join test completed successfully!')
      
    } catch (error) {
      // Capture screenshots on failure
      await player1Page.screenshot({ path: 'test-results/random-join-player1-error.png', fullPage: true }).catch(() => {})
      await player2Page.screenshot({ path: 'test-results/random-join-player2-error.png', fullPage: true }).catch(() => {})
      throw error
    } finally {
      // Clean up
      try {
        if (player1Page) await player1Page.close().catch(() => {})
        if (player2Page) await player2Page.close().catch(() => {})
      } catch {}
      try {
        if (player1Context) await player1Context.close().catch(() => {})
        if (player2Context) await player2Context.close().catch(() => {})
      } catch {}
    }
  })
})

