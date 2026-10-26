import { Link } from 'react-router-dom'

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="space-y-2 border-b border-zinc-800/80 pb-6">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
            About Amboss
          </p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            Design & Additive Manufacturing
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400">
            Based in Galle, Sri Lanka.
          </p>
        </div>

        {/* Narrative */}
        <div className="space-y-6 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          <p>
            Amboss is an engineering and rapid manufacturing studio originating at the University of Ruhuna Faculty of Engineering. We assist students, researchers, and commercial clients in turning CAD geometry into physical prototypes.
          </p>
          <p>
            Our workshop operates enclosed coreXY FDM machines (Creality K2 Plus, Elegoo Centauri Carbon, Bambu Lab A1) and high-resolution SLA resin printers. We print with engineering materials including PLA+, PETG, ABS, TPU, carbon fiber blends, and tough photopolymers.
          </p>
          <p>
            Every order is reviewed for printability, layer adhesion, and orientation to ensure functional reliability.
          </p>
        </div>

        {/* Studio Specs */}
        <div className="pt-6 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          <div className="p-4 rounded border border-zinc-800 bg-zinc-900/40 space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase">Location</span>
            <p className="text-zinc-200">Galle, Sri Lanka</p>
          </div>
          <div className="p-4 rounded border border-zinc-800 bg-zinc-900/40 space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase">Enclosure Volume</span>
            <p className="text-zinc-200">Up to 350×350×350 mm</p>
          </div>
          <div className="p-4 rounded border border-zinc-800 bg-zinc-900/40 space-y-1">
            <span className="text-zinc-500 text-[10px] uppercase">Turnaround</span>
            <p className="text-zinc-200">24–48 hours</p>
          </div>
        </div>

        {/* Colophon & Discreet System Access */}
        <div className="pt-10 border-t border-zinc-900 flex justify-between items-center text-[10px] font-mono text-zinc-600">
          <span>AMBOSS Engineering & Manufacturing</span>
          <Link
            to="/admin/login"
            className="text-zinc-600 hover:text-zinc-400 transition"
            title="System Terminal"
          >
            SYS / CTRL
          </Link>
        </div>
      </div>
    </div>
  )
}
