export interface PricingInput {
  volumeCm3: number
  surfaceAreaCm2: number
  dimensions: {
    x: number
    y: number
    z: number
  }
  material: {
    id: string
    name: string
    type: 'FDM' | 'SLA' | string
    densityGPerCm3: number
    costPerGramLkr: number
    requiresEnclosure?: boolean
  }
  infillPct: number // 10 to 100
  layerHeightMm: number
  quantity?: number
}

export interface PricingOutput {
  estimatedGrams: number
  estimatedPrintHours: number
  materialCostLkr: number
  machineCostLkr: number
  handlingCostLkr: number
  unitPriceLkr: number
  totalPriceLkr: number
  quantity: number
  recommendedMachine: string
  isOversized: boolean
}

import {
  MINIMUM_PRINT_PRICE_LKR,
  calculateCourierFee,
} from '../config/logistics.js'

export { MINIMUM_PRINT_PRICE_LKR, calculateCourierFee }

export function computeServerPricing(input: PricingInput): PricingOutput {
  const { volumeCm3, surfaceAreaCm2, dimensions, material, infillPct, layerHeightMm } = input
  const quantity = Math.max(1, input.quantity ?? 1)

  // 1. Effective mass based on shell + core infill
  const shellThicknessCm = 0.12 // 1.2 mm standard shell
  const shellVolumeCm3 = Math.min(volumeCm3, surfaceAreaCm2 * shellThicknessCm)
  const coreVolumeCm3 = Math.max(0, volumeCm3 - shellVolumeCm3)

  const infillRatio = Math.max(0.1, Math.min(1.0, infillPct / 100))
  const effectiveVolumeCm3 = shellVolumeCm3 + coreVolumeCm3 * infillRatio
  const rawGrams = effectiveVolumeCm3 * material.densityGPerCm3

  // Minimum billable grams: 6g
  const estimatedGrams = Math.max(6, Math.round(rawGrams * 10) / 10)

  // 2. Material Cost
  const materialCostLkr = Math.round(estimatedGrams * material.costPerGramLkr)

  // 3. Machine Time Estimation & Machine Cost
  const isSla = material.type.toUpperCase() === 'SLA'
  const baseDepositionRate = isSla ? 22 : 16 // grams per hour at 0.20mm
  const layerHeightRatio = Math.max(0.5, layerHeightMm / 0.20)
  const adjustedRate = baseDepositionRate * layerHeightRatio

  const rawHours = estimatedGrams / adjustedRate
  const estimatedPrintHours = Math.max(0.5, Math.round(rawHours * 10) / 10)

  const machineRatePerHourLkr = isSla ? 250 : 160
  const machineCostLkr = Math.round(estimatedPrintHours * machineRatePerHourLkr)

  // 4. Handling & Post-processing
  const handlingCostLkr = isSla ? 350 : 250

  // 5. Total (Minimum print is 250 LKR)
  const rawUnitPrice = materialCostLkr + machineCostLkr + handlingCostLkr
  const unitPriceLkr = Math.max(MINIMUM_PRINT_PRICE_LKR, rawUnitPrice)
  const totalPriceLkr = Math.max(MINIMUM_PRINT_PRICE_LKR, unitPriceLkr * quantity)

  // 6. Printer Routing
  const maxDim = Math.max(dimensions.x, dimensions.y, dimensions.z)
  let recommendedMachine = 'Bambu Lab A1'
  let isOversized = false

  if (isSla) {
    // Sort dimensions so orientation (rotating part in vat) doesn't cause false oversized flags
    const partDims = [dimensions.x, dimensions.y, dimensions.z].sort((a, b) => a - b)
    const vatDims = [118, 211, 220].sort((a, b) => a - b)
    const fitsSla =
      partDims[0] <= vatDims[0] &&
      partDims[1] <= vatDims[1] &&
      partDims[2] <= vatDims[2]

    if (fitsSla) {
      recommendedMachine = 'Elegoo Saturn 4 Ultra 16K (Resin)'
    } else {
      isOversized = true
      recommendedMachine = 'Exceeds SLA vat bounds (211×118×220 mm)'
    }
  } else {
    const isEnclosedRequired = material.requiresEnclosure ||
      material.name.toLowerCase().includes('abs') ||
      material.name.toLowerCase().includes('cf')

    if (isEnclosedRequired) {
      if (maxDim <= 256) {
        recommendedMachine = 'Elegoo Centauri Carbon / Creality K2 Plus (Enclosed CoreXY)'
      } else if (maxDim <= 350) {
        recommendedMachine = 'Creality K2 Plus (Enclosed Large-Format 350×350×350 mm)'
      } else {
        isOversized = true
        recommendedMachine = 'Exceeds enclosed chamber build volume (350 mm max)'
      }
    } else {
      if (maxDim <= 180) {
        recommendedMachine = 'Bambu Lab A1 Mini (180×180×180 mm)'
      } else if (maxDim <= 256) {
        recommendedMachine = 'Bambu Lab A1 / Elegoo Centauri Carbon (256×256×256 mm)'
      } else if (maxDim <= 350) {
        recommendedMachine = 'Creality K2 Plus (Large-Format 350×350×350 mm)'
      } else {
        isOversized = true
        recommendedMachine = 'Exceeds standard build envelope (350 mm max)'
      }
    }
  }

  return {
    estimatedGrams,
    estimatedPrintHours,
    materialCostLkr,
    machineCostLkr,
    handlingCostLkr,
    unitPriceLkr,
    totalPriceLkr,
    quantity,
    recommendedMachine,
    isOversized,
  }
}
