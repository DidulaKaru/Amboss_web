import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getDb, schema } from '../db/index.js'
import { INITIAL_PRODUCTS } from '../db/seedData.js'
import { and, eq, inArray } from 'drizzle-orm'
import {
  calculateCourierFee,
  calculateElectronicsDeliveryFee,
  LOGISTICS_CONFIG,
} from '../config/logistics.js'
import { BUSINESS_WHATSAPP_NUMBER } from '../config/business.js'
import { LIMITS } from '../config/validation.js'
import { limitFor, RATE_LIMITS } from '../config/rateLimit.js'
import { computeServerPricing } from '../services/pricingService.js'
import { resolveMaterial } from '../services/materialService.js'
import { quoteInputSchema } from './quote.js'

const deliveryMethodEnum = z.enum(['ruhuna_pickup', 'hapugala_pickup', 'galle_local', 'courier'])
export type DeliveryMethod = z.infer<typeof deliveryMethodEnum>

// Cart lines are identified by SKU only. Any client-supplied price is ignored (zod strips it).
const cartItemSchema = z.object({
  sku: z.string().min(1).max(LIMITS.sku),
  name: z.string().max(LIMITS.productName).optional(),
  quantity: z.number().int().min(1).max(LIMITS.quantity),
})

const validateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1).max(LIMITS.items),
})

// The quote branch takes the same inputs as POST /quote/calculate; the price is recomputed server-side.
const whatsappOrderSchema = z.object({
  type: z.enum(['shop', 'quote']),
  deliveryMethod: deliveryMethodEnum.default('ruhuna_pickup'),
  deliveryAddress: z.string().max(LIMITS.deliveryAddress).optional(),
  customerName: z.string().max(LIMITS.customerName).optional(),
  items: z.array(cartItemSchema).max(LIMITS.items).optional(),
  quote: quoteInputSchema.optional(),
})

/**
 * Courier fees: 500 LKR for the first 1kg and adding 150 LKR for each 1kg added on top.
 * For electronics, packages are under 1kg, so flat fee is 500 LKR.
 */
export function calculateDeliveryFee(
  method: DeliveryMethod,
  subtotal: number,
  weightGrams?: number
): number {
  if (weightGrams !== undefined && weightGrams > 0) {
    if (method === 'ruhuna_pickup' || method === 'hapugala_pickup') return 0
    if (method === 'galle_local') {
      return subtotal >= LOGISTICS_CONFIG.galleLocal.freeDeliveryThresholdLkr
        ? 0
        : LOGISTICS_CONFIG.galleLocal.standardFeeLkr
    }
    return calculateCourierFee(weightGrams)
  }
  return calculateElectronicsDeliveryFee(method, subtotal)
}

export function getDeliveryDescription(method: DeliveryMethod, weightGrams?: number): string {
  switch (method) {
    case 'ruhuna_pickup':
      return 'Free Pickup: Faculty of Engineering, University of Ruhuna (Hapugala, Galle)'
    case 'hapugala_pickup':
      return 'Free Pickup: Amboss Shop (Hapugala)'
    case 'galle_local':
      return 'Local Delivery: Galle Municipal & Suburb Areas (Direct Hand Delivery)'
    case 'courier': {
      const fee = calculateDeliveryFee('courier', 0, weightGrams)
      return `Islandwide Courier: Doorstep Delivery across Sri Lanka (Rs ${fee.toLocaleString()} LKR - PromptX / Domex)`
    }
    default:
      return 'Pickup at Amboss Studio'
  }
}

interface CatalogProduct {
  sku: string
  name: string
  priceLkr: string | number
  stockQuantity: number
}

/**
 * Resolve many SKUs at once. Uses a single `inArray` query when a database is available
 * (exact SKU match, active products only); falls back to the seed dataset (case-insensitive SKU)
 * only when there is no database or the query fails. Matching is by SKU only.
 */
async function findProductsBySkus(skus: string[]): Promise<(sku: string) => CatalogProduct | undefined> {
  const unique = Array.from(new Set(skus))
  const db = getDb()
  if (db) {
    try {
      const rows = await db
        .select()
        .from(schema.products)
        .where(and(inArray(schema.products.sku, unique), eq(schema.products.isActive, true)))
      const bySku = new Map<string, CatalogProduct>(rows.map((r) => [r.sku, r]))
      return (sku) => bySku.get(sku)
    } catch {
      // Fall through to the seed dataset
    }
  }
  const byLowerSku = new Map<string, CatalogProduct>(
    INITIAL_PRODUCTS.filter((p) => p.isActive !== false).map((p) => [p.sku.toLowerCase(), p])
  )
  return (sku) => byLowerSku.get(sku.toLowerCase())
}

/** Returns a human-readable stock error, or null if `quantity` is available. */
function stockError(product: CatalogProduct, quantity: number): string | null {
  const available = Number(product.stockQuantity)
  if (available >= quantity) return null
  if (available <= 0) return `"${product.name}" is currently out of stock.`
  return `"${product.name}" only has ${available} unit(s) available (requested: ${quantity}).`
}

export const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  const orderRateLimit = {
    config: { rateLimit: { max: limitFor(RATE_LIMITS.orders), timeWindow: '1 minute' } },
  }

  // Validate Cart Inventory Endpoint
  const validateHandler = async (request: any, reply: any) => {
    const parseResult = validateCartSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const { items } = parseResult.data
    const lookup = await findProductsBySkus(items.map((i) => i.sku))
    const errors: string[] = []
    const validatedItems: any[] = []
    let allValid = true

    for (const item of items) {
      const product = lookup(item.sku)

      if (!product) {
        errors.push(`Product "${item.name || item.sku}" was not found in active catalog.`)
        allValid = false
        validatedItems.push({
          sku: item.sku,
          name: item.name ?? item.sku,
          requestedQuantity: item.quantity,
          availableStock: 0,
          inStock: false,
          error: 'Not found',
        })
        continue
      }

      const error = stockError(product, item.quantity)
      if (error) {
        allValid = false
        errors.push(error)
      }

      validatedItems.push({
        sku: product.sku,
        name: product.name,
        requestedQuantity: item.quantity,
        availableStock: Number(product.stockQuantity),
        priceLkr: Number(product.priceLkr),
        inStock: !error,
        error: error ? 'Insufficient stock' : null,
      })
    }

    return {
      success: true,
      valid: allValid,
      errors,
      items: validatedItems,
    }
  }

  fastify.post('/api/v1/orders/validate-inventory', orderRateLimit, validateHandler)
  fastify.post('/api/v1/orders/validate-cart', orderRateLimit, validateHandler)

  // WhatsApp Order Payload Generation (all prices are computed server-side)
  fastify.post('/api/v1/orders/whatsapp-payload', orderRateLimit, async (request, reply) => {
    const parseResult = whatsappOrderSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const { type, items, quote, deliveryMethod, deliveryAddress, customerName } = parseResult.data
    let textLines: string[] = []

    const deliveryFeeLine = (deliveryFee: number) =>
      deliveryFee > 0
        ? `Delivery Fee: Rs ${deliveryFee.toLocaleString()} LKR`
        : deliveryMethod === 'ruhuna_pickup'
          ? 'Delivery Fee: FREE (University of Ruhuna Pickup)'
          : deliveryMethod === 'hapugala_pickup'
            ? 'Delivery Fee: FREE (Amboss Shop Hapugala Pickup)'
            : 'Delivery Fee: FREE (Local Delivery Promotion)'

    if (type === 'shop' && items && items.length > 0) {
      // Merge duplicate SKUs so stock is checked against the combined quantity
      const merged = new Map<string, number>()
      for (const item of items) {
        const key = item.sku.toLowerCase()
        merged.set(key, (merged.get(key) ?? 0) + item.quantity)
      }

      const lookup = await findProductsBySkus(items.map((i) => i.sku))
      const errors: string[] = []
      const lines: { name: string; quantity: number; lineTotal: number }[] = []

      for (const [key, quantity] of merged) {
        const original = items.find((i) => i.sku.toLowerCase() === key)!
        const product = lookup(original.sku)
        if (!product) {
          errors.push(`Product "${original.sku}" was not found in active catalog.`)
          continue
        }
        const error = stockError(product, quantity)
        if (error) {
          errors.push(error)
          continue
        }
        lines.push({ name: product.name, quantity, lineTotal: Number(product.priceLkr) * quantity })
      }

      if (errors.length > 0) {
        return reply.code(400).send({
          success: false,
          error: 'Order could not be created',
          details: errors,
        })
      }

      const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0)
      const deliveryFee = calculateDeliveryFee(deliveryMethod, subtotal)
      const grandTotal = subtotal + deliveryFee
      const deliveryText = getDeliveryDescription(deliveryMethod)

      textLines = [
        'Hi Amboss, I would like to place an order:',
        ...(customerName ? [`Customer: ${customerName}`] : []),
        ...lines.map((l) => `- ${l.name} x ${l.quantity} (Rs ${l.lineTotal.toLocaleString()} LKR)`),
        '',
        `Delivery Method: ${deliveryText}`,
        deliveryFeeLine(deliveryFee),
        ...(deliveryAddress ? [`Delivery Address / Notes: ${deliveryAddress}`] : []),
        `Total: Rs ${grandTotal.toLocaleString()} LKR`,
      ]
    } else if (type === 'quote' && quote) {
      const material = await resolveMaterial(quote.materialSlug, request.log)
      if (!material) {
        return reply.code(404).send({
          success: false,
          error: `Material with slug '${quote.materialSlug}' not found`,
        })
      }

      // Never trust a client-supplied price: recompute from the geometry and material.
      const pricing = computeServerPricing({
        volumeCm3: quote.volumeCm3,
        surfaceAreaCm2: quote.surfaceAreaCm2,
        dimensions: quote.dimensions,
        material,
        infillPct: quote.infillPct,
        layerHeightMm: quote.layerHeightMm,
        quantity: quote.quantity,
      })

      const totalWeightGrams = pricing.estimatedGrams * quote.quantity
      const deliveryFee = calculateDeliveryFee(deliveryMethod, pricing.totalPriceLkr, totalWeightGrams)
      const deliveryText = getDeliveryDescription(deliveryMethod, totalWeightGrams)
      const grandTotal = pricing.totalPriceLkr + deliveryFee

      textLines = [
        'Hi Amboss, I would like to get a 3D print quote:',
        `Model: ${quote.fileName}`,
        `Dimensions: ${quote.dimensions.x} x ${quote.dimensions.y} x ${quote.dimensions.z} mm`,
        `Material: ${material.name}`,
        `Infill: ${quote.infillPct}%`,
        `Layer Height: ${quote.layerHeightMm} mm`,
        `Estimated Weight: ~${totalWeightGrams.toFixed(1)} g`,
        `Quantity: ${quote.quantity}`,
        `Print Total: Rs ${pricing.totalPriceLkr.toLocaleString()} LKR`,
        `Delivery Method: ${deliveryText}`,
        deliveryFeeLine(deliveryFee),
        ...(deliveryAddress ? [`Delivery Address / Notes: ${deliveryAddress}`] : []),
        `Estimated Total: Rs ${grandTotal.toLocaleString()} LKR`,
        '',
        'Note: Automated estimate based on CAD volume.',
      ]
    } else {
      return reply.code(400).send({
        success: false,
        error: 'Missing order items or quote data',
      })
    }

    const messageText = textLines.join('\n')
    const encoded = encodeURIComponent(messageText)
    const whatsappUrl = `https://wa.me/${BUSINESS_WHATSAPP_NUMBER}?text=${encoded}`

    return {
      success: true,
      messageText,
      whatsappUrl,
    }
  })
}
