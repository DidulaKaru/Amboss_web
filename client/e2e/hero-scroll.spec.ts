import { test, expect } from '@playwright/test'

test.describe('Landing Page & Hero Navigation', () => {
  test('renders landing page with technical navigation and hero section', async ({ page }) => {
    await page.goto('/')

    // Check title
    await expect(page).toHaveTitle(/AMBOSS/i)

    // Check brand navigation
    const nav = page.locator('header')
    await expect(nav).toBeVisible()

    // Specific desktop navigation links
    const quoteLink = page.locator('header nav a[href="/quote"]').first()
    await expect(quoteLink).toBeVisible()
    await expect(quoteLink).toContainText('Instant Quote')

    const shopLink = page.locator('header nav a[href="/shop"]').first()
    await expect(shopLink).toBeVisible()
    await expect(shopLink).toContainText('Shop')

    // Static, crawlable page heading (does not change with scroll)
    const heroHeading = page.locator('h1')
    await expect(heroHeading).toHaveCount(1)
    await expect(heroHeading).toBeVisible()
    // BUG-05: heading copy changed to "From Concept to Reality" (commit 2e79235) but this
    // assertion was not updated, turning CI red on dev.
    await expect(heroHeading).toHaveText(/from concept to reality/i)

    // Stage title lives in a separate aria-live region and starts at "Concept"
    const stageTitle = page.getByTestId('hero-stage-title')
    await expect(stageTitle).toHaveText('Concept')
    await expect(page.getByTestId('hero-stage')).toHaveAttribute('aria-live', 'polite')

    // Scroll down and verify services & capabilities sections
    const services = page.locator('#services')
    await services.scrollIntoViewIfNeeded()
    await expect(services).toBeVisible()

    const capabilities = page.locator('#capabilities')
    await capabilities.scrollIntoViewIfNeeded()
    await expect(capabilities).toBeVisible()
  })
})
