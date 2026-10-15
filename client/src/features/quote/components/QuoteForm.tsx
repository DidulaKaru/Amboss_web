import { useState } from 'react'
import type { STLParseResult } from '../utils/stlParser'
import { MATERIALS, LAYER_HEIGHTS, INFILL_OPTIONS, type MaterialOption } from '../types'
import { calculateQuote, calculateCourierFee, MINIMUM_PRINT_PRICE_LKR } from '../utils/pricing'
import { SITE } from '../../../config/site'

interface QuoteFormProps {
  stlResult: STLParseResult
  fileName: string
  selectedMaterial: MaterialOption
  onMaterialChange: (material: MaterialOption) => void
}

type DeliveryOption = 'ruhuna_pickup' | 'hapugala_pickup' | 'courier'

export default function QuoteForm({
  stlResult,
  fileName,
  selectedMaterial,
  onMaterialChange,
}: QuoteFormProps) {
  const [infillPct, setInfillPct] = useState(20)
  const [layerHeight, setLayerHeight] = useState(0.20)
  const [quantity, setQuantity] = useState(1)
  const [deliveryOption, setDeliveryOption] = useState<DeliveryOption>('ruhuna_pickup')

  const quote = calculateQuote(stlResult, selectedMaterial, infillPct, layerHeight)
  const rawPrintTotal = quote.totalPriceLkr * quantity
  const printSubtotal = Math.max(MINIMUM_PRINT_PRICE_LKR, rawPrintTotal)
  const totalWeightGrams = quote.estimatedGrams * quantity

  // Dynamic courier fee: 500 LKR for the first 1kg and adding 150 for each 1kg added on top
  const courierFee = calculateCourierFee(totalWeightGrams)
  const deliveryFee =
    deliveryOption === 'ruhuna_pickup' || deliveryOption === 'hapugala_pickup'
      ? 0
      : courierFee

  const grandTotal = printSubtotal + deliveryFee

  const getInfillLabel = (val: number) => {
    if (val === 10) return '10% (Light)'
    if (val === 20) return '20% (Standard)'
    if (val === 50) return '50% (Dense)'
    return '100% (Solid)'
  }

  const handleWhatsAppQuote = () => {
    const deliveryText =
      deliveryOption === 'ruhuna_pickup'
        ? 'Free Pickup at Faculty of Engineering, University of Ruhuna'
        : deliveryOption === 'hapugala_pickup'
        ? 'Free Pickup at Amboss Shop, Hapugala'
        : `Islandwide Courier (Rs ${courierFee.toLocaleString()} LKR - PromptX/Domex)`

    const lines = [
      `AMBOSS 3D Print Quote Request`,
      `--------------------------------`,
      `Model: ${fileName}`,
      `Dimensions: ${stlResult.boundingBox.dimensions.x} x ${stlResult.boundingBox.dimensions.y} x ${stlResult.boundingBox.dimensions.z} mm`,
      `Volume: ${stlResult.volumeCm3} cm3`,
      `Material: ${selectedMaterial.name}`,
      `Infill: ${infillPct}%`,
      `Layer Height: ${layerHeight} mm`,
      `Estimated Weight: ~${totalWeightGrams.toFixed(1)} g`,
      `Estimated Machine Time: ~${(quote.estimatedPrintHours * quantity).toFixed(1)} h`,
      `Assigned Machine: ${quote.recommendedMachine}`,
      `Quantity: ${quantity}`,
      `Color Preference: (Please confirm available colors)`,
      `--------------------------------`,
      `Print Subtotal: Rs ${printSubtotal.toLocaleString()} LKR`,
      `Fulfillment: ${deliveryText}`,
      `Delivery Fee: ${deliveryFee > 0 ? `Rs ${deliveryFee.toLocaleString()} LKR` : 'FREE'}`,
      `Estimated Total: Rs ${grandTotal.toLocaleString()} LKR`,
      ``,
      `Note: Minimum print is 250 LKR. Automated estimate based on geometric volume. Final pricing and schedule confirmed upon CAD review.`,
    ]

    const text = encodeURIComponent(lines.join('\n'))
    const url = `https://wa.me/${SITE.phone.replace(/[^\d]/g, '')}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="w-full lg:max-w-md border border-zinc-800/80 bg-zinc-950 p-6 flex flex-col justify-between rounded-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Specification</h2>
            <p className="text-xs text-zinc-500 truncate mt-0.5">
              Configure parameters for {fileName}
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            Min print Rs 250
          </span>
        </div>

        {/* Material Selection: Compact Grid */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Material
            </label>
            <span className="text-[10px] text-zinc-500 font-mono">
              Inquire via WhatsApp for colors
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {MATERIALS.map((mat) => {
              const isSelected = selectedMaterial.id === mat.id
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => onMaterialChange(mat)}
                  className={`flex flex-col items-start p-2.5 rounded border text-left transition ${
                    isSelected
                      ? 'border-zinc-500 bg-zinc-900 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex justify-between w-full">
                    <span className="text-xs font-medium text-zinc-200">{mat.name}</span>
                    <span className="text-xs text-zinc-400">Rs {mat.pricePerGramLkr}/g</span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-0.5">{mat.tag}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Infill Selection: Segmented Control */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono uppercase text-zinc-400">
            <span>Infill Density</span>
            <span className="text-zinc-200">{getInfillLabel(infillPct)}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 rounded-md border border-zinc-800">
            {INFILL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInfillPct(opt.value)}
                className={`py-1 text-xs font-medium rounded transition ${
                  infillPct === opt.value
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layer Precision */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Layer Height
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {LAYER_HEIGHTS.map((res) => (
              <button
                key={res.value}
                type="button"
                onClick={() => setLayerHeight(res.value)}
                className={`py-1.5 text-xs text-center border rounded transition ${
                  layerHeight === res.value
                    ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                    : 'border-zinc-800 bg-zinc-900/30 text-zinc-300 hover:border-zinc-700'
                }`}
              >
                {res.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <div className="flex justify-between text-[11px] font-mono uppercase text-zinc-400">
            <span>Quantity</span>
            <span className="text-zinc-200">{quantity} {quantity === 1 ? 'unit' : 'units'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-xs font-mono transition cursor-pointer"
            >
              -
            </button>
            <span className="font-mono text-xs text-zinc-200 w-8 text-center">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity(quantity + 1)}
              className="w-8 h-8 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-xs font-mono transition cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        {/* Fulfillment Method Selection */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
            Fulfillment & Delivery
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-left">
            <button
              type="button"
              onClick={() => setDeliveryOption('ruhuna_pickup')}
              className={`p-2 rounded border transition text-left cursor-pointer ${
                deliveryOption === 'ruhuna_pickup'
                  ? 'border-emerald-500/80 bg-emerald-950/20 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-[11px] font-medium text-zinc-200 truncate">UoR Faculty</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-medium">FREE</div>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryOption('hapugala_pickup')}
              className={`p-2 rounded border transition text-left cursor-pointer ${
                deliveryOption === 'hapugala_pickup'
                  ? 'border-emerald-500/80 bg-emerald-950/20 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-[11px] font-medium text-zinc-200 truncate">Hapugala Shop</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5 font-medium">FREE</div>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryOption('courier')}
              className={`p-2 rounded border transition text-left cursor-pointer ${
                deliveryOption === 'courier'
                  ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="text-[11px] font-medium text-zinc-200 truncate">Courier</div>
              <div className="text-[10px] text-zinc-300 font-mono mt-0.5 font-medium">
                Rs {courierFee}
              </div>
            </button>
          </div>
          <p className="text-[10px] text-zinc-500">
            {deliveryOption === 'ruhuna_pickup'
              ? 'Free pickup at Faculty of Engineering, University of Ruhuna.'
              : deliveryOption === 'hapugala_pickup'
              ? 'Free pickup at Amboss Shop, Hapugala.'
              : `Islandwide courier: Rs 500 for first 1kg, +Rs 150/kg additional (~${totalWeightGrams.toFixed(1)}g total).`}
          </p>
        </div>
      </div>

      {/* Pricing Summary & Action */}
      <div className="pt-6 border-t border-zinc-800/80 space-y-4">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Material (~{totalWeightGrams.toFixed(1)}g)</span>
            <span className="font-mono text-zinc-200">Rs {(quote.materialCostLkr * quantity).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Machine Runtime (~{(quote.estimatedPrintHours * quantity).toFixed(1)}h)</span>
            <span className="font-mono text-zinc-200">Rs {(quote.machineTimeCostLkr * quantity).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Prep & QA</span>
            <span className="font-mono text-zinc-200">Rs {(quote.handlingFeeLkr * quantity).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Fulfillment</span>
            <span className="font-mono text-zinc-200">
              {deliveryFee === 0 ? <span className="text-emerald-400">FREE</span> : `Rs ${deliveryFee.toLocaleString()} LKR`}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-medium text-zinc-100">
            <span>Total Estimated</span>
            <span className="font-mono text-base font-semibold">Rs {grandTotal.toLocaleString()} LKR</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWhatsAppQuote}
          style={{ color: '#09090b' }}
          className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 hover:text-black font-semibold text-xs tracking-tight rounded transition-all cursor-pointer shadow-sm"
        >
          Order via WhatsApp
        </button>

        <p className="text-[10px] text-center text-zinc-500 leading-normal">
          Minimum print: Rs 250 LKR · Automated estimate based on geometric volume. Final pricing and schedule confirmed upon CAD review.
        </p>

        <p className="text-[10px] text-center text-zinc-500">
          Standard turnaround: 24–48 hours · Ruhuna pickup or nationwide courier
        </p>
      </div>
    </div>
  )
}
