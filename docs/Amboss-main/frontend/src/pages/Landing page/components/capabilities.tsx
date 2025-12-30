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
    img: `${import.meta.env.BASE_URL}images/FDM%20printer.jpg`,
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
          <p className="text-xs uppercase tracking-[0.2em] text-amboss-light/70">{kicker}</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{title}</h2>
          <p className="text-sm md:text-base text-amboss-light/70 max-w-3xl">{subtitle}</p>
        </div>

        {/* Cards */}
        <div className={`mt-8 grid gap-6 sm:gap-7 ${gridCols}`}>
          {items.map((c) => (
            <article
              key={c.name}
              className="group overflow-hidden rounded-2xl border border-amboss-accent/30 bg-amboss-section/30"
            >
              <div className="relative h-64 bg-amboss-bg">
                <img
                  src={c.img}
                  alt={c.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: "drop-shadow(0 0 22px rgba(50, 130, 184, 0.35))" }}
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amboss-bg/85 via-amboss-bg/30 to-transparent" />
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 transition group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(50, 130, 184, 0.15), transparent 40%)",
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
                <p className="text-sm text-amboss-light">{c.desc}</p>
                {c.specs && c.specs.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {c.specs.map((s, i) => (
                      <li
                        key={i}
                        className="rounded-full border border-amboss-accent/30 bg-white/5 px-3 py-1 text-xs text-amboss-light/80"
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




