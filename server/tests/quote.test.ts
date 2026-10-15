import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Quote Calculation API', () => {
  it('POST /api/v1/quote/calculate computes valid quote for 20mm cube with PLA+', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/quote/calculate',
      payload: {
        fileName: 'calibration_cube_20mm.stl',
        volumeCm3: 8.0,
        surfaceAreaCm2: 24.0,
        dimensions: { x: 20, y: 20, z: 20 },
        materialSlug: 'pla-plus',
        infillPct: 20,
        layerHeightMm: 0.20,
        quantity: 1,
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.pricing.estimatedGrams).toBeGreaterThan(0)
    expect(json.pricing.materialCostLkr).toBeGreaterThan(0)
    expect(json.pricing.machineCostLkr).toBeGreaterThan(0)
    expect(json.pricing.handlingCostLkr).toBe(250)
    expect(json.pricing.totalPriceLkr).toBe(
      json.pricing.materialCostLkr + json.pricing.machineCostLkr + json.pricing.handlingCostLkr
    )
    expect(json.disclaimer).toContain('Automated estimate')
    await app.close()
  })

  it('routes ABS to Elegoo Centauri Carbon or Creality K2 Plus', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/quote/calculate',
      payload: {
        fileName: 'functional_bracket.stl',
        volumeCm3: 15.0,
        surfaceAreaCm2: 45.0,
        dimensions: { x: 50, y: 50, z: 30 },
        materialSlug: 'abs',
        infillPct: 50,
        layerHeightMm: 0.20,
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.pricing.recommendedMachine).toMatch(/Centauri Carbon|K2 Plus/)
    await app.close()
  })

  it('routes SLA resin to Elegoo Saturn 4 Ultra', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/quote/calculate',
      payload: {
        fileName: 'miniature_figure.stl',
        volumeCm3: 5.0,
        surfaceAreaCm2: 18.0,
        dimensions: { x: 30, y: 30, z: 45 },
        materialSlug: 'lite-resin',
        infillPct: 100,
        layerHeightMm: 0.12,
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.pricing.recommendedMachine).toContain('Saturn 4 Ultra')
    expect(json.pricing.handlingCostLkr).toBe(350)
    await app.close()
  })

  it('rejects invalid inputs with 400', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/quote/calculate',
      payload: {
        volumeCm3: -5,
        surfaceAreaCm2: 24,
        dimensions: { x: 20, y: 20, z: 20 },
        materialSlug: 'pla-plus',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json().success).toBe(false)
    await app.close()
  })

  it('enforces minimum print price of 250 LKR', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/quote/calculate',
      payload: {
        fileName: 'tiny_pin.stl',
        volumeCm3: 0.1,
        surfaceAreaCm2: 0.6,
        dimensions: { x: 2, y: 2, z: 5 },
        materialSlug: 'pla-plus',
        infillPct: 20,
        layerHeightMm: 0.20,
        quantity: 1,
      },
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(json.pricing.unitPriceLkr).toBeGreaterThanOrEqual(250)
    expect(json.pricing.totalPriceLkr).toBeGreaterThanOrEqual(250)
    await app.close()
  })
})
