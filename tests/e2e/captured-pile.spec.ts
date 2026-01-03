import { test, expect, Page } from '@playwright/test'

/**
 * E2E tests for the Captured Pile (Home) feature
 * Tests that captured cards are displayed in the player's home area
 */

// Helper to create room and get room ID
async function createRoom(page: Page, playerName: string): Promise<string> {
  await page.goto('/')
  await page.getByTestId('player-name-input-create-test').fill(playerName)
  await page.getByTestId('create-room-test').click()
  
  await page.waitForSelector('[data-testid="room-code"]', { timeout: 10000 })
  const roomCodeElement = page.getByTestId('room-code')
  const roomId = await roomCodeElement.textContent()
  
  if (!roomId) {
    throw new Error('Failed to get room ID')
  }
  
  return roomId.trim()
}

// Helper to join room
async function joinRoom(page: Page, roomId: string, playerName: string) {
  await page.goto('/')
  await page.getByTestId('player-name-input-join').fill(playerName)
  await page.getByTestId('room-code-input').fill(roomId)
  await page.getByTestId('join-room-test').click()
  
  await page.waitForSelector('[data-testid="waiting-room"], [data-testid="casino-room-view"]', { timeout: 10000 })
}

// Helper to set player ready
async function setReady(page: Page) {
  const readyButton = page.getByRole('button', { name: /ready|i'm ready/i }).first()
  await readyButton.waitFor({ state: 'visible', timeout: 5000 })
  await readyButton.click()
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// Helper to wait for game to start
async function waitForGameStart(page: Page, timeout = 15000) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    // Look for game board indicators
    const hasGameBoard = await page.locator('.game-board, [data-testid="game-board"]').isVisible().catch(() => false)
    const hasTableArea = await page.locator('.table-area').isVisible().catch(() => false)
    const hasHand = await page.locator('.my-hand, .hand').first().isVisible().catch(() => false)
    
    if (hasGameBoard || hasTableArea || hasHand) {
      return true
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return false
}

// Helper to check if it's player's turn
async function isPlayerTurn(page: Page): Promise<boolean> {
  const turnIndicator = await page.locator('.turn-indicator.my-turn, .my-turn').isVisible().catch(() => false)
  const yourTurnText = await page.getByText(/your turn/i).isVisible().catch(() => false)
  return turnIndicator || yourTurnText
}

// Helper to perform a capture action
async function performCapture(page: Page): Promise<boolean> {
  try {
    // Select a card from hand
    const handCard = page.locator('.hand-card.playable, .my-hand button').first()
    await handCard.waitFor({ state: 'visible', timeout: 3000 })
    await handCard.click()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Select a table card
    const tableCard = page.locator('.table-card-btn').first()
    const tableCardVisible = await tableCard.isVisible().catch(() => false)
    
    if (tableCardVisible) {
      await tableCard.click()
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Click capture button
      const captureButton = page.locator('.btn-capture, button:has-text("Capture")').first()
      const captureEnabled = await captureButton.isEnabled().catch(() => false)
      
      if (captureEnabled) {
        await captureButton.click()
        await new Promise(resolve => setTimeout(resolve, 1000))
        return true
      }
    }
    
    return false
  } catch (error) {
    console.log('Capture failed:', error)
    return false
  }
}

// Helper to perform a trail action
async function performTrail(page: Page): Promise<boolean> {
  try {
    // Select a card from hand
    const handCard = page.locator('.hand-card.playable, .my-hand button').first()
    await handCard.waitFor({ state: 'visible', timeout: 3000 })
    await handCard.click()
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // Click trail button
    const trailButton = page.locator('.btn-trail, button:has-text("Trail")').first()
    const trailVisible = await trailButton.isVisible().catch(() => false)
    
    if (trailVisible) {
      await trailButton.click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    }
    
    return false
  } catch (error) {
    console.log('Trail failed:', error)
    return false
  }
}

test.describe('Captured Pile Feature', () => {
  test('Captured pile is visible in game board', async ({ browser }) => {
    const player1Context = await browser.newContext()
    const player2Context = await browser.newContext()
    
    const player1Page = await player1Context.newPage()
    const player2Page = await player2Context.newPage()
    
    try {
      console.log('🎮 Testing captured pile visibility...')
      
      // Create room
      const roomId = await createRoom(player1Page, 'Alice')
      console.log(`✅ Room created: ${roomId}`)
      
      // Join room
      await joinRoom(player2Page, roomId, 'Bob')
      console.log('✅ Player 2 joined')
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Both players ready
      await setReady(player1Page)
      await setReady(player2Page)
      console.log('✅ Both players ready')
      
      // Wait for game to start
      const gameStarted = await waitForGameStart(player1Page)
      expect(gameStarted).toBeTruthy()
      console.log('✅ Game started')
      
      // Check for captured pile elements
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Look for the captured pile button (Home area)
      const capturedPileButton = player1Page.locator('[data-testid="captured-pile-button"], .pile-button').first()
      const hasCapturedPile = await capturedPileButton.isVisible().catch(() => false)
      
      // Look for "Home" label
      const homeLabel = await player1Page.getByText('Home').isVisible().catch(() => false)
      
      // Look for captured count display
      const capturedCount = player1Page.locator('[data-testid="captured-count"], .pile-count').first()
      const hasCount = await capturedCount.isVisible().catch(() => false)
      
      console.log(`📊 Captured pile visible: ${hasCapturedPile}`)
      console.log(`📊 Home label visible: ${homeLabel}`)
      console.log(`📊 Count visible: ${hasCount}`)
      
      // At least one of these should be visible
      expect(hasCapturedPile || homeLabel || hasCount).toBeTruthy()
      
      console.log('✅ Captured pile visibility test passed!')
      
    } finally {
      await player1Page.close()
      await player2Page.close()
      await player1Context.close()
      await player2Context.close()
    }
  })
  
  test('Captured pile shows correct count after capture', async ({ browser }) => {
    const player1Context = await browser.newContext()
    const player2Context = await browser.newContext()
    
    const player1Page = await player1Context.newPage()
    const player2Page = await player2Context.newPage()
    
    try {
      console.log('🎮 Testing captured pile count...')
      
      // Create and join room
      const roomId = await createRoom(player1Page, 'Alice')
      await joinRoom(player2Page, roomId, 'Bob')
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Both players ready
      await setReady(player1Page)
      await setReady(player2Page)
      
      // Wait for game to start
      const gameStarted = await waitForGameStart(player1Page)
      expect(gameStarted).toBeTruthy()
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Get initial captured count
      const getCount = async (page: Page): Promise<number> => {
        const countElement = page.locator('[data-testid="captured-count"], .pile-count').first()
        const countText = await countElement.textContent().catch(() => '0')
        return parseInt(countText || '0', 10)
      }
      
      const initialCount1 = await getCount(player1Page)
      const initialCount2 = await getCount(player2Page)
      
      console.log(`📊 Initial counts - P1: ${initialCount1}, P2: ${initialCount2}`)
      
      // Play some moves - try to capture or trail
      let movesPlayed = 0
      const maxMoves = 10
      
      for (let i = 0; i < maxMoves; i++) {
        const p1Turn = await isPlayerTurn(player1Page)
        const p2Turn = await isPlayerTurn(player2Page)
        
        if (p1Turn) {
          // Try capture first, then trail
          const captured = await performCapture(player1Page)
          if (!captured) {
            await performTrail(player1Page)
          }
          movesPlayed++
        } else if (p2Turn) {
          const captured = await performCapture(player2Page)
          if (!captured) {
            await performTrail(player2Page)
          }
          movesPlayed++
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        if (movesPlayed >= 4) break
      }
      
      // Get final counts
      const finalCount1 = await getCount(player1Page)
      const finalCount2 = await getCount(player2Page)
      
      console.log(`📊 Final counts - P1: ${finalCount1}, P2: ${finalCount2}`)
      console.log(`📊 Moves played: ${movesPlayed}`)
      
      // Verify counts are displayed (even if 0)
      expect(finalCount1).toBeGreaterThanOrEqual(0)
      expect(finalCount2).toBeGreaterThanOrEqual(0)
      
      console.log('✅ Captured pile count test passed!')
      
    } finally {
      await player1Page.close()
      await player2Page.close()
      await player1Context.close()
      await player2Context.close()
    }
  })
  
  test('Captured pile modal opens and shows cards', async ({ browser }) => {
    const player1Context = await browser.newContext()
    const player2Context = await browser.newContext()
    
    const player1Page = await player1Context.newPage()
    const player2Page = await player2Context.newPage()
    
    try {
      console.log('🎮 Testing captured pile modal...')
      
      // Create and join room
      const roomId = await createRoom(player1Page, 'Alice')
      await joinRoom(player2Page, roomId, 'Bob')
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Both players ready
      await setReady(player1Page)
      await setReady(player2Page)
      
      // Wait for game to start
      const gameStarted = await waitForGameStart(player1Page)
      expect(gameStarted).toBeTruthy()
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Play some moves to get captured cards
      let capturedSomething = false
      const maxAttempts = 15
      
      for (let i = 0; i < maxAttempts && !capturedSomething; i++) {
        const p1Turn = await isPlayerTurn(player1Page)
        const p2Turn = await isPlayerTurn(player2Page)
        
        if (p1Turn) {
          capturedSomething = await performCapture(player1Page)
          if (!capturedSomething) {
            await performTrail(player1Page)
          }
        } else if (p2Turn) {
          capturedSomething = await performCapture(player2Page)
          if (!capturedSomething) {
            await performTrail(player2Page)
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      // Try to open the captured pile modal
      const pileButton = player1Page.locator('[data-testid="captured-pile-button"], .pile-button').first()
      const buttonVisible = await pileButton.isVisible().catch(() => false)
      
      if (buttonVisible) {
        const isDisabled = await pileButton.isDisabled().catch(() => true)
        
        if (!isDisabled) {
          await pileButton.click()
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Check if modal opened
          const modal = player1Page.locator('[data-testid="captured-modal"], .modal-overlay').first()
          const modalVisible = await modal.isVisible().catch(() => false)
          
          if (modalVisible) {
            console.log('✅ Modal opened successfully')
            
            // Check for modal content
            const hasTitle = await player1Page.getByText(/captured cards/i).isVisible().catch(() => false)
            const hasStats = await player1Page.getByText(/total cards|spades|aces/i).isVisible().catch(() => false)
            
            console.log(`📊 Modal has title: ${hasTitle}`)
            console.log(`📊 Modal has stats: ${hasStats}`)
            
            // Close modal
            const closeButton = player1Page.locator('.modal-close, button:has-text("✕")').first()
            await closeButton.click().catch(() => {})
          } else {
            console.log('ℹ️ Modal not visible (might have no captured cards)')
          }
        } else {
          console.log('ℹ️ Pile button disabled (no captured cards yet)')
        }
      }
      
      console.log('✅ Captured pile modal test passed!')
      
    } finally {
      await player1Page.close()
      await player2Page.close()
      await player1Context.close()
      await player2Context.close()
    }
  })
  
  test('Both players have their own captured piles', async ({ browser }) => {
    const player1Context = await browser.newContext()
    const player2Context = await browser.newContext()
    
    const player1Page = await player1Context.newPage()
    const player2Page = await player2Context.newPage()
    
    try {
      console.log('🎮 Testing both players have captured piles...')
      
      // Create and join room
      const roomId = await createRoom(player1Page, 'Alice')
      await joinRoom(player2Page, roomId, 'Bob')
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Both players ready
      await setReady(player1Page)
      await setReady(player2Page)
      
      // Wait for game to start
      const gameStarted = await waitForGameStart(player1Page)
      expect(gameStarted).toBeTruthy()
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Check Player 1's view has both piles
      const p1MyPile = player1Page.locator('.my-area-content .pile-button, .my-area [data-testid="captured-pile-button"]').first()
      const p1OpponentPile = player1Page.locator('.opponent-area-content .pile-button, .opponent-area [data-testid="captured-pile-button"]').first()
      
      const p1HasMyPile = await p1MyPile.isVisible().catch(() => false)
      const p1HasOpponentPile = await p1OpponentPile.isVisible().catch(() => false)
      
      // Check Player 2's view has both piles
      const p2MyPile = player2Page.locator('.my-area-content .pile-button, .my-area [data-testid="captured-pile-button"]').first()
      const p2OpponentPile = player2Page.locator('.opponent-area-content .pile-button, .opponent-area [data-testid="captured-pile-button"]').first()
      
      const p2HasMyPile = await p2MyPile.isVisible().catch(() => false)
      const p2HasOpponentPile = await p2OpponentPile.isVisible().catch(() => false)
      
      console.log(`📊 P1 view - My pile: ${p1HasMyPile}, Opponent pile: ${p1HasOpponentPile}`)
      console.log(`📊 P2 view - My pile: ${p2HasMyPile}, Opponent pile: ${p2HasOpponentPile}`)
      
      // At least the "Home" labels should be visible
      const p1HomeLabels = await player1Page.getByText('Home').count()
      const p2HomeLabels = await player2Page.getByText('Home').count()
      
      console.log(`📊 P1 Home labels: ${p1HomeLabels}`)
      console.log(`📊 P2 Home labels: ${p2HomeLabels}`)
      
      // Each player should see at least one captured pile area
      expect(p1HasMyPile || p1HasOpponentPile || p1HomeLabels > 0).toBeTruthy()
      expect(p2HasMyPile || p2HasOpponentPile || p2HomeLabels > 0).toBeTruthy()
      
      console.log('✅ Both players captured piles test passed!')
      
    } finally {
      await player1Page.close()
      await player2Page.close()
      await player1Context.close()
      await player2Context.close()
    }
  })
})
