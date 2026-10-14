import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'

const whatsappOrderSchema = z.object({
  type: z.enum(['shop', 'quote']),
  phone: z.string().default('94779902796'),
  items: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().int().min(1),
        priceLkr: z.number().positive(),
      })
    )
    .optional(),
  quote: z
    .object({
      fileName: z.string(),
      dimensions: z.object({ x: number(), y: number(), z: number() }).optional(),
      material: z.string(),
      infillPct: z.number().optional(),
      layerHeightMm: z.number().optional(),
      quantity: z.number().int().min(1).default(1),
      totalPriceLkr: z.number().positive(),
    })
    .optional(),
})

function number() {
  return z.number().positive()
}

export const ordersRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/v1/orders/whatsapp-payload', async (request, reply) => {
    const parseResult = whatsappOrderSchema.safeParse(request.body)
    if (!parseResult.success) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.errors,
      })
    }

    const { type, phone, items, quote } = parseResult.data
    const cleanPhone = phone.replace(/[^\d]/g, '')
    let textLines: string[] = []

    if (type === 'shop' && items && items.length > 0) {
      const total = items.reduce((sum, item) => sum + item.priceLkr * item.quantity, 0)
      textLines = [
        'AMBOSS Store Order Request',
        '',
        ...items.map((i) => `- ${i.name} x ${i.quantity} (Rs ${(i.priceLkr * i.quantity).toLocaleString()} LKR)`),
        '',
        `Total: Rs ${total.toLocaleString()} LKR`,
        '',
        'Free pickup at Faculty of Engineering, University of Ruhuna or nationwide courier.',
      ]
    } else if (type === 'quote' && quote) {
      textLines = [
        'AMBOSS 3D Print Quote Request',
        '',
        `Model: ${quote.fileName}`,
        ...(quote.dimensions
          ? [`Dimensions: ${quote.dimensions.x} x ${quote.dimensions.y} x ${quote.dimensions.z} mm`]
          : []),
        `Material: ${quote.material}`,
        ...(quote.infillPct ? [`Infill: ${quote.infillPct}%`] : []),
        ...(quote.layerHeightMm ? [`Layer Height: ${quote.layerHeightMm} mm`] : []),
        `Quantity: ${quote.quantity}`,
        `Estimated Total: Rs ${quote.totalPriceLkr.toLocaleString()} LKR`,
        '',
        'Note: Automated estimate based on CAD volume. Final pricing and schedule will be confirmed based on project requirements.',
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
