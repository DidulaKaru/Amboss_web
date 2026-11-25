import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { env } from '../config/env.js'
import { verifyAdmin } from '../middleware/auth.js'
import { limitFor, RATE_LIMITS } from '../config/rateLimit.js'

// Session lifetime: JWT expiry and cookie maxAge must match (12 hours)
const SESSION_SECONDS = 12 * 60 * 60

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(200),
})

// In-memory rate limiting to defend against brute-force password guessing
interface LoginAttempt {
  count: number
  lockoutUntil: number
}
const loginAttempts = new Map<string, LoginAttempt>()
const MAX_ATTEMPTS = 5
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

// bcrypt hash of a random throwaway string nobody knows. Compared against when the username is
// wrong so both login paths take the same time (prevents username enumeration by timing).
const DUMMY_HASH = '$2b$10$xmIhuW5YhEW4Co2CqSdWp.uVWGjIG/VKaZrVzUA4KxJ8b1Oa0Uqam'

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Login Endpoint
  fastify.post(
    '/api/v1/admin/login',
    { config: { rateLimit: { max: limitFor(RATE_LIMITS.adminLogin), timeWindow: '1 minute' } } },
    async (request, reply) => {
    const ip = request.ip || 'unknown'
    const now = Date.now()

    // Prune expired attempts periodically to prevent unbounded memory growth
    if (loginAttempts.size > 100) {
      for (const [key, value] of loginAttempts.entries()) {
        if (value.lockoutUntil <= now) {
          loginAttempts.delete(key)
        }
      }
    }

    const attempt = loginAttempts.get(ip)

    if (attempt && attempt.lockoutUntil > now) {
      const waitSeconds = Math.ceil((attempt.lockoutUntil - now) / 1000)
      reply.header('Retry-After', waitSeconds)
      return reply.code(429).send({
        success: false,
        error: `Too many failed login attempts. Please wait ${Math.ceil(waitSeconds / 60)} minutes before trying again.`,
      })
    }

    const parseResult = loginSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const { username, password } = parseResult.data

    // Constant-time execution to prevent timing-based username enumeration
    const isTargetUser = username === env.ADMIN_USERNAME
    const hashToTest = isTargetUser ? env.ADMIN_PASSWORD_HASH : DUMMY_HASH
    const passwordMatch = await bcrypt.compare(password, hashToTest)

    if (!isTargetUser || !passwordMatch) {
      // If previous lockout expired, reset counter to 0. Otherwise use existing count.
      const previousCount =
        attempt && attempt.lockoutUntil > 0 && attempt.lockoutUntil <= now
          ? 0
          : attempt?.count || 0

      const currentAttempts = previousCount + 1
      const isLocked = currentAttempts >= MAX_ATTEMPTS
      loginAttempts.set(ip, {
        count: isLocked ? 0 : currentAttempts,
        lockoutUntil: isLocked ? now + LOCKOUT_WINDOW_MS : 0,
      })

      return reply.code(401).send({
        success: false,
        error: isLocked
          ? 'Too many failed login attempts. Access locked for 15 minutes.'
          : 'Invalid username or password',
      })
    }

    // Reset attempt counter upon successful authentication
    loginAttempts.delete(ip)

    // Sign JWT with the same lifetime as the session cookie
    const token = (fastify as any).jwt.sign(
      { username: env.ADMIN_USERNAME, role: 'admin' },
      { expiresIn: SESSION_SECONDS }
    )

    const isProd = env.NODE_ENV === 'production'

    // Set HttpOnly cookie ('none' + secure: true in production to prevent cross-origin blocking on raw koyeb.app)
    reply.setCookie('amboss_admin_token', token, {
      path: '/',
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: SESSION_SECONDS,
    })

    return {
      success: true,
      user: {
        username: env.ADMIN_USERNAME,
        role: 'admin',
      },
    }
    }
  )

  // Logout Endpoint
  fastify.post('/api/v1/admin/logout', async (request, reply) => {
    const isProd = env.NODE_ENV === 'production'
    reply.clearCookie('amboss_admin_token', {
      path: '/',
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
    })
    return {
      success: true,
      message: 'Logged out successfully',
    }
  })

  // Current Admin Session Verification Endpoint
  fastify.get('/api/v1/admin/me', { preHandler: [verifyAdmin] }, async (request) => {
    return {
      success: true,
      user: request.user,
    }
  })
}
