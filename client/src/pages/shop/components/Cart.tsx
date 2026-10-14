import { useState } from 'react'
import { useCart } from '../../../context/useCart'
import { getAssetUrl } from '../../../utils/assets'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart()
  const [loading, setLoading] = useState(false)

  const handleProceedToOrder = async () => {
    if (cartItems.length === 0) {
      return
    }

    setLoading(true)

    // Format message with items and total
    const itemsList = cartItems
      .map((item: { name: string; quantity: number }) => `${item.name} x ${item.quantity}`)
      .join('\n')

    const message = `AMBOSS Order Request\n\n${itemsList}\n\nEstimated Total: Rs ${cartTotal.toLocaleString()} LKR\n\nPlease confirm availability and payment details.`

    const encodedMessage = encodeURIComponent(message)
    window.location.href = `https://wa.me/94779902796?text=${encodedMessage}`
    setLoading(false)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Slide-out Cart */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-zinc-950 border-l border-zinc-800 text-zinc-100 shadow-2xl transition-transform duration-200 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-5">
          <h2 className="text-sm font-medium text-zinc-200">Cart ({cartItems.reduce((acc: number, item: { quantity: number }) => acc + item.quantity, 0)})</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-zinc-400 hover:text-zinc-100 transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-xs font-mono text-zinc-500">Cart is empty</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item: { id: string; image_url: string; name: string; price: number; quantity: number; stock: number }) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded border border-zinc-800 bg-zinc-900/40"
                >
                  {/* Item Image */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded bg-zinc-950">
                    <img
                      src={getAssetUrl(item.image_url)}
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                      }}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-medium text-zinc-200 truncate">{item.name}</h3>
                      <p className="text-xs font-mono text-zinc-400 mt-0.5">
                        Rs {item.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 border border-zinc-800 rounded bg-zinc-900 px-1 w-fit mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="py-0.5 px-1.5 text-xs text-zinc-400 hover:text-white transition"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-xs font-mono text-zinc-200">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.min(item.stock, item.quantity + 1),
                          )
                        }
                        className="py-0.5 px-1.5 text-xs text-zinc-400 hover:text-white transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-zinc-500 hover:text-zinc-300 transition p-1 self-start"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Total & Notice */}
        {cartItems.length > 0 && (
          <div className="border-t border-zinc-800 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Total</span>
              <span className="text-sm font-mono font-medium text-zinc-100">
                Rs {cartTotal.toLocaleString()} LKR
              </span>
            </div>

            <p className="text-[10px] text-zinc-500 leading-normal">
              Free pickup at Faculty of Engineering, University of Ruhuna. Nationwide delivery calculated on confirmation.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={clearCart}
                className="rounded py-2 px-3 text-xs font-mono text-zinc-400 hover:text-zinc-200 border border-zinc-800 bg-zinc-900/40 transition cursor-pointer"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleProceedToOrder}
                disabled={loading}
                className="flex-1 rounded py-2 px-3 text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 transition cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Opening...' : 'Order via WhatsApp'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
