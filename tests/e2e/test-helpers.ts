import { Page } from '@playwright/test'

/**
 * Wait for SvelteKit app to be fully loaded and hydrated
 */
export async function waitForSvelteKitApp(page: Page, timeout = 15000) {
  // Wait for DOM content to load
  await page.waitForLoadState('domcontentloaded')
  
  // Wait for SvelteKit body to have content
  await page.waitForFunction(() => {
    return document.body && document.body.children.length > 0
  }, { timeout })
  
  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {
    // Network idle might timeout, that's okay
  })
  
  // Give SvelteKit a moment to hydrate
  await page.waitForTimeout(1000)
}

/**
 * Navigate to a page and wait for SvelteKit to load
 */
export async function gotoAndWait(page: Page, url: string, timeout = 30000) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout })
  await waitForSvelteKitApp(page, timeout)
}
