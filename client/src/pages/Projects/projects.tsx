import { getAssetUrl } from '../../utils/assets'

export default function Projects() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Featured Project */}
      <section className="relative w-full min-h-[60vh] md:min-h-[70vh] flex flex-col justify-end">
        <img
          src={getAssetUrl('images/pawsthetics.jpeg')}
          alt="Pawsthetics prosthetic project"
          onError={(e) => {
            e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
          }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 lg:px-8 space-y-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Featured Case Study
          </p>
          <div className="inline-flex items-center">
            <img
              src={getAssetUrl('images/by amboss.png')}
              alt="Pawsthetics by Amboss"
              onError={(e) => {
                e.currentTarget.src = getAssetUrl('images/pawsthetics_by_amboss.png')
              }}
              className="h-10 sm:h-12 w-auto"
              loading="eager"
            />
          </div>
          <p className="max-w-2xl text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Custom additive prosthetic design and fabrication for disabled animals in Sri Lanka, prototyped in collaboration with Animal SOS, Ahangama.
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

      {/* Projects Grid */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 space-y-8 border-t border-zinc-800/80">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            Portfolio
          </p>
          <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-zinc-100">
            Engineering Projects
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition flex flex-col">
            <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-950">
              <img
                src={getAssetUrl('images/pure mechanical arm.jpg')}
                alt="Mechanical prosthetic arm"
                onError={(e) => {
                  e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <h3 className="text-xs font-medium text-zinc-200">
                Body-Powered Mechanical Arm
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Cost-effective body-powered upper limb prosthesis tailored to individual anatomy using high-strength FDM filaments.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition flex flex-col">
            <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-950">
              <img
                src={getAssetUrl('images/set-gestured-arm.jpg')}
                alt="Gesture-controlled arm"
                onError={(e) => {
                  e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <h3 className="text-xs font-medium text-zinc-200">
                Gesture-Programmable System
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Servo-actuated prosthetic mechanism allowing wearers to map repeatable grip patterns to tactile input triggers.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition flex flex-col">
            <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-950">
              <img
                src={getAssetUrl('images/Myoelectric arm.jpg')}
                alt="Myoelectric prosthesis"
                onError={(e) => {
                  e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <h3 className="text-xs font-medium text-zinc-200">
                Myoelectric Arm Prosthesis
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                EMG-driven robotic prosthesis converting residual muscle signals into articulated finger actuation.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition flex flex-col">
            <div className="aspect-[4/3] w-full overflow-hidden bg-zinc-950">
              <img
                src={getAssetUrl('images/vein finder.jpg')}
                alt="Nightingale vein monitor"
                onError={(e) => {
                  e.currentTarget.src = getAssetUrl('images/amboss-logo.png')
                }}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
              <h3 className="text-xs font-medium text-zinc-200">
                Nightingale Vein Monitor
              </h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Near-infrared vein mapping and vital tracking device housed in custom SLA resin 3D-printed enclosure.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
