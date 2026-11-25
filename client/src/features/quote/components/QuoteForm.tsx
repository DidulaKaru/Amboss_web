import { useId, useState } from 'react'
import type { STLParseResult } from '../utils/stlParser'
import { MATERIALS, LAYER_HEIGHTS, INFILL_OPTIONS, type MaterialOption } from '../types'
import { calculateQuote, calculateCourierFee } from '../utils/pricing'
import {
  MAX_QUANTITY,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  clampQuantity,
  getDeliveryLabel,
  navigatePendingWindow,
  openPendingWindow,
  pricesDiffer,
  type DeliveryOption,
  type WhatsAppVariant,
} from '../utils/quoteOrder'
import { SITE } from '../../../config/site'

interface QuoteFormProps {
  stlResult: STLParseResult
  fileName: string
  selectedMaterial: MaterialOption
  onMaterialChange: (material: MaterialOption) => void
}

const API_BASE = import.meta.env.VITE_API_URL || ''

/** Shared visible keyboard-focus ring for all interactive controls in the form. */
const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-300'

/** What the server told us for the last order click, tied to the options it priced. */
interface ServerQuote {
  key: string
  printTotalLkr: number
}

interface ServerQuoteResult {
  quoteId: string | null
  printTotalLkr: number | null
}

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
  const [serverQuote, setServerQuote] = useState<ServerQuote | null>(null)

  const uid = useId()
  const materialLabelId = `${uid}-material`
  const infillLabelId = `${uid}-infill`
  const layerLabelId = `${uid}-layer`
  const quantityLabelId = `${uid}-quantity`
  const deliveryLabelId = `${uid}-delivery`

  const quote = calculateQuote(stlResult, selectedMaterial, infillPct, layerHeight)
  const clientPrintSubtotal = quote.totalPriceLkr * quantity
  const totalWeightGrams = quote.estimatedGrams * quantity

  // The server figure is only valid for the exact options it priced
  const optionsKey = `${selectedMaterial.id}|${infillPct}|${layerHeight}|${quantity}`
  const activeServerQuote = serverQuote && serverQuote.key === optionsKey ? serverQuote : null
  const printSubtotal = activeServerQuote ? activeServerQuote.printTotalLkr : clientPrintSubtotal
  const showServerNote =
    activeServerQuote !== null && pricesDiffer(clientPrintSubtotal, activeServerQuote.printTotalLkr)

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

  // Persists the generated quote to the PostgreSQL quotes table and returns the
  // server-computed print total (per order, incl. quantity) so the WhatsApp message
  // matches what was recorded. Returns null if the server is unreachable/rejects.
  const recordQuoteOnServer = async (): Promise<ServerQuoteResult | null> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)
    try {
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
      if (res.ok) {
        const json = await res.json()
        if (json?.success) {
          const total = Number(json.pricing?.totalPriceLkr)
          return {
            quoteId: typeof json.quoteId === 'string' && json.quoteId ? json.quoteId : null,
            printTotalLkr: Number.isFinite(total) && total > 0 ? total : null,
          }
        }
      }
    } catch {
      // Non-blocking: continue to WhatsApp even if backend is unreachable
    } finally {
      clearTimeout(timeoutId)
    }
    return null
  }

  const handleWhatsApp = async (variant: WhatsAppVariant) => {
    if (isSubmittingQuote) return

    // Open the window synchronously inside the click gesture; Safari/mobile block
    // window.open calls made after an await. It is pointed at WhatsApp afterwards.
    const popup = openPendingWindow()

    setIsSubmittingQuote(true)
    // recordQuoteOnServer never throws; it resolves to null on any failure
    const server = await recordQuoteOnServer()
    setIsSubmittingQuote(false)

    // Prefer the server price (what was recorded); fall back to the client estimate
    const serverPrint = server?.printTotalLkr ?? null
    if (serverPrint !== null) setServerQuote({ key: optionsKey, printTotalLkr: serverPrint })
    const grandTotalForMessage = (serverPrint ?? clientPrintSubtotal) + deliveryFee

    const message = buildWhatsAppMessage({
      variant,
      quoteId: server?.quoteId ?? null,
      fileName,
      materialName: selectedMaterial.name,
      deliveryLabel: getDeliveryLabel(deliveryOption, deliveryFee),
      grandTotalLkr: grandTotalForMessage,
      quantity,
    })

    navigatePendingWindow(popup, buildWhatsAppUrl(SITE.phone, message))
  }

  const deliveryButtonClass = (selected: boolean, free: boolean) =>
    `p-2 rounded border transition text-left cursor-pointer ${FOCUS_RING} ${
      selected
        ? free
          ? 'border-emerald-500/80 bg-emerald-950/20 text-zinc-100'
          : 'border-zinc-500 bg-zinc-800 text-zinc-100'
        : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:border-zinc-700'
    }`

  const stepperClass = `w-8 h-8 rounded border border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white hover:border-zinc-700 flex items-center justify-center text-xs font-mono transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-zinc-300 disabled:hover:border-zinc-800 ${FOCUS_RING}`

  return (
    <div className="w-full lg:max-w-md border border-zinc-800/80 bg-zinc-950 p-6 flex flex-col justify-between rounded-lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium text-zinc-200">Specification</h2>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              Select material and print options
            </p>
          </div>
        </div>

        {/* Material Selection: Compact Grid */}
        <div className="space-y-2" role="group" aria-labelledby={materialLabelId}>
          <span
            id={materialLabelId}
            className="block text-xs font-mono uppercase tracking-wider text-zinc-400"
          >
            Material
          </span>

          <div className="grid grid-cols-2 gap-2">
            {MATERIALS.map((mat) => {
              const isSelected = selectedMaterial.id === mat.id
              return (
                <button
                  key={mat.id}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onMaterialChange(mat)}
                  className={`flex flex-col items-start p-2.5 rounded border text-left transition cursor-pointer ${FOCUS_RING} ${
                    isSelected
                      ? 'border-zinc-500 bg-zinc-900 text-zinc-100'
                      : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <div className="flex justify-between w-full">
                    <span className="text-xs font-medium text-zinc-200">{mat.name}</span>
                    <span className="text-xs text-zinc-400">Rs {mat.pricePerGramLkr}/g</span>
                  </div>
                  <span className="text-xs text-zinc-400 mt-0.5">{mat.tag}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Infill Selection: Segmented Control */}
        <div className="space-y-2" role="group" aria-labelledby={infillLabelId}>
          <div className="flex justify-between text-xs font-mono uppercase text-zinc-400">
            <span id={infillLabelId}>Infill Density</span>
            <span className="text-zinc-200">{getInfillLabel(infillPct)}</span>
          </div>
          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-900 rounded-md border border-zinc-800">
            {INFILL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={infillPct === opt.value}
                onClick={() => setInfillPct(opt.value)}
                className={`py-1 text-xs font-medium rounded transition cursor-pointer ${FOCUS_RING} ${
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
        <div className="space-y-2" role="group" aria-labelledby={layerLabelId}>
          <span
            id={layerLabelId}
            className="block text-xs font-mono uppercase tracking-wider text-zinc-400"
          >
            Layer Height
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {LAYER_HEIGHTS.map((res) => (
              <button
                key={res.value}
                type="button"
                aria-pressed={layerHeight === res.value}
                onClick={() => setLayerHeight(res.value)}
                className={`py-1.5 text-xs text-center border rounded transition cursor-pointer ${FOCUS_RING} ${
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
        <div className="space-y-2" role="group" aria-labelledby={quantityLabelId}>
          <div className="flex justify-between text-xs font-mono uppercase text-zinc-400">
            <span id={quantityLabelId}>Quantity</span>
            <span className="text-zinc-200">{quantity} {quantity === 1 ? 'unit' : 'units'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Decrease quantity"
              onClick={() => setQuantity(clampQuantity(quantity - 1))}
              disabled={quantity <= 1}
              className={stepperClass}
            >
              <span aria-hidden="true">-</span>
            </button>
            <span
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="font-mono text-xs text-zinc-200 w-8 text-center"
            >
              <span className="sr-only">Quantity: </span>
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity(clampQuantity(quantity + 1))}
              disabled={quantity >= MAX_QUANTITY}
              className={stepperClass}
            >
              <span aria-hidden="true">+</span>
            </button>
            {quantity >= MAX_QUANTITY && (
              <span className="text-xs text-zinc-400">Max {MAX_QUANTITY} per order</span>
            )}
          </div>
        </div>

        {/* Delivery Method Selection */}
        <div className="space-y-2 pt-2 border-t border-zinc-800/80" role="group" aria-labelledby={deliveryLabelId}>
          <span
            id={deliveryLabelId}
            className="block text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium"
          >
            Delivery Method
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-left">
            <button
              type="button"
              aria-pressed={deliveryOption === 'ruhuna_pickup'}
              onClick={() => setDeliveryOption('ruhuna_pickup')}
              className={deliveryButtonClass(deliveryOption === 'ruhuna_pickup', true)}
            >
              <div className="text-xs font-medium text-zinc-200 truncate">UoR Faculty</div>
              <div className="text-xs text-emerald-400 font-mono mt-0.5 font-medium">FREE</div>
            </button>

            <button
              type="button"
              aria-pressed={deliveryOption === 'hapugala_pickup'}
              onClick={() => setDeliveryOption('hapugala_pickup')}
              className={deliveryButtonClass(deliveryOption === 'hapugala_pickup', true)}
            >
              <div className="text-xs font-medium text-zinc-200 truncate">Hapugala Shop</div>
              <div className="text-xs text-emerald-400 font-mono mt-0.5 font-medium">FREE</div>
            </button>

            <button
              type="button"
              aria-pressed={deliveryOption === 'courier'}
              onClick={() => setDeliveryOption('courier')}
              className={deliveryButtonClass(deliveryOption === 'courier', false)}
            >
              <div className="text-xs font-medium text-zinc-200 truncate">Courier</div>
              <div className="text-xs text-zinc-300 font-mono mt-0.5 font-medium">
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
          {showServerNote && (
            <p role="status" className="text-xs text-amber-300 leading-relaxed">
              Updated to our server price (Rs {printSubtotal.toLocaleString()} LKR); the live
              estimate was Rs {clientPrintSubtotal.toLocaleString()} LKR.
            </p>
          )}
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
        <div className="p-3 rounded border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400 leading-relaxed">
          <span className="font-medium text-zinc-200">Disclaimer:</span> This is an automated estimation based on model geometry to give you an idea of the cost. Final pricing is confirmed after review.
        </div>

        {/* Oversized Warning Note */}
        {quote.isOversized && (
          <div className="p-3.5 rounded border border-amber-500/50 bg-amber-950/20 text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-amber-300">
              <svg aria-hidden="true" className="w-4 h-4 shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Model Exceeds Maximum Capacity</span>
            </div>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              This model exceeds our maximum single-piece print capacity ({selectedMaterial.type === 'SLA' ? '211 × 118 × 220 mm' : '350 × 350 × 350 mm'}). We have to cut the model in order to print it. Please contact us to discuss cutting and printing.
            </p>
            <button
              type="button"
              onClick={() => void handleWhatsApp('oversized')}
              disabled={isSubmittingQuote}
              className={`w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs tracking-tight rounded transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 ${FOCUS_RING}`}
            >
              {isSubmittingQuote ? (
                <>
                  <span aria-hidden="true" className="h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                  <span role="status">Logging Quote...</span>
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
            onClick={() => void handleWhatsApp('order')}
            disabled={isSubmittingQuote}
            style={{ color: '#09090b' }}
            className={`w-full py-2.5 px-4 bg-zinc-100 hover:bg-white text-zinc-950 hover:text-black font-semibold text-xs tracking-tight rounded transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 ${FOCUS_RING}`}
          >
            {isSubmittingQuote ? (
              <>
                <span aria-hidden="true" className="h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                <span role="status">Preparing Quote...</span>
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
