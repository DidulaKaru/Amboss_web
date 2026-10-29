import { useState, useEffect, useMemo } from 'react'
import type { DisplayProduct, Product } from '../types'
import { useCart } from '../useCart'
import { getAssetUrl } from '../../../utils/assets'

interface ProductCardProps {
  product: DisplayProduct
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants && product.variants.length > 0 ? product.variants[0].id : null
  )
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const { addToCart, cartItems } = useCart()

  // Derive selected variant directly without useEffect state syncing
  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null
    return product.variants.find((v) => v.id === selectedVariantId) ?? product.variants[0]
  }, [product.variants, selectedVariantId])

  // Active parameters from either selected variant or standalone product
  const activeId = selectedVariant ? selectedVariant.id : product.id
  const activeSku = selectedVariant ? selectedVariant.sku : product.sku
  const activeName = selectedVariant ? selectedVariant.name : product.name
  const activePrice = selectedVariant ? selectedVariant.price : product.price
  const activeStock = selectedVariant ? selectedVariant.stock : product.stock
  const activeDesc = selectedVariant?.description || product.description
  const activeImage = selectedVariant?.image_url || product.image_url

  // Cart quantity check (performed silently in background, without showing raw numbers)
  const existingInCart = cartItems.find((i) => i.id === activeId)
  const inCartQty = existingInCart ? existingInCart.quantity : 0
  const isOutOfStock = activeStock <= 0
  const remainingStock = Math.max(0, activeStock - inCartQty)

  const handleAddToCart = () => {
    const itemToAdd: Product = {
      id: activeId,
      sku: activeSku,
      name: activeName,
      category: product.category,
      description: activeDesc,
      price: activePrice,
      stock: activeStock,
      image_url: activeImage,
      isActive: true,
    }

    const success = addToCart(itemToAdd, quantity)
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

  return (
    <div
      data-testid="product-card"
      data-sku={activeSku}
      className="flex flex-col rounded-lg border border-zinc-850/80 bg-zinc-900/30 p-4 hover:border-zinc-700/80 transition space-y-3"
    >
      {/* Product Image: Clean presentation without floating badges */}
      <div className="aspect-square w-full overflow-hidden rounded bg-zinc-900/60 border border-zinc-800/60">
        <img
          src={getAssetUrl(activeImage)}
          alt={activeName}
          width={400}
          height={400}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
          }}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Category metadata strip */}
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-500">
        <span>{product.category || 'Component'}</span>
      </div>

      {/* Product Name & Description */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-zinc-100 line-clamp-1">{product.name}</h3>
        <p className="text-[11px] text-zinc-400 line-clamp-1 leading-relaxed">{activeDesc}</p>
      </div>

      {/* Variant Dropdown: e.g. Color for LEDs, Termination for Jumper Cables */}
      {product.variants && product.variants.length > 1 && (
        <div className="space-y-1 pt-1">
          <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block font-medium">
            {product.variantLabel || 'Option'}
          </label>
          <select
            data-testid="variant-select"
            value={selectedVariant?.id}
            onChange={(e) => {
              setSelectedVariantId(e.target.value)
              setQuantity(1)
            }}
            className="w-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-200 rounded px-2.5 py-1.5 focus:outline-none focus:border-zinc-600 transition cursor-pointer"
          >
            {product.variants.map((v) => (
              <option key={v.id} value={v.id} className="bg-zinc-900 text-zinc-200">
                {v.label} {v.stock <= 0 ? '(Out of stock)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Price & Stock Indicator (Direct In Stock / Out of Stock, NO amounts mentioned) */}
      <div className="pt-2 mt-auto flex items-baseline justify-between border-t border-zinc-800/80">
        <div>
          <span className="font-mono text-sm font-semibold text-zinc-100">
            Rs {activePrice.toLocaleString()}
          </span>
          <span className="text-[10px] font-mono text-zinc-500 ml-1">LKR</span>
        </div>

        <div>
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-500">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              Out of stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              In stock
            </span>
          )}
        </div>
      </div>

      {/* Quantity & Add to Cart Action */}
      <div className="flex gap-2 pt-1">
        {!isOutOfStock && remainingStock > 0 && (
          <div className="flex items-center border border-zinc-800 rounded bg-zinc-900 px-1 shrink-0">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="py-1 px-1.5 text-xs text-zinc-400 hover:text-white transition cursor-pointer"
              title="Decrease quantity"
            >
              -
            </button>
            <span className="w-5 text-center text-xs font-mono text-zinc-200">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity(Math.min(remainingStock, quantity + 1))}
              disabled={quantity >= remainingStock}
              className="py-1 px-1.5 text-xs text-zinc-400 hover:text-white transition disabled:opacity-40 cursor-pointer"
              title="Increase quantity"
            >
              +
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isOutOfStock || remainingStock <= 0}
          className={`flex-1 rounded py-2 px-3 text-xs font-medium transition cursor-pointer flex items-center justify-center ${
            isOutOfStock
              ? 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-zinc-800'
              : remainingStock <= 0
              ? 'bg-zinc-900 text-zinc-400 cursor-not-allowed border border-zinc-800'
              : added
              ? 'bg-emerald-600 text-white'
              : 'bg-zinc-100 hover:bg-white text-zinc-950 font-semibold'
          }`}
        >
          {isOutOfStock
            ? 'Out of Stock'
            : remainingStock <= 0
            ? 'In Cart'
            : added
            ? 'Added'
            : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
