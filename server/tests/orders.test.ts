import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

const QUOTE_INPUT = {
  fileName: 'calibration_cube.stl',
  volumeCm3: 8.0,
  surfaceAreaCm2: 24.0,
  dimensions: { x: 20, y: 20, z: 20 },
  materialSlug: 'pla-plus',
  infillPct: 20,
  layerHeightMm: 0.2,
  quantity: 2,
}

describe('Orders WhatsApp Payload API', () => {
  it('POST /api/v1/orders/whatsapp-payload returns formatted quote payload priced server-side', async () => {
    const app = await buildApp()
    const calc = await app.inject({ method: 'POST', url: '/api/v1/quote/calculate', payload: QUOTE_INPUT })
    const expectedTotal = calc.json().pricing.totalPriceLkr as number

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      // totalPriceLkr from the client must be ignored
      payload: { type: 'quote', quote: { ...QUOTE_INPUT, totalPriceLkr: 1 } },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.whatsappUrl).toContain('https://wa.me/94779902796?text=')
    expect(json.messageText).toContain('calibration_cube.stl')
    expect(json.messageText).toContain('Automated estimate')
    expect(json.messageText).toContain(`Print Total: Rs ${expectedTotal.toLocaleString()} LKR`)
    expect(json.messageText).not.toContain('Print Total: Rs 1 LKR')
    await app.close()
  })

  it('rejects quote orders with an unknown material or missing geometry', async () => {
    const app = await buildApp()
    const unknown = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: { type: 'quote', quote: { ...QUOTE_INPUT, materialSlug: 'unobtainium' } },
    })
    expect(unknown.statusCode).toBe(404)

    const legacy = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: { type: 'quote', quote: { fileName: 'x.stl', material: 'PLA+', totalPriceLkr: 1 } },
    })
    expect(legacy.statusCode).toBe(400)
    await app.close()
  })

  it('POST /api/v1/orders/whatsapp-payload returns formatted cart payload with server prices', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'shop',
        items: [
          { sku: 'MCU-ESP32-WROOM-32D', name: 'ignored client name', quantity: 2 },
          { sku: 'ACC-ARDUINO-USB-CABLE', quantity: 4 },
        ],
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.whatsappUrl).toContain('https://wa.me/94779902796?text=')
    expect(json.messageText).toContain('ESP32 NodeMCU-32S x 2')
    expect(json.messageText).not.toContain('ignored client name')
    // 2 x 1450 + 4 x 130 = 3420 (pickup, no delivery fee)
    expect(json.messageText).toContain('Total: Rs 3,420 LKR')
    await app.close()
  })

  it('ignores client-supplied priceLkr and phone on shop orders', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'shop',
        phone: '15551234567',
        items: [{ sku: 'MCU-ESP32-WROOM-32D', quantity: 1, priceLkr: 1 }],
      },
    })
    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.messageText).toContain('Total: Rs 1,450 LKR')
    expect(json.whatsappUrl).toContain('https://wa.me/94779902796?')
    expect(json.whatsappUrl).not.toContain('15551234567')
    await app.close()
  })

  it('rejects unknown SKUs, name-only items, and insufficient stock with 400', async () => {
    const app = await buildApp()
    const post = (items: any[]) =>
      app.inject({ method: 'POST', url: '/api/v1/orders/whatsapp-payload', payload: { type: 'shop', items } })

    const unknown = await post([{ sku: 'NOPE-123', quantity: 1 }])
    expect(unknown.statusCode).toBe(400)
    expect(unknown.json().details[0]).toContain('not found')

    // Fuzzy name matching is gone: a name with no SKU is invalid
    const nameOnly = await post([{ name: 'ESP32 NodeMCU-32S', quantity: 1 }])
    expect(nameOnly.statusCode).toBe(400)

    const outOfStock = await post([{ sku: 'SEN-GY521-MPU6050', quantity: 1 }])
    expect(outOfStock.statusCode).toBe(400)
    expect(outOfStock.json().details[0]).toContain('out of stock')

    const tooMany = await post([{ sku: 'MCU-ARDUINO-UNO-R3', quantity: 101 }])
    expect(tooMany.statusCode).toBe(400)

    // Duplicate lines are merged before the stock check (49 in stock: 30 + 30 > 49)
    const dup = await post([
      { sku: 'MCU-ARDUINO-UNO-R3', quantity: 30 },
      { sku: 'MCU-ARDUINO-UNO-R3', quantity: 30 },
    ])
    expect(dup.statusCode).toBe(400)
    await app.close()
  })

  it('enforces input size limits on order payloads', async () => {
    const app = await buildApp()
    const oneItem = [{ sku: 'MCU-ARDUINO-UNO-R3', quantity: 1 }]
    const post = (extra: Record<string, unknown>, items: unknown[] = oneItem) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/orders/whatsapp-payload',
        payload: { type: 'shop', items, ...extra },
      })

    const items = Array.from({ length: 51 }, () => ({ sku: 'MCU-ARDUINO-UNO-R3', quantity: 1 }))
    expect((await post({}, items)).statusCode).toBe(400)
    expect((await post({ deliveryAddress: 'x'.repeat(501) })).statusCode).toBe(400)
    expect((await post({ customerName: 'x'.repeat(101) })).statusCode).toBe(400)
    expect((await post({ deliveryAddress: 'x'.repeat(500), customerName: 'x'.repeat(100) })).statusCode).toBe(200)

    const hugeQuote = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: { type: 'quote', quote: { ...QUOTE_INPUT, fileName: 'x'.repeat(256) } },
    })
    expect(hugeQuote.statusCode).toBe(400)
    await app.close()
  })

  it('rejects request bodies over the 100kb limit with 413', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/validate-cart',
      payload: { items: [{ sku: 'MCU-ARDUINO-UNO-R3', quantity: 1 }], junk: 'x'.repeat(120 * 1024) },
    })
    expect(response.statusCode).toBe(413)
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

    // Case 2: Exceeding stock (999 Arduino Uno via max-quantity bypass is rejected by schema, so use 99 > 49)
    const resInvalid = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/validate-cart',
      payload: {
        items: [
          { sku: 'MCU-ARDUINO-UNO-R3', name: 'Arduino Uno R3 DIP', quantity: 99 },
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

    // Unknown SKU is reported, never fuzzy-matched by name
    const resUnknown = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/validate-cart',
      payload: { items: [{ sku: 'ESP32', name: 'ESP32 NodeMCU-32S', quantity: 1 }] },
    })
    expect(resUnknown.json().valid).toBe(false)
    expect(resUnknown.json().items[0].error).toBe('Not found')

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
        items: [{ sku: 'MCU-ESP32-WROOM-32D', quantity: 1 }],
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
        items: [{ sku: 'MCU-ARDUINO-UNO-R3', quantity: 1 }],
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
        items: [{ sku: 'MCU-ARDUINO-UNO-R3', quantity: 1 }],
      },
    })

    expect(resCourierShop.statusCode).toBe(200)
    const jsonCourierShop = resCourierShop.json()
    expect(jsonCourierShop.messageText).toContain('Delivery Fee: Rs 500 LKR')
    expect(jsonCourierShop.messageText).toContain('Total: Rs 1,900 LKR')

    // Courier Delivery for 3D Print Quote (500 for first 1kg, +150 for each additional 1kg)
    const quoteInput = {
      fileName: 'large_bracket.stl',
      volumeCm3: 700,
      surfaceAreaCm2: 600,
      dimensions: { x: 120, y: 100, z: 80 },
      materialSlug: 'pla-plus',
      infillPct: 100,
      layerHeightMm: 0.2,
      quantity: 2,
    }
    const calc = (
      await app.inject({ method: 'POST', url: '/api/v1/quote/calculate', payload: quoteInput })
    ).json().pricing
    const totalWeight = calc.estimatedGrams * 2
    expect(totalWeight).toBeGreaterThan(1000)
    const expectedFee = 500 + Math.ceil((totalWeight - 1000) / 1000) * 150

    const resCourierQuote = await app.inject({
      method: 'POST',
      url: '/api/v1/orders/whatsapp-payload',
      payload: {
        type: 'quote',
        deliveryMethod: 'courier',
        deliveryAddress: 'Colombo 07',
        quote: quoteInput,
      },
    })

    expect(resCourierQuote.statusCode).toBe(200)
    const jsonCourierQuote = resCourierQuote.json()
    expect(jsonCourierQuote.messageText).toContain(`Estimated Weight: ~${totalWeight.toFixed(1)} g`)
    expect(jsonCourierQuote.messageText).toContain(`Delivery Fee: Rs ${expectedFee.toLocaleString()} LKR`)
    expect(jsonCourierQuote.messageText).toContain(
      `Estimated Total: Rs ${(calc.totalPriceLkr + expectedFee).toLocaleString()} LKR`
    )
    expect(jsonCourierQuote.messageText).toContain('Minimum print is 250 LKR')

    await app.close()
  })
})
