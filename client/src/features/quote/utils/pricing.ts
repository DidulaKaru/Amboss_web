import type { MaterialOption, QuoteCalculationResult } from '../types'
import type { STLParseResult } from './stlParser'
import {
  MINIMUM_PRINT_PRICE_LKR,
  calculateCourierFee,
} from '../../../config/logistics'

export { MINIMUM_PRINT_PRICE_LKR, calculateCourierFee }

/**
 * Computes deterministic 3D printing quotation in LKR based on divergence-theorem volume,
 * surface area, shell thickness, and internal infill density.
 */
export function calculateQuote(
  stl: STLParseResult,
  material: MaterialOption,
  infillPct: number, // 10 to 100
  layerHeightMm: number
): QuoteCalculationResult {
  const { volumeCm3, surfaceAreaCm2, boundingBox } = stl

  // 1. Effective Mass Estimation (guide.md formula)
  // Shell thickness ts = 1.2 mm = 0.12 cm
  const shellThicknessCm = 0.12
  const shellVolumeCm3 = Math.min(volumeCm3, surfaceAreaCm2 * shellThicknessCm)
  const coreVolumeCm3 = Math.max(0, volumeCm3 - shellVolumeCm3)

  const infillRatio = infillPct / 100.0
  const effectiveVolumeCm3 = shellVolumeCm3 + coreVolumeCm3 * infillRatio
  const rawGrams = effectiveVolumeCm3 * material.densityGPerCm3

  // Clamped minimum billable grams
  const estimatedGrams = Math.max(6, Math.round(rawGrams * 10) / 10)

  // 2. Material Cost
  const materialCostLkr = Math.round(estimatedGrams * material.pricePerGramLkr)

  // 3. Machine Time Estimation & Machine Cost
  // Base volumetric deposition rate: ~16g per hour at 0.20mm layer height
  const baseDepositionRateGramsPerHour = material.type === 'SLA' ? 22 : 16
  const layerHeightRatio = Math.max(0.5, layerHeightMm / 0.20)
  const adjustedRate = baseDepositionRateGramsPerHour * layerHeightRatio

  const rawHours = estimatedGrams / adjustedRate
  const estimatedPrintHours = Math.max(0.5, Math.round(rawHours * 10) / 10)

  // Machine rate per hour
  const machineRatePerHourLkr = material.type === 'SLA' ? 250 : 160
  const machineTimeCostLkr = Math.round(estimatedPrintHours * machineRatePerHourLkr)

  // 4. Handling & Post-processing fee
  const handlingFeeLkr = material.type === 'SLA' ? 350 : 250 // SLA requires alcohol wash & UV cure

  // 5. Total Price (Minimum print is 250 LKR)
  const rawPrice = materialCostLkr + machineTimeCostLkr + handlingFeeLkr
  const totalPriceLkr = Math.max(MINIMUM_PRINT_PRICE_LKR, rawPrice)

  // 6. Build Envelope & Printer Routing
  const maxDim = Math.max(
    boundingBox.dimensions.x,
    boundingBox.dimensions.y,
    boundingBox.dimensions.z
  )

  let recommendedMachine: string
  let isOversized = false

  if (material.type === 'SLA') {
    if (boundingBox.dimensions.x <= 211 && boundingBox.dimensions.y <= 118 && boundingBox.dimensions.z <= 220) {
      recommendedMachine = 'Elegoo Saturn 4 Ultra 16K (Resin)'
    } else {
      isOversized = true
      recommendedMachine = 'Exceeds SLA resin vat bounds (211×118×220 mm)'
    }
  } else {
    // If printing ABS or PETG-CF, printer must be Creality K2 Plus or Elegoo Centauri Carbon (enclosed)
    const requiresEnclosure = material.requiresEnclosure || material.id === 'abs' || material.id === 'petg-cf'

    if (requiresEnclosure) {
      if (maxDim <= 256) {
        recommendedMachine = 'Elegoo Centauri Carbon / Creality K2 Plus (Enclosed CoreXY)'
      } else if (maxDim <= 350) {
        recommendedMachine = 'Creality K2 Plus (Enclosed Large-Format 350×350×350 mm)'
      } else {
        isOversized = true
        recommendedMachine = 'Exceeds enclosed chamber build volume (350 mm max)'
      }
    } else {
      // Standard open / general materials (PLA+, PETG, TPU)
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
    materialCostLkr,
    machineTimeCostLkr,
    handlingFeeLkr,
    totalPriceLkr,
    estimatedGrams,
    estimatedPrintHours,
    recommendedMachine,
    isOversized,
  }
}
