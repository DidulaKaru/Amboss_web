import { createContext } from 'react'
import type { Product, CartItem } from '../types/shop'

export interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity: number) => boolean
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, newQuantity: number) => boolean
  clearCart: () => void
  cartTotal: number
  itemCount: number
}

export const STORAGE_KEY = 'amboss_cart'

export const CartContext = createContext<CartContextType | undefined>(undefined)

export default CartContext
