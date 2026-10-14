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
              <h2 className="text-xl sm:text-2xl md:text-4xl font-medium text-white mb-3">{item.title}</h2>
              <p className="text-xs sm:text-sm md:text-base text-zinc-300 max-w-2xl mb-4 leading-relaxed">{item.summary}</p>
              <button
                onClick={() => onLearnMore(item.anchorId)}
                className="inline-flex items-center gap-2 text-zinc-950 bg-zinc-100 hover:bg-white px-4 py-2 rounded text-xs font-medium transition cursor-pointer"
                aria-label={`Learn more about ${item.title}`}
              >
                Learn more →
              </button>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={goToPrevious}
        className="hidden sm:flex absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded transition"
        aria-label="Previous slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={goToNext}
        className="hidden sm:flex absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 pointer-events-auto bg-zinc-950/60 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 p-2 rounded transition"
        aria-label="Next slide"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {newsItems.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-1.5 rounded-full transition-all ${index === currentSlide ? "bg-white w-6" : "bg-white/40 w-2 hover:bg-white/60"}`}
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Updates</p>
          <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-zinc-100">News & Releases</h1>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {newsItems.map((item) => (
            <article
              key={item.id}
              id={item.anchorId}
              className="rounded border border-zinc-800 bg-zinc-900/30 p-5 sm:p-6 hover:border-zinc-700 transition scroll-mt-20"
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full sm:w-60 h-40 object-cover rounded bg-zinc-950"
                />
                <div className="flex-1 space-y-2">
                  <h3 className="text-base sm:text-lg font-medium text-zinc-100">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{item.content}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
