import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getDb, schema } from '../db/index.js'
import { resolveMaterial } from '../services/materialService.js'
import { limitFor, RATE_LIMITS } from '../config/rateLimit.js'
import { computeServerPricing } from '../services/pricingService.js'

/** Geometry/material inputs shared by /quote/calculate and the quote branch of the order payload. */
export const quoteInputSchema = z.object({
  fileName: z.string().max(255).default('model.stl'),
  volumeCm3: z.number().positive('volumeCm3 must be greater than 0').max(50_000),
  surfaceAreaCm2: z.number().positive('surfaceAreaCm2 must be greater than 0').max(500_000),
  dimensions: z.object({
    x: z.number().positive().max(2000),
    y: z.number().positive().max(2000),
    z: z.number().positive().max(2000),
  }),
  materialSlug: z.string().min(1, 'materialSlug is required').max(50),
  infillPct: z.number().min(10).max(100).default(20),
  layerHeightMm: z.number().min(0.05).max(0.40).default(0.20),
  quantity: z.number().int().min(1).max(100).default(1),
})

const calculateQuoteSchema = quoteInputSchema.extend({
  customerPhone: z.string().max(30).optional(),
})

export const quoteRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/api/v1/quote/calculate',
    { config: { rateLimit: { max: limitFor(RATE_LIMITS.quote), timeWindow: '1 minute' } } },
    async (request, reply) => {
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
    const db = getDb()
    const material = await resolveMaterial(materialSlug, fastify.log)

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
    }
  )
}
