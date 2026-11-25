/**
 * SQA 3.3 — Black-box tests (Equivalence Partitioning + Boundary Value Analysis)
 * Test case IDs map to docs/sqa/03-black-box.md
 */
import { describe, it, expect } from 'vitest'
import {
  calculateCourierFee,
  calculateShopDeliveryFee,
  MINIMUM_PRINT_PRICE_LKR,
  LOGISTICS_CONFIG,
  type DeliveryMethodId,
} from '../src/config/logistics'
import { calculateQuote } from '../src/features/quote/utils/pricing'
import { MATERIALS } from '../src/features/quote/types'
import { parseSTL, type STLParseResult } from '../src/features/quote/utils/stlParser'

function stl(volumeCm3: number, surfaceAreaCm2: number, dim: number): STLParseResult {
  return {
    triangleCount: 12,
    volumeMm3: volumeCm3 * 1000,
    volumeCm3,
    surfaceAreaMm2: surfaceAreaCm2 * 100,
    surfaceAreaCm2,
    boundingBox: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: dim, y: dim, z: dim },
      dimensions: { x: dim, y: dim, z: dim },
    },
    positions: new Float32Array(0),
    isAscii: false,
    isManifoldEstimate: true,
  }
}

const PLA = MATERIALS.find((m) => m.id === 'pla-plus')!

describe('BVA — calculateCourierFee (1 kg step boundary)', () => {
  // Partitions: invalid (<=0), first kg (0,1000], each extra started kg
  it.each([
    ['TC-BB-01', -1, 500],
    ['TC-BB-02', 0, 500],
    ['TC-BB-03', 1, 500],
    ['TC-BB-04', 999, 500],
    ['TC-BB-05', 1000, 500],
    ['TC-BB-06', 1001, 650],
    ['TC-BB-07', 1999, 650],
    ['TC-BB-08', 2000, 650],
    ['TC-BB-09', 2001, 800],
  ])('%s: weight %i g → %i LKR', (_id, grams, expected) => {
    expect(calculateCourierFee(grams)).toBe(expected)
  })
})

describe('BVA — Galle local free-delivery threshold (3000 LKR)', () => {
  const threshold = LOGISTICS_CONFIG.galleLocal.freeDeliveryThresholdLkr
  it.each([
    ['TC-BB-10', threshold - 1, 200],
    ['TC-BB-11', threshold, 0],
    ['TC-BB-12', threshold + 1, 0],
    ['TC-BB-13', 0, 200],
  ])('%s: subtotal %i → fee %i', (_id, subtotal, expected) => {
    expect(calculateShopDeliveryFee('galle_local', subtotal)).toBe(expected)
  })
})

describe('EP — delivery method (one representative per partition)', () => {
  it.each([
    ['TC-BB-14', 'ruhuna_pickup', 0],
    ['TC-BB-15', 'hapugala_pickup', 0],
    ['TC-BB-16', 'courier', 500],
    ['TC-BB-17', 'unknown_method', 0], // invalid partition falls to default branch
  ])('%s: %s → %i LKR', (_id, method, expected) => {
    expect(calculateShopDeliveryFee(method as DeliveryMethodId, 1000)).toBe(expected)
  })
})

describe('BVA — minimum print price clamp (250 LKR)', () => {
  // BUG-01 (docs/sqa/08-defects.md): the 250 LKR minimum is unreachable because the
  // handling fee alone is 250 and machine time is at least 0.5 h × 160 = 80 LKR,
  // so the cheapest possible quote is 450 LKR. Remove `.fails` once BUG-01 is fixed.
  it.fails('TC-BB-18: a tiny part is clamped down to the minimum price [BUG-01]', () => {
    const q = calculateQuote(stl(0.01, 0.1, 2), PLA, 20, 0.2)
    expect(q.totalPriceLkr).toBe(MINIMUM_PRINT_PRICE_LKR)
  })

  it('TC-BB-19: a large part is charged above the minimum', () => {
    const q = calculateQuote(stl(100, 200, 80), PLA, 20, 0.2)
    expect(q.totalPriceLkr).toBeGreaterThan(MINIMUM_PRINT_PRICE_LKR)
  })
})

describe('BVA — infill clamping in the pricing engine (10–100 %)', () => {
  const part = stl(50, 80, 40)
  const grams = (infill: number) => calculateQuote(part, PLA, infill, 0.2).estimatedGrams

  it('TC-BB-20: infill below 10 % is treated as 10 %', () => {
    expect(grams(5)).toBe(grams(10))
  })
  it('TC-BB-21: infill above 100 % is treated as 100 %', () => {
    expect(grams(150)).toBe(grams(100))
  })
  it('TC-BB-22: mass increases monotonically across the valid range', () => {
    expect(grams(11)).toBeGreaterThan(grams(10))
    expect(grams(100)).toBeGreaterThan(grams(99))
  })
})

describe('EP — STL geometry partitions (parseSTL)', () => {
  const ascii = (facets: number[][]) =>
    new TextEncoder().encode(
      ['solid t', ...facets.map((v) =>
        `facet normal 0 0 1\nouter loop\nvertex ${v.slice(0, 3).join(' ')}\nvertex ${v.slice(3, 6).join(' ')}\nvertex ${v.slice(6).join(' ')}\nendloop\nendfacet`),
       'endsolid t'].join('\n')
    ).buffer as ArrayBuffer

  // Open (non-watertight) surface: a single 20×20 mm square lifted to z = 20
  const openSquare = ascii([
    [0, 0, 20, 20, 0, 20, 20, 20, 20],
    [0, 0, 20, 20, 20, 20, 0, 20, 20],
  ])

  // BUG-03 (docs/sqa/08-defects.md): an open surface encloses no volume, but the
  // divergence-theorem sum measures it against the origin → 2.67 cm³, and
  // isManifoldEstimate (= volume > 0) reports it as valid. Remove `.fails` once fixed.
  it('TC-BB-23: open surface is NOT reported as a valid manifold [BUG-03]', () => {
    expect(parseSTL(openSquare).isManifoldEstimate).toBe(false)
  })

  it('TC-BB-24: documents the actual (wrong) behaviour for BUG-03', () => {
    const r = parseSTL(openSquare)
    expect(r.boundingBox.dimensions.z).toBe(0) // flat part
    expect(r.volumeCm3).toBeCloseTo(2.67, 2)   // yet has "volume"
  })
})
