import type { FastifyPluginAsync } from 'fastify'
import { getDb, schema } from '../db/index.js'
import { INITIAL_MACHINES } from '../db/seedData.js'
import { eq } from 'drizzle-orm'

export const machinesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/machines', async () => {
    const db = getDb()
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.machines)
          .where(eq(schema.machines.isOnline, true))
        if (rows && rows.length > 0) {
          return { success: true, count: rows.length, data: rows }
        }
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
