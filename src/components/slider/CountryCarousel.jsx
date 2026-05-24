"use client";

import Image from "next/image";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEFAULT_COUNTRY_IMAGE, preferCountryWebp } from "@/utils/countryImage";

const HERO_SIZES =
  "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1440px) 800px, 960px";

/**
 * Country image carousel — kept separate so the main Slider chunk parses less upfront.
 */
export default function CountryCarousel({
  carouselCountries,
  activeCarouselCountry,
  currentIndex,
  setCurrentIndex,
  goToPrevious,
  goToNext,
  resetTimer,
  thumbnailContainerRef,
  compact = false,
}) {
  const heroSrc = preferCountryWebp(
    activeCarouselCountry?.image || DEFAULT_COUNTRY_IMAGE,
  );

  useEffect(() => {
    const first = carouselCountries[0]?.image;
    if (!first || typeof document === "undefined") return undefined;

    const existing = document.querySelector(
      'link[data-nuvisa-preload="carousel-hero"]',
    );
    if (existing) return undefined;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = preferCountryWebp(first);
    link.setAttribute("data-nuvisa-preload", "carousel-hero");
    document.head.appendChild(link);

    return () => {
      link.remove();
    };
  }, [carouselCountries]);

  return (
    <section className={compact ? "mt-0 w-full" : "mt-1 w-full max-sm:mt-0"}>
      <div className="relative w-full">
        <div
          className={`overflow-hidden shadow-lg ${
            compact ? "rounded-2xl max-sm:rounded-xl" : "rounded-3xl max-sm:rounded-2xl"
          }`}
        >
          <div className="relative h-full w-full">
            <Image
              src={heroSrc}
              alt={activeCarouselCountry?.name || "Country"}
              width={800}
              height={800}
              sizes={HERO_SIZES}
              className={`w-full object-cover ${
                compact
                  ? "aspect-[16/9] sm:aspect-[16/10] max-h-[min(50vh,380px)] sm:max-h-[min(52vh,420px)] lg:max-h-[min(48vh,400px)]"
                  : "aspect-[4/3] sm:aspect-[5/4] lg:aspect-[16/10] xl:aspect-[4/3] max-h-[min(70vh,560px)]"
              }`}
              priority={currentIndex === 0}
              fetchPriority={currentIndex === 0 ? "high" : "auto"}
              loading={currentIndex === 0 ? "eager" : "lazy"}
            />
            <div
              className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent ${
                compact ? "p-3 max-sm:p-2.5" : "p-6 max-sm:p-4"
              }`}
            >
              <h3
                className={`font-gilroy-bold text-white ${
                  compact
                    ? "text-lg max-sm:text-base mb-0"
                    : "text-2xl max-sm:text-xl mb-5"
                }`}
              >
                {activeCarouselCountry?.name || ""}
              </h3>
            </div>
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

        <div
          className={`flex justify-center gap-2 absolute left-1/2 -translate-x-1/2 ${
            compact ? "bottom-3 max-sm:bottom-2.5" : "bottom-5 max-sm:bottom-3"
          }`}
        >
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
            />
          ))}
        </div>
      </div>

      <div
        ref={thumbnailContainerRef}
        className={`flex justify-start gap-2 overflow-x-auto overflow-y-hidden w-full px-1 sm:px-4 ${
          compact
            ? "mt-2 pb-2 md:mt-2.5 md:pb-3 max-sm:mt-1.5"
            : "pb-6 md:pb-10 mt-6 md:mt-8 max-sm:mt-4"
        }`}
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
            className={`aspect-square object-cover cursor-pointer rounded-xl border-2 transition-all max-sm:rounded-lg ${
              compact ? "w-14 max-sm:w-11" : "w-20 max-sm:w-12"
            } ${
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
