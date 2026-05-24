import { PRODUCTS } from '../../data/products'
import ProductCard from './components/ProductCard'

export default function Shop() {
  return (
    <div className="min-h-screen bg-amboss-bg py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">AMBOSS Maker Store</h1>
          <p className="text-lg text-amboss-light max-w-2xl mx-auto">
            Your hub for electronic components, microcontrollers and 3D printing filaments.
          </p>

          <div className="mt-4">
            <a
              href="https://wa.me/94779902796"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#0F4C75] text-white text-sm px-4 py-2 rounded-full"
            >
              Need a custom 3D print? Contact Us
            </a>
          </div>
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
