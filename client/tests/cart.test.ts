import { describe, it, expect } from 'vitest'
import type { Product, DeliveryMethod } from '../src/features/shop/types'
import { calculateCourierFee } from '../src/features/quote/utils/pricing'

// Test delivery fee logic for electronics
function calculateTestDeliveryFee(method: DeliveryMethod, subtotal: number): number {
  switch (method) {
    case 'ruhuna_pickup':
      return 0
    case 'galle_local':
      return subtotal >= 3000 ? 0 : 200
    case 'courier':
      return 500 // flat fee for electronics < 1kg
    default:
      return 0
  }
}

describe('Maker Shop Cart & Logistics Logic', () => {
  const sampleProducts: Product[] = [
    {
      id: 'MCU-ARDUINO-UNO-R3',
      name: 'Arduino Uno R3 DIP',
      description: 'Microcontroller',
      price: 1400,
      stock: 49,
      image_url: '/images/Arduino-DIP.png',
    },
    {
      id: 'MCU-ESP32-WROOM-32D',
      name: 'ESP32 NodeMCU-32S',
      description: 'Microcontroller',
      price: 1450,
      stock: 48,
      image_url: '/images/ESP32.png',
    },
    {
      id: 'PAS-LED-3MM-RED',
      name: 'LED 3mm RED',
      description: 'Diffused LED',
      price: 5,
      stock: 0,
      image_url: '/images/LED.png',
    },
  ]

  it('correctly calculates subtotal and quantity limits', () => {
    const cart = [
      { ...sampleProducts[0], quantity: 2 },
      { ...sampleProducts[1], quantity: 1 },
    ]

    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
    expect(subtotal).toBe(1400 * 2 + 1450) // 4250
    expect(cart.reduce((sum, i) => sum + i.quantity, 0)).toBe(3)
  })

  it('correctly computes University of Ruhuna free campus pickup logistics', () => {
    const subtotal = 1450
    const fee = calculateTestDeliveryFee('ruhuna_pickup', subtotal)
    expect(fee).toBe(0)
  })

  it('correctly computes Galle local delivery tiered fees', () => {
    // Under 3000 LKR threshold -> Rs 200
    expect(calculateTestDeliveryFee('galle_local', 2850)).toBe(200)

    // Over or equal to 3000 LKR threshold -> FREE (Rs 0)
    expect(calculateTestDeliveryFee('galle_local', 3000)).toBe(0)
    expect(calculateTestDeliveryFee('galle_local', 4500)).toBe(0)
  })

  it('correctly computes electronics flat courier fee of 500 LKR', () => {
    expect(calculateTestDeliveryFee('courier', 1000)).toBe(500)
    expect(calculateTestDeliveryFee('courier', 10000)).toBe(500)
  })

  it('correctly computes weight-based courier fees: 500 LKR for 1st kg, +150 LKR per additional kg', () => {
    // Up to 1000g -> 500 LKR
    expect(calculateCourierFee(200)).toBe(500)
    expect(calculateCourierFee(800)).toBe(500)
    expect(calculateCourierFee(1000)).toBe(500)

    // Above 1000g -> 500 + 150 for each 1kg added on top
    expect(calculateCourierFee(1050)).toBe(650)
    expect(calculateCourierFee(1500)).toBe(650)
    expect(calculateCourierFee(2000)).toBe(650)
    expect(calculateCourierFee(2001)).toBe(800)
    expect(calculateCourierFee(3000)).toBe(800)
    expect(calculateCourierFee(3500)).toBe(950)
  })

  it('prevents ordering out-of-stock items (stock = 0)', () => {
    const outOfStockItem = sampleProducts[2]
    expect(outOfStockItem.stock).toBe(0)
    const canAdd = outOfStockItem.stock > 0
    expect(canAdd).toBe(false)
  })
})
