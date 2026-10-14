import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Materials API', () => {
  it('GET /api/v1/materials returns the 7 Amboss materials', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/materials',
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data)).toBe(true)
    expect(json.data.length).toBeGreaterThanOrEqual(7)

    const slugs = json.data.map((m: any) => m.slug)
    expect(slugs).toContain('pla-plus')
    expect(slugs).toContain('petg')
    expect(slugs).toContain('abs')
    expect(slugs).toContain('tpu')
    expect(slugs).toContain('petg-cf')
    expect(slugs).toContain('lite-resin')
    expect(slugs).toContain('high-clear-resin')

    // Verify ABS requires enclosure
    const abs = json.data.find((m: any) => m.slug === 'abs')
    expect(abs.requiresEnclosure).toBe(true)
    expect(parseFloat(abs.costPerGramLkr)).toBe(25)

    await app.close()
  })
})
