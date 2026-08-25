import { useEffect, useState } from "react";
import { newsItems } from './data'

type NewsCarouselProps = {
  onLearnMore: (anchorId: string) => void;
};

export function NewsCarousel({ onLearnMore }: NewsCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setCurrentSlide((prev) => (prev + 1) % newsItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index: number) => setCurrentSlide(index);
  const goToPrevious = () => setCurrentSlide((prev) => (prev - 1 + newsItems.length) % newsItems.length);
  const goToNext = () => setCurrentSlide((prev) => (prev + 1) % newsItems.length);

  return (
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
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-8 md:p-12 lg:p-16">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl sm:text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">{item.title}</h2>
              <p className="text-sm sm:text-lg md:text-xl text-gray-200 max-w-3xl mb-4">{item.summary}</p>
              <button
                onClick={() => onLearnMore(item.anchorId)}
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

      <button
        onClick={goToPrevious}
        className="hidden sm:flex absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-black/35 hover:bg-black/50 border border-white/30 text-white p-2.5 md:p-3 rounded-full transition"
        aria-label="Previous slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="hidden sm:flex absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-black/35 hover:bg-black/50 border border-white/30 text-white p-2.5 md:p-3 rounded-full transition"
        aria-label="Next slide"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

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
  );
}

export default function News() {
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash) {
        const el = document.getElementById(hash);
        if (el) {
          setTimeout(() => {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 100);
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div className="min-h-screen bg-amboss-bg">
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
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
