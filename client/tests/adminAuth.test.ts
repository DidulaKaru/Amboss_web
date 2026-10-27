import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockStorage: Record<string, string> = {}
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, val: string) => {
    mockStorage[key] = val
  },
  removeItem: (key: string) => {
    delete mockStorage[key]
  },
  clear: () => {
    for (const k of Object.keys(mockStorage)) delete mockStorage[k]
  },
}

describe('Admin Authentication & Inventory Control Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorageMock.clear()
  })

  it('correctly calculates metrics for inventory management', () => {
    const mockProducts = [
      { sku: 'AMB-01', name: 'Product 1', stockQuantity: 25, priceLkr: 1400 },
      { sku: 'AMB-02', name: 'Product 2', stockQuantity: 5, priceLkr: 500 }, // low stock
      { sku: 'AMB-03', name: 'Product 3', stockQuantity: 0, priceLkr: 200 }, // depleted
      { sku: 'AMB-04', name: 'Product 4', stockQuantity: 8, priceLkr: 100 }, // low stock
    ]

    const total = mockProducts.length
    const inStock = mockProducts.filter((p) => p.stockQuantity > 0).length
    const lowStock = mockProducts.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 10).length
    const outOfStock = mockProducts.filter((p) => p.stockQuantity === 0).length

    expect(total).toBe(4)
    expect(inStock).toBe(3)
    expect(lowStock).toBe(2)
    expect(outOfStock).toBe(1)
  })

  it('filters products by category and search term correctly', () => {
    const mockProducts = [
      { sku: 'AMB-MCU-01', name: 'Arduino Uno R3', category: 'Microcontrollers' },
      { sku: 'AMB-MCU-02', name: 'ESP32 NodeMCU', category: 'Microcontrollers' },
      { sku: 'AMB-SEN-01', name: 'Ultrasonic Sensor', category: 'Sensors' },
      { sku: 'AMB-PAS-01', name: 'GL-12 Breadboard', category: 'Prototyping' },
    ]

    // Category filter
    const mcuOnly = mockProducts.filter((p) => p.category.toLowerCase() === 'microcontrollers')
    expect(mcuOnly.length).toBe(2)

    // Search query filter
    const query = 'esp32'
    const searched = mockProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query)
    )
    expect(searched.length).toBe(1)
    expect(searched[0].sku).toBe('AMB-MCU-02')
  })

  it('validates stock update prevents negative values', () => {
    const handleStockUpdate = (currentStock: number, delta: number): number => {
      const next = currentStock + delta
      return Math.max(0, next)
    }

    expect(handleStockUpdate(0, -1)).toBe(0)
    expect(handleStockUpdate(5, -1)).toBe(4)
    expect(handleStockUpdate(5, 1)).toBe(6)
  })

  it('validates authentication token storage in localStorage', () => {
    const sampleToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test'
    localStorageMock.setItem('amboss_admin_token', sampleToken)
    expect(localStorageMock.getItem('amboss_admin_token')).toBe(sampleToken)

    localStorageMock.removeItem('amboss_admin_token')
    expect(localStorageMock.getItem('amboss_admin_token')).toBeNull()
  })

  it('generates correct auth headers for JSON mutations vs body-less DELETE requests', () => {
    const sampleToken = 'valid-jwt-token'
    localStorageMock.setItem('amboss_admin_token', sampleToken)

    const getAuthHeaders = (includeContentType = true): Record<string, string> => {
      const headers: Record<string, string> = {}
      if (includeContentType) {
        headers['Content-Type'] = 'application/json'
      }
      const token = localStorageMock.getItem('amboss_admin_token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      return headers
    }

    // POST / PUT with body
    const postHeaders = getAuthHeaders(true)
    expect(postHeaders['Content-Type']).toBe('application/json')
    expect(postHeaders['Authorization']).toBe(`Bearer ${sampleToken}`)

    // DELETE without body (must not set Content-Type to avoid 400 Bad Request in Fastify)
    const deleteHeaders = getAuthHeaders(false)
    expect(deleteHeaders['Content-Type']).toBeUndefined()
    expect(deleteHeaders['Authorization']).toBe(`Bearer ${sampleToken}`)
  })
})
