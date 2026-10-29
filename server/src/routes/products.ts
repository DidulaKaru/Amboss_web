import type { FastifyPluginAsync } from 'fastify'
import { getDb, schema } from '../db/index.js'
import { INITIAL_PRODUCTS } from '../db/seedData.js'
import { eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { verifyAdmin } from '../middleware/auth.js'
import { env } from '../config/env.js'

const querySchema = z.object({
  category: z.string().optional(),
})

const createProductSchema = z.object({
  sku: z.string().min(2, 'SKU is required'),
  name: z.string().min(2, 'Product name is required'),
  category: z.string().min(2, 'Category is required'),
  description: z.string().default(''),
  priceLkr: z.coerce.number().min(0, 'Price must be positive'),
  stockQuantity: z.coerce.number().int().min(0, 'Stock must be 0 or more').default(0),
  imageUrl: z.string().default('images/amboss-logo.png'),
  isActive: z.boolean().default(true),
})

const updateProductSchema = z.object({
  name: z.string().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  priceLkr: z.coerce.number().min(0).optional(),
  stockQuantity: z.coerce.number().int().min(0).optional(),
  imageUrl: z.string().optional(),
  isActive: z.boolean().optional(),
})

export const productsRoutes: FastifyPluginAsync = async (fastify) => {
  // Public: List products
  fastify.get('/api/v1/products', async (request) => {
    const parseResult = querySchema.safeParse(request.query)
    const category = parseResult.success ? parseResult.data.category : undefined

    const db = getDb()
    if (db) {
      try {
        const query = db.select().from(schema.products).where(eq(schema.products.isActive, true))
        const rows = await query
        const filtered = category ? rows.filter((r) => r.category === category) : rows
        return { success: true, count: filtered.length, data: filtered }
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

  // Public: Single product by SKU
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
        return reply.code(404).send({ success: false, error: 'Product not found' })
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

  // Admin Protected: Create product
  fastify.post('/api/v1/products', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const parseResult = createProductSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const newProd = parseResult.data
    const db = getDb()

    if (db) {
      try {
        const inserted = await db
          .insert(schema.products)
          .values({
            sku: newProd.sku,
            name: newProd.name,
            category: newProd.category,
            description: newProd.description,
            priceLkr: newProd.priceLkr.toFixed(2),
            stockQuantity: newProd.stockQuantity,
            imageUrl: newProd.imageUrl,
            isActive: newProd.isActive,
          })
          .returning()

        if (inserted && inserted.length > 0) {
          return reply.code(201).send({
            success: true,
            data: inserted[0],
          })
        }
      } catch (err: any) {
        if (err?.code === '23505') {
          return reply.code(409).send({
            success: false,
            error: `Product with SKU '${newProd.sku}' already exists`,
          })
        }
        request.log.error({ err }, 'Error inserting product into database')
        return reply.code(500).send({
          success: false,
          error: 'Database error: Failed to persist product',
        })
      }
    }

    if (env.NODE_ENV !== 'test' && !db) {
      return reply.code(503).send({
        success: false,
        error: 'Database unavailable: Operation could not be persisted',
      })
    }

    // In-memory fallback for test environment
    const fallbackItem = {
      sku: newProd.sku,
      name: newProd.name,
      category: newProd.category,
      description: newProd.description,
      priceLkr: newProd.priceLkr.toFixed(2),
      stockQuantity: newProd.stockQuantity,
      imageUrl: newProd.imageUrl,
      isActive: newProd.isActive,
    }
    INITIAL_PRODUCTS.push(fallbackItem)

    return reply.code(201).send({
      success: true,
      data: fallbackItem,
    })
  })

  // Admin Protected: Update product by SKU or ID
  fastify.put('/api/v1/products/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parseResult = updateProductSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const updates = parseResult.data
    const db = getDb()

    if (db) {
      try {
        const updateValues: Record<string, any> = {}
        if (updates.name !== undefined) updateValues.name = updates.name
        if (updates.category !== undefined) updateValues.category = updates.category
        if (updates.description !== undefined) updateValues.description = updates.description
        if (updates.priceLkr !== undefined) updateValues.priceLkr = updates.priceLkr.toFixed(2)
        if (updates.stockQuantity !== undefined) updateValues.stockQuantity = updates.stockQuantity
        if (updates.imageUrl !== undefined) updateValues.imageUrl = updates.imageUrl
        if (updates.isActive !== undefined) updateValues.isActive = updates.isActive

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        const whereClause = isUuid
          ? or(eq(schema.products.sku, id), eq(schema.products.id, id))
          : eq(schema.products.sku, id)

        const updated = await db
          .update(schema.products)
          .set(updateValues)
          .where(whereClause)
          .returning()

        if (updated && updated.length > 0) {
          return { success: true, data: updated[0] }
        }
        return reply.code(404).send({ success: false, error: 'Product not found' })
      } catch (err: unknown) {
        request.log.error({ err }, `Error updating product in database for ${id}`)
        return reply.code(500).send({
          success: false,
          error: 'Database error: Failed to update product',
        })
      }
    }

    if (env.NODE_ENV !== 'test' && !db) {
      return reply.code(503).send({
        success: false,
        error: 'Database unavailable: Operation could not be persisted',
      })
    }

    // In-memory fallback for test environment
    const itemIndex = INITIAL_PRODUCTS.findIndex((p) => p.sku === id || (p as any).id === id)
    if (itemIndex === -1) {
      return reply.code(404).send({ success: false, error: 'Product not found' })
    }

    const item = INITIAL_PRODUCTS[itemIndex]
    if (updates.name !== undefined) item.name = updates.name
    if (updates.category !== undefined) item.category = updates.category
    if (updates.description !== undefined) item.description = updates.description
    if (updates.priceLkr !== undefined) item.priceLkr = updates.priceLkr.toFixed(2)
    if (updates.stockQuantity !== undefined) item.stockQuantity = updates.stockQuantity
    if (updates.imageUrl !== undefined) item.imageUrl = updates.imageUrl
    if (updates.isActive !== undefined) item.isActive = updates.isActive

    return { success: true, data: item }
  })

  // Admin Protected: Delete product by SKU or ID
  fastify.delete('/api/v1/products/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const db = getDb()

    if (db) {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        const whereClause = isUuid
          ? or(eq(schema.products.sku, id), eq(schema.products.id, id))
          : eq(schema.products.sku, id)

        const deleted = await db
          .delete(schema.products)
          .where(whereClause)
          .returning()

        if (deleted && deleted.length > 0) {
          return { success: true, message: 'Product deleted successfully', data: deleted[0] }
        }
        return reply.code(404).send({ success: false, error: 'Product not found' })
      } catch (err: unknown) {
        request.log.error({ err }, `Error deleting product in database for ${id}`)
        return reply.code(500).send({
          success: false,
          error: 'Database error: Failed to delete product',
        })
      }
    }

    if (env.NODE_ENV !== 'test' && !db) {
      return reply.code(503).send({
        success: false,
        error: 'Database unavailable: Operation could not be persisted',
      })
    }

    // In-memory fallback for test environment
    const itemIndex = INITIAL_PRODUCTS.findIndex((p) => p.sku === id || (p as any).id === id)
    if (itemIndex === -1) {
      return reply.code(404).send({ success: false, error: 'Product not found' })
    }

    const removed = INITIAL_PRODUCTS.splice(itemIndex, 1)[0]
    return { success: true, message: 'Product deleted successfully', data: removed }
  })
}
