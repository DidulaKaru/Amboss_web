import { test, expect } from '@playwright/test'

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
      if (postData?.username === 'Dory' && postData?.password === 'poplintu7577') {
        isLoggedIn = true
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock_jwt_token',
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
    await page.fill('#admin-password', 'poplintu7577')
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
})
