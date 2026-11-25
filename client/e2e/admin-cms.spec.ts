import { test, expect } from '@playwright/test'

// The login API is mocked below, so any per-run value works
const E2E_PASSWORD = crypto.randomUUID()

test.describe('Admin CMS & Discreet System Gateway Flow', () => {
  test('discreet SYS / CTRL link in About Us leads to Admin Login, which authenticates to Dashboard', async ({ page }) => {
    let isLoggedIn = false

    // Intercept admin endpoints for isolated E2E state transitions
    await page.route('**/api/v1/admin/me', async (route) => {
      if (isLoggedIn) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { username: 'admin', role: 'admin' },
          }),
        })
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Unauthorized',
          }),
        })
      }
    })

    await page.route('**/api/v1/admin/login', async (route) => {
      const postData = route.request().postDataJSON()
      if (postData?.username === 'Dory' && postData?.password === E2E_PASSWORD) {
        isLoggedIn = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: { username: 'Dory', role: 'admin' },
          }),
        })
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: 'Invalid username or password',
          }),
        })
      }
    })

    await page.route('**/api/v1/admin/logout', async (route) => {
      isLoggedIn = false
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Logged out successfully',
        }),
      })
    })

    await page.route('**/api/v1/products', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              sku: 'AMB-MCU-UNO-01',
              name: 'Arduino Uno R3 DIP',
              category: 'Microcontrollers',
              priceLkr: '1400.00',
              stockQuantity: 49,
              isActive: true,
            },
          ],
        }),
      })
    })

    // 1. Visit About Us page and check colophon
    await page.goto('/about-us')
    const colophonLink = page.getByRole('link', { name: 'SYS / CTRL' })
    await expect(colophonLink).toBeVisible()

    // 2. Click discreet colophon link to access login
    await colophonLink.click()
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.getByText('AMBOSS // SYS.CTRL')).toBeVisible()
    await expect(page.getByRole('button', { name: /AUTHENTICATE/i })).toBeVisible()

    // 3. Test invalid authentication attempt
    await page.fill('#admin-username', 'invalid_user')
    await page.fill('#admin-password', 'wrong_pass')
    await page.click('button[type="submit"]')

    await expect(page.getByRole('alert')).toBeVisible()
    await expect(page.getByText(/ACCESS DENIED/i)).toBeVisible()

    // 4. Test valid authentication
    await page.fill('#admin-username', 'Dory')
    await page.fill('#admin-password', E2E_PASSWORD)
    await page.click('button[type="submit"]')

    // 5. Verify redirection to Admin Dashboard
    await expect(page).toHaveURL(/\/admin/)
    await expect(page.getByText(/OPERATOR: Dory/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /NEW PRODUCT/i })).toBeVisible()
    await expect(page.getByRole('table')).toBeVisible()

    // 6. Test Logout
    const logoutBtn = page.getByRole('button', { name: /LOGOUT/i })
    await expect(logoutBtn).toBeVisible()
    await logoutBtn.click()

    await expect(page).toHaveURL(/\/admin\/login/)
  })

  test('typing a stock quantity saves it, and a failed save restores the real value (BUG-06)', async ({ page }) => {
    const saved: number[] = []
    let failNext = false

    await page.route('**/api/v1/admin/me', (route) =>
      route.fulfill({ json: { success: true, user: { username: 'Dory', role: 'admin' } } })
    )
    await page.route('**/api/v1/products**', (route) =>
      route.fulfill({
        json: {
          success: true,
          data: [{ sku: 'AMB-MCU-UNO-01', name: 'Arduino Uno R3 DIP', category: 'Microcontrollers', priceLkr: '1400.00', stockQuantity: 49, isActive: true }],
        },
      })
    )
    await page.route('**/api/v1/products/AMB-MCU-UNO-01', (route) => {
      if (failNext) return route.fulfill({ status: 500, json: { success: false, error: 'Database offline' } })
      saved.push(route.request().postDataJSON().stockQuantity)
      return route.fulfill({ json: { success: true } })
    })

    await page.goto('/admin')
    const stock = page.getByLabel('Stock quantity for AMB-MCU-UNO-01')
    await expect(stock).toHaveValue('49')

    // Enter saves
    await stock.fill('42')
    await stock.press('Enter')
    await expect.poll(() => saved).toEqual([42])
    await expect(stock).toHaveValue('42')

    // Leaving the field saves
    await stock.fill('40')
    await stock.blur()
    await expect.poll(() => saved).toEqual([42, 40])

    // Unchanged, empty and negative values are not saved
    for (const value of ['40', '', '-3']) {
      await stock.fill(value)
      await stock.blur()
      await expect(stock).toHaveValue('40')
    }

    // A failed save shows the error and the value that is really stored
    failNext = true
    await stock.fill('7')
    await stock.blur()
    await expect(page.getByText('Database offline')).toBeVisible()
    await expect(stock).toHaveValue('40')
    expect(saved).toEqual([42, 40])
  })
})
