import Fastify, { type FastifyInstance, type FastifyServerOptions, type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import cookie from '@fastify/cookie'
import jwt from '@fastify/jwt'
import rateLimit from '@fastify/rate-limit'
import { env, resolveTrustProxy } from './config/env.js'
import { limitFor, RATE_LIMITS } from './config/rateLimit.js'
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
    // Hop count (not `true`) so a client cannot spoof request.ip via X-Forwarded-For
    trustProxy: resolveTrustProxy(),
    bodyLimit: 100 * 1024, // 100kb
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

  // Global rate limiting (generous default; stricter per-route limits are set on the routes).
  // Effectively disabled under test unless a test opts in via RATE_LIMIT_IN_TEST (see config/rateLimit.ts).
  await app.register(rateLimit, {
    global: true,
    max: limitFor(RATE_LIMITS.global),
    timeWindow: '1 minute',
    allowList: (request) => request.url === '/health' || request.url.startsWith('/api/v1/health'),
  })

  await app.register(jwt, {
    secret: env.JWT_SECRET,
  })

  // Parse CORS origins strictly. Never reflect arbitrary origins with credentials: true.
  const allowedOrigins = (() => {
    const prodOrigins = ['https://amboss.lk', 'https://www.amboss.lk']
    const devOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4000']

    const baseOrigins = env.NODE_ENV === 'production' ? prodOrigins : [...devOrigins, ...prodOrigins]

    if (env.CORS_ORIGIN && env.CORS_ORIGIN !== '*') {
      const parsed = env.CORS_ORIGIN.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
      if (parsed.length > 0) {
        return Array.from(new Set([...baseOrigins, ...parsed]))
      }
    }
    return baseOrigins
  })()

  await app.register(cors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  })

  // 404 Handler (must be set BEFORE route plugins load, otherwise encapsulated plugin routes keep Fastify's defaults)
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      error: 'Route not found',
      path: request.url,
    })
  })

  // Global Error Handler
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500
    if (status >= 500) {
      // Log the real error, but never leak internals to the client
      app.log.error(error)
      reply.code(status).send({ success: false, error: 'Internal Server Error' })
      return
    }
    app.log.warn(error)
    reply.code(status).send({
      success: false,
      error: error.message || 'Bad Request',
    })
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

  return app
}

// Default export handler for Vercel Serverless Function runtime
const app = await buildApp();
await app.ready();

export default (req: any, res: any) => {
  app.server.emit('request', req, res);
};
