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
            <div className="inline-flex items-center rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
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

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-12">
        <h2 className="mb-8 text-center text-3xl font-bold md:text-4xl">Other Projects</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
          {/* Project 1 */}
          <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition hover:border-[#3282B8] hover:shadow-xl hover:shadow-[#3282B8]/10">
            <div className="aspect-video w-full overflow-hidden bg-zinc-800">
              <img
                src="/images/project-placeholder-1.jpg"
                alt="Body-powered mechanical prosthetic arm"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="mb-3 text-xl font-semibold text-[#BBE1FA]">
                3D-Printed Mechanical Prosthetic Arms
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                Our body-powered prosthetics leverage additive manufacturing to deliver lightweight, robust solutions at a 
                fraction of traditional costs. Each arm is engineered with simple yet reliable mechanisms and tailored to 
                individual anatomies, democratizing access to functional mobility aids across diverse communities.
              </p>
            </div>
          </div>

          {/* Project 2 */}
          <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition hover:border-[#3282B8] hover:shadow-xl hover:shadow-[#3282B8]/10">
            <div className="aspect-video w-full overflow-hidden bg-zinc-800">
              <img
                src="/images/project-placeholder-2.jpg"
                alt="Gesture-controlled prosthetic arm"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="mb-3 text-xl font-semibold text-[#BBE1FA]">
                Gesture-Programmable Prosthetic System
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                A breakthrough in user-programmable prosthetics that empowers wearers to map custom gestures to specific 
                finger movements. Through an elegant interface of button patterns and servo-driven actuators, users achieve 
                natural, fluid interactions with everyday objects.
              </p>
            </div>
          </div>

          {/* Project 3 */}
          <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition hover:border-[#3282B8] hover:shadow-xl hover:shadow-[#3282B8]/10">
            <div className="aspect-video w-full overflow-hidden bg-zinc-800">
              <img
                src="/images/project-placeholder-3.jpg"
                alt="Myoelectric prosthetic arm with EMG sensors"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="mb-3 text-xl font-semibold text-[#BBE1FA]">
                Bio-Sensing Myoelectric Prosthesis
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                Harnessing electromyographic signals directly from residual muscle tissue, this biomimetic arm translates 
                neural intent into coordinated digital movement. Our miniaturized control system merges biological impulses 
                with robotic actuation, pushing the boundaries of intuitive human-machine integration.
              </p>
            </div>
          </div>

          {/* Project 4 */}
          <div className="group overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40 transition hover:border-[#3282B8] hover:shadow-xl hover:shadow-[#3282B8]/10">
            <div className="aspect-video w-full overflow-hidden bg-zinc-800">
              <img
                src="/images/project-placeholder-4.jpg"
                alt="Nightingale vein visualization device"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </div>
            <div className="p-6">
              <h3 className="mb-3 text-xl font-semibold text-[#BBE1FA]">
                The Nightingale Vital Monitor
              </h3>
              <p className="text-sm leading-relaxed text-zinc-300">
                An at-home diagnostic tool combining near-infrared vein mapping with continuous vital sign tracking. Designed 
                for patients requiring frequent blood pressure monitoring, it provides non-invasive real-time insights, 
                reducing clinic dependency while maintaining clinical-grade accuracy.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

