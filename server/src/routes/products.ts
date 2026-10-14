import type { FastifyPluginAsync } from 'fastify'
import { getDb, schema } from '../db/index.js'
import { INITIAL_PRODUCTS } from '../db/seedData.js'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const querySchema = z.object({
  category: z.string().optional(),
})

export const productsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/v1/products', async (request) => {
    const parseResult = querySchema.safeParse(request.query)
    const category = parseResult.success ? parseResult.data.category : undefined

    const db = getDb()
    if (db) {
      try {
        let query = db.select().from(schema.products).where(eq(schema.products.isActive, true))
        const rows = await query
        if (rows && rows.length > 0) {
          const filtered = category ? rows.filter((r) => r.category === category) : rows
          return { success: true, count: filtered.length, data: filtered }
        }
      } catch (err) {
        fastify.log.warn({ err }, 'Querying products failed, using initial dataset')
      }
    }

    const filtered = category
      ? INITIAL_PRODUCTS.filter((p) => p.category === category)
      : INITIAL_PRODUCTS

    return {
      success: true,
      count: filtered.length,
      data: filtered,
    }
  })

  fastify.get('/api/v1/products/:sku', async (request, reply) => {
    const { sku } = request.params as { sku: string }

    const db = getDb()
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.sku, sku))
          .limit(1)
        if (rows && rows.length > 0) {
          return { success: true, data: rows[0] }
        }
      } catch (err) {
        fastify.log.warn({ err }, `Querying product ${sku} failed, using initial dataset`)
      }
    }

    const item = INITIAL_PRODUCTS.find((p) => p.sku === sku)
    if (!item) {
      return reply.code(404).send({ success: false, error: 'Product not found' })
    }

    return { success: true, data: item }
  })
}
