import type { FastifyPluginAsync } from 'fastify'
import { getDb, schema } from '../db/index.js'
import { INITIAL_MATERIALS } from '../db/seedData.js'
import { eq } from 'drizzle-orm'

export const materialsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/materials', async () => {
    const db = getDb()
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.materials)
          .where(eq(schema.materials.isActive, true))
        return { success: true, count: rows.length, data: rows }
      } catch (err) {
        fastify.log.warn({ err }, 'Querying materials failed, using initial dataset')
      }
    }

    return {
      success: true,
      count: INITIAL_MATERIALS.length,
      data: INITIAL_MATERIALS,
    }
  })
}
