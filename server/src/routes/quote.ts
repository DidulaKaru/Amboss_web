import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getDb, schema } from '../db/index.js'
import { INITIAL_MATERIALS } from '../db/seedData.js'
import { computeServerPricing } from '../services/pricingService.js'
import { eq } from 'drizzle-orm'

const calculateQuoteSchema = z.object({
  fileName: z.string().default('model.stl'),
  volumeCm3: z.number().positive('volumeCm3 must be greater than 0'),
  surfaceAreaCm2: z.number().positive('surfaceAreaCm2 must be greater than 0'),
  dimensions: z.object({
    x: z.number().positive(),
    y: z.number().positive(),
    z: z.number().positive(),
  }),
  materialSlug: z.string().min(1, 'materialSlug is required'),
  infillPct: z.number().min(10).max(100).default(20),
  layerHeightMm: z.number().min(0.05).max(0.40).default(0.20),
  quantity: z.number().int().min(1).default(1),
  customerPhone: z.string().optional(),
})

export const quoteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/v1/quote/calculate', async (request, reply) => {
    const parseResult = calculateQuoteSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const {
      fileName,
      volumeCm3,
      surfaceAreaCm2,
      dimensions,
      materialSlug,
      infillPct,
      layerHeightMm,
      quantity,
      customerPhone,
    } = parseResult.data

    // Locate material
    let material: any = null
    const db = getDb()
    if (db) {
      try {
        const rows = await db
          .select()
          .from(schema.materials)
          .where(eq(schema.materials.slug, materialSlug))
          .limit(1)
        if (rows && rows.length > 0) {
          material = {
            id: rows[0].id,
            name: rows[0].name,
            type: rows[0].type,
            densityGPerCm3: parseFloat(rows[0].densityGPerCm3),
            costPerGramLkr: parseFloat(rows[0].costPerGramLkr),
            requiresEnclosure: rows[0].requiresEnclosure,
          }
        }
      } catch (err) {
        fastify.log.warn({ err }, `Database query for material ${materialSlug} failed`)
      }
    }

    if (!material) {
      const fallback = INITIAL_MATERIALS.find((m) => m.slug === materialSlug)
      if (fallback) {
        material = {
          id: fallback.slug,
          name: fallback.name,
          type: fallback.type,
          densityGPerCm3: parseFloat(fallback.densityGPerCm3),
          costPerGramLkr: parseFloat(fallback.costPerGramLkr),
          requiresEnclosure: fallback.requiresEnclosure,
        }
      }
    }

    if (!material) {
      return reply.code(404).send({
        success: false,
        error: `Material with slug '${materialSlug}' not found`,
      })
    }

    // Compute pricing
    const pricing = computeServerPricing({
      volumeCm3,
      surfaceAreaCm2,
      dimensions,
      material,
      infillPct,
      layerHeightMm,
      quantity,
    })

    // Optionally record to quotes table
    let quoteId: string | null = null
    if (db && material.id && material.id.length === 36) {
      try {
        const [inserted] = await db
          .insert(schema.quotes)
          .values({
            fileName,
            boundingX: dimensions.x.toString(),
            boundingY: dimensions.y.toString(),
            boundingZ: dimensions.z.toString(),
            volumeCm3: volumeCm3.toString(),
            surfaceAreaCm2: surfaceAreaCm2.toString(),
            materialId: material.id,
            infillPercentage: infillPct,
            layerHeightMm: layerHeightMm.toString(),
            quantity,
            estimatedGrams: pricing.estimatedGrams.toString(),
            estimatedPrintHours: pricing.estimatedPrintHours.toString(),
            materialCostLkr: pricing.materialCostLkr.toString(),
            machineCostLkr: pricing.machineCostLkr.toString(),
            handlingCostLkr: pricing.handlingCostLkr.toString(),
            totalPriceLkr: pricing.totalPriceLkr.toString(),
            customerPhone: customerPhone || null,
            status: 'pending',
          })
          .returning({ id: schema.quotes.id })
        quoteId = inserted.id
      } catch (err) {
        fastify.log.warn({ err }, 'Could not record quote to database')
      }
    }

    return {
      success: true,
      quoteId,
      model: {
        fileName,
        dimensions,
        volumeCm3,
        surfaceAreaCm2,
      },
      specification: {
        material: material.name,
        materialSlug,
        infillPct,
        layerHeightMm,
        quantity,
      },
      pricing,
      disclaimer:
        'Automated estimate based on geometric volume. Final pricing and schedule may vary based on orientation, support structures, and specific requirements.',
    }
  })
}
