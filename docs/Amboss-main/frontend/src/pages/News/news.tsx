import { useEffect, useState, useRef } from "react";

interface NewsItem {
  id: number;
  anchorId: string;
  title: string;
  summary: string;
  imageUrl: string;
  content: string;
}

const newsItems: NewsItem[] = [
  {
    id: 1,
    anchorId: "news-1",
    title: "Rextro Exhibition",
    summary: "Amboss showcased multiple innovative projects at Rextro 2025.",
    imageUrl: `${import.meta.env.BASE_URL}images/rextro_crop.jpg`,
    content:
      "Amboss shined at the Rextro Exhibition, presenting a selection of precision-engineered prototypes, rapid-manufacturing workflows, and collaborative design processes. The showcase highlighted our end-to-end capability—from concept to production—while engaging with partners and students to foster innovation in engineering.",
  },
  {
    id: 2,
    anchorId: "news-2",
    title: "Rextro Souvenir",
    summary: "Limited-run custom souvenirs manufactured for the Silver Jubilee of the Faculty of Engineering.",
    imageUrl: `${import.meta.env.BASE_URL}images/souvenir_crop.jpg`,
    content:
      "To commemorate the Rextro Exhibition, Amboss designed and manufactured a limited series of custom souvenirs. Designed for durability and precise detail, these items demonstrate our craftsmanship and small-batch manufacturing discipline, including robust QA workflows and elegant finishing.",
  },
  {
    id: 3,
    anchorId: "news-3",
    title: "Falcon 9 Pen",
    summary: "Bringing a history defining rocket on to your desk.",
    imageUrl: `${import.meta.env.BASE_URL}images/falcon9.jpg`,
    content:
      "Designed and Manufactured by Amboss for SEDS Ruhuna chapter. Inspired by aerospace engineering, the Falcon 9 pen blends performance, ergonomics, and style. Crafted with precision 3D printing and high-quality materials, it offers a smooth writing experience while celebrating the spirit of innovation and exploration.",
  },
  {
    id: 4,
    anchorId: "news-4",
    title: "Disaster Relief",
    summary: "Giving back to the community in times of need.",
    imageUrl: `${import.meta.env.BASE_URL}images/disaster_relief.jpg`,
    content:
      "Amboss was able to contribute to disaster relief efforts in the aftermath of cyclone Ditwah by donating critical aid - including food, sanitary items, and medical supplies - to affected communities in Gampola. We are committed to supporting our community and standing together in times of crisis.",
  },
];

export default function News() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const newsArticlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return; // pause when tab is hidden
      setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Handle hash-based navigation for scrolling to news items
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the '#'
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    };

    // Call on mount in case there's a hash in the URL
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % newsItems.length);

  const handleLearnMore = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    if (el) {
      // Update the URL hash without forcing an extra jump
      window.history.replaceState(null, "", `#${anchorId}`);
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-amboss-bg">
      {/* Carousel Section */}
      <section className="relative w-screen overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {newsItems.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide
                ? "opacity-100 pointer-events-auto z-10"
                : "opacity-0 pointer-events-none z-0"
            }`}
            aria-hidden={index !== currentSlide}
          >
            {/* Image */}
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

            {/* Text Content */}
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 lg:p-16">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">{item.title}</h2>
                <p className="text-lg md:text-xl text-gray-200 max-w-3xl mb-4">{item.summary}</p>
                <button
                  onClick={() => handleLearnMore(item.anchorId)}
                  className="inline-flex items-center gap-2 text-white bg-amboss-accent hover:bg-amboss-accent/80 px-4 py-2 rounded"
                  aria-label={`Learn more about ${item.title}`}
                >
                  Learn more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white p-3 rounded-full transition"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {newsItems.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${index === currentSlide ? "bg-white w-8" : "bg-white/50 hover:bg-white/75"}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* News Articles */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8" ref={newsArticlesRef}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-10">News</h2>
          <div className="grid grid-cols-1 gap-8">
            {newsItems.map((item) => (
              <article
                key={item.id}
                id={item.anchorId}
                className="relative rounded-xl border border-amboss-accent/40 bg-zinc-900/50 p-6 md:p-8 shadow-[0_0_24px_rgba(37,99,235,0.35)] scroll-mt-20"
              >
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full md:w-72 h-48 md:h-48 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-2xl md:text-3xl font-semibold text-white mb-3">{item.title}</h3>
                    <p className="text-amboss-light text-base md:text-lg leading-relaxed mb-4">{item.content}</p>
                    <a
                      href={`#${item.anchorId}`}
                      className="sr-only"
                      aria-label={`Permalink to ${item.title}`}
                    >
                      Permalink
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
