/**
 * SQA 3.3 — Black-box API tests on POST /api/v1/quote/calculate
 * Boundaries come from the Zod schema in src/routes/quote.ts.
 * Test case IDs map to docs/sqa/03-black-box.md
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'

let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})
afterAll(async () => {
  await app.close()
})

const base = {
  fileName: 'cube.stl',
  volumeCm3: 8,
  surfaceAreaCm2: 24,
  dimensions: { x: 20, y: 20, z: 20 },
  materialSlug: 'pla-plus',
  infillPct: 20,
  layerHeightMm: 0.2,
  quantity: 1,
}

async function quote(overrides: Record<string, unknown>) {
  return app.inject({
    method: 'POST',
    url: '/api/v1/quote/calculate',
    payload: { ...base, ...overrides },
  })
}

describe('BVA — infillPct (valid 10–100)', () => {
  it.each([
    ['TC-API-01', 9, 400],
    ['TC-API-02', 10, 200],
    ['TC-API-03', 11, 200],
    ['TC-API-04', 99, 200],
    ['TC-API-05', 100, 200],
    ['TC-API-06', 101, 400],
  ])('%s: infillPct=%d → %d', async (_id, infillPct, status) => {
    expect((await quote({ infillPct })).statusCode).toBe(status)
  })
})

describe('BVA — layerHeightMm (valid 0.05–0.40)', () => {
  it.each([
    ['TC-API-07', 0.04, 400],
    ['TC-API-08', 0.05, 200],
    ['TC-API-09', 0.06, 200],
    ['TC-API-10', 0.39, 200],
    ['TC-API-11', 0.4, 200],
    ['TC-API-12', 0.41, 400],
  ])('%s: layerHeightMm=%d → %d', async (_id, layerHeightMm, status) => {
    expect((await quote({ layerHeightMm })).statusCode).toBe(status)
  })
})

describe('BVA — quantity (valid integer 1–100)', () => {
  it.each([
    ['TC-API-13', 0, 400],
    ['TC-API-14', 1, 200],
    ['TC-API-15', 2, 200],
    ['TC-API-16', 99, 200],
    ['TC-API-17', 100, 200],
    ['TC-API-18', 101, 400],
    ['TC-API-19', 1.5, 400], // non-integer partition
  ])('%s: quantity=%d → %d', async (_id, quantity, status) => {
    expect((await quote({ quantity })).statusCode).toBe(status)
  })
})

describe('EP — materialSlug', () => {
  it('TC-API-20: valid existing slug → 200', async () => {
    expect((await quote({ materialSlug: 'petg' })).statusCode).toBe(200)
  })
  it('TC-API-21: well-formed but unknown slug → 404', async () => {
    const res = await quote({ materialSlug: 'unobtainium' })
    expect(res.statusCode).toBe(404)
    expect(res.json().error).toContain('not found')
  })
  it('TC-API-22: empty slug → 400', async () => {
    expect((await quote({ materialSlug: '' })).statusCode).toBe(400)
  })
})

describe('EP — geometry', () => {
  it('TC-API-23: zero volume (invalid partition) → 400', async () => {
    expect((await quote({ volumeCm3: 0 })).statusCode).toBe(400)
  })
  it('TC-API-24: negative dimension → 400', async () => {
    expect((await quote({ dimensions: { x: -1, y: 20, z: 20 } })).statusCode).toBe(400)
  })
  it('TC-API-25: wrong type (string volume) → 400', async () => {
    expect((await quote({ volumeCm3: 'eight' })).statusCode).toBe(400)
  })
})
