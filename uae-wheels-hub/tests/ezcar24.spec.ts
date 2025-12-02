import { test, expect } from '@playwright/test'

test.describe('Ezcar24 homepage', () => {
  test('loads and has a valid title', async ({ page }) => {
    const url = 'https://ezcar24.com/'
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })

    // Basic network check
    expect(response, 'Navigation returned a response').toBeTruthy()
    expect(response?.ok(), `HTTP ${response?.status()} from ${url}`).toBeTruthy()

    // URL and title checks
    await expect(page).toHaveURL(/ezcar24\.com\/?/)
    // Title may change; assert it is not empty
    const title = await page.title()
    expect(title.trim().length).toBeGreaterThan(0)

    // Optional: quick visual smoke screenshot (stored under test-results)
    await page.screenshot({ path: `test-results/ezcar24-home.png`, fullPage: true })
  })
})

