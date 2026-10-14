import { useState, useEffect } from 'react'
import type { Product } from '../../../types/shop'
import { useCart } from '../../../context/useCart'
import { getAssetUrl } from '../../../utils/assets'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addToCart } = useCart()

  const handleAddToCart = () => {
    const success = addToCart(product, quantity)
    if (success) {
      setQuantity(1)
      setAdded(true)
    }
  }

  useEffect(() => {
    if (!added) return
    const t = setTimeout(() => setAdded(false), 900)
    return () => clearTimeout(t)
  }, [added])

  const isOutOfStock = product.stock === 0

  return (
    <div className="flex flex-col overflow-hidden rounded border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition">
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-zinc-950 relative">
        <img
          src={getAssetUrl(product.image_url)}
          alt={product.name}
          onError={(e) => {
            e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
          }}
          className="h-full w-full object-cover"
        />
        {isOutOfStock && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-zinc-900/90 border border-zinc-800 text-[10px] font-mono text-zinc-400">
            Out of stock
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3.5 space-y-3">
        <div>
          <h3 className="text-xs font-medium text-zinc-200 line-clamp-1">{product.name}</h3>
          <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{product.description}</p>
        </div>

        {/* Price */}
        <div className="pt-1">
          <p className="text-sm font-mono font-medium text-zinc-100">
            Rs {product.price.toLocaleString()} LKR
          </p>
        </div>

        {/* Quantity & Button */}
        <div className="flex gap-2 pt-1 mt-auto">
          {!isOutOfStock && (
            <div className="flex items-center border border-zinc-800 rounded bg-zinc-900/60 px-1.5">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="py-1 px-1.5 text-xs text-zinc-400 hover:text-white transition"
              >
                −
              </button>
              <span className="w-5 text-center text-xs font-mono text-zinc-200">{quantity}</span>
              <button
                type="button"
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="py-1 px-1.5 text-xs text-zinc-400 hover:text-white transition"
              >
                +
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 rounded py-1.5 px-3 text-xs font-medium transition cursor-pointer ${
              isOutOfStock
                ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
                : added
                ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                : 'bg-zinc-100 text-zinc-950 hover:bg-white'
            }`}
          >
            {isOutOfStock ? (
              'Unavailable'
            ) : added ? (
              'Added'
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
