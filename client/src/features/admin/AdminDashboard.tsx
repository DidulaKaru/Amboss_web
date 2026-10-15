import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './useAdminAuth'

interface ProductRecord {
  id?: string
  sku: string
  name: string
  category: string
  description?: string
  priceLkr?: string | number
  price?: number
  stockQuantity?: number
  stock?: number
  imageUrl?: string
  image_url?: string
  isActive?: boolean
}

const API_BASE = import.meta.env.VITE_API_URL || ''

const CATEGORY_OPTIONS = [
  'Microcontrollers',
  'Sensors',
  'Actuators',
  'Prototyping',
  'Accessories',
]

export default function AdminDashboard() {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()

  const [products, setProducts] = useState<ProductRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Saving states for inline stock edits
  const [savingSku, setSavingSku] = useState<string | null>(null)

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Microcontrollers',
    description: '',
    priceLkr: 0,
    stockQuantity: 0,
    imageUrl: 'images/amboss-logo.png',
    isActive: true,
  })
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 3500)
  }

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    const token = localStorage.getItem('amboss_admin_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  const fetchCatalog = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/products`)
      if (!res.ok) throw new Error('Failed to load products')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        // Standardize properties
        const items = (json.data as ProductRecord[]).map((p) => ({
          ...p,
          sku: p.sku || p.id || '',
          priceLkr: p.priceLkr ?? p.price ?? 0,
          stockQuantity: p.stockQuantity ?? p.stock ?? 0,
          imageUrl: p.imageUrl || p.image_url || 'images/amboss-logo.png',
          category: p.category || 'Accessories',
          isActive: p.isActive !== false,
        }))
        setProducts(items)
      }
    } catch {
      showNotification('Unable to fetch live catalog from server.', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalog()
  }, [fetchCatalog])

  // Stock update helper
  const handleStockUpdate = async (sku: string, newStock: number) => {
    if (newStock < 0) return
    setSavingSku(sku)
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${sku}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stockQuantity: newStock }),
      })

      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.sku === sku ? { ...p, stockQuantity: newStock } : p))
        )
        showNotification(`Stock for ${sku} updated to ${newStock}`)
      } else {
        const errJson = await res.json().catch(() => null)
        showNotification(errJson?.error || 'Failed to update stock quantity', 'error')
      }
    } catch {
      showNotification('Network error while saving stock update', 'error')
    } finally {
      setSavingSku(null)
    }
  }

  // Open modal for Create
  const handleOpenCreate = () => {
    setModalMode('create')
    setFormData({
      sku: `AMB-PRD-${Math.floor(100 + Math.random() * 900)}`,
      name: '',
      category: 'Microcontrollers',
      description: '',
      priceLkr: 500,
      stockQuantity: 10,
      imageUrl: 'images/amboss-logo.png',
      isActive: true,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open modal for Edit
  const handleOpenEdit = (product: ProductRecord) => {
    setModalMode('edit')
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      description: product.description || '',
      priceLkr: Number(product.priceLkr),
      stockQuantity: Number(product.stockQuantity),
      imageUrl: product.imageUrl || 'images/amboss-logo.png',
      isActive: product.isActive !== false,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Submit Modal (Create or Edit)
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!formData.sku.trim() || !formData.name.trim()) {
      setFormError('SKU and Name are required.')
      return
    }

    setFormSubmitting(true)
    try {
      if (modalMode === 'create') {
        const res = await fetch(`${API_BASE}/api/v1/products`, {
          method: 'POST',
          credentials: 'include',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            sku: formData.sku.trim(),
            name: formData.name.trim(),
            category: formData.category,
            description: formData.description.trim(),
            priceLkr: Number(formData.priceLkr),
            stockQuantity: Number(formData.stockQuantity),
            imageUrl: formData.imageUrl.trim() || 'images/amboss-logo.png',
            isActive: formData.isActive,
          }),
        })

        const json = await res.json()
        if (res.ok && json.success) {
          showNotification(`Created product ${formData.sku}`)
          setIsModalOpen(false)
          fetchCatalog()
        } else {
          setFormError(json.error || 'Failed to create product.')
        }
      } else {
        const res = await fetch(`${API_BASE}/api/v1/products/${formData.sku}`, {
          method: 'PUT',
          credentials: 'include',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: formData.name.trim(),
            category: formData.category,
            description: formData.description.trim(),
            priceLkr: Number(formData.priceLkr),
            stockQuantity: Number(formData.stockQuantity),
            imageUrl: formData.imageUrl.trim() || 'images/amboss-logo.png',
            isActive: formData.isActive,
          }),
        })

        const json = await res.json()
        if (res.ok && json.success) {
          showNotification(`Updated product ${formData.sku}`)
          setIsModalOpen(false)
          fetchCatalog()
        } else {
          setFormError(json.error || 'Failed to update product.')
        }
      }
    } catch {
      setFormError('Network communication error with server.')
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete target confirm
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${deleteTarget.sku}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      })

      const json = await res.json()
      if (res.ok && json.success) {
        showNotification(`Deleted SKU ${deleteTarget.sku}`)
        setDeleteTarget(null)
        fetchCatalog()
      } else {
        showNotification(json.error || 'Failed to delete product', 'error')
      }
    } catch {
      showNotification('Network error while deleting product', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedCategory !== 'All' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchSku = p.sku.toLowerCase().includes(q)
        const matchName = p.name.toLowerCase().includes(q)
        const matchDesc = (p.description || '').toLowerCase().includes(q)
        if (!matchSku && !matchName && !matchDesc) return false
      }
      return true
    })
  }, [products, selectedCategory, searchQuery])

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = products.length
    const inStock = products.filter((p) => Number(p.stockQuantity) > 0).length
    const lowStock = products.filter((p) => Number(p.stockQuantity) > 0 && Number(p.stockQuantity) < 10).length
    const outOfStock = products.filter((p) => Number(p.stockQuantity) === 0).length
    return { total, inStock, lowStock, outOfStock }
  }, [products])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-16">
      {/* Toast Notification */}
      {notification && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded border text-xs font-mono shadow-lg transition-all ${
            notification.type === 'error'
              ? 'border-red-800 bg-red-950/90 text-red-200'
              : 'border-emerald-800 bg-emerald-950/90 text-emerald-200'
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* Industrial Subtractive Header */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xs font-medium tracking-wider text-zinc-100 uppercase">
                AMBOSS // SYS.CTRL
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                OPERATOR: {user?.username || 'admin'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-mono font-medium transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>NEW PRODUCT</span>
            </button>

            <Link
              to="/shop"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>VIEW SHOP</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-800 hover:border-red-900/60 bg-zinc-900 hover:bg-red-950/20 text-zinc-400 hover:text-red-300 text-xs font-mono transition cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>LOGOUT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        {/* Metric Cards */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total SKUs</div>
            <div className="mt-1 font-mono text-xl font-medium text-zinc-100">{metrics.total}</div>
          </div>
          <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">In Stock</div>
            <div className="mt-1 font-mono text-xl font-medium text-emerald-400">{metrics.inStock}</div>
          </div>
          <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Low Stock (&lt;10)</div>
            <div className="mt-1 font-mono text-xl font-medium text-amber-400">{metrics.lowStock}</div>
          </div>
          <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
            <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Out of Stock</div>
            <div className="mt-1 font-mono text-xl font-medium text-red-400">{metrics.outOfStock}</div>
          </div>
        </section>

        {/* Search & Category Filter Toolbar */}
        <section className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex-1 max-w-md relative">
            <svg
              className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by SKU, name, or keyword..."
              className="w-full pl-9 pr-3 py-2 rounded border border-zinc-800 bg-zinc-900 text-zinc-100 text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setSelectedCategory('All')}
              className={`px-2.5 py-1.5 rounded text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                selectedCategory === 'All'
                  ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                  : 'border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All
            </button>
            {CATEGORY_OPTIONS.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1.5 rounded text-xs font-mono whitespace-nowrap transition cursor-pointer ${
                  selectedCategory.toLowerCase() === cat.toLowerCase()
                    ? 'border border-zinc-700 bg-zinc-800 text-zinc-100'
                    : 'border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* Industrial Inventory Table */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Specification</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-right">Price (LKR)</th>
                  <th className="py-3 px-4 text-center">Stock Control</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80 font-mono text-xs">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
                        <span>SYNCHRONIZING INVENTORY DATA...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500">
                      NO PRODUCTS FOUND MATCHING CRITERIA
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => {
                    const currentStock = Number(p.stockQuantity) || 0
                    const isSaving = savingSku === p.sku

                    return (
                      <tr key={p.sku} className="hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-4 text-zinc-400 font-medium whitespace-nowrap">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-sans text-xs text-zinc-200 font-medium">
                            {p.name}
                          </div>
                          {p.description && (
                            <div className="font-sans text-[11px] text-zinc-500 truncate max-w-xs mt-0.5">
                              {p.description}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-900 text-[10px] text-zinc-400">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right text-zinc-200 tabular-nums whitespace-nowrap">
                          {Number(p.priceLkr).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="inline-flex items-center gap-1.5 border border-zinc-800 rounded bg-zinc-900 p-0.5">
                            <button
                              type="button"
                              aria-label={`Decrement stock for ${p.sku}`}
                              disabled={isSaving || currentStock <= 0}
                              onClick={() => handleStockUpdate(p.sku, currentStock - 1)}
                              className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 transition cursor-pointer"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              disabled={isSaving}
                              value={currentStock}
                              aria-label={`Stock quantity for ${p.sku}`}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10)
                                if (!isNaN(val)) {
                                  setProducts((prev) =>
                                    prev.map((item) =>
                                      item.sku === p.sku ? { ...item, stockQuantity: val } : item
                                    )
                                  )
                                }
                              }}
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10)
                                if (!isNaN(val) && val !== currentStock) {
                                  handleStockUpdate(p.sku, val)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.currentTarget.blur()
                                }
                              }}
                              className="w-14 text-center bg-transparent text-zinc-100 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded py-0.5"
                            />
                            <button
                              type="button"
                              aria-label={`Increment stock for ${p.sku}`}
                              disabled={isSaving}
                              onClick={() => handleStockUpdate(p.sku, currentStock + 1)}
                              className="w-6 h-6 flex items-center justify-center rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-40 transition cursor-pointer"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {currentStock > 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              IN STOCK
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[10px] text-zinc-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                              DEPLETED
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(p)}
                              className="px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
                            >
                              EDIT
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(p)}
                              className="px-2 py-1 rounded border border-zinc-800 hover:border-red-900 bg-zinc-900 text-[11px] text-zinc-400 hover:text-red-400 transition cursor-pointer"
                            >
                              DELETE
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Modal: Create or Edit Product */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-mono font-medium uppercase text-zinc-100 tracking-wider">
                {modalMode === 'create' ? 'CATALOG // REGISTER NEW PRODUCT' : `CATALOG // EDIT ${formData.sku}`}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-3 rounded border border-red-900/50 bg-red-950/40 text-red-300 text-xs font-mono"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-3 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="modal-sku" className="text-[10px] uppercase text-zinc-400">SKU Code</label>
                  <input
                    id="modal-sku"
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="modal-category" className="text-[10px] uppercase text-zinc-400">Category</label>
                  <select
                    id="modal-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-name" className="text-[10px] uppercase text-zinc-400">Product Name</label>
                <input
                  id="modal-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Arduino Uno R3 DIP"
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-description" className="text-[10px] uppercase text-zinc-400">Technical Description</label>
                <textarea
                  id="modal-description"
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Specifications, pinouts, voltage ratings..."
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="modal-price" className="text-[10px] uppercase text-zinc-400">Price (LKR)</label>
                  <input
                    id="modal-price"
                    type="number"
                    min={0}
                    step="1"
                    required
                    value={formData.priceLkr}
                    onChange={(e) => setFormData({ ...formData, priceLkr: Number(e.target.value) })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label htmlFor="modal-stock" className="text-[10px] uppercase text-zinc-400">Stock Quantity</label>
                  <input
                    id="modal-stock"
                    type="number"
                    min={0}
                    required
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-image" className="text-[10px] uppercase text-zinc-400">Image Asset Path</label>
                <input
                  id="modal-image"
                  type="text"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="images/Arduino-DIP.png"
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-xs transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-1.5 rounded border border-zinc-700 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-medium uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                >
                  {formSubmitting ? 'PROCESSING...' : modalMode === 'create' ? 'SAVE ITEM' : 'UPDATE ITEM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirmation */}
      {deleteTarget && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-sm rounded-lg border border-red-900/60 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-400">
                WARNING // DESTRUCTIVE ACTION
              </span>
              <h2 className="text-sm font-mono font-medium text-zinc-100">
                Confirm Deletion of SKU {deleteTarget.sku}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Are you sure you want to delete <span className="text-zinc-200 font-medium">{deleteTarget.name}</span> from the active catalog? This action removes the SKU and its stock records.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-xs font-mono transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-1.5 rounded border border-red-800 bg-red-950 hover:bg-red-900 text-red-200 text-xs font-mono font-medium uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
