export default function Projects() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="relative w-full min-h-[70vh] md:min-h-[80vh]">
        <img
          src="/images/pawsthetics.jpeg"
          alt="Pawsthetics by AMBOSS team with dogs"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-900/30" />

        <div className="relative z-10 flex h-full w-full items-center">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:px-12 md:py-12">
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-[#BBE1FA]">
              Featured Project
            </p>
            <div className="flex items-center">
              <img
                src="/images/pawsthetics_by_amboss.png"
                alt="Pawsthetics by AMBOSS"
                className="h-10 sm:h-12 md:h-14 lg:h-16 w-auto drop-shadow-[0_2px_8px_rgba(50,130,184,0.35)]"
                loading="eager"
              />
            </div>
            <p className="max-w-3xl text-base sm:text-lg text-zinc-100">
              This Project aims to utilize the power and versatility of 3D Printing to enrich the lives of disabled
              animals in the country. The provided model was designed and fabricated for Daniel, a puppy currently in the
              care of Animal SOS, Ahangama.
            </p>
            <div className="flex gap-4">
              <a
                href="https://pawsthetics.lk/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-[#3282B8] px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold text-white transition hover:bg-[#0F4C75] focus:outline-none focus:ring-2 focus:ring-[#3282B8] focus:ring-offset-2 focus:ring-offset-zinc-950"
              >
                Visit pawsthetics.lk
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-5xl flex-col gap-6 px-6 py-12 md:px-12">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 shadow-lg">
          <h2 className="text-2xl font-semibold">Why This Matters</h2>
          <p className="mt-3 text-base text-zinc-300">
            Every paw matters. By pairing engineering with compassion, Pawsthetics helps animals regain mobility and
            independence. Daniel&apos;s custom prosthetic is one example of how 3D printing can rapidly prototype, test, and
            deliver life-changing support to animals in need.
          </p>
        </div>
      </section>
    </main>
  );
}

