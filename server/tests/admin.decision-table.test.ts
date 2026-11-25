/**
 * SQA 3.3 — Decision table for POST /api/v1/admin/login (src/routes/admin.ts)
 *
 * Conditions: C1 IP locked? | C2 body valid? | C3 username correct? | C4 password correct? | C5 5th consecutive failure?
 *
 * | Rule | C1 | C2 | C3 | C4 | C5 | Action                          |
 * |------|----|----|----|----|----|---------------------------------|
 * | R1   | Y  | -  | -  | -  | -  | 429 + Retry-After               |
 * | R2   | N  | N  | -  | -  | -  | 400 Validation failed           |
 * | R3   | N  | Y  | Y  | Y  | -  | 200 + HttpOnly cookie           |
 * | R4   | N  | Y  | N  | -  | N  | 401 "Invalid username or password" |
 * | R5   | N  | Y  | Y  | N  | N  | 401 "Invalid username or password" |
 * | R6   | N  | Y  | N/Y| -/N| Y  | 401 "Access locked for 15 minutes" |
 *
 * Each test uses its own IP because the lockout map is per-IP and module-scoped.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../src/app.js'
import { env } from '../src/config/env.js'
import { adminCredentials } from './helpers.js'

const GOOD = adminCredentials
let app: FastifyInstance

beforeAll(async () => {
  app = await buildApp()
})
afterAll(async () => {
  await app.close()
})

function login(ip: string, payload: unknown) {
  return app.inject({ method: 'POST', url: '/api/v1/admin/login', remoteAddress: ip, payload: payload as object })
}

async function failTimes(ip: string, n: number) {
  for (let i = 0; i < n; i++) await login(ip, { username: 'x', password: 'y' })
}

describe('Decision table — admin login', () => {
  it('R1: locked IP → 429 with Retry-After, even with correct credentials', async () => {
    const ip = '203.0.113.1'
    await failTimes(ip, 5)
    const res = await login(ip, GOOD)
    expect(res.statusCode).toBe(429)
    expect(res.headers['retry-after']).toBeDefined()
  })

  it('R2: invalid body (empty password) → 400', async () => {
    const res = await login('203.0.113.2', { username: 'Dory', password: '' })
    expect(res.statusCode).toBe(400)
    expect(res.json().error).toBe('Validation failed')
  })

  it('R3: correct username + password → 200 and HttpOnly session cookie', async () => {
    const res = await login('203.0.113.3', GOOD)
    expect(res.statusCode).toBe(200)
    const cookie = String(res.headers['set-cookie'])
    expect(cookie).toMatch(/HttpOnly/i)
  })

  it('R4: wrong username → 401 generic message (no user enumeration)', async () => {
    const res = await login('203.0.113.4', { username: 'notadmin', password: GOOD.password })
    expect(res.statusCode).toBe(401)
    expect(res.json().error).toBe('Invalid username or password')
  })

  it('R5: correct username + wrong password → identical 401 message', async () => {
    const res = await login('203.0.113.5', { username: GOOD.username, password: 'wrong' })
    expect(res.statusCode).toBe(401)
    expect(res.json().error).toBe('Invalid username or password')
  })

  it('R6: 5th consecutive failure → 401 with lockout message', async () => {
    const ip = '203.0.113.6'
    await failTimes(ip, 4)
    const res = await login(ip, { username: 'x', password: 'y' })
    expect(res.statusCode).toBe(401)
    expect(res.json().error).toContain('Access locked for 15 minutes')
  })

  it('Extra: a successful login resets the failure counter', async () => {
    const ip = '203.0.113.7'
    await failTimes(ip, 4)
    expect((await login(ip, GOOD)).statusCode).toBe(200)
    // counter was reset, so 4 more failures must not lock the IP
    await failTimes(ip, 4)
    expect((await login(ip, GOOD)).statusCode).toBe(200)
  })

  it('wrong username with the CORRECT password → 401 (both share one bcrypt comparison)', async () => {
    const res = await login('203.0.113.40', { ...GOOD, username: 'ghost' })
    expect(res.statusCode).toBe(401)
    expect(res.headers['set-cookie']).toBeUndefined()
  })

  it.each(['', 'replace-with-bcrypt-hash'])('admin login is disabled when ADMIN_PASSWORD_HASH is %j', async (hash) => {
    const original = env.ADMIN_PASSWORD_HASH
    env.ADMIN_PASSWORD_HASH = hash
    try {
      for (const password of [GOOD.password, hash || 'x']) {
        expect((await login('203.0.113.41', { username: GOOD.username, password })).statusCode).toBe(401)
      }
    } finally {
      env.ADMIN_PASSWORD_HASH = original
    }
  })
})
