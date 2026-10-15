import { describe, it, expect } from 'vitest'
import { groupProducts } from '../src/features/shop/groupProducts'
import type { Product } from '../src/features/shop/types'

describe('groupProducts utility', () => {
  const mockCatalog: Product[] = [
    {
      id: 'MCU-ARDUINO-UNO-R3',
      sku: 'MCU-ARDUINO-UNO-R3',
      name: 'Arduino Uno R3 DIP',
      category: 'microcontrollers',
      description: 'Atmega328P microcontroller',
      price: 1400,
      stock: 49,
      image_url: 'images/Arduino-DIP.png',
      isActive: true,
    },
    {
      id: 'PAS-LED-3MM-RED',
      sku: 'PAS-LED-3MM-RED',
      name: 'LED 3mm - Red',
      category: 'accessories',
      description: 'Red 3mm diffused LED',
      price: 5,
      stock: 500,
      image_url: 'images/LED.png',
      isActive: true,
    },
    {
      id: 'PAS-LED-3MM-GREEN',
      sku: 'PAS-LED-3MM-GREEN',
      name: 'LED 3mm - Green',
      category: 'accessories',
      description: 'Green 3mm diffused LED',
      price: 5,
      stock: 500,
      image_url: 'images/LED.png',
      isActive: true,
    },
    {
      id: 'PRT-JUMPER-WIRES-MM',
      sku: 'PRT-JUMPER-WIRES-MM',
      name: 'Jumper Cables - Male-Male',
      category: 'prototyping',
      description: 'DuPont Male-Male',
      price: 180,
      stock: 57,
      image_url: 'images/Jumper-cables.png',
      isActive: true,
    },
    {
      id: 'PRT-JUMPER-WIRES-MF',
      sku: 'PRT-JUMPER-WIRES-MF',
      name: 'Jumper Cables - Male-Female',
      category: 'prototyping',
      description: 'DuPont Male-Female',
      price: 180,
      stock: 57,
      image_url: 'images/Jumper-cables.png',
      isActive: true,
    },
    {
      id: 'PRT-JUMPER-WIRES-FF',
      sku: 'PRT-JUMPER-WIRES-FF',
      name: 'Jumper Cables - Female-Female',
      category: 'prototyping',
      description: 'DuPont Female-Female',
      price: 180,
      stock: 57,
      image_url: 'images/Jumper-cables.png',
      isActive: true,
    },
  ]

  it('merges red and green LEDs into a single card with color variants', () => {
    const grouped = groupProducts(mockCatalog)
    const ledCard = grouped.find((p) => p.sku === 'PAS-LED-3MM')

    expect(ledCard).toBeDefined()
    expect(ledCard?.name).toBe('LED 3mm Diffused')
    expect(ledCard?.variantLabel).toBe('Color')
    expect(ledCard?.variants).toHaveLength(2)

    const labels = ledCard?.variants?.map((v) => v.label)
    expect(labels).toContain('Red')
    expect(labels).toContain('Green')

    // Stock is aggregated across variants
    expect(ledCard?.stock).toBe(1000)
    // Individual variants retain their exact 500 stock
    expect(ledCard?.variants?.find((v) => v.label === 'Red')?.stock).toBe(500)
    expect(ledCard?.variants?.find((v) => v.label === 'Green')?.stock).toBe(500)
  })

  it('merges jumper cables into a single card with termination variants', () => {
    const grouped = groupProducts(mockCatalog)
    const jumperCard = grouped.find((p) => p.sku === 'PRT-JUMPER-WIRES')

    expect(jumperCard).toBeDefined()
    expect(jumperCard?.name).toBe('Jumper Cables (40 pcs)')
    expect(jumperCard?.variantLabel).toBe('Termination')
    expect(jumperCard?.variants).toHaveLength(3)

    const labels = jumperCard?.variants?.map((v) => v.label)
    expect(labels).toContain('Male to Male (M-M)')
    expect(labels).toContain('Male to Female (M-F)')
    expect(labels).toContain('Female to Female (F-F)')
    expect(jumperCard?.stock).toBe(57 * 3)
  })

  it('preserves standalone products without variants', () => {
    const grouped = groupProducts(mockCatalog)
    const uno = grouped.find((p) => p.sku === 'MCU-ARDUINO-UNO-R3')

    expect(uno).toBeDefined()
    expect(uno?.name).toBe('Arduino Uno R3 DIP')
    expect(uno?.variants).toBeUndefined()
  })

  it('reduces the total card count from 6 raw items to 3 display cards', () => {
    const grouped = groupProducts(mockCatalog)
    // 1 Arduino + 1 LED Card + 1 Jumper Card = 3 cards
    expect(grouped).toHaveLength(3)
  })
})
