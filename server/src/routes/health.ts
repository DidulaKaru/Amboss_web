import type { FastifyPluginAsync } from 'fastify'
import { getDb } from '../db/index.js'

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async () => {
    const db = getDb()
    return {
      status: 'ok',
      service: 'amboss-api',
      timestamp: new Date().toISOString(),
      database: db ? 'available' : 'fallback',
    }
  })
}
