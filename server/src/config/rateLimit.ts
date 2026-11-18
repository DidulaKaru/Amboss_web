import { env } from './env.js'

/**
 * Rate limits are effectively disabled under NODE_ENV=test so the integration suite
 * can hammer endpoints; set RATE_LIMIT_IN_TEST=1 to enforce the real limits in a test.
 * Evaluated at call time (route registration), not import time.
 */
export function limitFor(max: number): number {
  const active = env.NODE_ENV !== 'test' || process.env.RATE_LIMIT_IN_TEST === '1'
  return active ? max : 1_000_000
}

export const RATE_LIMITS = {
  global: 120,
  quote: 20,
  orders: 30,
  adminLogin: 10,
} as const
