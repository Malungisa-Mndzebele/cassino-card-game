import { test, expect } from '@playwright/test'

test('landing renders and shows actions', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Create New Room')).toBeVisible()
  await expect(page.getByText('Join Existing Room')).toBeVisible()
})


