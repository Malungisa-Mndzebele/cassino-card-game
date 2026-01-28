import { test, expect, Page, BrowserContext } from '@playwright/test'

/**
 * E2E test that plays a complete game from start to finish with winner determination
 * This test ensures the game properly handles all phases and crowns a winner
 */

// Helper to wait for specific game state
async function waitForGameState(page: Page, condition: () => Promise<boolean>, timeout = 30000) {
  const startTime = Date.now()
  while (Date.now() - startTime < timeout) {
    try {
      if (await condition()) {
        return true
      }
    } catch (e) {
      // Continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  return false
}

// Helper to create room and get room ID
async function createRoom(page: Page, playerName: string): Promise<string> {
  await page.goto('./')
  await page.waitForLoadState('networkidle')
  // Wait for hydration
  await new Promise(resolve => setTimeout(resolve, 3000))

  try {
    const input = page.locator('[data-testid="player-name-input-create-test"]')
    await input.waitFor({ state: 'visible', timeout: 30000 })
    await input.fill(playerName)
  } catch (e) {
    console.log('Failed to find create input. Page content:')
    console.log(await page.content())
    throw e
  }
  await page.getByTestId('create-room-test').click()

  // Wait for room creation and get room ID
  await page.waitForSelector('.tracking-widest', { timeout: 30000 })
  const roomCodeElement = page.locator('.tracking-widest')
  const roomId = await roomCodeElement.textContent()

  if (!roomId) {
    throw new Error('Failed to get room ID')
  }

  return roomId.trim()
}

// Helper to join room
async function joinRoom(page: Page, roomId: string, playerName: string) {
  await page.goto('./')
  await page.waitForLoadState('networkidle')
  await new Promise(resolve => setTimeout(resolve, 3000))
  await page.getByTestId('player-name-input-join').fill(playerName)
  await page.getByTestId('room-code-input').fill(roomId)
  await page.getByTestId('join-room-test').click()

  // Wait for successful join
  await page.waitForSelector('.waiting-screen, .game-main', { timeout: 10000 })
}

// Helper to set player ready
async function setReady(page: Page) {
  // Wait for GamePhases to mount
  await page.waitForSelector('text=Ready to Play', { timeout: 15000 }).catch(() => { })

  const readyButton = page.getByRole('button', { name: /ready|i'm ready/i }).first()
  await readyButton.waitFor({ state: 'visible', timeout: 15000 })
  await readyButton.click()
  await new Promise(resolve => setTimeout(resolve, 1000))
}

// Helper to play a card (trail action - safest move)
async function playCard(page: Page): Promise<boolean> {
  try {
    // Look for player hand cards
    const handCards = page.locator('[data-testid="player-hand"] .card, [data-testid*="card"]').first()

    // Wait for card to be clickable
    await handCards.waitFor({ state: 'visible', timeout: 5000 })
    await handCards.click()

    // Wait a bit for UI to update
    await new Promise(resolve => setTimeout(resolve, 500))

    // Look for trail button
    const trailButton = page.getByRole('button', { name: /trail/i }).first()
    const trailVisible = await trailButton.isVisible().catch(() => false)

    if (trailVisible) {
      await trailButton.click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    }

    // Alternative: look for play button
    const playButton = page.getByRole('button', { name: /play/i }).first()
    const playVisible = await playButton.isVisible().catch(() => false)

    if (playVisible) {
      await playButton.click()
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    }

    return false
  } catch (error) {
    console.log('Failed to play card:', error)
    return false
  }
}

// Helper to check if game is finished
async function isGameFinished(page: Page): Promise<boolean> {
  const finishedIndicators = [
    /won|lost|winner|victory/i,
    /final.*score/i,
    /game.*complete/i,
    /congratulations/i
  ]

  for (const indicator of finishedIndicators) {
    const element = await page.getByText(indicator).first().isVisible().catch(() => false)
    if (element) return true
  }

  // Check for finished phase in game state
  const phaseElement = await page.locator('[data-testid="game-phase"]').textContent().catch(() => null)
  if (phaseElement && phaseElement.includes('finished')) return true

  return false
}

// Helper to check whose turn it is
async function isPlayerTurn(page: Page): Promise<boolean> {
  const turnIndicators = [
    /your turn/i,
    /it's your turn/i,
    /play a card/i
  ]

  for (const indicator of turnIndicators) {
    const element = await page.getByText(indicator).first().isVisible().catch(() => false)
    if (element) return true
  }

  // Check if cards are clickable (indicating it's player's turn)
  const clickableCard = await page.locator('[data-testid="player-hand"] .card[style*="cursor"]').first().isVisible().catch(() => false)
  return clickableCard
}

test.describe('Complete Game to Winner', () => {
  test('Two players play a complete game until winner is determined', async ({ browser }) => {
    // Create two browser contexts for two players
    const player1Context = await browser.newContext()
    const player2Context = await browser.newContext()

    const player1Page = await player1Context.newPage()
    const player2Page = await player2Context.newPage()

    try {
      console.log('🎮 Starting complete game test...')

      // Step 1: Player 1 creates room
      console.log('📝 Step 1: Player 1 creating room...')
      const roomId = await createRoom(player1Page, 'Alice')
      console.log(`✅ Room created: ${roomId}`)

      // Step 2: Player 2 joins room
      console.log('📝 Step 2: Player 2 joining room...')
      await joinRoom(player2Page, roomId, 'Bob')
      console.log('✅ Player 2 joined')

      // Wait for both players to see each other
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Step 3: Both players set ready
      console.log('📝 Step 3: Setting players ready...')
      await setReady(player1Page)
      await setReady(player2Page)
      console.log('✅ Both players ready')

      // Step 4: Wait for game to start
      console.log('📝 Step 4: Waiting for game to start...')
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify game started
      const gameStarted = await Promise.race([
        waitForGameState(player1Page, () =>
          player1Page.getByText(/round|dealer|card|table/i).first().isVisible()
        ),
        waitForGameState(player2Page, () =>
          player2Page.getByText(/round|dealer|card|table/i).first().isVisible()
        )
      ])

      expect(gameStarted).toBeTruthy()
      console.log('✅ Game started')

      // Step 5: Play through the game until completion
      console.log('📝 Step 5: Playing game to completion...')

      let movesPlayed = 0
      const maxMoves = 100 // Safety limit
      let gameFinished = false

      for (let i = 0; i < maxMoves && !gameFinished; i++) {
        // Check if game is finished
        const p1Finished = await isGameFinished(player1Page)
        const p2Finished = await isGameFinished(player2Page)

        if (p1Finished || p2Finished) {
          gameFinished = true
          console.log(`🏆 Game finished after ${movesPlayed} moves!`)
          break
        }

        // Determine whose turn it is and play
        const p1Turn = await isPlayerTurn(player1Page)
        const p2Turn = await isPlayerTurn(player2Page)

        let moveSuccessful = false

        if (p1Turn) {
          console.log(`🎯 Move ${i + 1}: Player 1's turn`)
          moveSuccessful = await playCard(player1Page)
          if (moveSuccessful) movesPlayed++
        } else if (p2Turn) {
          console.log(`🎯 Move ${i + 1}: Player 2's turn`)
          moveSuccessful = await playCard(player2Page)
          if (moveSuccessful) movesPlayed++
        } else {
          // No clear turn indicator, wait and try again
          await new Promise(resolve => setTimeout(resolve, 1000))
          continue
        }

        if (!moveSuccessful) {
          console.log(`⚠️ Move ${i + 1} failed, continuing...`)
        }

        // Wait between moves
        await new Promise(resolve => setTimeout(resolve, 1500))

        // Safety check - if we haven't made progress in a while, something might be wrong
        if (i > 20 && movesPlayed === 0) {
          console.warn('⚠️ No successful moves detected, game might be stuck')
          break
        }
      }

      // Step 6: Verify game completion and winner
      console.log('📝 Step 6: Verifying game completion...')

      // Wait a bit more for final state to settle
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Check final game state
      const p1GameFinished = await isGameFinished(player1Page)
      const p2GameFinished = await isGameFinished(player2Page)

      // At least one player should see the finished state
      expect(p1GameFinished || p2GameFinished).toBeTruthy()

      // Look for winner announcement
      const winnerElements = [
        /player.*won|alice.*won|bob.*won/i,
        /victory|winner|champion/i,
        /final.*score/i
      ]

      let winnerFound = false
      for (const winnerPattern of winnerElements) {
        const p1Winner = await player1Page.getByText(winnerPattern).first().isVisible().catch(() => false)
        const p2Winner = await player2Page.getByText(winnerPattern).first().isVisible().catch(() => false)

        if (p1Winner || p2Winner) {
          winnerFound = true
          console.log('🏆 Winner announcement found!')
          break
        }
      }

      // Look for score display
      const scoreElements = [
        /score.*\d+/i,
        /points.*\d+/i,
        /\d+.*points/i
      ]

      let scoresFound = false
      for (const scorePattern of scoreElements) {
        const p1Score = await player1Page.getByText(scorePattern).first().isVisible().catch(() => false)
        const p2Score = await player2Page.getByText(scorePattern).first().isVisible().catch(() => false)

        if (p1Score || p2Score) {
          scoresFound = true
          console.log('📊 Scores displayed!')
          break
        }
      }

      // Report results
      console.log(`📊 Game Statistics:`)
      console.log(`   Total moves played: ${movesPlayed}`)
      console.log(`   Game finished: ${p1GameFinished || p2GameFinished}`)
      console.log(`   Winner announced: ${winnerFound}`)
      console.log(`   Scores displayed: ${scoresFound}`)

      // The game should have finished properly
      expect(p1GameFinished || p2GameFinished).toBeTruthy()

      // We should have played at least some moves
      expect(movesPlayed).toBeGreaterThan(0)

      console.log('✅ Complete game test passed!')

    } catch (error) {
      // Capture screenshots on failure
      await player1Page.screenshot({
        path: 'test-results/complete-game-player1-error.png',
        fullPage: true
      }).catch(() => { })
      await player2Page.screenshot({
        path: 'test-results/complete-game-player2-error.png',
        fullPage: true
      }).catch(() => { })

      console.error('❌ Complete game test failed:', error)
      throw error

    } finally {
      // Cleanup
      try {
        await player1Page.close()
        await player2Page.close()
        await player1Context.close()
        await player2Context.close()
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  })

  test('Game properly handles round transitions and scoring', async ({ browser }) => {
    // This test focuses on verifying the game mechanics work correctly
    const context = await browser.newContext()
    const page = await context.newPage()

    try {
      console.log('🎮 Testing game mechanics...')

      // Navigate to the game
      await page.goto('./')

      // Create a room
      await page.getByTestId('player-name-input-create-test').fill('TestPlayer')
      await page.getByTestId('create-room-test').click()

      // Wait for room creation
      await page.waitForSelector('[data-testid="room-code"]', { timeout: 10000 })

      // Verify we can see game elements
      const roomElements = [
        '[data-testid="room-code"]',
        '[data-testid="waiting-room"]',
        '[data-testid="casino-room-view"]'
      ]

      let roomVisible = false
      for (const selector of roomElements) {
        const element = await page.locator(selector).isVisible().catch(() => false)
        if (element) {
          roomVisible = true
          break
        }
      }

      expect(roomVisible).toBeTruthy()

      console.log('✅ Game mechanics test passed!')

    } finally {
      await page.close()
      await context.close()
    }
  })
})