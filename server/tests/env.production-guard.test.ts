import { describe, it, expect } from 'vitest'
import {
  assertProductionSecrets,
  DEV_DEFAULT_JWT_SECRET,
  MIN_JWT_SECRET_LENGTH,
} from '../src/config/env.js'

// Structurally valid bcrypt hash of a throwaway string (60 chars) - not the dev default.
const GOOD_HASH = '$2b$10$xmIhuW5YhEW4Co2CqSdWp.uVWGjIG/VKaZrVzUA4KxJ8b1Oa0Uqam'
// The hash that used to be the default in env.ts; revoked, and rejected by fingerprint.
const LEAKED_HASH = '$2b$10$if6Vv4XeouWjfdqpIvQBIurozAOyjzN0hpoCNlVTnJJ4eyrFlDpMG'
const GOOD_SECRET = 'x'.repeat(MIN_JWT_SECRET_LENGTH)

const config = (over: Partial<Parameters<typeof assertProductionSecrets>[0]> = {}) => ({
  NODE_ENV: 'production' as const,
  ADMIN_PASSWORD_HASH: GOOD_HASH,
  JWT_SECRET: GOOD_SECRET,
  ...over,
})

describe('assertProductionSecrets (BUG-04 guard)', () => {
  it('accepts custom secrets in production', () => {
    expect(() => assertProductionSecrets(config())).not.toThrow()
  })

  it.each(['development', 'test'] as const)('allows unset secrets in %s', (NODE_ENV) => {
    expect(() =>
      assertProductionSecrets({
        NODE_ENV,
        ADMIN_PASSWORD_HASH: '',
        JWT_SECRET: DEV_DEFAULT_JWT_SECRET,
      })
    ).not.toThrow()
  })

  it('rejects the default JWT secret in production', () => {
    expect(() => assertProductionSecrets(config({ JWT_SECRET: DEV_DEFAULT_JWT_SECRET }))).toThrow(/JWT_SECRET/)
  })

  it('rejects the previously leaked admin hash in production', () => {
    expect(() =>
      assertProductionSecrets(config({ ADMIN_PASSWORD_HASH: LEAKED_HASH }))
    ).toThrow(/ADMIN_PASSWORD_HASH/)
  })

  it('rejects a missing admin hash in production', () => {
    expect(() => assertProductionSecrets(config({ ADMIN_PASSWORD_HASH: '' }))).toThrow(/ADMIN_PASSWORD_HASH/)
  })

  it('rejects the .env.example placeholders', () => {
    expect(() =>
      assertProductionSecrets(config({ JWT_SECRET: 'replace-with-a-very-long-random-secret-key' }))
    ).toThrow(/JWT_SECRET/)
    expect(() =>
      assertProductionSecrets(config({ ADMIN_PASSWORD_HASH: 'replace-with-bcrypt-hash' }))
    ).toThrow(/ADMIN_PASSWORD_HASH/)
  })

  it('rejects a short JWT secret (BVA: min-1 fails, min passes)', () => {
    expect(() =>
      assertProductionSecrets(config({ JWT_SECRET: 'x'.repeat(MIN_JWT_SECRET_LENGTH - 1) }))
    ).toThrow(/at least 32/)
    expect(() =>
      assertProductionSecrets(config({ JWT_SECRET: 'x'.repeat(MIN_JWT_SECRET_LENGTH) }))
    ).not.toThrow()
  })

  it('rejects an admin hash that is not bcrypt-shaped (e.g. a plaintext password)', () => {
    expect(() => assertProductionSecrets(config({ ADMIN_PASSWORD_HASH: 'hunter2' }))).toThrow(/valid bcrypt/)
  })

  it('reports every problem in one error', () => {
    expect(() =>
      assertProductionSecrets(
        config({ ADMIN_PASSWORD_HASH: LEAKED_HASH, JWT_SECRET: DEV_DEFAULT_JWT_SECRET })
      )
    ).toThrow(/ADMIN_PASSWORD_HASH[\s\S]*JWT_SECRET/)
  })
})
