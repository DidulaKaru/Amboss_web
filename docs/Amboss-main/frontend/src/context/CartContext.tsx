import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Product, CartItem } from '../types/shop'

interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity: number) => boolean
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, newQuantity: number) => boolean
  clearCart: () => void
  cartTotal: number
  itemCount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

const STORAGE_KEY = 'amboss_cart'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        setCartItems(JSON.parse(stored))
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error)
      }
    }
  }, [])

  // Sync to localStorage whenever cartItems changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartItems))
  }, [cartItems])

  const addToCart = (product: Product, quantity: number): boolean => {
    if (quantity <= 0) {
      return false
    }

    const existingItem = cartItems.find((item) => item.id === product.id)

    if (existingItem) {
      const newTotal = existingItem.quantity + quantity
      if (newTotal > product.stock) {
        alert(
          `Cannot add item. Stock limit exceeded. Available: ${product.stock}, Already in cart: ${existingItem.quantity}`,
        )
        return false
      }
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === product.id ? { ...item, quantity: newTotal } : item,
        ),
      )
    } else {
      if (quantity > product.stock) {
        alert(`Cannot add item. Only ${product.stock} in stock.`)
        return false
      }
      setCartItems((prev) => [
        ...prev,
        {
          ...product,
          quantity,
        },
      ])
    }

    return true
  }

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id))
  }

  const updateQuantity = (id: string, newQuantity: number): boolean => {
    if (newQuantity <= 0) {
      removeFromCart(id)
      return true
    }

    const item = cartItems.find((i) => i.id === id)
    if (!item) return false

    if (newQuantity > item.stock) {
      alert(`Cannot update. Only ${item.stock} in stock.`)
      return false
    }

    setCartItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i)),
    )
    return true
  }

  const clearCart = () => {
    setCartItems([])
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
