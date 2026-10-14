import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Products API', () => {
  it('GET /api/v1/products returns maker store catalog', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/products',
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThanOrEqual(8)

    const skus = json.data.map((p: any) => p.sku)
    expect(skus).toContain('MCU-ESP32-WROOM-32D')
    expect(skus).toContain('MCU-ARDUINO-UNO-R3')
    expect(skus).toContain('ACT-SG90-SERVO')

    await app.close()
  })

  it('GET /api/v1/products?category=microcontrollers filters catalog', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/products?category=microcontrollers',
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.data.every((p: any) => p.category === 'microcontrollers')).toBe(true)
    await app.close()
  })

  it('GET /api/v1/products/:sku returns single item or 404', async () => {
    const app = await buildApp()
    const resFound = await app.inject({
      method: 'GET',
      url: '/api/v1/products/MCU-ESP32-WROOM-32D',
    })
    expect(resFound.statusCode).toBe(200)
    expect(resFound.json().data.name).toContain('ESP32')

    const resNotFound = await app.inject({
      method: 'GET',
      url: '/api/v1/products/NON-EXISTENT-SKU',
    })
    expect(resNotFound.statusCode).toBe(404)
    await app.close()
  })
})
