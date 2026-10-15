import { test, expect } from '@playwright/test'

test.describe('Instant 3D Print Quote Flow', () => {
  test('navigates to quote page and displays upload dropzone and engineering instructions', async ({
    page,
  }) => {
    await page.goto('/quote')

    // Page title and header
    await expect(page).toHaveTitle(/Quote/i)
    await expect(page.locator('h1')).toContainText(/3D Print Configurator/i)

    // Dropzone interface
    const dropzone = page.locator('input[type="file"]')
    await expect(dropzone).toBeAttached()

    // Upload an ASCII STL test part to trigger the 3D viewer and quote form
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

    await dropzone.setInputFiles({
      name: 'test_calibration_cube.stl',
      mimeType: 'application/sla',
      buffer: Buffer.from(sampleStl),
    })

    // After parsing, the specification heading should appear
    const specHeading = page.getByRole('heading', { name: 'Specification' })
    await expect(specHeading).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Min print Rs 250')).toBeVisible()

    // Verify materials buttons are visible
    await expect(page.locator('button:has-text("PLA+")')).toBeVisible()
    await expect(page.getByRole('button', { name: /PETG Rs 22/ })).toBeVisible()

    // Verify fulfillment options (Ruhuna faculty, Hapugala shop, Courier)
    await expect(page.locator('button:has-text("UoR Faculty")')).toBeVisible()
    await expect(page.locator('button:has-text("Hapugala Shop")')).toBeVisible()
    await expect(page.locator('button:has-text("Courier")')).toBeVisible()

    // Verify WhatsApp order button
    const orderBtn = page.locator('button:has-text("Order via WhatsApp")')
    await expect(orderBtn).toBeVisible()
  })
})
