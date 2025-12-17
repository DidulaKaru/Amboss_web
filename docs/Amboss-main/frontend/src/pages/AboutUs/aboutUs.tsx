export default function AboutUs() {
    return (
      <div className="min-h-screen bg-amboss-bg">
        {/* About Us Header */}
        <section className="py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-amboss-accent/20 bg-zinc-900/40">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">About Us</h1>
            <p className="text-amboss-light mt-3">Learn more about Amboss and our journey.</p>
          </div>
        </section>

        {/* How We Started */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">How We Started</h2>
            <div className="prose prose-lg prose-invert max-w-none">
              <p className="text-amboss-light text-lg leading-relaxed mb-6">
                Amboss began with a simple idea: bring precision engineering and accessible manufacturing together to help ideas become products. Starting as a small workshop, we focused on solving real-world problems through practical design, rapid prototyping, and a relentless attention to detail.
              </p>
              <p className="text-amboss-light text-lg leading-relaxed mb-6">
                Over time, our capabilities grew—so did our ambition. Today, we collaborate across disciplines, deliver quality at speed, and continue to refine our craft. This section is placeholder content—feel free to replace it with your own origin story and milestones.
              </p>
              <p className="text-amboss-light text-lg leading-relaxed">
                Our journey reflects the values we stand for: reliability, innovation, and hands-on problem solving.
              </p>
            </div>
          </div>
        </section>

        {/* Meet the Team */}
        <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-t border-amboss-accent/20 bg-zinc-900/30">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Meet the Team</h2>
            <p className="text-amboss-light">This section will feature the team soon.</p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Intentionally left empty for now */}
            </div>
          </div>
        </section>
      </div>
    );
}