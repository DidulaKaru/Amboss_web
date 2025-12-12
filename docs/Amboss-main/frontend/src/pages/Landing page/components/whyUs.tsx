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
  kicker = "Why choose us",
  title = "Quality, speed, and real manufacturing support",
  subtitle = "We obsess over reliability—process-controlled printing, tuned profiles, and proactive DFM feedback so your parts work the first time.",
  items = DEFAULT_ITEMS,
  className = "",
}: WhyUsProps) {
  return (
    <section id={id} className={`py-16 md:py-20 ${className}`}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="space-y-3">
          {kicker && (
            <p className="text-xs uppercase tracking-[0.2em] text-amboss-light/70">
              {kicker}
            </p>
          )}
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm md:text-base text-amboss-light/70 max-w-3xl">
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


