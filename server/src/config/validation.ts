import { z } from 'zod'

/**
 * Shared image path validator: relative paths under `images/` only.
 * No scheme, no leading slash, no `..`, safe characters (spaces allowed), max 255 chars.
 */
export const imageUrlSchema = z
  .string()
  .max(255, 'Image path must be 255 characters or fewer')
  .refine(
    (v) =>
      /^images\/[A-Za-z0-9._\- ()\/]+$/.test(v) && !v.includes('..') && !v.includes('//'),
    { message: "Image path must be a relative path starting with 'images/' using safe characters" }
  )

export const LIMITS = {
  sku: 50,
  productName: 150,
  category: 50,
  customerName: 100,
  deliveryAddress: 500,
  fileName: 255,
  items: 50,
  quantity: 100,
} as const
