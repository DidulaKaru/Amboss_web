import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Product, ProductCategory } from './types'
import { PRODUCTS as FALLBACK_PRODUCTS } from '../../data/products'
import { groupProducts } from './groupProducts'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function useProducts() {
  const [rawProducts, setRawProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // First attempt relative /api/v1/products (proxied by Vite or web server)
      const url = `${API_BASE}/api/v1/products`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const res = await fetch(url, { signal: controller.signal })
      clearTimeout(timeoutId)

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: Failed to load catalog`)
      }

interface RawProductApiItem {
  id?: string
  sku?: string
  name: string
  category?: string
  description?: string
  priceLkr?: string | number
  price?: number
  stockQuantity?: number
  stock?: number
  imageUrl?: string
  image_url?: string
  isActive?: boolean
}

      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        const normalized: Product[] = (json.data as RawProductApiItem[]).map((item) => ({
          id: item.sku || item.id || '',
          sku: item.sku || item.id,
          name: item.name,
          category: item.category || 'accessories',
          description: item.description || '',
          price: Number(item.priceLkr ?? item.price ?? 0),
          stock: Number(item.stockQuantity ?? item.stock ?? 0),
          image_url: item.imageUrl || item.image_url || '/images/amboss-logo.png',
          isActive: item.isActive !== false,
        }))

        setRawProducts(normalized)
        setIsLoading(false)
        return
      }
      throw new Error('Invalid JSON format from products API')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      console.warn('Backend products API unavailable, falling back to local dataset:', msg)
      // Fallback gracefully to client data
      const fallbackList: Product[] = FALLBACK_PRODUCTS.map((item) => ({
        ...item,
        sku: item.id,
        category: determineCategory(item.name),
        isActive: true,
      }))
      setRawProducts(fallbackList)
      setError(null) // Do not block UI when fallback is available
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  // Helper to categorize legacy items if missing category
  function determineCategory(name: string): string {
    const n = name.toLowerCase()
    if (n.includes('arduino') || n.includes('esp32')) return 'microcontrollers'
    if (n.includes('sensor') || n.includes('potentiometer') || n.includes('gy-521')) return 'sensors'
    if (n.includes('servo') || n.includes('motor') || n.includes('driver')) return 'actuators'
    if (n.includes('breadboard') || n.includes('jumper') || n.includes('oled')) return 'prototyping'
    return 'accessories'
  }

  // Grouped products with variant support (LEDs and Jumper Cables)
  const groupedProducts = useMemo(() => groupProducts(rawProducts), [rawProducts])

  // Filtered products based on category and search
  const filteredProducts = useMemo(() => {
    return groupedProducts.filter((product) => {
      // Category match
      if (selectedCategory !== 'all') {
        const prodCat = (product.category || '').toLowerCase()
        if (prodCat !== selectedCategory.toLowerCase()) {
          return false
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = product.name.toLowerCase().includes(q)
        const matchDesc = product.description.toLowerCase().includes(q)
        const matchSku = (product.sku || '').toLowerCase().includes(q)
        const matchVariants = product.variants?.some(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.label.toLowerCase().includes(q) ||
            (v.sku || '').toLowerCase().includes(q)
        )
        if (!matchName && !matchDesc && !matchSku && !matchVariants) {
          return false
        }
      }

      return true
    })
  }, [groupedProducts, selectedCategory, searchQuery])

  return {
    products: filteredProducts,
    allProducts: rawProducts,
    isLoading,
    error,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    refetch: fetchProducts,
  }
}
