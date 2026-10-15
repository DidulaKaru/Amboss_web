export type ProductCategory =
  | 'all'
  | 'microcontrollers'
  | 'sensors'
  | 'actuators'
  | 'prototyping'
  | 'accessories'

export type DeliveryMethod = 'ruhuna_pickup' | 'hapugala_pickup' | 'galle_local' | 'courier'

export interface Product {
  id: string
  sku?: string
  name: string
  category?: string
  description: string
  price: number
  stock: number
  image_url: string
  isActive?: boolean
}

export interface ProductVariant {
  id: string
  sku?: string
  name: string
  label: string
  price: number
  stock: number
  description?: string
  image_url?: string
}

export interface DisplayProduct extends Product {
  variantLabel?: string
  variants?: ProductVariant[]
}

export interface CartItem extends Product {
  quantity: number
}

export interface InventoryValidationItem {
  sku: string | null
  name: string
  requestedQuantity: number
  availableStock: number
  priceLkr?: number
  inStock: boolean
  error?: string | null
}

export interface InventoryValidationResponse {
  success: boolean
  valid: boolean
  errors: string[]
  items: InventoryValidationItem[]
}

export interface WhatsAppOrderResponse {
  success: boolean
  messageText: string
  whatsappUrl: string
}

export interface CartContextType {
  cartItems: CartItem[]
  addToCart: (product: Product, quantity: number) => boolean
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, newQuantity: number) => boolean
  clearCart: () => void
  deliveryMethod: DeliveryMethod
  setDeliveryMethod: (method: DeliveryMethod) => void
  deliveryAddress: string
  setDeliveryAddress: (address: string) => void
  customerName: string
  setCustomerName: (name: string) => void
  subtotal: number
  deliveryFee: number
  cartTotal: number
  itemCount: number
  isCheckingOut: boolean
  validationErrors: string[]
  clearValidationErrors: () => void
  validateLiveCart: () => Promise<{ valid: boolean; errors: string[] }>
  proceedToWhatsAppOrder: () => Promise<boolean>
}

