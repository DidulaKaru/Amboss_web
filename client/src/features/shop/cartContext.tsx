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

    let success = true
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        const newTotal = existing.quantity + quantity
        if (newTotal > product.stock) {
          alert(`Cannot add item. Maximum available stock reached for "${product.name}".`)
          success = false
          return prev
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newTotal } : item
        )
      } else {
        if (quantity > product.stock) {
          alert(`Cannot add item. Maximum available stock reached for "${product.name}".`)
          success = false
          return prev
        }
        return [
          ...prev,
          {
            ...product,
            quantity,
          },
        ]
      }
    })

    return success
  }, [])

  const removeFromCart = useCallback((id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
    setValidationErrors([])
  }, [])

  const updateQuantity = useCallback((id: string, newQuantity: number): boolean => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return true
    }

    let success = true
    setCartItems((prev) => {
      const item = prev.find((i) => i.id === id)
      if (!item) return prev

      if (newQuantity > item.stock) {
        alert('Cannot update quantity. Maximum available stock reached.')
        success = false
        return prev
      }

      return prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i))
    })

    return success
  }, [removeFromCart])

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

    const fulfillmentText =
      deliveryMethod === 'ruhuna_pickup'
        ? 'Free Pickup: Faculty of Engineering, University of Ruhuna'
        : deliveryMethod === 'hapugala_pickup'
        ? 'Free Pickup: Amboss Shop (Hapugala)'
        : deliveryMethod === 'galle_local'
        ? 'Local Delivery: Galle Municipal Area'
        : 'Islandwide Courier (PromptX / Domex)'

    const message = [
      'AMBOSS Store Order Request',
      '--------------------------------',
      ...(customerName ? [`Customer: ${customerName}`] : []),
      itemsList,
      '--------------------------------',
      `Subtotal: Rs ${subtotal.toLocaleString()} LKR`,
      `Fulfillment: ${fulfillmentText}`,
      `Delivery Fee: ${deliveryFee > 0 ? `Rs ${deliveryFee.toLocaleString()} LKR` : 'FREE'}`,
      ...(deliveryAddress ? [`Address / Notes: ${deliveryAddress}`] : []),
      `Total: Rs ${cartTotal.toLocaleString()} LKR`,
      '',
      'Please confirm availability and banking/payment instructions.',
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
    subtotal,
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
