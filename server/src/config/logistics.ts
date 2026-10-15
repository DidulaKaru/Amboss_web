/**
 * Amboss Logistics & Pricing Single Source of Truth (Server)
 *
 * All manufacturing minimum thresholds, courier fees, and fulfillment options
 * are centrally defined and verified here.
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
  pickups: {
    ruhuna: {
      id: 'ruhuna_pickup',
      label: 'Free Pickup: Faculty of Engineering, University of Ruhuna (Hapugala, Galle)',
      feeLkr: 0,
    },
    hapugala: {
      id: 'hapugala_pickup',
      label: 'Free Pickup: Amboss Shop (Hapugala)',
      feeLkr: 0,
    },
  },
} as const

export type DeliveryMethodType =
  | 'ruhuna_pickup'
  | 'hapugala_pickup'
  | 'galle_local'
  | 'courier'

/**
 * Computes islandwide courier fee:
 * 500 LKR for the first 1kg (up to 1000g), +150 LKR for each additional 1kg.
 */
export function calculateCourierFee(weightGrams: number): number {
  if (weightGrams <= 1000) {
    return LOGISTICS_CONFIG.courier.firstKgFeeLkr
  }
  const extraKg = Math.ceil((weightGrams - 1000) / 1000)
  return LOGISTICS_CONFIG.courier.firstKgFeeLkr + extraKg * LOGISTICS_CONFIG.courier.addedKgFeeLkr
}

/**
 * Computes maker store electronics delivery fee.
 * Electronics orders qualify for flat 500 LKR courier fee (weight < 1kg).
 */
export function calculateElectronicsDeliveryFee(
  method: DeliveryMethodType,
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

/**
 * Returns human-readable fulfillment description for WhatsApp payloads and customer summaries.
 */
export function getFulfillmentDescription(method: DeliveryMethodType): string {
  switch (method) {
    case 'ruhuna_pickup':
      return LOGISTICS_CONFIG.pickups.ruhuna.label
    case 'hapugala_pickup':
      return LOGISTICS_CONFIG.pickups.hapugala.label
    case 'galle_local':
      return 'Local Delivery: Galle Municipal Area'
    case 'courier':
      return 'Islandwide Courier (PromptX / Domex)'
    default:
      return 'Standard Delivery'
  }
}
