/**
 * Pure helpers for the quote -> WhatsApp order flow (kept free of React so they
 * can be unit-tested without a DOM).
 */

/** Matches the server-side cap on POST /api/v1/quote/calculate. */
export const MAX_QUANTITY = 100

/** Server and client prices within this many rupees are considered identical. */
export const PRICE_MISMATCH_TOLERANCE_LKR = 1

export type DeliveryOption = 'ruhuna_pickup' | 'hapugala_pickup' | 'courier'
export type WhatsAppVariant = 'order' | 'oversized'

/** Clamps to an integer in [1, MAX_QUANTITY]; non-finite input becomes 1. */
export function clampQuantity(value: number): number {
  if (!Number.isFinite(value)) return 1
  return Math.min(MAX_QUANTITY, Math.max(1, Math.floor(value)))
}

/** True when the server figure differs from the displayed estimate by more than Rs 1. */
export function pricesDiffer(clientTotal: number, serverTotal: number): boolean {
  return Math.abs(clientTotal - serverTotal) > PRICE_MISMATCH_TOLERANCE_LKR
}

export function getDeliveryLabel(option: DeliveryOption, courierFeeLkr: number): string {
  if (option === 'ruhuna_pickup') return 'Free Pickup: Faculty of Engineering, University of Ruhuna'
  if (option === 'hapugala_pickup') return 'Free Pickup: Amboss Shop (Hapugala)'
  return `Islandwide Courier (Rs ${courierFeeLkr.toLocaleString()} LKR)`
}

export interface WhatsAppMessageInput {
  variant: WhatsAppVariant
  quoteId: string | null
  fileName: string
  materialName: string
  deliveryLabel: string
  grandTotalLkr: number
  quantity: number
}

export function buildWhatsAppMessage(input: WhatsAppMessageInput): string {
  const { variant, quoteId, fileName, materialName, deliveryLabel, grandTotalLkr, quantity } = input
  const intro =
    variant === 'oversized'
      ? `Hi Amboss, my model exceeds your print capacity:`
      : `Hi Amboss, I'd like to get a 3D print:`

  const lines = [
    intro,
    ...(quoteId ? [`- Quote Ref: AMB-${quoteId.slice(0, 6).toUpperCase()}`] : []),
    `- File: ${fileName}`,
    `- Material: ${materialName}`,
    `- Delivery: ${deliveryLabel}`,
    `- Estimated Price: Rs ${grandTotalLkr.toLocaleString()} LKR`,
    ...(quantity > 1 ? [`- Quantity: ${quantity}`] : []),
    ...(variant === 'oversized'
      ? [``, `We have to cut the model in order to print it. Can you help?`]
      : []),
  ]
  return lines.join('\n')
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(message)}`
}

/** Minimal window surface we need; lets tests pass a fake. */
export interface PopupWindow {
  opener: unknown
  location: { href: string }
}
export interface WindowLike {
  open: (url?: string, target?: string) => PopupWindow | null
  location: { href: string }
}

/**
 * Must be called synchronously inside a user-gesture handler (before any `await`),
 * otherwise Safari and mobile browsers block the popup. We deliberately do not pass
 * `noopener` in the features string (that makes `open` return null); instead the
 * opener link is severed manually.
 */
export function openPendingWindow(win: WindowLike = window as unknown as WindowLike): PopupWindow | null {
  const popup = win.open('', '_blank')
  if (popup) {
    try {
      popup.opener = null
    } catch {
      // Some browsers make opener read-only; the blank window is still usable.
    }
  }
  return popup
}

/** Points the pre-opened window at `url`, or falls back to same-tab navigation if it was blocked/closed. */
export function navigatePendingWindow(
  popup: PopupWindow | null,
  url: string,
  win: WindowLike = window as unknown as WindowLike
): void {
  if (popup) {
    try {
      popup.location.href = url
      return
    } catch {
      // Fall through to same-tab navigation.
    }
  }
  win.location.href = url
}
