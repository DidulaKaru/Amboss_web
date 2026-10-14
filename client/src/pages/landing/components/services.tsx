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
    title: "3D CAD & Mechanical Design",
    desc: "Convert sketches, dimensioned drawings, or broken parts into manufacturing-ready 3D CAD models.",
    icon: <IconDesign />,
  },
  {
    title: "Additive Manufacturing",
    desc: "FDM and resin 3D printing for rapid iteration, functional prototypes, and low-volume production.",
    icon: <IconBolt />,
  },
  {
    title: "Molding & Casting",
    desc: "Silicone tooling and resin casting for batch duplication and specialized materials without hard tooling costs.",
    icon: <IconBatch />,
  },
];

function Services({
  id = "services",
  kicker = "Capabilities",
  title = "Design to Production",
  subtitle = "Engineering design, rapid prototyping, and additive manufacturing.",
  items = DEFAULT_ITEMS,
  className = "",
}: ServicesProps) {
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
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((s) => (
            <article
              key={s.title}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-6 hover:border-zinc-700 transition"
            >
              <div className="mb-4 inline-flex items-center justify-center rounded border border-zinc-800 bg-zinc-900 p-2 text-zinc-400">
                {s.icon}
              </div>
              <h3 className="text-sm font-medium text-zinc-200">{s.title}</h3>
              <p className="mt-2 text-xs text-zinc-400 leading-relaxed">{s.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Services;
