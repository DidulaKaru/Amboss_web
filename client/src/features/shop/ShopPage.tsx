import { useState } from 'react'
import { useProducts } from './useProducts'
import ProductCard from './components/ProductCard'
import Cart from './components/Cart'
import { useCart } from './useCart'
import type { ProductCategory } from './types'

const CATEGORIES: { id: ProductCategory; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'microcontrollers', label: 'Microcontrollers' },
  { id: 'sensors', label: 'Sensors' },
  { id: 'actuators', label: 'Actuators' },
  { id: 'prototyping', label: 'Prototyping' },
  { id: 'accessories', label: 'Accessories' },
]

export default function ShopPage() {
  const {
    products,
    isLoading,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useProducts()

  const { itemCount } = useCart()
  const [isCartOpen, setIsCartOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
              Maker Store
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400">
              Hardware components and prototyping supplies.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-xs font-mono text-zinc-200 transition cursor-pointer shrink-0"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span>Cart</span>
            {itemCount > 0 && (
              <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-300">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="space-y-4 pt-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Segmented Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded text-xs font-mono transition shrink-0 cursor-pointer ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950 font-medium'
                        : 'bg-zinc-900/70 text-zinc-400 hover:text-zinc-200 border border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Search Input & Refresh Button */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search components..."
                  className="w-full rounded bg-zinc-900 border border-zinc-800 pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 font-sans"
                />
                <svg className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1.5 text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={refetch}
                title="Refresh live catalog and inventory"
                className="p-1.5 rounded border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Result Count (Only during active search) */}
          {searchQuery && (
            <div className="text-[11px] font-mono text-zinc-500">
              {products.length} {products.length === 1 ? 'item' : 'items'} matching &ldquo;{searchQuery}&rdquo;
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && products.length === 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="h-72 rounded border border-zinc-800/60 bg-zinc-900/20 animate-pulse flex flex-col justify-between p-4"
              >
                <div className="aspect-square bg-zinc-900/50 rounded" />
                <div className="space-y-2 pt-2">
                  <div className="h-3 bg-zinc-800/80 rounded w-3/4" />
                  <div className="h-2.5 bg-zinc-800/50 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
        {products.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-64 border border-dashed border-zinc-800 rounded p-8 text-center space-y-3">
            <div className="h-10 w-10 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-300">No products found</p>
            <p className="text-xs text-zinc-500 max-w-sm">
              We couldn't find any items matching your selected criteria. Reset your category filter or search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
              className="px-3 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Cart Drawer */}
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>
  )
}
