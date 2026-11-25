import type { FastifyPluginAsync } from 'fastify'
import { getDb, schema } from '../db/index.js'
import { INITIAL_MACHINES } from '../db/seedData.js'
import { eq } from 'drizzle-orm'
import { PUBLIC_CACHE_CONTROL } from '../config/cache.js'

export const machinesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/machines', async (_request, reply) => {
    reply.header('Cache-Control', PUBLIC_CACHE_CONTROL)
    const db = getDb()
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.machines)
          .where(eq(schema.machines.isOnline, true))
        return { success: true, count: rows.length, data: rows }
      } catch (err) {
        fastify.log.warn({ err }, 'Querying machines failed, using initial dataset')
      }
    }

    return {
      success: true,
      count: INITIAL_MACHINES.length,
      data: INITIAL_MACHINES,
    }
  })
}
