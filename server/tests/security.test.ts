import { describe, it, expect, afterEach } from 'vitest'
import { buildApp } from '../src/app.js'
import { resolveTrustProxy, env } from '../src/config/env.js'
import { imageUrlSchema } from '../src/config/validation.js'
import { INITIAL_PRODUCTS, INITIAL_PORTFOLIO_ITEMS } from '../src/db/seedData.js'
import { adminCookie, adminCredentials } from './helpers.js'

const QUOTE = {
  fileName: 'cube.stl',
  volumeCm3: 8,
  surfaceAreaCm2: 24,
  dimensions: { x: 20, y: 20, z: 20 },
  materialSlug: 'pla-plus',
}

describe('Rate limiting', () => {
  afterEach(() => {
    delete process.env.RATE_LIMIT_IN_TEST
  })

  it('returns 429 on POST /api/v1/quote/calculate after 20 requests per minute', async () => {
    process.env.RATE_LIMIT_IN_TEST = '1'
    const app = await buildApp()
    const call = () =>
      app.inject({ method: 'POST', url: '/api/v1/quote/calculate', payload: QUOTE, remoteAddress: '192.0.2.10' })

    for (let i = 0; i < 20; i++) {
      expect((await call()).statusCode).toBe(200)
    }
    const blocked = await call()
    expect(blocked.statusCode).toBe(429)
    expect(blocked.json().success).toBe(false)
    expect(blocked.headers['retry-after']).toBeDefined()

    // A different client IP is unaffected
    const other = await app.inject({
      method: 'POST',
      url: '/api/v1/quote/calculate',
      payload: QUOTE,
      remoteAddress: '192.0.2.11',
    })
    expect(other.statusCode).toBe(200)
    await app.close()
  })

  it('limits POST /api/v1/orders/* to 30 per minute', async () => {
    process.env.RATE_LIMIT_IN_TEST = '1'
    const app = await buildApp()
    const call = () =>
      app.inject({
        method: 'POST',
        url: '/api/v1/orders/validate-cart',
        payload: { items: [{ sku: 'MCU-ARDUINO-UNO-R3', quantity: 1 }] },
      })
    for (let i = 0; i < 30; i++) expect((await call()).statusCode).toBe(200)
    expect((await call()).statusCode).toBe(429)
    await app.close()
  })

  it('applies a global per-IP default of 120 requests per minute', async () => {
    process.env.RATE_LIMIT_IN_TEST = '1'
    const app = await buildApp()
    for (let i = 0; i < 120; i++) {
      expect((await app.inject({ method: 'GET', url: '/api/v1/materials' })).statusCode).toBe(200)
    }
    expect((await app.inject({ method: 'GET', url: '/api/v1/materials' })).statusCode).toBe(429)
    await app.close()
  })

  it('throttles admin login attempts independently of the failed-attempt lockout', async () => {
    process.env.RATE_LIMIT_IN_TEST = '1'
    const app = await buildApp()
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/login',
        remoteAddress: '192.0.2.50',
        payload: adminCredentials,
      })
      statuses.push(res.statusCode)
    }
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true)
    expect(statuses[10]).toBe(429)
    await app.close()
  })
})

describe('Error handler', () => {
  it('hides internal error details for 5xx responses', async () => {
    const app = await buildApp()
    app.get('/boom', async () => {
      throw new Error('password=hunter2 connection string leaked')
    })
    const res = await app.inject({ method: 'GET', url: '/boom' })
    expect(res.statusCode).toBe(500)
    expect(res.json()).toEqual({ success: false, error: 'Internal Server Error' })
    expect(res.body).not.toContain('hunter2')
    await app.close()
  })

  it('hides details of errors thrown with an explicit 5xx statusCode', async () => {
    const app = await buildApp()
    app.get('/boom503', async () => {
      const err: any = new Error('db host 10.1.2.3 refused')
      err.statusCode = 503
      throw err
    })
    const res = await app.inject({ method: 'GET', url: '/boom503' })
    expect(res.statusCode).toBe(503)
    expect(res.json().error).toBe('Internal Server Error')
    await app.close()
  })

  it('keeps client-error (4xx) messages', async () => {
    const app = await buildApp()
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/quote/calculate',
      headers: { 'content-type': 'application/json' },
      payload: '{ not json',
    })
    expect(res.statusCode).toBe(400)
    expect(res.json().success).toBe(false)
    expect(res.json().error).not.toBe('Internal Server Error')
    await app.close()
  })
})

describe('Trust proxy configuration', () => {
  it('trusts no proxy outside production', () => {
    expect(resolveTrustProxy('development')).toBe(false)
    expect(resolveTrustProxy('test')).toBe(false)
  })

  it('trusts exactly one hop in production by default', () => {
    const fn = resolveTrustProxy('production') as (a: string, hop: number) => boolean
    expect(typeof fn).toBe('function')
    expect(fn('10.0.0.1', 0)).toBe(true)
    expect(fn('1.2.3.4', 1)).toBe(false)
  })

  it('honours TRUST_PROXY_HOPS and disables trust at 0', () => {
    const original = env.TRUST_PROXY_HOPS
    try {
      ;(env as any).TRUST_PROXY_HOPS = 2
      const fn = resolveTrustProxy('production') as (a: string, hop: number) => boolean
      expect(fn('x', 1)).toBe(true)
      expect(fn('x', 2)).toBe(false)
      ;(env as any).TRUST_PROXY_HOPS = 0
      expect(resolveTrustProxy('production')).toBe(false)
    } finally {
      ;(env as any).TRUST_PROXY_HOPS = original
    }
  })

  it('ignores client-supplied X-Forwarded-For prefixes in production', async () => {
    const original = env.NODE_ENV
    ;(env as any).NODE_ENV = 'production'
    try {
      const app = await buildApp()
      app.get('/ip', async (req) => ({ ip: req.ip }))
      const res = await app.inject({
        method: 'GET',
        url: '/ip',
        remoteAddress: '10.0.0.1',
        headers: { 'x-forwarded-for': '6.6.6.6, 198.51.100.77' },
      })
      expect(res.json().ip).toBe('198.51.100.77')
      await app.close()
    } finally {
      ;(env as any).NODE_ENV = original
    }
  })
})

describe('imageUrl validation', () => {
  it('accepts relative images/ paths including every seed value and the default', () => {
    const seeds = [...INITIAL_PRODUCTS, ...INITIAL_PORTFOLIO_ITEMS].map((i) => i.imageUrl)
    for (const url of [...seeds, 'images/amboss-logo.png', 'images/vein finder.jpg', 'images/sub/dir/a_b-c(1).webp']) {
      expect(imageUrlSchema.safeParse(url).success, url).toBe(true)
    }
  })

  it('rejects schemes, absolute paths, traversal, unsafe characters and long values', () => {
    const bad = [
      'https://evil.example/x.png',
      'http://evil.example/x.png',
      '//evil.example/x.png',
      '/images/x.png',
      'javascript:alert(1)',
      'data:image/svg+xml;base64,AAAA',
      'images/../secret.png',
      '../images/x.png',
      'images/..%2f..%2fx.png',
      'images/x.png?<script>',
      'images/"onerror=x',
      'images\\x.png',
      'img/x.png',
      'images/' + 'a'.repeat(250),
      '',
    ]
    for (const url of bad) {
      expect(imageUrlSchema.safeParse(url).success, url).toBe(false)
    }
  })

  it('is enforced on product and portfolio admin writes', async () => {
    const app = await buildApp()
    const auth = await adminCookie(app)

    const badProduct = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: auth,
      payload: { sku: 'IMG-TEST-1', name: 'Img Test', category: 'sensors', priceLkr: 10, imageUrl: 'https://evil.example/x.png' },
    })
    expect(badProduct.statusCode).toBe(400)

    const goodProduct = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: auth,
      payload: { sku: 'IMG-TEST-2', name: 'Img Test', category: 'sensors', priceLkr: 10, imageUrl: 'images/vein finder.jpg' },
    })
    expect(goodProduct.statusCode).toBe(201)

    const badUpdate = await app.inject({
      method: 'PUT',
      url: '/api/v1/products/IMG-TEST-2',
      headers: auth,
      payload: { imageUrl: '/etc/passwd' },
    })
    expect(badUpdate.statusCode).toBe(400)
    await app.inject({ method: 'DELETE', url: '/api/v1/products/IMG-TEST-2', headers: auth })

    const badPortfolio = await app.inject({
      method: 'POST',
      url: '/api/v1/portfolio',
      headers: auth,
      payload: { title: 'Bad image', imageUrl: 'images/../../x.png' },
    })
    expect(badPortfolio.statusCode).toBe(400)

    const badPortfolioUpdate = await app.inject({
      method: 'PUT',
      url: `/api/v1/portfolio/${INITIAL_PORTFOLIO_ITEMS[0].id}`,
      headers: auth,
      payload: { imageUrl: 'javascript:alert(1)' },
    })
    expect(badPortfolioUpdate.statusCode).toBe(400)
    await app.close()
  })

  it('defaults product imageUrl to the logo when omitted', async () => {
    const app = await buildApp()
    const auth = await adminCookie(app)
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/products',
      headers: auth,
      payload: { sku: 'IMG-TEST-3', name: 'Default Img', category: 'sensors', priceLkr: 10 },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.imageUrl).toBe('images/amboss-logo.png')
    await app.inject({ method: 'DELETE', url: '/api/v1/products/IMG-TEST-3', headers: auth })
    await app.close()
  })
})

describe('Public caching headers', () => {
  const CACHE = 'public, max-age=60, stale-while-revalidate=300'

  it('sets Cache-Control on public GET list endpoints', async () => {
    const app = await buildApp()
    for (const url of ['/api/v1/products', '/api/v1/portfolio', '/api/v1/materials', '/api/v1/machines']) {
      const res = await app.inject({ method: 'GET', url })
      expect(res.statusCode, url).toBe(200)
      expect(res.headers['cache-control'], url).toBe(CACHE)
    }
    await app.close()
  })

  it('does not set public caching on POST or admin endpoints', async () => {
    const app = await buildApp()
    const quote = await app.inject({ method: 'POST', url: '/api/v1/quote/calculate', payload: QUOTE })
    expect(quote.headers['cache-control'] ?? '').not.toContain('public')

    const auth = await adminCookie(app)
    const me = await app.inject({ method: 'GET', url: '/api/v1/admin/me', headers: auth })
    expect(me.statusCode).toBe(200)
    expect(me.headers['cache-control'] ?? '').not.toContain('public')
    await app.close()
  })
})

describe('Input bounds', () => {
  it('rejects over-long category query parameters', async () => {
    const app = await buildApp()
    for (const base of ['/api/v1/products', '/api/v1/portfolio']) {
      const res = await app.inject({ method: 'GET', url: `${base}?category=${'a'.repeat(51)}` })
      expect(res.statusCode, base).toBe(400)
    }
    await app.close()
  })

  it('bounds quote geometry, quantity and file name', async () => {
    const app = await buildApp()
    const post = (extra: Record<string, unknown>) =>
      app.inject({ method: 'POST', url: '/api/v1/quote/calculate', payload: { ...QUOTE, ...extra } })

    expect((await post({ quantity: 101 })).statusCode).toBe(400)
    expect((await post({ quantity: 100 })).statusCode).toBe(200)
    expect((await post({ volumeCm3: 1e9 })).statusCode).toBe(400)
    expect((await post({ surfaceAreaCm2: 1e9 })).statusCode).toBe(400)
    expect((await post({ dimensions: { x: 1e6, y: 1, z: 1 } })).statusCode).toBe(400)
    expect((await post({ fileName: 'x'.repeat(256) })).statusCode).toBe(400)
    expect((await post({ materialSlug: 'x'.repeat(51) })).statusCode).toBe(400)
    await app.close()
  })

  it('bounds admin product fields', async () => {
    const app = await buildApp()
    const auth = await adminCookie(app)
    const post = (extra: Record<string, unknown>) =>
      app.inject({
        method: 'POST',
        url: '/api/v1/products',
        headers: auth,
        payload: { sku: 'BOUND-1', name: 'Bound', category: 'sensors', priceLkr: 10, ...extra },
      })
    expect((await post({ sku: 'S'.repeat(51) })).statusCode).toBe(400)
    expect((await post({ name: 'N'.repeat(151) })).statusCode).toBe(400)
    expect((await post({ category: 'c'.repeat(51) })).statusCode).toBe(400)
    expect((await post({ description: 'd'.repeat(5001) })).statusCode).toBe(400)
    expect((await post({ priceLkr: 1e12 })).statusCode).toBe(400)
    await app.close()
  })
})
