type WhyUsProps = {
  id?: string;
  kicker?: string;
  title?: string;
  subtitle?: string;
  className?: string;
};

function WhyUs({
  id = "why-us",
  kicker = "Quality & Process",
  title = "Engineering Support",
  subtitle = "Calibrated print profiles, verified tolerances, and direct design-for-additive-manufacturing feedback on every job.",
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
      </div>
    </section>
  );
}

export default WhyUs;
