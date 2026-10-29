import type { FastifyPluginAsync } from 'fastify'
import { getDb, schema } from '../db/index.js'
import { INITIAL_PORTFOLIO_ITEMS } from '../db/seedData.js'
import { eq, asc } from 'drizzle-orm'
import { z } from 'zod'
import { verifyAdmin } from '../middleware/auth.js'
import { randomUUID } from 'node:crypto'

const querySchema = z.object({
  category: z.string().optional(),
})

const createPortfolioItemSchema = z.object({
  title: z.string().min(2, 'Title is required').max(255),
  category: z.string().optional().default('general'),
  material: z.string().max(100).optional().default(''),
  imageUrl: z.string().min(1, 'Image URL is required'),
  aspectRatio: z.string().optional().default('auto'),
  description: z.string().optional().default(''),
  displayOrder: z.coerce.number().int().optional().default(0),
  isActive: z.boolean().default(true),
})

const updatePortfolioItemSchema = z.object({
  title: z.string().min(2).max(255).optional(),
  category: z.string().optional(),
  material: z.string().max(100).optional(),
  imageUrl: z.string().min(1).optional(),
  aspectRatio: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.coerce.number().int().optional(),
  isActive: z.boolean().optional(),
})

export const portfolioRoutes: FastifyPluginAsync = async (fastify) => {
  // Public: List active portfolio items ordered by displayOrder asc
  fastify.get('/api/v1/portfolio', async (request) => {
    const parseResult = querySchema.safeParse(request.query)
    const category = parseResult.success ? parseResult.data.category : undefined

    const db = getDb()
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.portfolioItems)
          .where(eq(schema.portfolioItems.isActive, true))
          .orderBy(asc(schema.portfolioItems.displayOrder))

        const filtered = category ? rows.filter((r) => r.category === category) : rows
        return { success: true, count: filtered.length, data: filtered }
      } catch (err) {
        fastify.log.warn({ err }, 'Querying portfolio_items failed, using fallback dataset')
      }
    }

    // In-memory fallback
    let items = INITIAL_PORTFOLIO_ITEMS.filter((item) => item.isActive !== false)
    if (category) {
      items = items.filter((item) => item.category === category)
    }
    items.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))

    return {
      success: true,
      count: items.length,
      data: items,
    }
  })

  // Public: Single portfolio item by ID
  fastify.get('/api/v1/portfolio/:id', async (request, reply) => {
    const { id } = request.params as { id: string }

    const db = getDb()
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.portfolioItems)
          .where(eq(schema.portfolioItems.id, id))
          .limit(1)

        if (rows && rows.length > 0) {
          return { success: true, data: rows[0] }
        }
        return reply.code(404).send({ success: false, error: 'Portfolio item not found' })
      } catch (err) {
        fastify.log.warn({ err }, `Querying portfolio item ${id} failed`)
      }
    }

    const item = INITIAL_PORTFOLIO_ITEMS.find((p) => p.id === id)
    if (!item) {
      return reply.code(404).send({ success: false, error: 'Portfolio item not found' })
    }

    return { success: true, data: item }
  })

  // Admin Protected: Create portfolio item
  fastify.post('/api/v1/portfolio', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const parseResult = createPortfolioItemSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const data = parseResult.data
    const db = getDb()

    if (db) {
      try {
        const inserted = await db
          .insert(schema.portfolioItems)
          .values({
            title: data.title,
            category: data.category,
            material: data.material || null,
            imageUrl: data.imageUrl,
            aspectRatio: data.aspectRatio,
            description: data.description || null,
            displayOrder: data.displayOrder,
            isActive: data.isActive,
          })
          .returning()

        if (inserted && inserted.length > 0) {
          return reply.code(201).send({
            success: true,
            data: inserted[0],
          })
        }
      } catch (err: unknown) {
        request.log.warn({ err }, 'Error inserting portfolio item into database, falling back to in-memory dataset')
      }
    }

    // In-memory fallback
    const fallbackItem = {
      id: randomUUID(),
      title: data.title,
      category: data.category,
      material: data.material || '',
      imageUrl: data.imageUrl,
      aspectRatio: data.aspectRatio,
      description: data.description || '',
      displayOrder: data.displayOrder,
      isActive: data.isActive,
      createdAt: new Date().toISOString(),
    }
    INITIAL_PORTFOLIO_ITEMS.push(fallbackItem)

    return reply.code(201).send({
      success: true,
      data: fallbackItem,
    })
  })

  // Admin Protected: Update portfolio item
  fastify.put('/api/v1/portfolio/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parseResult = updatePortfolioItemSchema.safeParse(request.body)
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
        if (updates.title !== undefined) updateValues.title = updates.title
        if (updates.category !== undefined) updateValues.category = updates.category
        if (updates.material !== undefined) updateValues.material = updates.material
        if (updates.imageUrl !== undefined) updateValues.imageUrl = updates.imageUrl
        if (updates.aspectRatio !== undefined) updateValues.aspectRatio = updates.aspectRatio
        if (updates.description !== undefined) updateValues.description = updates.description
        if (updates.displayOrder !== undefined) updateValues.displayOrder = updates.displayOrder
        if (updates.isActive !== undefined) updateValues.isActive = updates.isActive

        const updated = await db
          .update(schema.portfolioItems)
          .set(updateValues)
          .where(eq(schema.portfolioItems.id, id))
          .returning()

        if (updated && updated.length > 0) {
          return { success: true, data: updated[0] }
        }
        return reply.code(404).send({ success: false, error: 'Portfolio item not found' })
      } catch (err: unknown) {
        request.log.warn({ err }, `Error updating portfolio item in database for ${id}, falling back to in-memory dataset`)
      }
    }

    // In-memory fallback
    const itemIndex = INITIAL_PORTFOLIO_ITEMS.findIndex((p) => p.id === id)
    if (itemIndex === -1) {
      return reply.code(404).send({ success: false, error: 'Portfolio item not found' })
    }

    const item = INITIAL_PORTFOLIO_ITEMS[itemIndex]
    if (updates.title !== undefined) item.title = updates.title
    if (updates.category !== undefined) item.category = updates.category
    if (updates.material !== undefined) item.material = updates.material
    if (updates.imageUrl !== undefined) item.imageUrl = updates.imageUrl
    if (updates.aspectRatio !== undefined) item.aspectRatio = updates.aspectRatio
    if (updates.description !== undefined) item.description = updates.description
    if (updates.displayOrder !== undefined) item.displayOrder = updates.displayOrder
    if (updates.isActive !== undefined) item.isActive = updates.isActive

    return { success: true, data: item }
  })

  // Admin Protected: Delete portfolio item
  fastify.delete('/api/v1/portfolio/:id', { preHandler: [verifyAdmin] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const db = getDb()

    if (db) {
      try {
        const deleted = await db
          .delete(schema.portfolioItems)
          .where(eq(schema.portfolioItems.id, id))
          .returning()

        if (deleted && deleted.length > 0) {
          return { success: true, message: 'Portfolio item deleted successfully', data: deleted[0] }
        }
        return reply.code(404).send({ success: false, error: 'Portfolio item not found' })
      } catch (err: unknown) {
        request.log.warn({ err }, `Error deleting portfolio item in database for ${id}, falling back to in-memory dataset`)
      }
    }

    // In-memory fallback
    const itemIndex = INITIAL_PORTFOLIO_ITEMS.findIndex((p) => p.id === id)
    if (itemIndex === -1) {
      return reply.code(404).send({ success: false, error: 'Portfolio item not found' })
    }

    const removed = INITIAL_PORTFOLIO_ITEMS.splice(itemIndex, 1)[0]
    return { success: true, message: 'Portfolio item deleted successfully', data: removed }
  })
}
