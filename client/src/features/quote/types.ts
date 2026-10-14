export interface MaterialOption {
  id: string
  name: string
  type: 'FDM' | 'SLA'
  densityGPerCm3: number
  pricePerGramLkr: number
  tag: string
  requiresEnclosure?: boolean
}

export const MATERIALS: MaterialOption[] = [
  {
    id: 'pla-plus',
    name: 'PLA+',
    type: 'FDM',
    densityGPerCm3: 1.24,
    pricePerGramLkr: 20,
    tag: 'Standard',
    requiresEnclosure: false,
  },
  {
    id: 'petg',
    name: 'PETG',
    type: 'FDM',
    densityGPerCm3: 1.27,
    pricePerGramLkr: 22,
    tag: 'Durable',
    requiresEnclosure: false,
  },
  {
    id: 'abs',
    name: 'ABS',
    type: 'FDM',
    densityGPerCm3: 1.04,
    pricePerGramLkr: 25,
    tag: 'Heat-Resistant',
    requiresEnclosure: true,
  },
  {
    id: 'tpu',
    name: 'TPU',
    type: 'FDM',
    densityGPerCm3: 1.21,
    pricePerGramLkr: 35,
    tag: 'Flexible',
    requiresEnclosure: false,
  },
  {
    id: 'petg-cf',
    name: 'PETG-CF',
    type: 'FDM',
    densityGPerCm3: 1.29,
    pricePerGramLkr: 35,
    tag: 'Carbon Fiber',
    requiresEnclosure: true,
  },
  {
    id: 'lite-resin',
    name: 'Lite Resin',
    type: 'SLA',
    densityGPerCm3: 1.15,
    pricePerGramLkr: 35,
    tag: 'SLA Detail',
    requiresEnclosure: false,
  },
  {
    id: 'high-clear-resin',
    name: 'Clear Resin',
    type: 'SLA',
    densityGPerCm3: 1.15,
    pricePerGramLkr: 40,
    tag: 'SLA Clear',
    requiresEnclosure: false,
  },
]

export const INFILL_OPTIONS = [
  { value: 10, label: '10%' },
  { value: 20, label: '20%' },
  { value: 50, label: '50%' },
  { value: 100, label: '100%' },
]

export const LAYER_HEIGHTS = [
  { value: 0.12, label: '0.12 mm' },
  { value: 0.16, label: '0.16 mm' },
  { value: 0.20, label: '0.20 mm' },
  { value: 0.28, label: '0.28 mm' },
]

export interface QuoteCalculationResult {
  materialCostLkr: number
  machineTimeCostLkr: number
  handlingFeeLkr: number
  totalPriceLkr: number
  estimatedGrams: number
  estimatedPrintHours: number
  recommendedMachine: string
  isOversized: boolean
}
