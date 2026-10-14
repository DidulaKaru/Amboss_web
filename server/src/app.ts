import Fastify, { type FastifyInstance, type FastifyServerOptions, type FastifyError } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import { env } from './config/env.js'
import { healthRoutes } from './routes/health.js'
import { materialsRoutes } from './routes/materials.js'
import { machinesRoutes } from './routes/machines.js'
import { productsRoutes } from './routes/products.js'
import { quoteRoutes } from './routes/quote.js'
import { ordersRoutes } from './routes/orders.js'

export async function buildApp(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'test' ? false : true,
    ...opts,
  })

  // Security & Middleware
  await app.register(helmet, {
    contentSecurityPolicy: false,
  })

  await app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN.split(','),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  // Register API Routes
  await app.register(healthRoutes)
  await app.register(materialsRoutes)
  await app.register(machinesRoutes)
  await app.register(productsRoutes)
  await app.register(quoteRoutes)
  await app.register(ordersRoutes)

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
