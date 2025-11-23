import { test, expect } from '@playwright/test'

test('landing renders and shows actions', async ({ page }) => {
  // Set a global timeout for the test
  test.setTimeout(30000)
  
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 15000 })
  
  // Wait for SvelteKit to render
  await page.waitForFunction(() => {
    return document.body && document.body.children.length > 0
  }, { timeout: 15000 })
  
  // Wait a bit for SvelteKit to hydrate
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Check for Create button with multiple strategies
  const createButton = page.getByText(/Create.*Game|Create New Game/i)
  const createButtonVisible = await createButton.isVisible({ timeout: 10000 }).catch(() => false)
  
  if (!createButtonVisible) {
    // Try to find by test ID
    const createByTestId = await page.getByTestId('create-room-test').isVisible({ timeout: 3000 }).catch(() => false)
    expect(createByTestId || createButtonVisible).toBeTruthy()
  } else {
    expect(createButtonVisible).toBeTruthy()
  }
  
  // Check for either "Join with Code" or "Join Random Game" or "Join Existing Game"
  // Try multiple selectors with timeout
  const joinOptions = [
    page.getByText(/Join with Code/i),
    page.getByText(/Join Random Game/i),
    page.getByText(/Join.*Game|Join Existing Game/i),
    page.getByTestId('join-random-room-button'),
    page.getByTestId('room-code-input') // Join form is always visible in 2-column layout
  ]
  
  let hasJoinOption = false
  for (const option of joinOptions) {
    try {
      hasJoinOption = await option.isVisible({ timeout: 2000 })
      if (hasJoinOption) break
    } catch {
      // Continue to next option
    }
  }
  
  expect(hasJoinOption).toBeTruthy()
})


