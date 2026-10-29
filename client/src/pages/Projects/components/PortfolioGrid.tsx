import { useState, useEffect } from 'react'
import { getAssetUrl } from '../../../utils/assets'

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
    title: 'Nightingale Vein Monitor',
    material: 'SLA Tough Photopolymer',
    imageUrl: 'images/vein finder.jpg',
    description: 'Near-infrared vein mapping and vital tracking device housed in custom SLA resin 3D-printed enclosure.',
    isActive: true,
  },
  {
    id: 'b2222222-2222-4222-8222-222222222222',
    title: 'Falcon 9 Pen',
    material: 'PLA+ / PETG',
    imageUrl: 'images/falcon9.jpg',
    description: 'Designed and manufactured for SEDS Ruhuna chapter. Aerospace-inspired precision desk writing instrument.',
    isActive: true,
  },
  {
    id: 'c3333333-3333-4333-8333-333333333333',
    title: 'Rextro Souvenirs',
    material: 'Polyurethane Resin / Composite',
    imageUrl: 'images/souvenir_crop.jpg',
    description: 'Limited-run custom souvenirs manufactured for the Silver Jubilee of the Faculty of Engineering, University of Ruhuna.',
    isActive: true,
  },
  {
    id: 'd4444444-4444-4444-8444-444444444444',
    title: 'Body-Powered Mechanical Arm',
    material: 'PA12-CF / PETG',
    imageUrl: 'images/pure mechanical arm.jpg',
    description: 'Cost-effective body-powered upper limb prosthesis tailored to individual anatomy using high-strength FDM filaments.',
    isActive: true,
  },
  {
    id: 'e5555555-5555-4555-8555-555555555555',
    title: 'Gesture-Programmable System',
    material: 'PETG / Servo Enclosures',
    imageUrl: 'images/set-gestured-arm.jpg',
    description: 'Servo-actuated prosthetic mechanism allowing wearers to map repeatable grip patterns to tactile input triggers.',
    isActive: true,
  },
  {
    id: 'f6666666-6666-4666-8666-666666666666',
    title: 'Myoelectric Arm Prosthesis',
    material: 'Nylon PA12 / Carbon Blend',
    imageUrl: 'images/Myoelectric arm.jpg',
    description: 'EMG-driven robotic prosthesis converting residual muscle signals into articulated finger actuation.',
    isActive: true,
  },
  {
    id: 'a7777777-7777-4777-8777-777777777777',
    title: 'Optical Sensor Fixture',
    material: 'High Clear Resin',
    imageUrl: 'images/SLA printer.jpg',
    description: 'Micron-level SLA fixture printed with ultra-clear photopolymer for sensor calibration benches.',
    isActive: true,
  },
  {
    id: 'b8888888-8888-4888-8888-888888888888',
    title: 'Large Format CoreXY Build Jigs',
    material: 'PA12-CF',
    imageUrl: 'images/k2plus.jpg',
    description: 'Structural corner braces and gantry mountings printed in carbon-fiber reinforced nylon.',
    isActive: true,
  },
]

const API_BASE = import.meta.env.VITE_API_URL || ''

export default function PortfolioGrid() {
  const [items, setItems] = useState<PortfolioItem[]>(STATIC_FALLBACK_ITEMS)
  const [activeModalItem, setActiveModalItem] = useState<PortfolioItem | null>(null)

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

    fetchPortfolio()
    return () => {
      isMounted = false
    }
  }, [])

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalItem(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const activeItems = items.filter((item) => item.isActive !== false)

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-8 border-t border-zinc-800/80">
      {/* Section Heading */}
      <div className="space-y-1">
        <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
          Precision Manufacturing
        </p>
        <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-100">
          Engineering Projects & Artifacts
        </h2>
      </div>

      {/* Dynamic CSS Column Masonry Grid */}
      {activeItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-zinc-800 rounded font-mono text-xs text-zinc-500">
          NO ARTIFACTS IN PORTFOLIO
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {activeItems.map((item) => (
            <div
              key={item.id}
              data-testid="portfolio-card"
              onClick={() => setActiveModalItem(item)}
              className="group relative break-inside-avoid mb-4 rounded border border-zinc-800 bg-zinc-900/40 overflow-hidden cursor-pointer transition hover:border-zinc-600 hover:shadow-lg"
            >
              {/* Dynamic Photo Container: adjusts naturally without forced aspect ratio */}
              <div className="w-full overflow-hidden bg-zinc-950">
                <img
                  src={getAssetUrl(item.imageUrl)}
                  alt={item.title}
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={600}
                  onError={(e) => {
                    e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                  }}
                  className="w-full h-auto block object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Monospace Part Specs Bar */}
              <div className="p-3 bg-zinc-950 border-t border-zinc-800/80 transition-colors group-hover:bg-zinc-900">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-mono text-xs font-medium text-zinc-200 truncate">
                    {item.title}
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-400 shrink-0 opacity-80 group-hover:opacity-100 transition">
                    [+] INSPECT
                  </span>
                </div>
                {item.material && (
                  <p className="font-mono text-[10px] text-zinc-400 mt-1 truncate">
                    MAT: {item.material}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Inspecting Print Layer Details */}
      {activeModalItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lightbox-title"
          onClick={() => setActiveModalItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-md transition-opacity"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden shadow-2xl"
          >
            {/* Close Button */}
            <button
              type="button"
              aria-label="Close inspection lightbox"
              onClick={() => setActiveModalItem(null)}
              className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded border border-zinc-800 bg-zinc-950/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 text-xs font-mono transition cursor-pointer"
            >
              [ESC] CLOSE
            </button>

            {/* High-Resolution Media Viewport */}
            <div className="flex-1 min-h-[300px] md:min-h-[500px] bg-black flex items-center justify-center overflow-hidden p-2">
              <img
                src={getAssetUrl(activeModalItem.imageUrl)}
                alt={activeModalItem.title}
                width={1200}
                height={900}
                onError={(e) => {
                  e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                }}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded"
              />
            </div>

            {/* Technical Detail Sidebar */}
            <div className="w-full md:w-80 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-800 bg-zinc-900/60 font-mono text-xs space-y-6">
              <div className="space-y-4">
                <h3 id="lightbox-title" className="text-base font-medium text-zinc-100 pt-1">
                  {activeModalItem.title}
                </h3>

                {activeModalItem.material && (
                  <div className="p-3 rounded border border-zinc-800 bg-zinc-950 space-y-1">
                    <span className="text-[10px] uppercase text-zinc-500">Material Specification</span>
                    <p className="text-zinc-200 text-xs font-medium">{activeModalItem.material}</p>
                  </div>
                )}

                {activeModalItem.description && (
                  <div className="space-y-1 font-sans text-xs text-zinc-300 leading-relaxed">
                    <span className="font-mono text-[10px] uppercase text-zinc-500 block">
                      Engineering Notes
                    </span>
                    <p>{activeModalItem.description}</p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-800 space-y-2 text-[10px] text-zinc-500 font-mono">
                <div className="flex justify-between">
                  <span>PRINT INSPECTION:</span>
                  <span className="text-emerald-400">VERIFIED QA</span>
                </div>
                <div className="flex justify-between">
                  <span>FACILITY:</span>
                  <span className="text-zinc-300">AMBOSS GALLE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
