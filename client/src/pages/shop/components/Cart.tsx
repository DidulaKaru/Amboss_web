import { useState } from 'react'
import { useCart } from '../../../context/useCart'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart()
  const [loading, setLoading] = useState(false)

  const handleProceedToOrder = async () => {
    if (cartItems.length === 0) {
      alert('Your cart is empty!')
      return
    }

    setLoading(true)

    // Format message with items and total
    const itemsList = cartItems
      .map((item: { name: string; quantity: number }) => `${item.name} x ${item.quantity}`)
      .join('\n')

    const message = `Hello! I would like to place an order:\n\n${itemsList}\n\nTotal Price: Rs ${cartTotal.toLocaleString()}\n\nPlease confirm availability and payment details.`

    // URL encode the message
    const encodedMessage = encodeURIComponent(message)

    // Redirect to WhatsApp
    window.location.href = `https://wa.me/94779902796?text=${encodedMessage}`

    setLoading(false)
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Slide-out Cart */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-full max-w-sm bg-[var(--color-bg)] border-l border-amboss-accent/30 shadow-2xl transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between border-b border-amboss-accent/30 px-6">
          <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
          <button
            onClick={onClose}
            className="p-1 text-amboss-light hover:text-white transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartItems.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <p className="text-amboss-light">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item: { id: string; image_url: string; name: string; price: number; quantity: number; stock: number }) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 rounded bg-amboss-dark/50 border border-amboss-accent/20"
                >
                  {/* Item Image */}
                  <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{item.name}</h3>
                    <p className="text-sm text-amboss-light">
                      Rs {item.price.toLocaleString()}
                    </p>

                    {/* Quantity Controls */}
                    <div className="mt-2 flex items-center gap-2 border border-amboss-accent/30 rounded w-fit">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, Math.max(1, item.quantity - 1))
                        }
                        className="py-1 px-2 text-amboss-accent hover:text-white transition"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-white text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.id,
                            Math.min(item.stock, item.quantity + 1),
                          )
                        }
                        className="py-1 px-2 text-amboss-accent hover:text-white transition"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="text-amboss-light hover:text-red-500 transition p-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
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
          <div className="border-t border-amboss-accent/30 px-6 py-4 space-y-4">
            {/* Total */}
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-white">Total:</span>
              <span className="text-2xl font-bold text-amboss-accent">
                Rs {cartTotal.toLocaleString()}
              </span>
            </div>

            {/* Notice */}
            <div className="bg-amboss-accent/10 border border-amboss-accent/30 rounded p-3">
              <p className="text-sm text-amboss-light leading-relaxed">
                <span className="font-semibold text-amboss-accent">Notice:</span> No shipping
                fee around the Faculty of Engineering, University of Ruhuna. Final price and
                payment details will be informed through WhatsApp.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <button
                onClick={clearCart}
                className="flex-1 rounded py-2 px-4 font-medium border border-amboss-accent/50 text-amboss-accent hover:bg-amboss-accent/10 transition"
              >
                Clear Cart
              </button>
              <button
                onClick={handleProceedToOrder}
                disabled={loading}
                className="flex-1 rounded py-2 px-4 font-medium bg-amboss-accent text-amboss-dark hover:bg-amboss-accent/90 transition disabled:opacity-50"
              >
                {loading ? 'Redirecting...' : 'Proceed to Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
