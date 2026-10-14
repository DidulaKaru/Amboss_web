import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Orders WhatsApp Payload API', () => {
  it('POST /api/v1/orders/whatsapp-payload returns formatted quote payload', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'quote',
        quote: {
          fileName: 'calibration_cube.stl',
          dimensions: { x: 20, y: 20, z: 20 },
          material: 'PLA+',
          infillPct: 20,
          layerHeightMm: 0.2,
          quantity: 2,
          totalPriceLkr: 1450,
        },
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.whatsappUrl).toContain('https://wa.me/')
    expect(json.messageText).toContain('calibration_cube.stl')
    expect(json.messageText).toContain('Automated estimate')
    await app.close()
  })

  it('POST /api/v1/orders/whatsapp-payload returns formatted cart payload', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'shop',
        items: [
          { name: 'ESP32 Development Board', quantity: 2, priceLkr: 1850 },
          { name: 'SG90 Micro Servo', quantity: 4, priceLkr: 450 },
        ],
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.whatsappUrl).toContain('https://wa.me/')
    expect(json.messageText).toContain('ESP32 Development Board x 2')
    expect(json.messageText).toContain('Total: Rs 5,500 LKR')
    await app.close()
  })
})
