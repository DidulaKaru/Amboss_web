type Product = {
  name: string;
  img: string;
  desc: string;
  badges?: string[];
};

const DEFAULT_PRODUCTS: Product[] = [
  {
    name: "Print on Demand - FDM",
    img: `${import.meta.env.BASE_URL}images/FDM_print.jpg`,
    desc: "High-quality FDM 3D printing services for functional prototypes, custom parts, and mechanical components.",
    badges: ["Fast Turnaround", "Multiple Materials", "Custom Colors"],
  },
  {
    name: "Print on Demand - SLA",
    img: `${import.meta.env.BASE_URL}images/resin_print.jpg`,
    desc: "Precision resin printing for highly detailed figurines, miniatures, and intricate models with smooth surface finish.",
    badges: ["High Detail", "Smooth Finish", "Multiple Resins"],
  },
  {
    name: "Amboss Electronics",
    img: `${import.meta.env.BASE_URL}images/electronics.jpg`,
    desc: "Electronics for enthusiasts and students. Arduino boards, sensors, and development kits for your projects.",
    badges: ["Coming Soon", "For Students", "Maker Friendly"],
  },
];

export default function Products({
  items = DEFAULT_PRODUCTS,
  id = "products",
  title = "Products & Services",
  subtitle = "Professional 3D printing services and electronics for makers, students, and enthusiasts.",
}: {
  items?: Product[];
  id?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <section id={id} className="py-16 md:py-20">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-amboss-light/70">Our Services & Products</p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">{title}</h2>
          <p className="text-sm md:text-base text-amboss-light/70 max-w-3xl">{subtitle}</p>
        </div>

        <div className="mt-8 grid gap-6 sm:gap-7 md:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <article key={p.name} className="group overflow-hidden rounded-2xl border border-amboss-accent/30 bg-white/[0.03]">
              <div className="relative aspect-video bg-black">
                <img
                  src={p.img}
                  alt={p.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/85 via-zinc-950/30 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-white text-lg font-semibold">{p.name}</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-zinc-300">{p.desc}</p>
                {p.badges && p.badges.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {p.badges.map((b, i) => (
                      <li key={i} className="rounded-full border border-amboss-accent/30 bg-amboss-section/30 px-3 py-1 text-xs text-amboss-light">
                        {b}
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
