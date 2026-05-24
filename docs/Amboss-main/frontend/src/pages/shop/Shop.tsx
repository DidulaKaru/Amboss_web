import { PRODUCTS } from '../../data/products'
import ProductCard from './components/ProductCard'

export default function Shop() {
  return (
    <div className="min-h-screen bg-amboss-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">AMBOSS Shop</h1>
          <p className="text-lg text-amboss-light max-w-2xl mx-auto">
            Explore our premium 3D printing services and custom parts. High-precision
            manufacturing with fast turnaround times.
          </p>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Empty State */}
        {PRODUCTS.length === 0 && (
          <div className="flex items-center justify-center min-h-96">
            <p className="text-center text-amboss-light">No products available at the moment.</p>
          </div>
        )}
      </div>
    </div>
  )
}
