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
    const cartBtn = page.locator('header button[aria-label^="Shopping cart"]').first()
    await cartBtn.click()

    // Cart drawer is an accessible dialog (no blocking alert() dialogs are used anywhere)
    const drawer = page.getByRole('dialog', { name: 'Cart' })
    await expect(drawer).toBeVisible()
    await expect(page.locator('h2:has-text("Cart")').first()).toBeVisible()
    await expect(page.locator('button:has-text("Order via WhatsApp")').first()).toBeVisible()

    // Fulfillment options in cart drawer
    await expect(page.locator('text=UoR Faculty').first()).toBeVisible()
    await expect(page.locator('text=Hapugala Shop').first()).toBeVisible()
    await expect(page.locator('text=Islandwide Courier').first()).toBeVisible()

    // Escape closes the drawer and returns focus to the opener
    await page.keyboard.press('Escape')
    // closed drawer is aria-hidden/inert, so it drops out of the accessibility tree
    await expect(drawer).toHaveCount(0)
    await expect(cartBtn).toBeFocused()
  })

  test('checkout opens the shop WhatsApp with the server message and ignores any URL in the response', async ({ page }) => {
    const messageText = 'Order: 2 x LED\nTotal: Rs 100 & 50% + "tax" ✓'

    await page.route('**/api/v1/orders/validate-cart', (route) =>
      route.fulfill({ json: { success: true, valid: true, errors: [], items: [] } })
    )
    await page.route('**/api/v1/orders/whatsapp-payload', (route) =>
      route.fulfill({ json: { success: true, messageText, whatsappUrl: 'https://evil.example/phish' } })
    )
    const visited: string[] = []
    for (const pattern of ['https://wa.me/**', 'https://evil.example/**']) {
      await page.route(pattern, (route) => {
        visited.push(route.request().url())
        return route.fulfill({ body: 'stub' })
      })
    }

    await page.goto('/shop')
    await page.locator('button:has-text("Add to Cart")').first().click()
    await page.locator('header button[aria-label^="Shopping cart"]').first().click()

    // Delivery radios are named by title and price, and described by their note
    const drawer = page.getByRole('dialog', { name: 'Cart' })
    const courier = drawer.getByRole('radio', { name: /Islandwide Courier/ })
    await courier.check()
    await expect(courier).toBeChecked()
    await expect(courier).toHaveAccessibleDescription(/.+/)

    await page.locator('button:has-text("Order via WhatsApp")').first().click()
    await page.waitForURL('https://wa.me/**')

    expect(visited).toHaveLength(1)
    const url = new URL(visited[0])
    expect(url.pathname).toBe('/94779902796')
    expect(url.searchParams.get('text')).toBe(messageText)
  })
})
