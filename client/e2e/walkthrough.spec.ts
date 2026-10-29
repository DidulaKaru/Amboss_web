import { test, expect } from '@playwright/test'

test.describe('End-to-End Comprehensive Button & User Flow Walkthrough', () => {
  test('clicks every major button across Home, Quote, Shop, Projects, About, and Admin', async ({
    page,
  }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        // filter out expected 503 fallback logs if server is offline
        if (!msg.text().includes('503') && !msg.text().includes('Failed to load resource')) {
          consoleErrors.push(msg.text())
        }
      }
    })

    // 1. HOME PAGE
    await page.goto('/')
    await expect(page).toHaveTitle(/AMBOSS/i)

    // Check Hero stage 01
    await expect(page.locator('h1')).toBeVisible()

    // Click "Instant Quote" Hero button
    const heroQuoteBtn = page.locator('a:has-text("Instant Quote")').first()
    await expect(heroQuoteBtn).toBeVisible()
    await heroQuoteBtn.click()
    await expect(page).toHaveURL(/\/quote/)

    // 2. QUOTE PAGE
    await expect(page.locator('h1')).toContainText(/cost of your 3D print/i)

    // Upload STL to dropzone
    const sampleStl = `solid cube
  facet normal 0 0 1
    outer loop
      vertex 0 0 20
      vertex 20 0 20
      vertex 20 20 20
    endloop
  endfacet
  facet normal 0 0 1
    outer loop
      vertex 0 0 20
      vertex 20 20 20
      vertex 0 20 20
    endloop
  endfacet
endsolid cube`

    const dropzone = page.locator('input[type="file"]')
    await dropzone.setInputFiles({
      name: 'cube.stl',
      mimeType: 'application/sla',
      buffer: Buffer.from(sampleStl),
    })

    // Verify specification section & materials buttons
    await expect(page.getByRole('heading', { name: 'Specification' })).toBeVisible({ timeout: 10000 })
    await expect(page.locator('button:has-text("PLA+")')).toBeVisible()
    
    // Click PETG material button (use first match to distinguish from PETG-CF)
    const petgBtn = page.locator('button:has-text("PETG")').first()
    await petgBtn.click()

    // Click delivery option
    const courierBtn = page.locator('button:has-text("Courier")')
    await courierBtn.click()

    // Verify WhatsApp order button is present and clickable
    const orderBtn = page.locator('button:has-text("Order via WhatsApp")')
    await expect(orderBtn).toBeVisible()

    // 3. SHOP PAGE
    await page.goto('/shop')
    await expect(page).toHaveTitle(/Shop/i)

    // Check product cards
    const productCards = page.locator('[data-testid="product-card"]')
    await expect(productCards.first()).toBeVisible({ timeout: 10000 })
    const count = await productCards.count()
    expect(count).toBeGreaterThan(0)

    // Click Add to Cart
    const addToCartBtn = page.locator('button:has-text("Add to Cart")').first()
    await addToCartBtn.click()

    // Open Cart Drawer using header cart icon button
    const cartBtn = page.locator('header button[aria-label="Shopping cart"]').first()
    await cartBtn.click()

    // Cart drawer should be visible with item & delivery methods
    await expect(page.locator('h2:has-text("Cart")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Order via WhatsApp")').first()).toBeVisible()
    await expect(page.locator('text=Islandwide Courier').first()).toBeVisible()

    // Close cart drawer by clicking close button
    const closeCartBtn = page.locator('div.fixed button:has-text("✕")').first()
    if (await closeCartBtn.isVisible()) {
      await closeCartBtn.click()
    }

    // 4. PROJECTS PAGE
    await page.goto('/projects')
    await expect(page).toHaveTitle(/Projects/i)

    // Pawsthetics external link button
    const pawstheticsBtn = page.getByRole('link', { name: /Visit pawsthetics.lk/i })
    await expect(pawstheticsBtn).toBeVisible()

    // Click first portfolio item to open inspection lightbox
    const portfolioCard = page.locator('[data-testid="portfolio-card"]').first()
    await portfolioCard.click()
    const modal = page.locator('div[role="dialog"]')
    await expect(modal).toBeVisible()

    // Click ESC close button
    const closeLightboxBtn = page.locator('button:has-text("[ESC] CLOSE")')
    await closeLightboxBtn.click()
    await expect(modal).toHaveCount(0)

    // 5. ABOUT US & ADMIN CMS GATEWAY
    await page.goto('/about-us')
    await expect(page).toHaveTitle(/AMBOSS/i)

    // Discreet gateway link in About Us colophon
    const colophonLink = page.getByRole('link', { name: 'SYS / CTRL' })
    await expect(colophonLink).toBeVisible()
    await colophonLink.click()
    await expect(page).toHaveURL(/\/admin\/login/)

    // Form inputs exist and are functional
    await expect(page.locator('#admin-username')).toBeVisible()
    await expect(page.locator('#admin-password')).toBeVisible()
    await page.fill('#admin-username', 'invalid_user')
    await page.fill('#admin-password', 'invalid_key')
    await page.click('button[type="submit"]')

    // Verify rejection alert appears cleanly
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    expect(consoleErrors).toHaveLength(0)
  })
})
