export default function LogisticsBanner() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4 sm:p-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Summary */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Fulfillment Options
            </span>
          </div>
          <h2 className="text-sm font-medium text-zinc-100">
            Free Campus & Workshop Pickup · Islandwide Courier
          </h2>
          <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
            Collect orders with zero delivery fee from the Faculty of Engineering (University of Ruhuna) or our Hapugala shop. Nationwide courier dispatched within 24 hours.
          </p>
        </div>

        {/* Right: Technical Logistics Spec Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0 text-xs font-mono">
          {/* Ruhuna Campus */}
          <div className="p-3 rounded border border-zinc-800/90 bg-zinc-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-200">UoR Faculty</span>
              <span className="text-[10px] text-emerald-400 font-medium">FREE</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-tight">
              Faculty of Engineering, Hapugala
            </p>
          </div>

          {/* Hapugala Shop */}
          <div className="p-3 rounded border border-zinc-800/90 bg-zinc-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-200">Hapugala Shop</span>
              <span className="text-[10px] text-emerald-400 font-medium">FREE</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-tight">
              Amboss Workshop, Elhenage Watta
            </p>
          </div>

          {/* Islandwide Courier */}
          <div className="p-3 rounded border border-zinc-800/90 bg-zinc-950/60 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-200">Islandwide</span>
              <span className="text-[10px] text-zinc-300 font-medium">Rs 500</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-tight">
              Flat rate for electronics (&lt;1 kg)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
