import { describe, it, expect } from 'vitest'
import { buildApp } from '../src/app.js'

describe('Health API', () => {
  it('GET /health returns status 200 with ok status', async () => {
    const app = await buildApp()
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    const json = response.json()
    expect(json.status).toBe('ok')
    expect(json.service).toBe('amboss-api')
    expect(json.timestamp).toBeDefined()
    await app.close()
  })
})
