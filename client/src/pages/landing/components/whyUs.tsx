type WhyUsProps = {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  items?: string[];
  className?: string;
};

const DEFAULT_ITEMS: string[] = [];

function WhyUs({
  id = "why-us",
  kicker = "Quality & Process",
  title = "Engineering Support",
  subtitle = "Calibrated print profiles, verified tolerances, and direct design-for-additive-manufacturing feedback on every job.",
  items = DEFAULT_ITEMS,
  className = "",
}: WhyUsProps) {
  return (
    <section id={id} className={`py-16 bg-zinc-950 border-t border-zinc-800/80 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="space-y-2">
          {kicker && (
            <p className="text-[11px] uppercase tracking-wider font-mono text-zinc-400">
              {kicker}
            </p>
          )}
          <h2 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Larger stat cards */}
        {items.length > 0 && (
          <ul className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
            {items.map((label) => (
              <li
                key={label}
                className="min-h-[90px] md:min-h-[110px]
                         flex items-center justify-center text-center
                         rounded-2xl border border-amboss-accent/30 bg-amboss-section/30
                         px-6 py-5 md:px-8 md:py-7
                         text-base md:text-lg font-medium text-zinc-200
                         shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
              >
                {label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default WhyUs;
