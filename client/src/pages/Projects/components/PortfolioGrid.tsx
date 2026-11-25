import { useState, useEffect, useRef, useCallback } from 'react'
import { getAssetUrl } from '../../../utils/assets'
import PortfolioLightbox from './PortfolioLightbox'

export interface PortfolioItem {
  id: string
  title: string
  category?: string
  material?: string
  imageUrl: string
  aspectRatio?: string
  description?: string
  displayOrder?: number
  isActive?: boolean
}

const STATIC_FALLBACK_ITEMS: PortfolioItem[] = [
  {
    id: 'a1111111-1111-4111-8111-111111111111',
    title: 'Nightingale Near IR Vein Illuminator',
    material: 'SLA Tough Photopolymer',
    imageUrl: 'images/vein finder.jpg',
    description: 'Near-infrared vein mapping and vital tracking device housed in custom 3D-printed enclosure.',
    isActive: true,
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    title: 'Falcon 9 Pen',
    material: 'PLA+',
    imageUrl: 'images/falcon9.jpg',
    description: 'Designed and manufactured for SEDS Ruhuna chapter. Aerospace-inspired pen',
    isActive: true,
  },
  {
    id: 'c3333333-3333-4333-8333-333333333333',
    title: 'Rextro Souvenirs',
    material: 'PLA+',
    imageUrl: 'images/souvenir_crop.jpg',
    description: 'Limited-run custom souvenirs manufactured for the Silver Jubilee of the Faculty of Engineering, University of Ruhuna.',
    isActive: true,
  },
  {
    id: 'd4444444-4444-4444-8444-444444444444',
    title: 'Body-Powered Mechanical Arm',
    material: 'PETG',
    imageUrl: 'images/pure mechanical arm.jpg',
    description: 'Cost-effective body-powered upper limb prosthesis tailored to individual anatomy using high-strength FDM filaments.',
    isActive: true,
  },
  {
    id: 'e5555555-5555-4555-8555-555555555555',
    title: 'Set Gestured Arm',
    material: 'PETG',
    imageUrl: 'images/set-gestured-arm.jpg',
    description: 'Servo-actuated prosthetic mechanism allowing wearers to map repeatable grip patterns to tactile input triggers.',
    isActive: true,
  },
  {
    id: 'f6666666-6666-4666-8666-666666666666',
    title: 'Myoelectric Prosthetic Arm',
    material: 'PETG',
    imageUrl: 'images/Myoelectric arm.jpg',
    description: 'EMG-driven robotic prosthesis converting residual muscle signals into articulated finger actuation.',
    isActive: true,
  },
]

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PortfolioGrid() {
  const [items, setItems] = useState<PortfolioItem[]>(STATIC_FALLBACK_ITEMS)
  const [activeModalItem, setActiveModalItem] = useState<PortfolioItem | null>(null)
  const openerRef = useRef<HTMLElement | null>(null)

  const closeModal = useCallback(() => {
    setActiveModalItem(null)
    // Return focus to the card that opened the lightbox
    const opener = openerRef.current
    openerRef.current = null
    if (opener && opener.isConnected) {
      requestAnimationFrame(() => opener.focus())
    }
  }, [])

  // Fetch from server with static fallback
  useEffect(() => {
    let isMounted = true
    const fetchPortfolio = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/portfolio`)
        if (!res.ok) throw new Error('Failed to fetch portfolio')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          if (isMounted) {
            setItems(json.data)
          }
        }
      } catch {
        // Retain static fallback
      }
    }

    void fetchPortfolio() // handles its own errors (keeps the static fallback)
    return () => {
      isMounted = false
    }
  }, [])

  const activeItems = items.filter((item) => item.isActive !== false)

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-8 border-t border-zinc-800/80">
      {/* Section Heading */}
      <div className="space-y-1">
        <p className="text-xs font-mono uppercase tracking-wider text-zinc-400">
          Amboss Manufacturing
        </p>
        <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-100">
          Engineering Projects & Portfolio
        </h2>
      </div>

      {/* Dynamic CSS Column Masonry Grid */}
      {activeItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded font-mono text-xs text-zinc-400">
          NO ARTIFACTS IN PORTFOLIO
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {activeItems.map((item) => (
            <button
              key={item.id}
              type="button"
              data-testid="portfolio-card"
              aria-haspopup="dialog"
              aria-label={`Inspect ${item.title}${item.material ? `, ${item.material}` : ''}`}
              onClick={(e) => {
                openerRef.current = e.currentTarget
                setActiveModalItem(item)
              }}
              className="group relative block w-full text-left break-inside-avoid mb-4 rounded border border-zinc-800 bg-zinc-900/40 overflow-hidden cursor-pointer transition hover:border-zinc-600 hover:shadow-lg"
            >
              {/* Dynamic Photo Container: adjusts naturally without forced aspect ratio */}
              <span className="block w-full overflow-hidden bg-zinc-950">
                <img
                  src={getAssetUrl(item.imageUrl)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                  onError={(e) => {
                    e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                  }}
                  className="w-full h-auto block object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </span>

              {/* Monospace Part Specs Bar */}
              <span className="block p-3 bg-zinc-950 border-t border-zinc-800/80 transition-colors group-hover:bg-zinc-900">
                <span className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-zinc-200 truncate">
                    {item.title}
                  </span>
                  <span className="text-xs font-mono text-cyan-400 shrink-0 opacity-80 group-hover:opacity-100 transition">
                    INSPECT
                  </span>
                </span>
                {item.material && (
                  <span className="block font-mono text-xs text-zinc-400 mt-1 truncate">
                    MAT: {item.material}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Inspecting Print Layer Details */}
      {activeModalItem && <PortfolioLightbox item={activeModalItem} onClose={closeModal} />}
    </section>
  )
}
