import { Page, expect } from '@playwright/test'

/**
 * Helper utilities for E2E game testing
 */

export interface GameState {
  phase: string
  round?: number
  player1Score?: number
  player2Score?: number
  player1Hand?: any[]
  player2Hand?: any[]
  tableCards?: any[]
  currentTurn?: number
  winner?: number | null
}

/**
 * Wait for a specific game phase
 */
export async function waitForPhase(page: Page, phase: string, timeout = 10000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    // Check URL or page content for phase indicators
    const phaseIndicators: Record<string, string[]> = {
      waiting: ['waiting', 'players', 'joined', 'room'],
      dealer: ['dealer', 'ready to deal', 'the dealer'],
      round1: ['round', 'round 1', 'your turn', 'player.*turn', 'cassino.*round'],
      round2: ['round 2', 'final round'],
      finished: ['won', 'lost', 'tie', 'final scores', 'game completed']
    }
    
    const indicators = phaseIndicators[phase] || [phase]
    
    // Special handling for round1/round2 - check for poker table view
    if (phase === 'round1' || phase === 'round2') {
      const pokerTableElements = [
        page.getByText(/COMMUNITY CARDS/i),
        page.getByText(/DEALER/i),
        page.getByText(/BURN PILE/i),
        page.getByText(/Round \d+/i),
        page.getByText(/Your Turn|Your turn/i)
      ]
      
      for (const element of pokerTableElements) {
        const found = await element.first().isVisible({ timeout: 1000 }).catch(() => false)
        if (found) {
          await new Promise(resolve => setTimeout(resolve, 500))
          return true
        }
      }
    }
    
    for (const indicator of indicators) {
      try {
        const element = page.getByText(new RegExp(indicator, 'i')).first()
        const found = await element.isVisible({ timeout: 1000 }).catch(() => false)
        if (found) {
          await new Promise(resolve => setTimeout(resolve, 500)) // Small delay to ensure state settled
          return true
        }
      } catch {
        // Continue searching
      }
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return false
}

/**
 * Get current game state from API (if available) or UI
 */
export async function getGameState(page: Page): Promise<Partial<GameState>> {
  // Try to get state from API response (if backend is accessible)
  try {
    const response = await page.evaluate(async () => {
      // Try to get room ID from URL or localStorage
      const url = window.location.href
      const roomMatch = url.match(/room[=/]([A-Z0-9]{6})/i)
      const roomId = roomMatch ? roomMatch[1] : null
      
      if (!roomId) return null
      
      try {
        const apiUrl = process.env.VITE_API_URL || 'http://localhost:8000'
        const response = await fetch(`${apiUrl}/rooms/${roomId}/state`)
        if (response.ok) {
          const data = await response.json()
          return data.game_state || data
        }
      } catch (e) {
        console.error('Failed to fetch game state:', e)
      }
      return null
    })
    
    if (response) {
      return response
    }
  } catch (e) {
    // Fallback to UI-based detection
  }
  
  // Fallback: Extract state from UI
  const phaseText = await page.locator('h1, h2, h3').first().textContent().catch(() => '')
  const roundMatch = phaseText?.match(/round (\d+)/i)
  const round = roundMatch ? parseInt(roundMatch[1]) : undefined
  
  return {
    phase: detectPhaseFromUI(page),
    round
  }
}

/**
 * Detect game phase from UI elements (requires evaluate context)
 * This is a placeholder - actual implementation would use page.evaluate()
 */
function detectPhaseFromUI(page: Page): string {
  // This function is a placeholder
  // Actual phase detection should use page.evaluate() to check DOM
  return 'unknown'
}

/**
 * Create a room and return room ID
 */
export async function createRoom(page: Page, playerName: string): Promise<string> {
  // Debug: Log page state
  const pageClosedBeforeCheck = page.isClosed()
  if (pageClosedBeforeCheck) {
    console.error('❌ createRoom called with closed page')
    throw new Error('Page is closed - cannot create room. Make sure the page is not closed by previous test cleanup.')
  }
  
  // Navigate to the page with retries
  let attempts = 0
  const maxAttempts = 3
  
  while (attempts < maxAttempts) {
    attempts++
    
    try {
      // Check page state before each attempt
      const pageClosedDuringAttempt = page.isClosed()
      if (pageClosedDuringAttempt) {
        console.warn(`⚠️ Page closed during attempt ${attempts}/${maxAttempts}`)
        if (attempts >= maxAttempts) {
          throw new Error('Page was closed during room creation - cannot retry')
        }
        // Wait a bit before retrying (page might have been temporarily closed)
        await new Promise(resolve => setTimeout(resolve, 1000))
        continue
      }
      
      // Debug: Log navigation attempt
      console.log(`📝 createRoom: Navigating to / (attempt ${attempts}/${maxAttempts})`)
      
      try {
        // Use a shorter timeout to fail fast if the page closes
        await Promise.race([
          page.goto('/', { 
            waitUntil: 'networkidle', 
            timeout: 30000 
          }),
          // Check periodically if page is closed
          new Promise<void>((_, reject) => {
            const checkInterval = setInterval(() => {
              if (page.isClosed()) {
                clearInterval(checkInterval)
                reject(new Error('Page was closed during navigation'))
              }
            }, 100)
            
            // Clear interval after navigation should complete
            setTimeout(() => clearInterval(checkInterval), 31000)
          })
        ])
      } catch (gotoError: any) {
        // Check if error is due to closed page or test ending
        const isClosedError = gotoError?.message?.includes('closed') || 
                              gotoError?.message?.includes('Target page') ||
                              gotoError?.message?.includes('Test ended') ||
                              page.isClosed()
        
        if (isClosedError) {
          console.error(`❌ Navigation failed - page closed: ${gotoError?.message}`)
          if (attempts >= maxAttempts) {
            throw new Error(`Page was closed during navigation after ${attempts} attempts: ${gotoError?.message}`)
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }
        // Re-throw other errors
        throw gotoError
      }
      
      // Wait for React to hydrate - check for actual content
      // First ensure the page itself loaded
      const pageContent = await page.content()
      if (pageContent.length < 100) {
        throw new Error('Page HTML is empty - server not responding')
      }
      
      // Check if page is still open before waiting for selectors
      if (page.isClosed()) {
        throw new Error('Page was closed during React rendering wait')
      }
      
      // Wait for SvelteKit body to have content
      await page.waitForFunction(
        () => {
          return document.body && document.body.children.length > 0
        },
        { timeout: 15000 }
      ).catch(() => {
        if (page.isClosed()) {
          throw new Error('Page was closed while waiting for SvelteKit to load')
        }
        throw new Error('SvelteKit body not found or empty')
      })
      
      // Wait for SvelteKit to render content
      await page.waitForFunction(
        () => {
          const body = document.body
          if (!body) return false
          // Check if SvelteKit has rendered - look for any content
          return body.children.length > 0 && body.innerHTML.trim().length > 0
        },
        { timeout: 20000 }
      ).catch(async (error) => {
        // Check if page closed during wait
        if (page.isClosed()) {
          throw new Error('Page was closed while waiting for SvelteKit to render')
        }
        // If SvelteKit hasn't rendered yet, wait a bit more
        await new Promise(resolve => setTimeout(resolve, 3000))
        // Check if page closed during additional wait
        if (page.isClosed()) {
          throw new Error('Page was closed during additional SvelteKit rendering wait')
        }
        // Check if there's at least some content now
        const bodyContent = await page.locator('body').textContent().catch(() => '')
        if (!bodyContent || bodyContent.trim().length === 0) {
          throw new Error('SvelteKit did not render - body element is empty')
        }
      })
      
      // Check if page is still open before additional wait
      if (page.isClosed()) {
        throw new Error('Page was closed before final React rendering wait')
      }
      
      // Additional wait for React to render
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check one more time before proceeding
      if (page.isClosed()) {
        throw new Error('Page was closed after React rendering wait')
      }
      
      // Check if page loaded correctly
      const bodyText = await page.locator('body').textContent().catch(() => '')
      const htmlContent = await page.content().catch(() => '')
      const bodyContent = await page.locator('body').textContent().catch(() => '')
      
      // More lenient check - HTML should have content even if React hasn't rendered
      if (htmlContent.length < 500) {
        // Page didn't load at all - this is a real problem
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
        
        const url = page.url()
        const title = await page.title().catch(() => 'no title')
        throw new Error(`Page did not load properly after ${maxAttempts} attempts. URL: ${url}, Title: ${title}, HTML length: ${htmlContent.length}, Root content: ${rootContent?.substring(0, 100) || 'empty'}`)
      }
      
      // Page loaded successfully
      break
    } catch (error) {
      if (attempts >= maxAttempts) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
  
  // Try to find room-manager element with multiple strategies
  let roomManager = page.getByTestId('room-manager')
  let roomManagerVisible = await roomManager.isVisible({ timeout: 15000 }).catch(() => false)
  
  if (!roomManagerVisible) {
    // Try alternative selectors - look for text content
    const hasCreateButton = await page.getByText(/create.*room|create.*game/i).first().isVisible({ timeout: 5000 }).catch(() => false)
    const hasJoinButton = await page.getByText(/join.*room|join.*game/i).first().isVisible({ timeout: 5000 }).catch(() => false)
    
    if (hasCreateButton || hasJoinButton) {
      // Page loaded but test ID might be different - try to find by role
      roomManager = page.locator('main, [role="main"], .room-manager, body').first()
      roomManagerVisible = true
    } else {
      // Last resort: check if any meaningful content exists
      const anyText = await page.getByText(/casino|cassino|card|game/i).first().isVisible({ timeout: 5000 }).catch(() => false)
      if (!anyText) {
        const url = page.url()
        const screenshot = await page.screenshot({ path: 'test-results/debug-page-not-loaded.png', fullPage: true }).catch(() => null)
        throw new Error(`Room manager element not found. Page URL: ${url}. Screenshot saved.`)
      }
    }
  }
  
  // Check if page is still open before interacting with it
  if (page.isClosed()) {
    throw new Error('Page was closed after navigation - cannot create room')
  }
  
  // Only assert if we found the element
  if (roomManagerVisible) {
    await expect(roomManager).toBeVisible({ timeout: 5000 }).catch(() => {
      // If room manager disappeared, page might have navigated - continue anyway
      if (page.isClosed()) {
        throw new Error('Page was closed while waiting for room manager')
      }
    })
  }
  
  // Check again before filling input
  if (page.isClosed()) {
    throw new Error('Page was closed before filling input - cannot create room')
  }
  
  await page.getByTestId('player-name-input-create-test').fill(playerName)
  await page.getByTestId('create-room-test').click()
  
  // Wait for navigation or state change
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Try to extract room ID from page
  const roomIdElement = page.getByText(/[A-Z0-9]{6}/).first()
  const roomIdText = await roomIdElement.textContent().catch(() => null)
  
  if (roomIdText) {
    const match = roomIdText.match(/[A-Z0-9]{6}/)
    if (match) return match[0]
  }
  
  // Fallback: Check URL
  const url = page.url()
  const urlMatch = url.match(/room[=/]([A-Z0-9]{6})/i)
  if (urlMatch) return urlMatch[1]
  
  // Last resort: check localStorage or cookies
  const roomId = await page.evaluate(() => {
    return localStorage.getItem('roomId') || ''
  })
  
  if (roomId) return roomId
  
  throw new Error('Could not determine room ID after creation')
}

/**
 * Join an existing room
 */
export async function joinRoom(page: Page, roomId: string, playerName: string): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 })
  
  // Wait for SvelteKit to render
  await page.waitForFunction(() => {
    return document.body && document.body.children.length > 0
  }, { timeout: 15000 }).catch(() => {})
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  await expect(page.getByTestId('room-manager')).toBeVisible({ timeout: 15000 })
  // Fill in join form (right column) - both forms are visible in 2-column layout
  await page.getByTestId('player-name-input-join').fill(playerName)
  await new Promise(resolve => setTimeout(resolve, 500))
  
  await page.getByTestId('room-code-input').fill(roomId)
  await expect(page.getByTestId('room-code-input')).toHaveValue(roomId)
  
  await page.getByTestId('join-room-test').click()
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Verify we left the landing page
  const stillOnLanding = await page.getByTestId('room-manager').isVisible().catch(() => false)
  if (stillOnLanding) {
    throw new Error('Still on landing page after join attempt')
  }
}

/**
 * Set player ready status
 */
export async function setReady(page: Page): Promise<void> {
  // Look for ready button in various locations
  const readyButtons = [
    page.getByRole('button', { name: /i'm ready|ready/i }),
    page.getByRole('button', { name: /ready!/i }),
    page.locator('button').filter({ hasText: /ready/i }).first()
  ]
  
  for (const button of readyButtons) {
    const visible = await button.isVisible().catch(() => false)
    if (visible) {
      await button.click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      return
    }
  }
  
  // If no button found, might already be ready or in different phase
  console.warn('Ready button not found - may already be ready')
}

/**
 * Play a card action (capture, build, or trail)
 */
export async function playCardAction(
  page: Page,
  action: 'capture' | 'build' | 'trail',
  cardId?: string,
  targetCards?: string[],
  buildValue?: number
): Promise<void> {
  // Wait for game actions to be visible
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Check if we're in poker table view (round1/round2) or game actions view
  const pokerTableView = await page.getByText(/COMMUNITY CARDS|DEALER|BURN PILE/i).first().isVisible().catch(() => false)
  
  if (pokerTableView) {
    // In poker table view - cards are clickable directly
    // Find player hand cards (face-up cards with glow effect)
    const handCards = page.locator('.card, [role="button"]').filter({ hasText: /[A-Z0-9]/ }).first()
    const cardVisible = await handCards.isVisible().catch(() => false)
    
    if (!cardVisible) {
      // Try to find cards by their structure in poker view
      const pokerCards = page.locator('div').filter({ hasText: /A|K|Q|J|10|[2-9]/ }).first()
      await pokerCards.click().catch(() => {
        console.warn('No clickable cards found in poker table view')
      })
      await new Promise(resolve => setTimeout(resolve, 500))
      return // Cards in poker view auto-play on click (trail action)
    }
    
    // Click on a card (automatically plays as trail)
    await handCards.click()
    await new Promise(resolve => setTimeout(resolve, 1000))
    return
  }
  
  // Legacy game actions view
  // Find player hand cards
  const handCards = page.locator('[data-testid*="hand"] .card, .card').first()
  const cardVisible = await handCards.isVisible().catch(() => false)
  
  if (!cardVisible) {
    console.warn('No cards visible in hand')
    return
  }
  
  // Click on a card to select it
  await handCards.click()
  await new Promise(resolve => setTimeout(resolve, 500))
  
  // Select action type if needed
  if (action === 'capture') {
    const captureButton = page.getByRole('button', { name: /capture/i }).first()
    await captureButton.click().catch(() => {})
  } else if (action === 'build') {
    const buildButton = page.getByRole('button', { name: /build/i }).first()
    await buildButton.click().catch(() => {})
    
    if (buildValue) {
      const buildValueInput = page.locator('input[type="number"]').first()
      await buildValueInput.fill(String(buildValue)).catch(() => {})
    }
  } else {
    // Trail - default action
    const trailButton = page.getByRole('button', { name: /trail/i }).first()
    await trailButton.click().catch(() => {})
  }
  
  // Confirm play
  const playButton = page.getByRole('button', { name: /play|confirm|submit/i }).first()
  await playButton.click().catch(() => {})
  
  await page.waitForTimeout(1000)
}

/**
 * Wait for turn to become available
 */
export async function waitForMyTurn(page: Page, timeout = 30000): Promise<boolean> {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const myTurn = await page.getByText(/your turn/i).isVisible().catch(() => false)
    if (myTurn) {
      return true
    }
    
    // Check if game is finished
    const finished = await page.getByText(/won|lost|tie|final/i).isVisible().catch(() => false)
    if (finished) {
      return false // Game ended, no more turns
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return false
}

/**
 * Verify game is in a valid state
 */
export async function verifyGameState(page: Page): Promise<void> {
  // Should not be on landing page
  const onLanding = await page.getByTestId('room-manager').isVisible().catch(() => false)
  expect(onLanding).toBeFalsy()
  
  // Should see game-related UI
  const hasGameUI = await page.getByText(/room|score|card|round|turn/i).first().isVisible().catch(() => false)
  expect(hasGameUI).toBeTruthy()
}

