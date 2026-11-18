import { describe, it, expect } from 'vitest'
import {
  MAX_QUANTITY,
  buildWhatsAppMessage,
  buildWhatsAppUrl,
  clampQuantity,
  getDeliveryLabel,
  navigatePendingWindow,
  openPendingWindow,
  pricesDiffer,
  type PopupWindow,
  type WindowLike,
} from '../src/features/quote/utils/quoteOrder'

describe('quote order helpers', () => {
  it('clamps quantity to [1, 100] and handles bad input', () => {
    expect(MAX_QUANTITY).toBe(100)
    expect(clampQuantity(0)).toBe(1)
    expect(clampQuantity(-5)).toBe(1)
    expect(clampQuantity(7.9)).toBe(7)
    expect(clampQuantity(100)).toBe(100)
    expect(clampQuantity(101)).toBe(100)
    expect(clampQuantity(Number.NaN)).toBe(1)
    expect(clampQuantity(Infinity)).toBe(1)
  })

  it('flags price differences only beyond Rs 1', () => {
    expect(pricesDiffer(500, 500)).toBe(false)
    expect(pricesDiffer(500, 501)).toBe(false)
    expect(pricesDiffer(500, 499)).toBe(false)
    expect(pricesDiffer(500, 501.5)).toBe(true)
    expect(pricesDiffer(500, 450)).toBe(true)
  })

  it('builds delivery labels', () => {
    expect(getDeliveryLabel('ruhuna_pickup', 500)).toContain('University of Ruhuna')
    expect(getDeliveryLabel('hapugala_pickup', 500)).toContain('Hapugala')
    expect(getDeliveryLabel('courier', 650)).toBe('Islandwide Courier (Rs 650 LKR)')
  })

  const base = {
    quoteId: 'abcdef12-0000-0000-0000-000000000000',
    fileName: 'part.stl',
    materialName: 'PLA+',
    deliveryLabel: 'Free Pickup',
    grandTotalLkr: 1250,
    quantity: 1,
  }

  it('builds the standard order message with quote ref and omits quantity of 1', () => {
    const msg = buildWhatsAppMessage({ ...base, variant: 'order' })
    expect(msg).toContain("I'd like to get a 3D print")
    expect(msg).toContain('Quote Ref: AMB-ABCDEF')
    expect(msg).toContain(`Estimated Price: Rs ${(1250).toLocaleString()} LKR`)
    expect(msg).not.toContain('Quantity')
    expect(msg).not.toContain('cut the model')
  })

  it('omits quote ref when the server did not return one, and includes quantity > 1', () => {
    const msg = buildWhatsAppMessage({ ...base, variant: 'order', quoteId: null, quantity: 3 })
    expect(msg).not.toContain('Quote Ref')
    expect(msg).toContain('- Quantity: 3')
  })

  it('builds the oversized message with the cut request', () => {
    const msg = buildWhatsAppMessage({ ...base, variant: 'oversized' })
    expect(msg).toContain('exceeds your print capacity')
    expect(msg).toContain('We have to cut the model in order to print it')
  })

  it('builds a wa.me URL with digits-only phone and encoded text', () => {
    const url = buildWhatsAppUrl('+94 77 123 4567', 'a b\nc')
    expect(url).toBe('https://wa.me/94771234567?text=a%20b%0Ac')
  })
})

describe('WhatsApp popup handling', () => {
  const makeWin = (popup: PopupWindow | null) => {
    const calls: Array<[string | undefined, string | undefined]> = []
    const win: WindowLike = {
      open: (url, target) => {
        calls.push([url, target])
        return popup
      },
      location: { href: 'https://amboss.test/quote' },
    }
    return { win, calls }
  }

  it('opens a blank window synchronously without noopener and severs the opener', () => {
    const popup: PopupWindow = { opener: 'parent', location: { href: 'about:blank' } }
    const { win, calls } = makeWin(popup)
    const result = openPendingWindow(win)
    expect(result).toBe(popup)
    expect(calls).toEqual([['', '_blank']])
    expect(popup.opener).toBeNull()
  })

  it('returns null when the browser blocks the popup', () => {
    const { win } = makeWin(null)
    expect(openPendingWindow(win)).toBeNull()
  })

  it('navigates the pre-opened window when available', () => {
    const popup: PopupWindow = { opener: null, location: { href: 'about:blank' } }
    const { win } = makeWin(popup)
    navigatePendingWindow(popup, 'https://wa.me/1', win)
    expect(popup.location.href).toBe('https://wa.me/1')
    expect(win.location.href).toBe('https://amboss.test/quote')
  })

  it('falls back to same-tab navigation if the popup was blocked', () => {
    const { win } = makeWin(null)
    navigatePendingWindow(null, 'https://wa.me/1', win)
    expect(win.location.href).toBe('https://wa.me/1')
  })

  it('falls back to same-tab navigation if the popup was closed/throws', () => {
    const popup = {
      opener: null,
      get location(): { href: string } {
        throw new Error('closed')
      },
    } as unknown as PopupWindow
    const { win } = makeWin(popup)
    navigatePendingWindow(popup, 'https://wa.me/1', win)
    expect(win.location.href).toBe('https://wa.me/1')
  })
})
