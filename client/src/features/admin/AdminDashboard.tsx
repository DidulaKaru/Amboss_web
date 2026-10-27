import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAdminAuth } from './useAdminAuth'
import { getAssetUrl } from '../../utils/assets'

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

export interface PortfolioItemRecord {
  id: string
  title: string
  category: string
  material?: string
  imageUrl: string
  aspectRatio?: string
  description?: string
  displayOrder?: number
  isActive?: boolean
  createdAt?: string
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

  // Active top-level view tab
  const [activeTab, setActiveTab] = useState<'products' | 'portfolio'>('products')

  // Products state
  const [products, setProducts] = useState<ProductRecord[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [savingSku, setSavingSku] = useState<string | null>(null)

  // Product modal state
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

  // Product delete state
  const [deleteTarget, setDeleteTarget] = useState<ProductRecord | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Portfolio state
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItemRecord[]>([])
  const [isPortfolioLoading, setIsPortfolioLoading] = useState<boolean>(true)
  const [portfolioSearchQuery, setPortfolioSearchQuery] = useState('')
  const [togglingPortfolioId, setTogglingPortfolioId] = useState<string | null>(null)

  // Portfolio modal state
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false)
  const [portfolioModalMode, setPortfolioModalMode] = useState<'create' | 'edit'>('create')
  const [portfolioFormData, setPortfolioFormData] = useState({
    id: '',
    title: '',
    material: '',
    imageUrl: 'images/falcon9.jpg',
    description: '',
    isActive: true,
  })
  const [portfolioFormSubmitting, setPortfolioFormSubmitting] = useState(false)
  const [portfolioFormError, setPortfolioFormError] = useState<string | null>(null)

  // Portfolio delete state
  const [deletePortfolioTarget, setDeletePortfolioTarget] = useState<PortfolioItemRecord | null>(null)
  const [isDeletingPortfolio, setIsDeletingPortfolio] = useState(false)

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type })
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr))
    }, 3500)
  }

  const getAuthHeaders = (includeContentType = true): Record<string, string> => {
    const headers: Record<string, string> = {}
    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }
    const token = localStorage.getItem('amboss_admin_token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  // Fetch Products
  const fetchCatalog = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/products`)
      if (!res.ok) throw new Error('Failed to load products')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
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

  // Fetch Portfolio
  const fetchPortfolio = useCallback(async () => {
    setIsPortfolioLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/portfolio`)
      if (!res.ok) throw new Error('Failed to load portfolio')
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setPortfolioItems(json.data)
      }
    } catch {
      showNotification('Unable to fetch live portfolio from server.', 'error')
    } finally {
      setIsPortfolioLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCatalog()
    fetchPortfolio()
  }, [fetchCatalog, fetchPortfolio])

  // Product Stock update helper
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

  // Open modal for Create Product
  const handleOpenCreate = () => {
    setModalMode('create')
    setFormData({
      sku: '',
      name: '',
      category: 'Microcontrollers',
      description: '',
      priceLkr: 0,
      stockQuantity: 0,
      imageUrl: 'images/amboss-logo.png',
      isActive: true,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Open modal for Edit Product
  const handleOpenEdit = (p: ProductRecord) => {
    setModalMode('edit')
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      description: p.description || '',
      priceLkr: Number(p.priceLkr) || 0,
      stockQuantity: p.stockQuantity || 0,
      imageUrl: p.imageUrl || 'images/amboss-logo.png',
      isActive: p.isActive !== false,
    })
    setFormError(null)
    setIsModalOpen(true)
  }

  // Submit Product modal
  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSubmitting(true)
    setFormError(null)

    try {
      const isEdit = modalMode === 'edit'
      const endpoint = isEdit ? `${API_BASE}/api/v1/products/${formData.sku}` : `${API_BASE}/api/v1/products`
      const method = isEdit ? 'PUT' : 'POST'

      const payload = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category: formData.category,
        description: formData.description.trim(),
        priceLkr: Number(formData.priceLkr),
        stockQuantity: Number(formData.stockQuantity),
        imageUrl: formData.imageUrl.trim() || 'images/amboss-logo.png',
        isActive: formData.isActive,
      }

      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.details?.[0]?.message || 'Operation failed')
      }

      if (isEdit) {
        setProducts((prev) =>
          prev.map((p) => (p.sku === formData.sku ? { ...p, ...payload } : p))
        )
        showNotification(`SKU ${formData.sku} updated successfully`)
      } else {
        setProducts((prev) => [...prev, { ...payload, sku: formData.sku }])
        showNotification(`SKU ${formData.sku} added to catalog`)
      }

      setIsModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving the item.'
      setFormError(message)
    } finally {
      setFormSubmitting(false)
    }
  }

  // Delete Product handler
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/products/${deleteTarget.sku}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(false),
      })

      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.sku !== deleteTarget.sku))
        showNotification(`SKU ${deleteTarget.sku} deleted from catalog`)
        setDeleteTarget(null)
      } else {
        const errJson = await res.json().catch(() => null)
        showNotification(errJson?.error || 'Failed to delete product', 'error')
      }
    } catch {
      showNotification('Network error while deleting product', 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  // Portfolio Toggle Active
  const handleTogglePortfolioActive = async (id: string, currentStatus: boolean) => {
    setTogglingPortfolioId(id)
    try {
      const res = await fetch(`${API_BASE}/api/v1/portfolio/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !currentStatus }),
      })
      if (res.ok) {
        setPortfolioItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, isActive: !currentStatus } : item))
        )
        showNotification(`Portfolio item status updated to ${!currentStatus ? 'Active' : 'Inactive'}`)
      } else {
        const err = await res.json().catch(() => null)
        showNotification(err?.error || 'Failed to update portfolio status', 'error')
      }
    } catch {
      showNotification('Network error while updating portfolio item', 'error')
    } finally {
      setTogglingPortfolioId(null)
    }
  }

  // Open modal for Create Portfolio
  const handleOpenPortfolioCreate = () => {
    setPortfolioModalMode('create')
    setPortfolioFormData({
      id: '',
      title: '',
      material: '',
      imageUrl: 'images/falcon9.jpg',
      description: '',
      isActive: true,
    })
    setPortfolioFormError(null)
    setIsPortfolioModalOpen(true)
  }

  // Open modal for Edit Portfolio
  const handleOpenPortfolioEdit = (item: PortfolioItemRecord) => {
    setPortfolioModalMode('edit')
    setPortfolioFormData({
      id: item.id,
      title: item.title,
      material: item.material || '',
      imageUrl: item.imageUrl || 'images/amboss-logo.png',
      description: item.description || '',
      isActive: item.isActive !== false,
    })
    setPortfolioFormError(null)
    setIsPortfolioModalOpen(true)
  }

  // Submit Portfolio modal
  const handlePortfolioModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPortfolioFormSubmitting(true)
    setPortfolioFormError(null)
    try {
      const isEdit = portfolioModalMode === 'edit'
      const endpoint = isEdit
        ? `${API_BASE}/api/v1/portfolio/${portfolioFormData.id}`
        : `${API_BASE}/api/v1/portfolio`
      const method = isEdit ? 'PUT' : 'POST'

      const payload = {
        title: portfolioFormData.title.trim(),
        material: portfolioFormData.material.trim(),
        imageUrl: portfolioFormData.imageUrl.trim() || 'images/amboss-logo.png',
        description: portfolioFormData.description.trim(),
        isActive: portfolioFormData.isActive,
      }

      const res = await fetch(endpoint, {
        method,
        credentials: 'include',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data?.error || data?.details?.[0]?.message || 'Operation failed')
      }

      if (isEdit) {
        setPortfolioItems((prev) =>
          prev.map((item) => (item.id === portfolioFormData.id ? { ...item, ...data.data } : item))
        )
        showNotification(`Portfolio item updated`)
      } else {
        setPortfolioItems((prev) => [...prev, data.data])
        showNotification(`New portfolio item created`)
      }
      setIsPortfolioModalOpen(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred while saving portfolio item.'
      setPortfolioFormError(message)
    } finally {
      setPortfolioFormSubmitting(false)
    }
  }

  // Delete Portfolio handler
  const handleDeletePortfolioConfirm = async () => {
    if (!deletePortfolioTarget) return
    setIsDeletingPortfolio(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/portfolio/${deletePortfolioTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(false),
      })
      if (res.ok) {
        setPortfolioItems((prev) => prev.filter((p) => p.id !== deletePortfolioTarget.id))
        showNotification(`Portfolio item "${deletePortfolioTarget.title}" deleted`)
        setDeletePortfolioTarget(null)
      } else {
        const err = await res.json().catch(() => null)
        showNotification(err?.error || 'Failed to delete portfolio item', 'error')
      }
    } catch {
      showNotification('Network error while deleting portfolio item', 'error')
    } finally {
      setIsDeletingPortfolio(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase()
      const q = searchQuery.toLowerCase().trim()
      const matchesSearch =
        !q ||
        p.sku.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
      return matchesCategory && matchesSearch
    })
  }, [products, selectedCategory, searchQuery])

  // Filtered Portfolio
  const filteredPortfolioItems = useMemo(() => {
    const q = portfolioSearchQuery.toLowerCase().trim()
    return portfolioItems.filter((item) => {
      if (!q) return true
      return (
        item.title.toLowerCase().includes(q) ||
        (item.material && item.material.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      )
    })
  }, [portfolioItems, portfolioSearchQuery])

  // Product Metrics
  const productMetrics = useMemo(() => {
    const total = products.length
    const inStock = products.filter((p) => (p.stockQuantity ?? 0) > 0).length
    const lowStock = products.filter(
      (p) => (p.stockQuantity ?? 0) > 0 && (p.stockQuantity ?? 0) < 10
    ).length
    const outOfStock = products.filter((p) => (p.stockQuantity ?? 0) <= 0).length
    return { total, inStock, lowStock, outOfStock }
  }, [products])

  // Portfolio Metrics
  const portfolioMetrics = useMemo(() => {
    const total = portfolioItems.length
    const active = portfolioItems.filter((p) => p.isActive !== false).length
    const withMaterial = portfolioItems.filter((p) => !!p.material).length
    const inactive = total - active
    return { total, active, withMaterial, inactive }
  }, [portfolioItems])

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
            {activeTab === 'products' ? (
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
            ) : (
              <button
                type="button"
                onClick={handleOpenPortfolioCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-700 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-mono font-medium transition cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>NEW PORTFOLIO ITEM</span>
              </button>
            )}

            <Link
              to={activeTab === 'products' ? '/shop' : '/projects'}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>{activeTab === 'products' ? 'VIEW SHOP' : 'VIEW PROJECTS'}</span>
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Tab Switcher: Products & Stock vs Portfolio Gallery */}
        <section className="flex items-center gap-2 border-b border-zinc-800">
          <button
            type="button"
            id="tab-products"
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
              activeTab === 'products'
                ? 'border-zinc-100 text-zinc-100 font-medium bg-zinc-900/60'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            [ Products & Stock ]
          </button>
          <button
            type="button"
            id="tab-portfolio"
            onClick={() => setActiveTab('portfolio')}
            className={`px-4 py-2.5 font-mono text-xs uppercase tracking-wider transition border-b-2 cursor-pointer ${
              activeTab === 'portfolio'
                ? 'border-zinc-100 text-zinc-100 font-medium bg-zinc-900/60'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            [ Portfolio Gallery ]
          </button>
        </section>

        {activeTab === 'products' ? (
          <>
            {/* Metric Cards for Products */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total SKUs</div>
                <div className="mt-1 font-mono text-xl font-medium text-zinc-100">{productMetrics.total}</div>
              </div>
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">In Stock</div>
                <div className="mt-1 font-mono text-xl font-medium text-emerald-400">{productMetrics.inStock}</div>
              </div>
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Low Stock (&lt;10)</div>
                <div className="mt-1 font-mono text-xl font-medium text-amber-400">{productMetrics.lowStock}</div>
              </div>
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Out of Stock</div>
                <div className="mt-1 font-mono text-xl font-medium text-red-400">{productMetrics.outOfStock}</div>
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
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          RETRIEVING INVENTORY REGISTRY...
                        </td>
                      </tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-zinc-500">
                          NO SKUs MATCH CURRENT FILTER CRITERIA
                        </td>
                      </tr>
                    ) : (
                      filteredProducts.map((p) => {
                        const isSaving = savingSku === p.sku
                        const currentStock = p.stockQuantity ?? 0
                        return (
                          <tr key={p.sku} className="hover:bg-zinc-900/50 transition">
                            <td className="py-3 px-4 font-medium text-zinc-200 whitespace-nowrap">
                              {p.sku}
                            </td>
                            <td className="py-3 px-4 font-sans text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getAssetUrl(p.imageUrl || 'images/amboss-logo.png')}
                                  alt={p.name}
                                  width={32}
                                  height={32}
                                  onError={(e) => {
                                    e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                                  }}
                                  className="w-8 h-8 rounded border border-zinc-800 bg-zinc-950 object-cover flex-shrink-0"
                                />
                                <div>
                                  <div className="font-medium text-zinc-100">{p.name}</div>
                                  {p.description && (
                                    <div className="text-[11px] text-zinc-500 line-clamp-1">{p.description}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-[10px] text-zinc-400 uppercase">
                                {p.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap text-zinc-200">
                              {Number(p.priceLkr || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <div className="inline-flex items-center border border-zinc-800 rounded bg-zinc-950 px-1 py-0.5">
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
          </>
        ) : (
          <>
            {/* Metric Cards for Portfolio */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Total Projects</div>
                <div className="mt-1 font-mono text-xl font-medium text-zinc-100">{portfolioMetrics.total}</div>
              </div>
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Active in Gallery</div>
                <div className="mt-1 font-mono text-xl font-medium text-emerald-400">{portfolioMetrics.active}</div>
              </div>
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">With Material Specs</div>
                <div className="mt-1 font-mono text-xl font-medium text-cyan-400">{portfolioMetrics.withMaterial}</div>
              </div>
              <div className="p-3.5 rounded border border-zinc-800 bg-zinc-900/40">
                <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">Hidden / Inactive</div>
                <div className="mt-1 font-mono text-xl font-medium text-zinc-400">{portfolioMetrics.inactive}</div>
              </div>
            </section>

            {/* Search Toolbar for Portfolio */}
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
                  value={portfolioSearchQuery}
                  onChange={(e) => setPortfolioSearchQuery(e.target.value)}
                  placeholder="Search portfolio by title, material, description..."
                  className="w-full pl-9 pr-3 py-2 rounded border border-zinc-800 bg-zinc-900 text-zinc-100 text-xs font-mono placeholder-zinc-500 focus:outline-none focus:border-cyan-500 transition"
                />
              </div>
            </section>

            {/* Portfolio High-Density Table */}
            <section className="rounded-lg border border-zinc-800 bg-zinc-900/30 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 bg-zinc-900/70 text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                      <th className="py-3 px-4">Artifact / Visual</th>
                      <th className="py-3 px-4">Material Specification</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                    {isPortfolioLoading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500">
                          RETRIEVING PORTFOLIO REGISTRY...
                        </td>
                      </tr>
                    ) : filteredPortfolioItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-zinc-500">
                          NO PORTFOLIO ITEMS MATCH FILTER
                        </td>
                      </tr>
                    ) : (
                      filteredPortfolioItems.map((item) => {
                        const isToggling = togglingPortfolioId === item.id
                        const isActive = item.isActive !== false
                        return (
                          <tr key={item.id} className="hover:bg-zinc-900/50 transition">
                            <td className="py-3 px-4 font-sans text-xs">
                              <div className="flex items-center gap-3">
                                <img
                                  src={getAssetUrl(item.imageUrl)}
                                  alt={item.title}
                                  width={48}
                                  height={48}
                                  onError={(e) => {
                                    e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                                  }}
                                  className="w-12 h-12 rounded border border-zinc-800 bg-zinc-950 object-cover flex-shrink-0"
                                />
                                <div>
                                  <div className="font-medium text-zinc-100">{item.title}</div>
                                  {item.description && (
                                    <div className="text-[11px] text-zinc-500 line-clamp-1 max-w-sm">
                                      {item.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-4 whitespace-nowrap text-zinc-300 font-mono text-[11px]">
                              {item.material || 'Standard Filament'}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              <button
                                type="button"
                                disabled={isToggling}
                                onClick={() => handleTogglePortfolioActive(item.id, isActive)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-mono border transition cursor-pointer disabled:opacity-40 ${
                                  isActive
                                    ? 'border-emerald-800/80 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
                                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isActive ? 'bg-emerald-500' : 'bg-zinc-600'
                                  }`}
                                />
                                {isActive ? 'ACTIVE' : 'INACTIVE'}
                              </button>
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPortfolioEdit(item)}
                                  className="px-2 py-1 rounded border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-[11px] text-zinc-300 hover:text-white transition cursor-pointer"
                                >
                                  EDIT
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletePortfolioTarget(item)}
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
          </>
        )}
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

      {/* Modal: Create or Edit Portfolio Item */}
      {isPortfolioModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-sm font-mono font-medium uppercase text-zinc-100 tracking-wider">
                {portfolioModalMode === 'create'
                  ? 'PORTFOLIO // ADD SHOWCASE ITEM'
                  : `PORTFOLIO // EDIT ${portfolioFormData.title}`}
              </h2>
              <button
                type="button"
                onClick={() => setIsPortfolioModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {portfolioFormError && (
              <div
                role="alert"
                className="p-3 rounded border border-red-900/50 bg-red-950/40 text-red-300 text-xs font-mono"
              >
                {portfolioFormError}
              </div>
            )}

            <form onSubmit={handlePortfolioModalSubmit} className="space-y-3 font-mono text-xs">
              <div className="space-y-1">
                <label htmlFor="portfolio-title" className="text-[10px] uppercase text-zinc-400">Project Title</label>
                <input
                  id="portfolio-title"
                  type="text"
                  required
                  value={portfolioFormData.title}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, title: e.target.value })}
                  placeholder="e.g. Nightingale Vein Monitor"
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="portfolio-material" className="text-[10px] uppercase text-zinc-400">Material Specification</label>
                <input
                  id="portfolio-material"
                  type="text"
                  value={portfolioFormData.material}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, material: e.target.value })}
                  placeholder="e.g. PA12-CF, High Clear Resin"
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="portfolio-image" className="text-[10px] uppercase text-zinc-400">Image Asset URL / Path</label>
                <input
                  id="portfolio-image"
                  type="text"
                  required
                  value={portfolioFormData.imageUrl}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, imageUrl: e.target.value })}
                  placeholder="images/falcon9.jpg"
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="portfolio-description" className="text-[10px] uppercase text-zinc-400">Description</label>
                <textarea
                  id="portfolio-description"
                  rows={3}
                  value={portfolioFormData.description}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
                  placeholder="Key engineering challenges, tolerancing, functional applications..."
                  className="w-full px-2.5 py-1.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-100 focus:outline-none focus:border-cyan-500 resize-none font-sans"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  id="portfolio-is-active"
                  type="checkbox"
                  checked={portfolioFormData.isActive}
                  onChange={(e) => setPortfolioFormData({ ...portfolioFormData, isActive: e.target.checked })}
                  className="rounded border-zinc-800 bg-zinc-950 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="portfolio-is-active" className="text-[11px] text-zinc-300">
                  Visible in public showcase gallery
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPortfolioModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-xs transition cursor-pointer"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={portfolioFormSubmitting}
                  className="px-4 py-1.5 rounded border border-zinc-700 bg-zinc-100 hover:bg-white text-zinc-900 text-xs font-medium uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
                >
                  {portfolioFormSubmitting ? 'PROCESSING...' : portfolioModalMode === 'create' ? 'SAVE ITEM' : 'UPDATE ITEM'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Product Confirmation */}
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

      {/* Modal: Delete Portfolio Confirmation */}
      {deletePortfolioTarget && (
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
                Confirm Deletion of "{deletePortfolioTarget.title}"
              </h2>
            </div>
            <p className="text-xs text-zinc-400 font-sans">
              Are you sure you want to delete this project from the showcase gallery? This action removes the portfolio entry.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isDeletingPortfolio}
                onClick={() => setDeletePortfolioTarget(null)}
                className="px-3 py-1.5 rounded border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 text-xs font-mono transition cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                disabled={isDeletingPortfolio}
                onClick={handleDeletePortfolioConfirm}
                className="px-4 py-1.5 rounded border border-red-800 bg-red-950 hover:bg-red-900 text-red-200 text-xs font-mono font-medium uppercase tracking-wider transition cursor-pointer disabled:opacity-50"
              >
                {isDeletingPortfolio ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
