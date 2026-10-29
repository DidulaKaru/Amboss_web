import { test, expect } from '@playwright/test'

test.describe('Maker Shop Browsing & Cart Flow', () => {
  test('browses catalog, selects variants from dropdowns, and manages cart', async ({ page }) => {
    await page.goto('/shop')

    // Page title and header
    await expect(page).toHaveTitle(/Shop/i)
    await expect(page.locator('h1')).toContainText(/Maker Store/i)

    // Verify product cards are rendered
    const cards = page.locator('[data-testid="product-card"]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })

    // Find the variant select dropdowns
    const variantSelects = page.locator('[data-testid="variant-select"]')
    await expect(variantSelects.first()).toBeVisible()

    // Verify options in the first variant select (e.g. LED colors)
    const firstSelect = variantSelects.first()
    await expect(firstSelect.locator('option')).toContainText(['Red', 'Green'])

    // Verify stock status says "In stock" (and no stock count numbers)
    await expect(page.locator('text=In stock').first()).toBeVisible()
    await expect(page.locator('text=In stock (')).toHaveCount(0)

    // Add first available item to cart
    const addBtn = page.locator('button:has-text("Add to Cart")').first()
    await addBtn.click()

    // Open Cart Drawer using header cart icon button
    const cartBtn = page.locator('header button[aria-label="Shopping cart"]').first()
    await cartBtn.click()

    // Cart drawer should be visible with item
    await expect(page.locator('h2:has-text("Cart")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Order via WhatsApp")').first()).toBeVisible()

    // Fulfillment options in cart drawer
    await expect(page.locator('text=UoR Faculty').first()).toBeVisible()
    await expect(page.locator('text=Hapugala Shop').first()).toBeVisible()
    await expect(page.locator('text=Islandwide Courier').first()).toBeVisible()
  })
})
