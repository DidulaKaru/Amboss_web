import type { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { env } from '../config/env.js'
import { verifyAdmin } from '../middleware/auth.js'

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const adminRoutes: FastifyPluginAsync = async (fastify) => {
  // Login Endpoint
  fastify.post('/api/v1/admin/login', async (request, reply) => {
    const parseResult = loginSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const { username, password } = parseResult.data

    const usernameMatch = username === env.ADMIN_USERNAME
    const passwordMatch = usernameMatch && (await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH))

    if (!usernameMatch || !passwordMatch) {
      return reply.code(401).send({
        success: false,
        error: 'Invalid username or password',
      })
    }

    // Sign JWT token valid for 24h
    const token = (fastify as any).jwt.sign(
      { username: env.ADMIN_USERNAME, role: 'admin' },
      { expiresIn: '24h' }
    )

    // Set HttpOnly cookie
    reply.setCookie('amboss_admin_token', token, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400, // 24 hours in seconds
    })

    return {
      success: true,
      token,
      user: {
        username: env.ADMIN_USERNAME,
        role: 'admin',
      },
    }
  })

  // Logout Endpoint
  fastify.post('/api/v1/admin/logout', async (request, reply) => {
    reply.clearCookie('amboss_admin_token', {
      path: '/',
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
