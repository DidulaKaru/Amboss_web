import { PRODUCTS } from '../../data/products'
import ProductCard from './components/ProductCard'
import { Link } from 'react-router-dom'

export default function Shop() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Catalog
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
                Store
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl mt-1">
                Filaments, microcontrollers, and electronic hardware in stock.
              </p>
            </div>
            <Link
              to="/quote"
              className="text-xs font-mono text-zinc-400 hover:text-zinc-200 underline underline-offset-4 transition self-start sm:self-auto"
            >
              Need custom 3D printing? Open instant quote →
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {PRODUCTS.length === 0 && (
          <div className="flex items-center justify-center min-h-64 border border-dashed border-zinc-800 rounded-lg">
            <p className="text-center text-xs font-mono text-zinc-500">No products available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
