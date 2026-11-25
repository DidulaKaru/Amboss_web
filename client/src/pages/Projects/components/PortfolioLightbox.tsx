import { useEffect, useRef } from 'react'
import { getAssetUrl } from '../../../utils/assets'
import type { PortfolioItem } from './PortfolioGrid'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface PortfolioLightboxProps {
  item: PortfolioItem
  onClose: () => void
}

/**
 * Accessible modal: moves focus inside on mount, traps Tab, closes on Escape,
 * locks background scroll, and removes all listeners/locks on unmount.
 * The caller is responsible for restoring focus to the opening element.
 */
export default function PortfolioLightbox({ item, onClose }: PortfolioLightboxProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Scroll lock: restores the exact previous inline values on close.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  // Initial focus, Escape and Tab trap. The listener only exists while mounted.
  useEffect(() => {
    closeRef.current?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusables = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
      if (focusables.length === 0) {
        e.preventDefault()
        panel.focus()
        return
      }
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      const outside = !panel.contains(active)
      if (e.shiftKey && (active === first || outside)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (active === last || outside)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const imageAlt = item.material
    ? `${item.title}, 3D printed in ${item.material}`
    : `${item.title}, 3D printed part`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md transition-opacity">
      {/* Click-outside-to-close. Mouse/touch only: keyboard users have Escape and the Close button. */}
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lightbox-title"
        aria-describedby={item.description ? 'lightbox-description' : undefined}
        tabIndex={-1}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row rounded-lg border border-zinc-800 bg-zinc-950 overflow-y-auto md:overflow-hidden shadow-2xl"
      >
        {/* Close Button */}
        <button
          ref={closeRef}
          type="button"
          aria-label="Close project details"
          aria-keyshortcuts="Escape"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 text-xs font-mono transition cursor-pointer"
        >
          [ESC] CLOSE
        </button>

        {/* High-Resolution Media Viewport */}
        <div className="flex-1 min-h-[300px] md:min-h-[500px] bg-black flex items-center justify-center overflow-hidden p-2">
          <img
            src={getAssetUrl(item.imageUrl)}
            alt={imageAlt}
            width={1200}
            height={900}
            onError={(e) => {
              e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
            }}
            className="max-h-[75vh] w-auto max-w-full object-contain rounded"
          />
        </div>

        {/* Technical Detail Sidebar */}
        <div className="w-full md:w-80 lg:w-96 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/60 font-mono text-xs space-y-6 md:overflow-y-auto">
          <div className="space-y-4">
            <h3 id="lightbox-title" className="text-base font-medium text-zinc-100 leading-snug md:pr-28">
              {item.title}
            </h3>

            {item.material && (
              <div className="p-3 rounded border border-zinc-800 bg-zinc-950 space-y-1">
                <span className="text-xs uppercase text-zinc-400">Material</span>
                <p className="text-zinc-200 text-xs font-medium">{item.material}</p>
              </div>
            )}

            {item.description && (
              <div className="space-y-1 font-sans text-xs text-zinc-300 leading-relaxed">
                <span className="font-mono text-xs uppercase text-zinc-400 block">Notes</span>
                <p id="lightbox-description">{item.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
