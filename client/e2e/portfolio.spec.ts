import { test, expect } from '@playwright/test'

test.describe('Projects Portfolio & News Removal Flow', () => {
  test('navigates to /projects, preserves Pawsthetics hero, and renders dynamic portfolio grid', async ({ page }) => {
    await page.goto('/projects')

    // 1. Verify Page Title
    await expect(page).toHaveTitle(/Projects/i)

    // 2. Verify Pawsthetics Hero Section is completely intact
    await expect(page.locator('text=Featured')).toBeVisible()
    await expect(page.locator('img[alt="Pawsthetics by Amboss"]')).toBeVisible()
    const pawstheticsLink = page.getByRole('link', { name: /Visit pawsthetics.lk/i })
    await expect(pawstheticsLink).toBeVisible()
    await expect(pawstheticsLink).toHaveAttribute('href', 'https://pawsthetics.lk/')

    // 3. Verify Dynamic Engineering Projects Section
    await expect(page.getByRole('heading', { name: /Engineering Projects & Portfolio/i })).toBeVisible()

    // 4. Verify portfolio cards adjust dynamically without category filter pills
    const portfolioCards = page.locator('[data-testid="portfolio-card"]')
    await expect(portfolioCards).toHaveCount(6)

    await expect(page.locator('text=Falcon 9 Pen')).toBeVisible()
    await expect(page.locator('text=Nightingale Near IR Vein Illuminator')).toBeVisible()
    await expect(page.locator('text=Body-Powered Mechanical Arm')).toBeVisible()
    await expect(page.locator('text=Rextro Souvenirs')).toBeVisible()

    // 5. Test Click-to-open Lightbox modal
    const falconCard = page.getByRole('button', { name: /Inspect Falcon 9 Pen/i })
    await falconCard.focus()
    await falconCard.press('Enter')

    // Lightbox modal verification
    const modal = page.getByRole('dialog')
    await expect(modal).toBeVisible()
    await expect(page.locator('#lightbox-title')).toHaveText('Falcon 9 Pen')
    await expect(modal).toHaveAccessibleDescription(/Aerospace-inspired pen/)

    // Focus moves into the dialog, scroll is locked
    const closeBtn = page.getByRole('button', { name: 'Close project details' })
    await expect(closeBtn).toBeFocused()
    await expect(page.locator('body')).toHaveCSS('overflow', 'hidden')

    // Tab stays trapped inside the dialog
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    expect(await modal.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await expect(page.locator('text=Aerospace-inspired pen')).toBeVisible()
    await expect(page.locator('text=Material')).toBeVisible()

    // Escape closes, focus returns to the card, scroll lock is released
    await page.keyboard.press('Escape')
    await expect(modal).toHaveCount(0)
    await expect(falconCard).toBeFocused()
    await expect(page.locator('body')).not.toHaveCSS('overflow', 'hidden')

    // Close button also works
    await falconCard.click()
    await expect(modal).toBeVisible()
    await page.getByRole('button', { name: 'Close project details' }).click()
    await expect(modal).toHaveCount(0)
  })

  test('confirms /news route cleanly redirects to /projects and News link is demolished from navigation', async ({ page }) => {
    // 1. Visit root and verify header navigation has no News link
    await page.goto('/')
    const navLinks = page.locator('header nav a')
    const navTexts = await navLinks.allTextContents()
    expect(navTexts.map((t) => t.trim().toLowerCase())).not.toContain('news')

    // 2. Direct navigation to /news must redirect to /projects
    await page.goto('/news')
    await expect(page).toHaveURL(/\/projects/)
    await expect(page.locator('text=Featured')).toBeVisible()
  })

  test('Admin CMS provides Portfolio Gallery tab with item controls', async ({ page }) => {
    // Intercept admin endpoints
    await page.route('**/api/v1/admin/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { username: 'admin', role: 'admin' },
        }),
      })
    })

    await page.route('**/api/v1/portfolio', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'mock-1',
              title: 'Falcon 9 Pen',
              category: 'fdm_printing',
              material: 'PLA+ / PETG',
              imageUrl: 'images/falcon9.jpg',
              aspectRatio: 'tall',
              description: 'Aerospace pen.',
              displayOrder: 1,
              isActive: true,
            },
          ],
        }),
      })
    })

    await page.goto('/admin')

    // Verify tab switcher exists
    const productsTab = page.locator('#tab-products')
    const portfolioTab = page.locator('#tab-portfolio')
    await expect(productsTab).toBeVisible()
    await expect(portfolioTab).toBeVisible()

    // Switch to Portfolio tab
    await portfolioTab.click()
    await expect(page.getByRole('button', { name: /NEW PORTFOLIO ITEM/i })).toBeVisible()
    await expect(page.locator('th:has-text("Artifact / Visual")')).toBeVisible()
    await expect(page.locator('td:has-text("Falcon 9 Pen")')).toBeVisible()
    await expect(page.locator('button:has-text("ACTIVE")')).toBeVisible()
  })
})
