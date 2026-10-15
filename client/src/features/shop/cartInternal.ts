import { createContext } from 'react'
import type { CartContextType } from './types'

export const STORAGE_KEY = 'amboss_cart_v2'
export const CartContext = createContext<CartContextType | undefined>(undefined)
export default CartContext
