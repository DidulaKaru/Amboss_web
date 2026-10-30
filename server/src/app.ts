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
    trustProxy: env.NODE_ENV === 'production',
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

// Default export handler for Vercel Serverless Function runtime
const app = await buildApp();
await app.ready();

export default (req: any, res: any) => {
  app.server.emit('request', req, res);
};
