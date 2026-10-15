import React from 'react'
import { CartProvider as ShopCartProvider } from '../features/shop/cartContext'

export function CartProvider({ children }: { children: React.ReactNode }) {
  return <ShopCartProvider>{children}</ShopCartProvider>
}

export default CartProvider
