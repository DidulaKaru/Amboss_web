# Server API Integration Tests (`server/tests`)

This directory houses the backend test suite executed with Vitest, leveraging Fastify's in-memory `.inject()` method for fast, deterministic HTTP testing without binding to live TCP sockets.

---

## Test Suites Overview

| Test File | Target Endpoint / Module | Key Assertions |
| :--- | :--- | :--- |
| `admin.test.ts` | `/api/v1/admin/*`, `/api/v1/products` | Rejects unauthenticated mutations with 401 Unauthorized; rejects invalid credentials; authenticates valid credentials, sets HttpOnly cookie, and performs CRUD operations; logs out successfully. |
| `health.test.ts` | `/health` | Returns 200 OK with uptime, timestamp, and database status. |
| `materials.test.ts`| `/api/v1/materials` | Returns active 7 Amboss additive manufacturing materials with densities and prices. |
| `orders.test.ts` | `/api/v1/orders/*` | Validates cart quantities against inventory; generates formatted WhatsApp payloads for store and quote orders; tests free pickup and dynamic courier calculations. |
| `products.test.ts`| `/api/v1/products` | Returns full maker catalog; filters by category; retrieves product by SKU. |
| `quote.test.ts` | `/api/v1/quote/calculate` | Computes valid quote for 20mm calibration cube; verifies price updates with infill changes; tests build volume limits; enforces **250 LKR** minimum print threshold. |

---

## Execution Instructions

```bash
# Run all server tests
npm test --workspace=server

# Run tests in watch mode
npm run test:watch --workspace=server

# Run a specific test suite
npx vitest run server/tests/admin.test.ts
```

---

## Writing Integration Tests with Fastify `.inject()`

Example template:
```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/app.js'
import type { FastifyInstance } from 'fastify'

describe('Custom Feature API', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('handles GET /api/v1/custom', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/custom',
    })
    expect(res.statusCode).toBe(200)
    const json = res.json()
    expect(json.success).toBe(true)
  })
})
```
