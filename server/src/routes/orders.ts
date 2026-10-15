import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getDb, schema } from '../db/index.js'
import { INITIAL_PRODUCTS } from '../db/seedData.js'
import { eq } from 'drizzle-orm'
import {
  calculateCourierFee,
  calculateElectronicsDeliveryFee,
  LOGISTICS_CONFIG,
} from '../config/logistics.js'

const deliveryMethodEnum = z.enum(['ruhuna_pickup', 'hapugala_pickup', 'galle_local', 'courier'])
export type DeliveryMethod = z.infer<typeof deliveryMethodEnum>

const cartItemSchema = z.object({
  id: z.string().optional(),
  sku: z.string().optional(),
  name: z.string(),
  quantity: z.number().int().min(1),
  priceLkr: z.number().positive().optional(),
})

const validateCartSchema = z.object({
  items: z.array(cartItemSchema).min(1),
})

const whatsappOrderSchema = z.object({
  type: z.enum(['shop', 'quote']),
  phone: z.string().default('94779902796'),
  deliveryMethod: deliveryMethodEnum.default('ruhuna_pickup'),
  deliveryAddress: z.string().optional(),
  customerName: z.string().optional(),
  items: z.array(cartItemSchema).optional(),
  quote: z
    .object({
      fileName: z.string(),
      dimensions: z.object({ x: number(), y: number(), z: number() }).optional(),
      material: z.string(),
      infillPct: z.number().optional(),
      layerHeightMm: z.number().optional(),
      quantity: z.number().int().min(1).default(1),
      estimatedGrams: z.number().optional(),
      totalPriceLkr: z.number().positive(),
    })
    .optional(),
})

function number() {
  return z.number().positive()
}

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

async function findProduct(identifier: { id?: string; sku?: string; name?: string }) {
  const db = getDb()
  if (db) {
    try {
      if (identifier.sku) {
        const rows = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.sku, identifier.sku))
          .limit(1)
        if (rows.length > 0) return rows[0]
      }
      if (identifier.id && identifier.id.length === 36) {
        const rows = await db
          .select()
          .from(schema.products)
          .where(eq(schema.products.id, identifier.id))
          .limit(1)
        if (rows.length > 0) return rows[0]
      }
    } catch {
      // Fallback to initial products
    }
  }

  return INITIAL_PRODUCTS.find((p) => {
    if (identifier.sku && p.sku.toLowerCase() === identifier.sku.toLowerCase()) return true
    if (identifier.id && p.sku.toLowerCase() === identifier.id.toLowerCase()) return true
    if (identifier.name) {
      const pName = p.name.toLowerCase()
      const iName = identifier.name.toLowerCase()
      return pName === iName || pName.includes(iName) || iName.includes(pName)
    }
    return false
  })
}

export const ordersRoutes: FastifyPluginAsync = async (fastify) => {
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
    const errors: string[] = []
    const validatedItems: any[] = []
    let allValid = true

    for (const item of items) {
      const product = await findProduct(item)

      if (!product) {
        errors.push(`Product "${item.name}" was not found in active catalog.`)
        allValid = false
        validatedItems.push({
          sku: item.sku || null,
          name: item.name,
          requestedQuantity: item.quantity,
          availableStock: 0,
          inStock: false,
          error: 'Not found',
        })
        continue
      }

      const availableStock = Number(product.stockQuantity)
      const priceLkr = Number(product.priceLkr)
      const isSufficient = availableStock >= item.quantity

      if (!isSufficient) {
        allValid = false
        if (availableStock <= 0) {
          errors.push(`"${product.name}" is currently out of stock.`)
        } else {
          errors.push(
            `"${product.name}" only has ${availableStock} unit(s) available (requested: ${item.quantity}).`
          )
        }
      }

      validatedItems.push({
        sku: product.sku,
        name: product.name,
        requestedQuantity: item.quantity,
        availableStock,
        priceLkr,
        inStock: isSufficient,
        error: isSufficient ? null : 'Insufficient stock',
      })
    }

    return {
      success: true,
      valid: allValid,
      errors,
      items: validatedItems,
    }
  }

  fastify.post('/api/v1/orders/validate-inventory', validateHandler)
  fastify.post('/api/v1/orders/validate-cart', validateHandler)

  // WhatsApp Order Payload Generation
  fastify.post('/api/v1/orders/whatsapp-payload', async (request, reply) => {
    const parseResult = whatsappOrderSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const { type, phone, items, quote, deliveryMethod, deliveryAddress, customerName } = parseResult.data
    const cleanPhone = phone.replace(/[^\d]/g, '')
    let textLines: string[] = []

    if (type === 'shop' && items && items.length > 0) {
      const subtotal = items.reduce(
        (sum, item) => sum + (item.priceLkr || 0) * item.quantity,
        0
      )
      const deliveryFee = calculateDeliveryFee(deliveryMethod, subtotal)
      const grandTotal = subtotal + deliveryFee
      const deliveryText = getDeliveryDescription(deliveryMethod)

      textLines = [
        'AMBOSS Store Order Request',
        '--------------------------------',
        ...(customerName ? [`Customer: ${customerName}`] : []),
        ...items.map(
          (i) =>
            `- ${i.name} x ${i.quantity}${
              i.priceLkr ? ` (Rs ${(i.priceLkr * i.quantity).toLocaleString()} LKR)` : ''
            }`
        ),
        '--------------------------------',
        `Subtotal: Rs ${subtotal.toLocaleString()} LKR`,
        `Fulfillment: ${deliveryText}`,
        ...(deliveryFee > 0
          ? [`Delivery Fee: Rs ${deliveryFee.toLocaleString()} LKR`]
          : deliveryMethod === 'ruhuna_pickup'
          ? ['Delivery Fee: FREE (University of Ruhuna Pickup)']
          : ['Delivery Fee: FREE (Local Delivery Promotion)']),
        ...(deliveryAddress ? [`Delivery Address / Notes: ${deliveryAddress}`] : []),
        `Total: Rs ${grandTotal.toLocaleString()} LKR`,
        '',
        'Logistics Note: Ruhuna Faculty of Engineering pickup is free and prepared within 24h. Local Galle and nationwide courier dispatched upon confirmation.',
      ]
    } else if (type === 'quote' && quote) {
      const totalWeightGrams = quote.estimatedGrams ? quote.estimatedGrams * quote.quantity : 0
      const deliveryFee = calculateDeliveryFee(deliveryMethod, quote.totalPriceLkr, totalWeightGrams)
      const deliveryText = getDeliveryDescription(deliveryMethod, totalWeightGrams)
      const grandTotal = quote.totalPriceLkr + deliveryFee

      textLines = [
        'AMBOSS 3D Print Quote Request',
        '--------------------------------',
        `Model: ${quote.fileName}`,
        ...(quote.dimensions
          ? [`Dimensions: ${quote.dimensions.x} x ${quote.dimensions.y} x ${quote.dimensions.z} mm`]
          : []),
        `Material: ${quote.material}`,
        ...(quote.infillPct ? [`Infill: ${quote.infillPct}%`] : []),
        ...(quote.layerHeightMm ? [`Layer Height: ${quote.layerHeightMm} mm`] : []),
        ...(quote.estimatedGrams ? [`Estimated Weight: ~${totalWeightGrams.toFixed(1)} g`] : []),
        `Quantity: ${quote.quantity}`,
        `Print Total: Rs ${quote.totalPriceLkr.toLocaleString()} LKR`,
        `Fulfillment: ${deliveryText}`,
        ...(deliveryFee > 0
          ? [`Delivery Fee: Rs ${deliveryFee.toLocaleString()} LKR`]
          : deliveryMethod === 'ruhuna_pickup'
          ? ['Delivery Fee: FREE (University of Ruhuna Pickup)']
          : ['Delivery Fee: FREE (Local Delivery Promotion)']),
        ...(deliveryAddress ? [`Delivery Address / Notes: ${deliveryAddress}`] : []),
        `Estimated Total: Rs ${grandTotal.toLocaleString()} LKR`,
        '',
        'Note: Minimum print is 250 LKR. Automated estimate based on CAD volume. Final pricing and schedule will be confirmed based on project requirements.',
      ]
    } else {
      return reply.code(400).send({
        success: false,
        error: 'Missing order items or quote data',
      })
    }

    const messageText = textLines.join('\n')
    const encoded = encodeURIComponent(messageText)
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encoded}`

    return {
      success: true,
      messageText,
      whatsappUrl,
    }
  })
}
