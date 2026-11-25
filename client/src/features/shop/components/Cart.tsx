import { useEffect, useRef } from 'react'
import { useCart } from '../useCart'
import type { DeliveryMethod } from '../types'
import { getAssetUrl } from '../../../utils/assets'
import CartToast from './CartToast'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

// Body scroll lock is ref-counted and only touches <body>, so it never conflicts with the
// navbar's mobile menu, which toggles `overflow-hidden` on <html>.
let scrollLocks = 0
let previousBodyOverflow = ''
function lockBodyScroll() {
  if (scrollLocks === 0) {
    previousBodyOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  scrollLocks += 1
}
function unlockBodyScroll() {
  scrollLocks = Math.max(0, scrollLocks - 1)
  if (scrollLocks === 0) document.body.style.overflow = previousBodyOverflow
}

const DELIVERY_OPTIONS: {
  id: DeliveryMethod
  title: string
  price: string
  free: boolean
  note: string
}[] = [
  { id: 'ruhuna_pickup', title: 'UoR Faculty of Engineering', price: 'FREE', free: true, note: 'Campus pickup at Hapugala.' },
  { id: 'hapugala_pickup', title: 'Hapugala Shop', price: 'FREE', free: true, note: 'Workshop pickup at Hapugala.' },
  { id: 'courier', title: 'Islandwide Courier', price: 'Rs 500', free: false, note: 'Doorstep delivery across Sri Lanka.' },
]

export default function Cart({ isOpen, onClose }: CartProps) {
  const {
    cartItems,
    removeFromCart,
    updateQuantity,
    clearCart,
    subtotal,
    deliveryFee,
    cartTotal,
    itemCount,
    deliveryMethod,
    setDeliveryMethod,
    deliveryAddress,
    setDeliveryAddress,
    customerName,
    setCustomerName,
    isCheckingOut,
    validationErrors,
    clearValidationErrors,
    proceedToWhatsAppOrder,
  } = useCart()

  const drawerRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // While open: move focus in, restore it to the opener on close, lock scroll,
  // close on Escape and keep Tab focus inside the drawer.
  useEffect(() => {
    if (!isOpen) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    closeButtonRef.current?.focus()
    lockBodyScroll()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const drawer = drawerRef.current
      if (!drawer) return
      const focusable = Array.from(drawer.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusable.length === 0) {
        e.preventDefault()
        drawer.focus()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      const inside = active instanceof Node && drawer.contains(active)
      if (e.shiftKey && (!inside || active === first || active === drawer)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockBodyScroll()
      if (opener && opener.isConnected) opener.focus()
    }
  }, [isOpen])

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out Cart Drawer */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
        tabIndex={-1}
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 text-zinc-100 shadow-2xl transition-transform duration-300 flex flex-col focus:outline-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-5 bg-zinc-900/40">
          <div className="flex items-center gap-2">
            <h2 id="cart-drawer-title" className="text-sm font-medium text-zinc-200">Cart</h2>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close cart"
          >
            <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Inventory / Order Validation Errors Banner */}
        {validationErrors.length > 0 && (
          <div role="alert" className="p-3 mx-4 mt-3 rounded border border-red-900/60 bg-red-950/40 text-xs text-red-200 space-y-1">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <svg aria-hidden="true" className="w-3.5 h-3.5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Order needs attention
              </span>
              <button
                type="button"
                onClick={clearValidationErrors}
                className="text-xs text-red-400 hover:text-red-200 underline cursor-pointer"
              >
                Dismiss
              </button>
            </div>
            <ul className="list-disc list-inside text-xs space-y-0.5 text-red-300/90 font-mono">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
              <div className="h-10 w-10 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
                <svg aria-hidden="true" className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-300">Cart is empty</p>
                <p className="text-xs text-zinc-400 mt-0.5">Select electronics components to add to your order.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700/80 transition"
                >
                  {/* Thumbnail */}
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded bg-zinc-950 border border-zinc-800">
                    <img
                      src={getAssetUrl(item.image_url)}
                      alt={item.name}
                      width={56}
                      height={56}
                      onError={(e) => {
                        e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-medium text-zinc-200 truncate">{item.name}</h3>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        Rs {item.price.toLocaleString()} LKR
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 border border-zinc-800 rounded bg-zinc-900 px-1 w-fit mt-1.5">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        className="py-0.5 px-1.5 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        <span aria-hidden="true">-</span>
                      </button>
                      <span className="w-5 text-center text-xs font-mono text-zinc-200">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, Math.min(item.stock, item.quantity + 1))}
                        disabled={item.quantity >= item.stock}
                        className="py-0.5 px-1.5 text-xs text-zinc-400 hover:text-white transition disabled:opacity-40 cursor-pointer"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-zinc-400 hover:text-red-400 transition p-1 self-start cursor-pointer"
                    aria-label={`Remove ${item.name} from cart`}
                  >
                    <svg aria-hidden="true" className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Delivery & Logistics Method Selection */}
          {cartItems.length > 0 && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <fieldset className="space-y-3 border-0 p-0 m-0 min-w-0">
                <legend className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-medium mb-3">
                  Delivery Method
                </legend>

                <div className="space-y-2">
                  {DELIVERY_OPTIONS.map((opt) => {
                    const selected = deliveryMethod === opt.id
                    return (
                      <label
                        key={opt.id}
                        className={`p-3 rounded border text-left cursor-pointer transition flex items-start gap-3 ${
                          selected
                            ? `${opt.free ? 'border-emerald-500/80' : 'border-zinc-500'} bg-zinc-900 text-zinc-100`
                            : 'border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 text-zinc-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="deliveryMethod"
                          checked={selected}
                          onChange={() => setDeliveryMethod(opt.id)}
                          className={`mt-0.5 ${opt.free ? 'accent-emerald-500' : 'accent-zinc-400'}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-medium text-zinc-200">{opt.title}</span>
                            <span
                              className={`text-xs font-mono font-medium ${opt.free ? 'text-emerald-400' : 'text-zinc-200'}`}
                            >
                              {opt.price}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{opt.note}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              {/* Recipient Details & Delivery Address Input */}
              <div className="space-y-2 pt-1">
                <div>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your Name (optional)"
                    aria-label="Your name (optional)"
                    className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-600 font-sans"
                  />
                </div>
                {deliveryMethod === 'courier' && (
                  <div>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Delivery address and city..."
                      aria-label="Delivery address and city"
                      className="w-full rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-600 font-sans"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Itemized Total & WhatsApp Checkout Button */}
        {cartItems.length > 0 && (
          <div className="border-t border-zinc-800 px-5 py-4 space-y-3 bg-zinc-900/30">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span className="font-mono text-zinc-200">Rs {subtotal.toLocaleString()} LKR</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Delivery</span>
                <span className="font-mono text-zinc-200">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-400 font-medium">FREE</span>
                  ) : (
                    `Rs ${deliveryFee.toLocaleString()} LKR`
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-sm">
                <span className="font-medium text-zinc-200">Total</span>
                <span className="font-mono font-medium text-base text-zinc-100">
                  Rs {cartTotal.toLocaleString()} LKR
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={clearCart}
                className="rounded py-2 px-3 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-900/60 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={proceedToWhatsAppOrder}
                disabled={isCheckingOut}
                className="flex-1 rounded py-2 px-3 text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {isCheckingOut ? (
                  <>
                    <span aria-hidden="true" className="h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Order via WhatsApp'
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <CartToast />
    </>
  )
}
