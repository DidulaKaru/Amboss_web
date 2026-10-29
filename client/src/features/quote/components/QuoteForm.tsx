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

const API_BASE = import.meta.env.VITE_API_URL || ''

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
  const [isSubmittingQuote, setIsSubmittingQuote] = useState(false)

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

  // Persists the generated quote to the PostgreSQL quotes table
  const recordQuoteOnServer = async (): Promise<string | null> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3500)
      const res = await fetch(`${API_BASE}/api/v1/quote/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          fileName: fileName || 'model.stl',
          volumeCm3: Math.max(0.01, stlResult.volumeCm3),
          surfaceAreaCm2: Math.max(0.01, stlResult.surfaceAreaCm2),
          dimensions: {
            x: Math.max(0.1, stlResult.boundingBox.dimensions.x),
            y: Math.max(0.1, stlResult.boundingBox.dimensions.y),
            z: Math.max(0.1, stlResult.boundingBox.dimensions.z),
          },
          materialSlug: selectedMaterial.id,
          infillPct,
          layerHeightMm: layerHeight,
          quantity,
        }),
      })
      clearTimeout(timeoutId)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.quoteId) {
          return json.quoteId
        }
      }
    } catch {
      // Non-blocking: continue to WhatsApp even if backend is unreachable
    }
    return null
  }

  const handleWhatsAppQuote = async () => {
    setIsSubmittingQuote(true)
    const quoteId = await recordQuoteOnServer()
    setIsSubmittingQuote(false)

    const deliveryLabel =
      deliveryOption === 'ruhuna_pickup'
        ? 'Free Pickup: Faculty of Engineering, University of Ruhuna'
        : deliveryOption === 'hapugala_pickup'
        ? 'Free Pickup: Amboss Shop (Hapugala)'
        : `Islandwide Courier (Rs ${deliveryFee.toLocaleString()} LKR)`

    const lines = [
      `Hi Amboss, I'd like to get a 3D print:`,
      ...(quoteId ? [`- Quote Ref: AMB-${quoteId.slice(0, 6).toUpperCase()}`] : []),
      `- File: ${fileName}`,
      `- Material: ${selectedMaterial.name}`,
      `- Delivery: ${deliveryLabel}`,
      `- Estimated Price: Rs ${grandTotal.toLocaleString()} LKR`,
      ...(quantity > 1 ? [`- Quantity: ${quantity}`] : []),
    ]

    const text = encodeURIComponent(lines.join('\n'))
    const url = `https://wa.me/${SITE.phone.replace(/[^\d]/g, '')}?text=${text}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleWhatsAppOversized = async () => {
    setIsSubmittingQuote(true)
    const quoteId = await recordQuoteOnServer()
    setIsSubmittingQuote(false)

    const deliveryLabel =
      deliveryOption === 'ruhuna_pickup'
        ? 'Free Pickup: Faculty of Engineering, University of Ruhuna'
        : deliveryOption === 'hapugala_pickup'
        ? 'Free Pickup: Amboss Shop (Hapugala)'
        : `Islandwide Courier (Rs ${deliveryFee.toLocaleString()} LKR)`

    const lines = [
      `Hi Amboss, my model exceeds your print capacity:`,
      ...(quoteId ? [`- Quote Ref: AMB-${quoteId.slice(0, 6).toUpperCase()}`] : []),
      `- File: ${fileName}`,
      `- Material: ${selectedMaterial.name}`,
      `- Delivery: ${deliveryLabel}`,
      `- Estimated Price: Rs ${grandTotal.toLocaleString()} LKR`,
      ...(quantity > 1 ? [`- Quantity: ${quantity}`] : []),
      ``,
      `We have to cut the model in order to print it. Can you help?`,
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
              Select material and print options
            </p>
          </div>
          <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            Min print Rs 250
          </span>
        </div>

        {/* Material Selection: Compact Grid */}
        <div className="space-y-2">
          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Material
          </label>

          <div className="grid grid-cols-2 gap-2">
            {MATERIALS.map((mat) => {
              const isSelected = selectedMaterial.id === mat.id
              return (
                <button
                  key={mat.id}
                  type="button"
                  onClick={() => onMaterialChange(mat)}
                  className={`flex flex-col items-start p-2.5 rounded border text-left transition cursor-pointer ${
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
                className={`py-1 text-xs font-medium rounded transition cursor-pointer ${
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

        {/* Layer Height Selection */}
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
                className={`py-1.5 text-xs text-center border rounded transition cursor-pointer ${
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

        {/* Delivery Method Selection */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80">
          <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
            Delivery Method
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
        </div>
      </div>

      {/* Pricing Summary, Disclaimer & Action */}
      <div className="pt-6 border-t border-zinc-800/80 space-y-4">
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Estimated Weight</span>
            <span className="font-mono text-zinc-200">~{totalWeightGrams.toFixed(1)} g</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Print Cost</span>
            <span className="font-mono text-zinc-200">Rs {printSubtotal.toLocaleString()} LKR</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Fulfillment</span>
            <span className="font-mono text-zinc-200">
              {deliveryFee === 0 ? <span className="text-emerald-400">FREE</span> : `Rs ${deliveryFee.toLocaleString()} LKR`}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-zinc-800 text-sm font-medium text-zinc-100">
            <span>Estimated Total</span>
            <span className="font-mono text-base font-semibold">Rs {grandTotal.toLocaleString()} LKR</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3 rounded border border-zinc-800/80 bg-zinc-900/40 text-[11px] text-zinc-400 leading-relaxed">
          <span className="font-medium text-zinc-200">Disclaimer:</span> This is an automated estimation based on model geometry to give you an idea of the cost. Final pricing is confirmed after review.
        </div>

        {/* Oversized Warning Note */}
        {quote.isOversized && (
          <div className="p-3.5 rounded border border-amber-500/50 bg-amber-950/20 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-amber-300">
              <svg className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Model Exceeds Maximum Capacity</span>
            </div>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              This model exceeds our maximum single-piece print capacity ({selectedMaterial.type === 'SLA' ? '211 × 118 × 220 mm' : '350 × 350 × 350 mm'}). We have to cut the model in order to print it. Please contact us to discuss cutting and printing.
            </p>
            <button
              type="button"
              onClick={handleWhatsAppOversized}
              disabled={isSubmittingQuote}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs tracking-tight rounded transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isSubmittingQuote ? (
                <>
                  <span className="h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  Logging Quote...
                </>
              ) : (
                'Contact Us on WhatsApp to Cut & Print'
              )}
            </button>
          </div>
        )}

        {/* Standard Action Button (when not oversized) */}
        {!quote.isOversized && (
          <button
            type="button"
            onClick={handleWhatsAppQuote}
            disabled={isSubmittingQuote}
            style={{ color: '#09090b' }}
            className="w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 hover:text-black font-semibold text-xs tracking-tight rounded transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {isSubmittingQuote ? (
              <>
                <span className="h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                Preparing Quote...
              </>
            ) : (
              'Order via WhatsApp'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
