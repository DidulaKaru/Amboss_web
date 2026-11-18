import { createContext } from 'react'
import type { CartContextType } from './types'

export const STORAGE_KEY = 'amboss_cart_v2'
export const CartContext = createContext<CartContextType | undefined>(undefined)
export default CartContext

export const GENERIC_ORDER_REJECTION = 'The server could not accept this order. Please review your cart.'

/** Extract a user-facing message from a server error body ({ error } or { message }). */
export function getOrderErrorMessage(body: unknown): string {
  if (body && typeof body === 'object') {
    const { error, message } = body as { error?: unknown; message?: unknown }
    if (typeof error === 'string' && error.trim()) return error
    if (typeof message === 'string' && message.trim()) return message
  }
  return GENERIC_ORDER_REJECTION
}
