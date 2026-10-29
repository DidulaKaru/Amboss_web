import { getAssetUrl } from '../../utils/assets'
import PortfolioGrid from './components/PortfolioGrid'

export default function Projects() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Featured Case Study Hero Section */}
      <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex flex-col justify-end">
        <img
          src={getAssetUrl('images/pawsthetics.jpeg')}
          alt="Pawsthetics prosthetic project"
          width={1920}
          height={1080}
          onError={(e) => {
            e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8 space-y-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Featured
          </p>
          <div className="inline-flex items-center">
            <img
              src={getAssetUrl('images/by amboss.png')}
              alt="Pawsthetics by Amboss"
              width={200}
              height={48}
              onError={(e) => {
                e.currentTarget.src = getAssetUrl('images/pawsthetics_by_amboss.png')
              }}
              className="h-10 sm:h-12 w-auto"
              loading="eager"
            />
          </div>
          <p className="max-w-2xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Custom additive prosthetic design and fabrication for disabled animals in Sri Lanka, in collaboration with Animal SOS, Ahangama.
          </p>
          <div>
            <a
              href="https://pawsthetics.lk/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded bg-zinc-100 hover:bg-white px-4 py-2 text-xs font-medium text-zinc-950 transition"
            >
              Visit pawsthetics.lk →
            </a>
          </div>
        </div>
      </section>

      {/* Dynamic Filterable Portfolio Grid */}
      <PortfolioGrid />
    </main>
  )
}
