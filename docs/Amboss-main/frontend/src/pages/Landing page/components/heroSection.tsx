 

type HeroProps = {
  bgSrc?: string;
  title?: string;
  tagline?: string;
  blurb?: string;
  ctaPrimary?: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
};

export default function Hero({
  bgSrc = "/images/hero-bg.jpg",
  title = "Industrial-grade 3D printing, on demand",
  tagline = "From concept to reality",
  blurb = "From first prototype to short-run production, we deliver precise parts, expert guidance, and predictable timelines.",
  ctaPrimary = { label: "Get a quote", href: "https://wa.me/94779902796" },
  ctaSecondary = { label: "Explore services", href: "#services" },
}: HeroProps) {
  const handleWhatsAppClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.currentTarget.href.includes("wa.me")) {
      e.currentTarget.target = "_blank";
      e.currentTarget.rel = "noopener noreferrer";
    }
  };
  return (
    <header id="home" className="relative isolate">
      {/* Background image + overlays */}
      <div className="absolute inset-0 -z-10">
        <img
          src={bgSrc}
          alt=""
          className="h-[68vh] w-full object-cover object-center opacity-60"
          loading="eager"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-amboss-bg via-amboss-bg/70 to-amboss-bg" />
        {/* subtle radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(50, 130, 184, 0.15),transparent_60%)]" />
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto flex h-[68vh] max-w-6xl flex-col justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          {tagline && (
            <p className="text-sm text-zinc-300">
              {/** emphasize one word for a nice touch */}
              {tagline.split(" ").map((w, i) =>
                i === 1 ? (
                  <span key={i} className="text-white font-semibold">
                    {w + " "}
                  </span>
                ) : (
                  w + " "
                )
              )}
            </p>
          )}

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
            {title}
          </h1>

          {blurb && <p className="max-w-2xl text-zinc-400">{blurb}</p>}

          <div className="flex items-center gap-3 pt-2">
            {ctaPrimary && (
              <a
                href={ctaPrimary.href}
                onClick={handleWhatsAppClick}
                className="inline-flex items-center rounded-full bg-amboss-accent hover:bg-amboss-accent/80 scroll-smooth"
              >
                {ctaPrimary.label}
              </a>
            )}
            {ctaSecondary && (
              <a
                href={ctaSecondary.href}
                className="inline-flex items-center rounded-full px-5 py-3 text-sm font-medium text-white/90 ring-1 ring-amboss-light/20 hover:ring-amboss-light/50 scroll-smooth"
              >
                {ctaSecondary.label}
              </a>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}



