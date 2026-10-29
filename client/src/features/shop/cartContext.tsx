import React, { useState, useEffect, useMemo, useCallback } from 'react'
import type { CartItem, Product, DeliveryMethod, InventoryValidationResponse, WhatsAppOrderResponse } from './types'
import { CartContext, STORAGE_KEY } from './cartInternal'
import { calculateShopDeliveryFee } from '../../config/logistics'
import { SITE } from '../../config/site'

const API_BASE = import.meta.env.VITE_API_URL || ''

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('ruhuna_pickup')
  const [deliveryAddress, setDeliveryAddress] = useState<string>('')
  const [customerName, setCustomerName] = useState<string>('')
  const [isCheckingOut, setIsCheckingOut] = useState<boolean>(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setCartItems(JSON.parse(stored))
      }
    } catch (e) {
      console.error('Failed to load cart from localStorage:', e)
    }
  }, [])

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
    } catch (e) {
      console.error('Failed to persist cart:', e)
    }
  }, [cartItems])

  const addToCart = useCallback((product: Product, quantity: number): boolean => {
    if (quantity <= 0) return false

    if (product.stock <= 0) {
      alert(`"${product.name}" is currently out of stock.`)
      return false
    }

    const existing = cartItems.find((item) => item.id === product.id)
    const currentQty = existing ? existing.quantity : 0
    if (currentQty + quantity > product.stock) {
      alert(`Cannot add item. Maximum available stock reached for "${product.name}".`)
      return false
    }

    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id)
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [
        ...prev,
        {
          ...product,
          quantity,
        },
      ]
    })

    return true
  }, [cartItems])

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
    setValidationErrors([])
  }, [])

  const updateQuantity = useCallback((id: string, newQuantity: number): boolean => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return true
    }

    const item = cartItems.find((i) => i.id === id)
    if (!item) return false

    if (newQuantity > item.stock) {
      alert('Cannot update quantity. Maximum available stock reached.')
      return false
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i))
    )
    return true
  }, [cartItems, removeFromCart])

  const clearCart = useCallback(() => {
    setCartItems([])
    setValidationErrors([])
  }, [])

  const clearValidationErrors = useCallback(() => {
    setValidationErrors([])
  }, [])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }, [cartItems])

  const deliveryFee = useMemo(() => {
    if (cartItems.length === 0) return 0
    return calculateShopDeliveryFee(deliveryMethod, subtotal)
  }, [deliveryMethod, subtotal, cartItems.length])

  const cartTotal = useMemo(() => {
    return subtotal + deliveryFee
  }, [subtotal, deliveryFee])

  const itemCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0)
  }, [cartItems])

  // Live Inventory Validation against Fastify backend
  const validateLiveCart = useCallback(async (): Promise<{ valid: boolean; errors: string[] }> => {
    if (cartItems.length === 0) {
      return { valid: true, errors: [] }
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/validate-cart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            id: item.id,
            sku: item.sku || item.id,
            name: item.name,
            quantity: item.quantity,
          })),
        }),
      })

      if (!res.ok) {
        throw new Error(`Inventory validation server returned ${res.status}`)
      }

      const data: InventoryValidationResponse = await res.json()
      if (data.success) {
        setValidationErrors(data.errors)
        return { valid: data.valid, errors: data.errors }
      }
      return { valid: false, errors: ['Failed to validate inventory'] }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      console.warn('Backend validation unreachable, using client cached stock:', msg)
      // Check client side cached stock
      const errors: string[] = []
      for (const item of cartItems) {
        if (item.stock <= 0) {
          errors.push(`"${item.name}" is out of stock.`)
        } else if (item.quantity > item.stock) {
          errors.push(`"${item.name}" only has ${item.stock} in stock.`)
        }
      }
      setValidationErrors(errors)
      return { valid: errors.length === 0, errors }
    }
  }, [cartItems])

  // Proceed to WhatsApp Order
  const proceedToWhatsAppOrder = useCallback(async (): Promise<boolean> => {
    if (cartItems.length === 0) return false

    setIsCheckingOut(true)

    // Step 1: Live inventory validation
    const validation = await validateLiveCart()
    if (!validation.valid) {
      setIsCheckingOut(false)
      alert(`Please resolve the inventory alerts before ordering:\n\n• ${validation.errors.join('\n• ')}`)
      return false
    }

    // Step 2: Request WhatsApp payload from Fastify backend
    try {
      const res = await fetch(`${API_BASE}/api/v1/orders/whatsapp-payload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'shop',
          deliveryMethod,
          deliveryAddress: deliveryAddress.trim() || undefined,
          customerName: customerName.trim() || undefined,
          items: cartItems.map((item) => ({
            sku: item.sku || item.id,
            name: item.name,
            quantity: item.quantity,
            priceLkr: item.price,
          })),
        }),
      })

      if (res.ok) {
        const data: WhatsAppOrderResponse = await res.json()
        if (data.success && data.whatsappUrl) {
          window.location.href = data.whatsappUrl
          setIsCheckingOut(false)
          return true
        }
      }
    } catch (e) {
      console.warn('Failed to get formatted WhatsApp payload from backend, falling back:', e)
    }

    // Fallback direct WhatsApp link
    const itemsList = cartItems
      .map((item) => `- ${item.name} x ${item.quantity} (Rs ${(item.price * item.quantity).toLocaleString()} LKR)`)
      .join('\n')

    const deliveryText =
      deliveryMethod === 'ruhuna_pickup'
        ? 'University of Ruhuna Pickup (FREE)'
        : deliveryMethod === 'hapugala_pickup'
          ? 'Amboss Shop Hapugala Pickup (FREE)'
          : deliveryMethod === 'galle_local'
            ? 'Local Delivery: Galle Area'
            : `Islandwide Courier (Rs ${deliveryFee.toLocaleString()} LKR)`

    const message = [
      'Hi Amboss, I would like to place an order:',
      ...(customerName ? [`Customer: ${customerName}`] : []),
      itemsList,
      '',
      `Delivery Method: ${deliveryText}`,
      ...(deliveryAddress ? [`Address / Notes: ${deliveryAddress}`] : []),
      `Total: Rs ${cartTotal.toLocaleString()} LKR`,
    ].join('\n')

    const encoded = encodeURIComponent(message)
    const whatsappNumber = SITE.phone.replace(/[^\d]/g, '')
    window.location.href = `https://wa.me/${whatsappNumber}?text=${encoded}`
    setIsCheckingOut(false)
    return true
  }, [
    cartItems,
    validateLiveCart,
    deliveryMethod,
    deliveryAddress,
    customerName,
    deliveryFee,
    cartTotal,
  ])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        deliveryMethod,
        setDeliveryMethod,
        deliveryAddress,
        setDeliveryAddress,
        customerName,
        setCustomerName,
        subtotal,
        deliveryFee,
        cartTotal,
        itemCount,
        isCheckingOut,
        validationErrors,
        clearValidationErrors,
        validateLiveCart,
        proceedToWhatsAppOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export default CartProvider
