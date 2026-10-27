import Fastify, { type FastifyInstance, type FastifyServerOptions, type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import { env } from './config/env.js'
import { healthRoutes } from './routes/health.js'
import { materialsRoutes } from './routes/materials.js'
import { machinesRoutes } from './routes/machines.js'
import { productsRoutes } from './routes/products.js'
import { quoteRoutes } from './routes/quote.js'
import { ordersRoutes } from './routes/orders.js'
import { adminRoutes } from './routes/admin.js'
import { portfolioRoutes } from './routes/portfolioRoutes.js'

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : true,
    ...opts,
  })

  // Handle empty JSON bodies gracefully (prevents FST_ERR_CTP_EMPTY_JSON_BODY on DELETE/GET requests)
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
    const raw = typeof body === 'string' ? body : body ? body.toString('utf-8') : ''
    if (!raw || raw.trim().length === 0) {
      done(null, undefined)
      return
    }
    try {
      done(null, JSON.parse(raw))
    } catch (err: any) {
      err.statusCode = 400
      done(err, undefined)
    }
  })

  // Security & Middleware
  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  await app.register(cookie)

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  })

  // Parse CORS origins from environment into a clean, trimmed array
  const allowedOrigins = (() => {
    if (env.CORS_ORIGIN === '*') {
      return true
    }
    const defaults = ['http://localhost:5173', 'https://amboss.lk', 'https://www.amboss.lk']
    if (env.CORS_ORIGIN) {
      const parsed = env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
      if (parsed.length > 0) {
        return Array.from(new Set([...defaults, ...parsed]))
      }
    }
    return defaults
  })()

  await app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  // Register API Routes
  await app.register(healthRoutes)
  await app.register(materialsRoutes)
  await app.register(machinesRoutes)
  await app.register(productsRoutes)
  await app.register(quoteRoutes)
  await app.register(ordersRoutes)
  await app.register(adminRoutes)
  await app.register(portfolioRoutes)

  // 404 Handler
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Route not found',
      path: request.url,
    })
  })

  // Global Error Handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    app.log.error(error)
    reply.code(error.statusCode || 500).send({
      success: false,
      error: error.message || 'Internal Server Error',
    })
  })

  return app
}
