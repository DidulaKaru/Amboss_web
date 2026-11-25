/**
 * SQA 3.4 — White-box tests for calculateQuote() (src/features/quote/utils/pricing.ts)
 * Goal: 100 % statement + branch coverage. One test per independent path through
 * the printer-routing decision tree, plus the SLA/FDM ternaries.
 * Path IDs (P1–P9) map to the control-flow graph in docs/sqa/04-white-box.md
 */
import { describe, it, expect } from 'vitest'
import { calculateQuote } from '../src/features/quote/utils/pricing'
import { MATERIALS, type MaterialOption } from '../src/features/quote/types'
import type { STLParseResult } from '../src/features/quote/utils/stlParser'

const mat = (id: string) => MATERIALS.find((m) => m.id === id)!

function box(x: number, y: number, z: number): STLParseResult {
  return {
    triangleCount: 12,
    volumeMm3: 1000,
    volumeCm3: 1,
    surfaceAreaMm2: 600,
    surfaceAreaCm2: 6,
    boundingBox: {
      min: { x: 0, y: 0, z: 0 },
      max: { x, y, z },
      dimensions: { x, y, z },
    },
    positions: new Float32Array(0),
    isAscii: false,
    isManifoldEstimate: true,
  }
}

const route = (m: MaterialOption, x: number, y = x, z = x) => calculateQuote(box(x, y, z), m, 20, 0.2)

describe('White-box — SLA branch (material.type === "SLA")', () => {
  it('P1: SLA part that fits the vat (any orientation) → Saturn 4 Ultra', () => {
    // 210 × 100 × 200 only fits after sorting dimensions against the vat
    const q = route(mat('lite-resin'), 210, 100, 200)
    expect(q.isOversized).toBe(false)
    expect(q.recommendedMachine).toContain('Saturn 4 Ultra')
    expect(q.handlingFeeLkr).toBe(350) // SLA ternary true
  })

  it('P2: SLA part larger than the vat → oversized', () => {
    const q = route(mat('lite-resin'), 230, 50, 50)
    expect(q.isOversized).toBe(true)
    expect(q.recommendedMachine).toContain('Exceeds SLA')
  })
})

describe('White-box — enclosed FDM branch (ABS / PETG-CF)', () => {
  it('P3: enclosed, maxDim ≤ 256 → Centauri Carbon / K2 Plus', () => {
    const q = route(mat('abs'), 256)
    expect(q.recommendedMachine).toContain('Centauri Carbon')
    expect(q.handlingFeeLkr).toBe(250) // SLA ternary false
  })
  it('P4: enclosed, 256 < maxDim ≤ 350 → K2 Plus large format', () => {
    expect(route(mat('petg-cf'), 300).recommendedMachine).toContain('Enclosed Large-Format')
  })
  it('P5: enclosed, maxDim > 350 → oversized', () => {
    const q = route(mat('abs'), 351)
    expect(q.isOversized).toBe(true)
    expect(q.recommendedMachine).toContain('enclosed chamber')
  })
})

describe('White-box — open FDM branch (PLA+, PETG, TPU)', () => {
  it('P6: maxDim ≤ 180 → A1 Mini', () => {
    expect(route(mat('pla-plus'), 180).recommendedMachine).toContain('A1 Mini')
  })
  it('P7: 180 < maxDim ≤ 256 → A1 / Centauri', () => {
    expect(route(mat('petg'), 181).recommendedMachine).toContain('Bambu Lab A1 /')
  })
  it('P8: 256 < maxDim ≤ 350 → K2 Plus', () => {
    expect(route(mat('tpu'), 350).recommendedMachine).toContain('K2 Plus (Large-Format')
  })
  it('P9: maxDim > 350 → oversized', () => {
    const q = route(mat('pla-plus'), 400)
    expect(q.isOversized).toBe(true)
    expect(q.recommendedMachine).toContain('standard build envelope')
  })
})

describe('White-box — remaining condition outcomes', () => {
  it('requiresEnclosure via id fallback when the flag is absent', () => {
    const absNoFlag: MaterialOption = { ...mat('abs'), requiresEnclosure: undefined }
    expect(route(absNoFlag, 100).recommendedMachine).toContain('Enclosed')
  })
  it('layer-height ratio floor (Math.max 0.5) — very fine layers', () => {
    const fine = calculateQuote(box(20, 20, 20), mat('pla-plus'), 20, 0.05)
    const normal = calculateQuote(box(20, 20, 20), mat('pla-plus'), 20, 0.2)
    expect(fine.estimatedPrintHours).toBeGreaterThanOrEqual(normal.estimatedPrintHours)
  })
  it('shell volume capped at total volume (thin part, huge surface area)', () => {
    const thin = { ...box(50, 50, 1), volumeCm3: 1, surfaceAreaCm2: 100 }
    const q = calculateQuote(thin, mat('pla-plus'), 20, 0.2)
    expect(q.estimatedGrams).toBeGreaterThanOrEqual(6) // minimum billable grams
  })
})
