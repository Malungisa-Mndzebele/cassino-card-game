import { test, expect } from '@playwright/test'

test('landing renders and shows actions', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText(/Create.*Game|Create New Game/i)).toBeVisible()
  await expect(page.getByText(/Join.*Game|Join Existing Game/i)).toBeVisible()
})


