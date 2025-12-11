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
    img: "/images/centauri-carbon.png", // place image at public/images/centauri-carbon.png
    desc:
      "Dimensional accuracy across multiple machines for functional parts and jigs. Tuned profiles for engineering filaments and fiber blends.",
    specs: [
      "Models: Bambu Labs A1 (AMS), Bambu Labs A1 mini, Elegoo Centauri Carbon, Elegoo Neptune 4 Pro",
      "Materials: PLA, PETG, ABS, TPU, Nylon, CF blends",
      "Layer: 0.08–0.28 mm",
      "Build: up to 256×256×256 mm",
    ],
  },
  {
    name: "SLA Printers",
    img: "/images/saturn-4.png",
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
  kicker = "Our 3D printing capabilities",
  title = "Industrial-grade printers. Repeatable results.",
  subtitle = "Process-controlled machines with calibration logs, tuned material profiles, and documented QA.",
  items = DEFAULT_ITEMS,
  className = "",
  columns = 2,
}: CapabilitiesProps) {
  const gridCols =
    columns === 3 ? "md:grid-cols-3" : columns === 1 ? "md:grid-cols-1" : "md:grid-cols-2";

  return (
    <section id={id} className={`py-16 md:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-red-500/80">{kicker}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{title}</h2>
          <p className="text-sm md:text-base text-zinc-400 max-w-3xl">{subtitle}</p>
        </div>

        {/* Cards */}
        <div className={`mt-8 grid gap-6 sm:gap-7 ${gridCols}`}>
          {items.map((c) => (
            <article
              key={c.name}
              className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
            >
              <div className="relative h-64 bg-black">
                <img
                  src={c.img}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/30 to-transparent" />
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 transition group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(239,68,68,.10), transparent 40%)",
                  }}
                  onMouseMove={(e) => {
                    const el = e.currentTarget as HTMLDivElement;
                    const r = el.getBoundingClientRect();
                    el.style.setProperty("--x", `${e.clientX - r.left}px`);
                    el.style.setProperty("--y", `${e.clientY - r.top}px`);
                  }}
                />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-xl font-semibold">{c.name}</h3>
                </div>
              </div>

              <div className="p-6">
                <p className="text-sm text-zinc-300">{c.desc}</p>
                {c.specs && c.specs.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {c.specs.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-200"
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
