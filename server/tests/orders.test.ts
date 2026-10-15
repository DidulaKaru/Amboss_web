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

  it('POST /api/v1/orders/validate-cart passes for available items and fails for over-stock items', async () => {
    const app = await buildApp()
    
    // Case 1: Within available stock
    const resValid = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/validate-cart',
      payload: {
        items: [
          { sku: 'MCU-ARDUINO-UNO-R3', name: 'Arduino Uno R3 DIP', quantity: 2 },
          { sku: 'MCU-ESP32-WROOM-32D', name: 'ESP32 NodeMCU-32S', quantity: 5 },
        ],
      },
    })

    expect(resValid.statusCode).toBe(200)
    const jsonValid = resValid.json()
    expect(jsonValid.success).toBe(true)
    expect(jsonValid.valid).toBe(true)
    expect(jsonValid.errors.length).toBe(0)
    expect(jsonValid.items.length).toBe(2)
    expect(jsonValid.items[0].inStock).toBe(true)

    // Case 2: Exceeding stock (e.g. requesting 999 Arduino Uno or 1 LED where stock is 0)
    const resInvalid = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/validate-cart',
      payload: {
        items: [
          { sku: 'MCU-ARDUINO-UNO-R3', name: 'Arduino Uno R3 DIP', quantity: 999 },
          { sku: 'SEN-GY521-MPU6050', name: '6-axis motion tracking sensor (GY-521)', quantity: 1 },
        ],
      },
    })

    expect(resInvalid.statusCode).toBe(200)
    const jsonInvalid = resInvalid.json()
    expect(jsonInvalid.success).toBe(true)
    expect(jsonInvalid.valid).toBe(false)
    expect(jsonInvalid.errors.length).toBe(2)
    expect(jsonInvalid.errors.some((e: string) => e.includes('out of stock') || e.includes('available'))).toBe(true)

    await app.close()
  })

  it('POST /api/v1/orders/whatsapp-payload formats Ruhuna and Galle delivery logistical alerts', async () => {
    const app = await buildApp()

    // Ruhuna Faculty Pickup
    const resRuhuna = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'shop',
        deliveryMethod: 'ruhuna_pickup',
        customerName: 'Engineering Student',
        items: [
          { sku: 'MCU-ESP32-WROOM-32D', name: 'ESP32 NodeMCU-32S', quantity: 1, priceLkr: 1450 },
        ],
      },
    })

    expect(resRuhuna.statusCode).toBe(200)
    const jsonRuhuna = resRuhuna.json()
    expect(jsonRuhuna.messageText).toContain('University of Ruhuna (Hapugala, Galle)')
    expect(jsonRuhuna.messageText).toContain('FREE (University of Ruhuna Pickup)')
    expect(jsonRuhuna.messageText).toContain('Total: Rs 1,450 LKR')

    // Galle Local Delivery
    const resGalle = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'shop',
        deliveryMethod: 'galle_local',
        deliveryAddress: 'Unawatuna, Galle',
        items: [
          { sku: 'MCU-ARDUINO-UNO-R3', name: 'Arduino Uno R3 DIP', quantity: 1, priceLkr: 1400 },
        ],
      },
    })

    expect(resGalle.statusCode).toBe(200)
    const jsonGalle = resGalle.json()
    expect(jsonGalle.messageText).toContain('Local Delivery: Galle Municipal & Suburb Areas')
    expect(jsonGalle.messageText).toContain('Delivery Fee: Rs 200 LKR')
    expect(jsonGalle.messageText).toContain('Delivery Address / Notes: Unawatuna, Galle')
    expect(jsonGalle.messageText).toContain('Total: Rs 1,600 LKR')

    // Courier Delivery for Electronics (Flat 500 LKR)
    const resCourierShop = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'shop',
        deliveryMethod: 'courier',
        deliveryAddress: 'Kandy, Central Province',
        items: [
          { sku: 'MCU-ARDUINO-UNO-R3', name: 'Arduino Uno R3 DIP', quantity: 1, priceLkr: 1400 },
        ],
      },
    })

    expect(resCourierShop.statusCode).toBe(200)
    const jsonCourierShop = resCourierShop.json()
    expect(jsonCourierShop.messageText).toContain('Delivery Fee: Rs 500 LKR')
    expect(jsonCourierShop.messageText).toContain('Total: Rs 1,900 LKR')

    // Courier Delivery for 3D Print Quote (500 for first 1kg, +150 for each additional 1kg)
    const resCourierQuote = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'quote',
        deliveryMethod: 'courier',
        deliveryAddress: 'Colombo 07',
        quote: {
          fileName: 'large_bracket.stl',
          material: 'PLA+',
          quantity: 2,
          estimatedGrams: 800, // 800 * 2 = 1600g -> 1st kg (500) + 1 extra kg (150) = 650
          totalPriceLkr: 4500,
        },
      },
    })

    expect(resCourierQuote.statusCode).toBe(200)
    const jsonCourierQuote = resCourierQuote.json()
    expect(jsonCourierQuote.messageText).toContain('Estimated Weight: ~1600.0 g')
    expect(jsonCourierQuote.messageText).toContain('Delivery Fee: Rs 650 LKR')
    expect(jsonCourierQuote.messageText).toContain('Estimated Total: Rs 5,150 LKR')
    expect(jsonCourierQuote.messageText).toContain('Minimum print is 250 LKR')

    await app.close()
  })
})
