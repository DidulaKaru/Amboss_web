import { useState, useEffect } from 'react'
import type { Product } from '../../../types/shop'
import { useCart } from '../../../context/useCart'

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
    <div className="flex flex-col overflow-hidden rounded-lg border-2 border-amboss-accent/30 bg-amboss-dark hover:border-amboss-accent/60 transition-all duration-300">
      {/* Image Container */}
      <div className="aspect-square overflow-hidden bg-amboss-dark/50">
        <img
          src={product.image_url}
          alt={product.name}
          className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
        <p className="text-sm text-amboss-light mb-4 flex-grow">{product.description}</p>

        {/* Price */}
        <div className="mb-4">
          <p className="text-2xl font-bold text-amboss-accent">
            Rs {product.price.toLocaleString()}
          </p>
        </div>

        {/* Quantity & Button */}
        <div className="flex gap-2">
          {!isOutOfStock && (
            <div className="flex items-center gap-2 border border-amboss-accent/30 rounded px-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="py-1 px-2 text-amboss-accent hover:text-white transition"
              >
                −
              </button>
              <span className="w-8 text-center text-white">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity(Math.min(product.stock, quantity + 1))
                }
                className="py-1 px-2 text-amboss-accent hover:text-white transition"
              >
                +
              </button>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-pressed={added}
            className={`flex-1 rounded py-2 px-4 font-medium transition-flex ${
              isOutOfStock
                ? 'bg-amboss-dark/50 text-amboss-light/50 cursor-not-allowed border border-amboss-accent/20'
                : 'bg-amboss-accent text-amboss-dark hover:bg-amboss-accent/90'
            } ${added ? 'btn-add-animate' : ''}`}
          >
            {isOutOfStock ? (
              'Out of Stock'
            ) : added ? (
              <span className="added-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                  <path d="M20 6L9 17l-5-5" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Added
              </span>
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
