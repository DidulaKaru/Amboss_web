import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Admin Authentication & CMS API', () => {
  it('rejects unauthenticated product mutations with 401 Unauthorized', async () => {
    const app = await buildApp()

    // Unauthenticated POST
    const resPost = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      payload: {
        sku: 'TEST-UNAUTH-ITEM',
        name: 'Unauthorized Item',
        category: 'accessories',
        priceLkr: 500,
        stockQuantity: 10,
      },
    })
    expect(resPost.statusCode).toBe(401)
    expect(resPost.json().error).toContain('Unauthorized')

    // Unauthenticated PUT
    const resPut = await app.inject({
      method: 'PUT',
      url: '/api/v1/products/MCU-ESP32-WROOM-32D',
      payload: {
        stockQuantity: 100,
      },
    })
    expect(resPut.statusCode).toBe(401)
    expect(resPut.json().error).toContain('Unauthorized')

    // Unauthenticated DELETE
    const resDelete = await app.inject({
      method: 'DELETE',
      url: '/api/v1/products/MCU-ESP32-WROOM-32D',
    })
    expect(resDelete.statusCode).toBe(401)
    expect(resDelete.json().error).toContain('Unauthorized')

    await app.close()
  })

  it('rejects invalid credentials with 401 and generic error', async () => {
    const app = await buildApp()

    const resBadLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: {
        username: 'admin',
        password: 'wrong-password',
      },
    })

    expect(resBadLogin.statusCode).toBe(401)
    expect(resBadLogin.json().success).toBe(false)
    expect(resBadLogin.json().error).toBe('Invalid username or password')

    await app.close()
  })

  it('authenticates valid admin credentials, sets HttpOnly cookie, and performs CRUD operations', async () => {
    const app = await buildApp()

    // 1. Successful Login
    const resLogin = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/login',
      payload: {
        username: 'Dory',
        password: 'poplintu7577',
      },
    })

    expect(resLogin.statusCode).toBe(200)
    const jsonLogin = resLogin.json()
    expect(jsonLogin.success).toBe(true)
    expect(jsonLogin.token).toBeDefined()
    expect(jsonLogin.user.username).toBe('Dory')

    // Verify Set-Cookie header contains amboss_admin_token and HttpOnly
    const cookieHeader = resLogin.headers['set-cookie'] as string
    expect(cookieHeader).toBeDefined()
    expect(cookieHeader).toContain('amboss_admin_token')
    expect(cookieHeader.toLowerCase()).toContain('httponly')

    const authHeaders = {
      Authorization: `Bearer ${jsonLogin.token}`,
    }

    // 2. GET /api/v1/admin/me
    const resMe = await app.inject({
      method: 'GET',
      url: '/api/v1/admin/me',
      headers: authHeaders,
    })
    expect(resMe.statusCode).toBe(200)
    expect(resMe.json().user.username).toBe('Dory')

    // 3. Create Product
    const testSku = 'TEST-NEW-SENSOR-001'
    const resCreate = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: authHeaders,
      payload: {
        sku: testSku,
        name: 'Precision Barometer BMP280',
        category: 'sensors',
        description: 'Atmospheric pressure sensor module',
        priceLkr: 380,
        stockQuantity: 25,
      },
    })
    expect(resCreate.statusCode).toBe(201)
    expect(resCreate.json().data.sku).toBe(testSku)

    // 4. Update Product Stock
    const resUpdate = await app.inject({
      method: 'PUT',
      url: `/api/v1/products/${testSku}`,
      headers: authHeaders,
      payload: {
        stockQuantity: 40,
        priceLkr: 400,
      },
    })
    expect(resUpdate.statusCode).toBe(200)
    expect(resUpdate.json().data.stockQuantity).toBe(40)

    // 5. Delete Product
    const resDelete = await app.inject({
      method: 'DELETE',
      url: `/api/v1/products/${testSku}`,
      headers: authHeaders,
    })
    expect(resDelete.statusCode).toBe(200)
    expect(resDelete.json().success).toBe(true)

    // 6. Logout
    const resLogout = await app.inject({
      method: 'POST',
      url: '/api/v1/admin/logout',
    })
    expect(resLogout.statusCode).toBe(200)
    expect(resLogout.json().success).toBe(true)

    await app.close()
  })
})
