import React from "react";

type Service = {
  title: string;
  desc: string;
  icon?: React.ReactNode;
};

type ServicesProps = {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  items?: Service[];
  className?: string;
};

const IconBolt = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M13 3L4 14h6l-1 7 9-11h-6l1-7z" />
  </svg>
);

const IconBatch = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <rect x="3" y="3" width="7" height="7" rx="2" strokeWidth="2" />
    <rect x="14" y="3" width="7" height="7" rx="2" strokeWidth="2" />
    <rect x="3" y="14" width="7" height="7" rx="2" strokeWidth="2" />
    <rect x="14" y="14" width="7" height="7" rx="2" strokeWidth="2" />
  </svg>
);

const IconDesign = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 20l9-9-8-8-9 9v8h8zM7 15h.01" />
  </svg>
);

const DEFAULT_ITEMS: Service[] = [
  {
    title: "Rapid Prototyping",
    desc: "Same-week prints with tight tolerances, photos for approval, and iterative tweaks.",
    icon: <IconBolt />,
  },
  {
    title: "Small Batch Production",
    desc: "Repeatable parts with DFM checks, serialized QC, and clear lead times.",
    icon: <IconBatch />,
  },
  {
    title: "Custom Design & Consultation",
    desc: "From CAD help to jigs & fixtures—orientation, infill, and materials tuned for performance.",
    icon: <IconDesign />,
  },
];

function Services({
  id = "services",
  kicker = "Our services",
  title = "From idea to short-run production",
  subtitle = "A flexible menu to match your timeline and budget—every job includes orientation planning and a basic QC check.",
  items = DEFAULT_ITEMS,
  className = "",
}: ServicesProps) {
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
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((s) => (
            <article
              key={s.title}
              className="group relative overflow-hidden rounded-2xl border border-white/10
                         bg-gradient-to-b from-white/[0.06] to-white/[0.02]
                         p-6 md:p-7 shadow-[inset_0_1px_0_rgba(255,255,255,.05)]
                         hover:border-red-500/40 transition"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded-xl bg-white/5 p-3 text-zinc-200 group-hover:text-white">
                {s.icon}
              </div>
              <h3 className="text-lg md:text-xl font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{s.desc}</p>

              <div className="mt-4 inline-flex items-center text-red-400 text-sm opacity-0 group-hover:opacity-100 transition">
                Learn more →
              </div>

              {/* subtle hover glow */}
              <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition"
                   style={{
                     background:
                       "radial-gradient(600px circle at var(--x,50%) var(--y,50%), rgba(239,68,68,.08), transparent 40%)",
                   }}
                   onMouseMove={(e) => {
                     const el = e.currentTarget as HTMLDivElement;
                     const r = el.getBoundingClientRect();
                     el.style.setProperty("--x", `${e.clientX - r.left}px`);
                     el.style.setProperty("--y", `${e.clientY - r.top}px`);
                   }}
              />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
