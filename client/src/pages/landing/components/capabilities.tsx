// Capabilities.tsx

type Capability = {
  name: string;
  img: string;
  desc: string;
  specs?: string[];
};

type CapabilitiesProps = {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  items?: Capability[];
  className?: string;
  columns?: 1 | 2 | 3;
};

const DEFAULT_ITEMS: Capability[] = [
  {
    name: "FDM Printers",
    img: `${import.meta.env.BASE_URL}images/k2plus.jpg`,
    desc:
      "Dimensional accuracy across multiple machines for functional parts and jigs. Tuned profiles for engineering filaments and fiber blends.",
    specs: [
      "Models: Bambu Labs A1 (AMS), Bambu Labs A1 mini, Elegoo Centauri Carbon, Elegoo Neptune 4 Pro, Creality K2 Plus",
      "Materials: PLA, PETG, ABS, TPU, Nylon, CF blends",
      "Layer: 0.08–0.28 mm",
      "Build: up to 350×350×350 mm",
    ],
  },
  {
    name: "SLA Printers",
    img: `${import.meta.env.BASE_URL}images/SLA%20printer.jpg`,
    desc:
      "High-resolution resin printing for detailed models, fixtures, and snap-fit prototypes with smooth surfaces.",
    specs: [
      "Models: Elegoo Mars 5 Ultra, Elegoo Saturn 4 Ultra 16K",
      "Resins: Clear, ABS-like, Tough",
      "Layer: 0.02–0.1 mm",
      "Build: up to 211.68×118.37×220 mm",
    ],
  }, 
];

function Capabilities({
  id = "capabilities",
  kicker = "Equipment",
  title = "Machine Specifications",
  subtitle = "Calibrated build envelopes and material capabilities for FDM and SLA fabrication.",
  items = DEFAULT_ITEMS,
  className = "",
  columns = 2,
}: CapabilitiesProps) {
  const gridCols =
    columns === 3 ? "md:grid-cols-3" : columns === 1 ? "md:grid-cols-1" : "md:grid-cols-2";

  return (
    <section id={id} className={`py-16 bg-zinc-950 border-t border-zinc-800/80 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-wider font-mono text-zinc-400">{kicker}</p>
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">{title}</h2>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl">{subtitle}</p>
        </div>

        {/* Cards */}
        <div className={`mt-8 grid gap-4 ${gridCols}`}>
          {items.map((c) => (
            <article
              key={c.name}
              className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/30 hover:border-zinc-700 transition"
            >
              <div className="relative h-60 bg-zinc-900">
                <img
                  src={c.img}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  width={600}
                  height={400}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-zinc-100 text-base font-medium">{c.name}</h3>
                </div>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-xs text-zinc-400 leading-relaxed">{c.desc}</p>
                {c.specs && c.specs.length > 0 && (
                  <ul className="flex flex-wrap gap-1.5">
                    {c.specs.map((s, i) => (
                      <li
                        key={i}
                        className="rounded border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-[11px] font-mono text-zinc-400"
                      >
                        {s}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Capabilities; // <-- default export
