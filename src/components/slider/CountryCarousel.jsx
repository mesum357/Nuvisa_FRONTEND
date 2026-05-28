"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_COUNTRY_IMAGE, preferCountryWebp } from "@/utils/countryImage";

const HERO_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 800px, 960px";

/**
 * Country image carousel — horizontal slide track (no single-image src swap).
 */
export default function CountryCarousel({
  carouselCountries,
  currentIndex,
  setCurrentIndex,
  goToPrevious,
  goToNext,
  resetTimer,
  thumbnailContainerRef,
}) {
  useEffect(() => {
    if (typeof document === "undefined" || !carouselCountries.length) {
      return undefined;
    }

    const preloadCount = Math.min(3, carouselCountries.length);
    const links = [];

    for (let i = 0; i < preloadCount; i += 1) {
      const href = preferCountryWebp(carouselCountries[i]?.image);
      if (!href) continue;

      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      link.setAttribute("data-nuvisa-preload", `carousel-hero-${i}`);
      document.head.appendChild(link);
      links.push(link);
    }

    return () => {
      links.forEach((link) => link.remove());
    };
  }, [carouselCountries]);

  if (!carouselCountries.length) {
    return null;
  }

  return (
    <section className="mt-1 w-full max-sm:mt-0">
      <div className="relative w-full">
        <div className="overflow-hidden rounded-3xl shadow-lg max-sm:rounded-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out motion-reduce:transition-none motion-reduce:duration-0"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
            }}
            aria-live="polite"
          >
            {carouselCountries.map((country, index) => (
              <div
                key={country.id ?? country.name ?? index}
                className="relative w-full shrink-0"
              >
                <Image
                  src={preferCountryWebp(country.image || DEFAULT_COUNTRY_IMAGE)}
                  alt={country.name || "Country"}
                  width={800}
                  height={800}
                  sizes={HERO_SIZES}
                  className="w-full aspect-square object-cover"
                  priority={index <= 1}
                  fetchPriority={index === 0 ? "high" : "auto"}
                  loading={index <= 1 ? "eager" : "lazy"}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 max-sm:p-4 pointer-events-none">
                  <h3 className="text-2xl font-gilroy-bold text-white max-sm:text-xl mb-5">
                    {country.name || ""}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/70 flex items-center text-black/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-300 z-10 max-sm:left-2 max-sm:p-1.5"
          aria-label="Previous slide"
        >
          <ChevronLeft size={24} className="max-sm:w-5 max-sm:h-5" />
        </button>
        <button
          type="button"
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/70 flex items-center text-black/80 hover:bg-white p-2 rounded-full shadow-md transition-all duration-300 z-10 max-sm:right-2 max-sm:p-1.5"
          aria-label="Next slide"
        >
          <ChevronRight size={24} className="max-sm:w-5 max-sm:h-5" />
        </button>

        <div className="flex justify-center gap-2 absolute bottom-5 left-1/2 -translate-x-1/2 max-sm:bottom-3 z-10">
          {carouselCountries.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setCurrentIndex(index);
                resetTimer();
              }}
              className={`w-2.5 h-2.5 cursor-pointer rounded-full transition-all max-sm:w-2 max-sm:h-2 ${
                index === currentIndex
                  ? "bg-white w-6 max-sm:w-4"
                  : "bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
            />
          ))}
        </div>
      </div>

      <div
        ref={thumbnailContainerRef}
        className="flex justify-start pb-10 gap-2 max-lg:hidden mt-8 overflow-x-auto overflow-y-hidden w-full max-sm:mt-4 px-4"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {carouselCountries.map((country, index) => (
          <Image
            key={country.id}
            src={preferCountryWebp(country.image)}
            alt={country.name}
            width={80}
            height={80}
            sizes="80px"
            onClick={() => {
              setCurrentIndex(index);
              resetTimer();
            }}
            className={`w-20 aspect-square object-cover cursor-pointer rounded-xl border-2 transition-all max-sm:w-12 max-sm:rounded-lg ${
              index === currentIndex
                ? "border-[#7350FF]"
                : "border-white opacity-70 hover:opacity-100"
            }`}
            loading="lazy"
            style={{ boxSizing: "border-box" }}
          />
        ))}
      </div>
    </section>
  );
}
