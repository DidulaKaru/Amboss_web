import { describe, it, expect } from 'vitest'
import {
  calculateQuote,
  calculateCourierFee,
  MINIMUM_PRINT_PRICE_LKR,
} from '../src/features/quote/utils/pricing'
import { MATERIALS } from '../src/features/quote/types'
import type { STLParseResult } from '../src/features/quote/utils/stlParser'

describe('Instant 3D Print Quote Pricing Engine', () => {
  // Standard 20mm calibration cube
  const mockCube20mm: STLParseResult = {
    volumeCm3: 8.0,
    surfaceAreaCm2: 24.0,
    boundingBox: {
      min: { x: -10, y: -10, z: 0 },
      max: { x: 10, y: 10, z: 20 },
      dimensions: { x: 20, y: 20, z: 20 },
    },
    triangleCount: 12,
  }

  // Tiny 5mm calibration chip (raw cost will be under 250 LKR)
  const mockTinyChip: STLParseResult = {
    volumeCm3: 0.125,
    surfaceAreaCm2: 1.5,
    boundingBox: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 5, y: 5, z: 5 },
      dimensions: { x: 5, y: 5, z: 5 },
    },
    triangleCount: 12,
  }

  // Large part (exceeds small printer build volumes)
  const mockLargeEnclosure: STLParseResult = {
    volumeCm3: 650.0,
    surfaceAreaCm2: 1200.0,
    boundingBox: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 300, y: 300, z: 280 },
      dimensions: { x: 300, y: 300, z: 280 },
    },
    triangleCount: 5000,
  }

  const pla = MATERIALS.find((m) => m.id === 'pla-plus')!
  const petgCf = MATERIALS.find((m) => m.id === 'petg-cf')!
  const clearResin = MATERIALS.find((m) => m.id === 'high-clear-resin')!

  it('calculates deterministic quote for standard 20mm cube in PLA+', () => {
    const quote = calculateQuote(mockCube20mm, pla, 20, 0.2)

    expect(quote.estimatedGrams).toBeGreaterThan(0)
    expect(quote.estimatedPrintHours).toBeGreaterThan(0)
    expect(quote.materialCostLkr).toBeGreaterThan(0)
    expect(quote.machineTimeCostLkr).toBeGreaterThan(0)
    expect(quote.handlingFeeLkr).toBeGreaterThan(0)
    expect(quote.totalPriceLkr).toBeGreaterThanOrEqual(MINIMUM_PRINT_PRICE_LKR)
    expect(quote.recommendedMachine).toBeDefined()
  })

  it('enforces MINIMUM_PRINT_PRICE_LKR (250 LKR) threshold', () => {
    const quote = calculateQuote(mockTinyChip, pla, 10, 0.28)
    expect(quote.totalPriceLkr).toBeGreaterThanOrEqual(MINIMUM_PRINT_PRICE_LKR)
    expect(MINIMUM_PRINT_PRICE_LKR).toBe(250)
  })

  it('routes engineering materials (PETG-CF) and large parts to large/enclosed machines', () => {
    const quoteCf = calculateQuote(mockCube20mm, petgCf, 20, 0.2)
    // Carbon fiber engineering materials require hardened nozzles and enclosure
    expect(quoteCf.recommendedMachine).toContain('Elegoo Centauri Carbon')

    // Large 300x300x280mm part must route to Creality K2 Plus (350x350x350)
    const quoteLarge = calculateQuote(mockLargeEnclosure, pla, 20, 0.2)
    expect(quoteLarge.recommendedMachine).toContain('Creality K2 Plus')
  })

  it('routes resin materials to SLA printers', () => {
    const quoteResin = calculateQuote(mockCube20mm, clearResin, 100, 0.05)
    expect(quoteResin.recommendedMachine).toContain('Elegoo Saturn 4 Ultra')
  })

  it('calculates dynamic islandwide courier fees accurately', () => {
    // 0 - 1000g -> 500 LKR
    expect(calculateCourierFee(100)).toBe(500)
    expect(calculateCourierFee(1000)).toBe(500)

    // 1001g - 2000g -> 650 LKR
    expect(calculateCourierFee(1001)).toBe(650)
    expect(calculateCourierFee(2000)).toBe(650)

    // 2001g - 3000g -> 800 LKR
    expect(calculateCourierFee(2500)).toBe(800)
  })
})
