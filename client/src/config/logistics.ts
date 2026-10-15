/**
 * Amboss Logistics & Pricing Single Source of Truth (Client)
 *
 * All fulfillment rules, courier fee calculations, pickup points,
 * and minimum manufacturing thresholds are centrally defined here.
 */

export const MINIMUM_PRINT_PRICE_LKR = 250

export const LOGISTICS_CONFIG = {
  courier: {
    firstKgFeeLkr: 500,
    addedKgFeeLkr: 150,
    electronicsFlatFeeLkr: 500,
  },
  galleLocal: {
    standardFeeLkr: 200,
    freeDeliveryThresholdLkr: 3000,
  },
  pickups: [
    {
      id: 'ruhuna_pickup',
      title: 'UoR Faculty Pickup',
      label: 'Faculty of Engineering, University of Ruhuna (Hapugala, Galle)',
      badge: 'FREE',
      feeLkr: 0,
      description: 'Campus collection at Hapugala. Ready within 24 hours.',
    },
    {
      id: 'hapugala_pickup',
      title: 'Hapugala Shop',
      label: 'Amboss Shop (Hapugala)',
      badge: 'FREE',
      feeLkr: 0,
      description: 'Direct workshop pickup at Elhenage Watta, Hapugala.',
    },
  ],
} as const

export type DeliveryMethodId =
  | 'ruhuna_pickup'
  | 'hapugala_pickup'
  | 'galle_local'
  | 'courier'

/**
 * Computes islandwide courier delivery fee based on total mass in grams.
 * Amboss policy: 500 LKR for the first 1kg, +150 LKR for each additional 1kg.
 */
export function calculateCourierFee(weightGrams: number): number {
  if (weightGrams <= 0) return LOGISTICS_CONFIG.courier.firstKgFeeLkr

  const weightKg = weightGrams / 1000
  if (weightKg <= 1.0) {
    return LOGISTICS_CONFIG.courier.firstKgFeeLkr
  }

  // Weight beyond 1kg rounded up to nearest whole kg
  const extraKg = Math.ceil(weightKg - 1.0)
  return LOGISTICS_CONFIG.courier.firstKgFeeLkr + extraKg * LOGISTICS_CONFIG.courier.addedKgFeeLkr
}

/**
 * Computes maker store electronics delivery fee.
 * Electronics orders qualify for flat 500 LKR courier fee (weight < 1kg).
 */
export function calculateShopDeliveryFee(
  method: DeliveryMethodId,
  subtotalLkr: number
): number {
  switch (method) {
    case 'ruhuna_pickup':
    case 'hapugala_pickup':
      return 0
    case 'galle_local':
      return subtotalLkr >= LOGISTICS_CONFIG.galleLocal.freeDeliveryThresholdLkr
        ? 0
        : LOGISTICS_CONFIG.galleLocal.standardFeeLkr
    case 'courier':
      return LOGISTICS_CONFIG.courier.electronicsFlatFeeLkr
    default:
      return 0
  }
}
