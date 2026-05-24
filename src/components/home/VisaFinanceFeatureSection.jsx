"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { staticCountries } from "@/constants/staticCountries";

const SLIDE_INTERVAL_MS = 5000;
const FADE_DURATION_MS = 900;

const carouselCountries = staticCountries.filter(
  (country) => country?.name && country?.image,
);

const proofPoints = [
  {
    value: "£30",
    label: "Monthly cost you pay for the Schengen visa",
  },
  {
    value: "No fees",
    label: "Pay absolutely no fees & 0% interest",
  },
  {
    value: "Flexible",
    label: "Spread the cost over 3 small payments",
  },
];

const VisaFinanceFeatureSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef(null);

  const carouselLength = carouselCountries.length;

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (carouselLength <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const isLastSlide = prevIndex === carouselLength - 1;
        return isLastSlide ? 0 : prevIndex + 1;
      });
    }, SLIDE_INTERVAL_MS);
  }, [carouselLength]);

  useEffect(() => {
    if (!carouselLength) return undefined;
    if (currentIndex >= carouselLength) {
      setCurrentIndex(0);
    }
    return undefined;
  }, [carouselLength, currentIndex]);

  useEffect(() => {
    if (carouselLength <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return undefined;
    }

    resetTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [carouselLength, resetTimer]);

  const goToPrevious = () => {
    if (!carouselLength) return;
    const isFirstSlide = currentIndex === 0;
    setCurrentIndex(isFirstSlide ? carouselLength - 1 : currentIndex - 1);
    resetTimer();
  };

  const goToNext = () => {
    if (!carouselLength) return;
    const isLastSlide = currentIndex === carouselLength - 1;
    setCurrentIndex(isLastSlide ? 0 : currentIndex + 1);
    resetTimer();
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
    resetTimer();
  };

  return (
    <section className="visa-finance-section">
      <div className="visa-finance-panel">
        <div className="visa-finance-backgrounds" aria-hidden="true">
          {carouselCountries.map((country, index) => (
            <div
              key={country.id}
              className={`visa-finance-background-layer${
                index === currentIndex ? " is-active" : ""
              }`}
              style={{ backgroundImage: `url("${country.image}")` }}
            />
          ))}
          <div className="visa-finance-background-overlay" />
        </div>

        {carouselLength > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              className="visa-finance-carousel-btn visa-finance-carousel-btn-prev"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={goToNext}
              className="visa-finance-carousel-btn visa-finance-carousel-btn-next"
              aria-label="Next slide"
            >
              <ChevronRight size={24} aria-hidden="true" />
            </button>
            <div className="visa-finance-carousel-dots">
              {carouselCountries.map((country, index) => (
                <button
                  key={country.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  className={`visa-finance-carousel-dot${
                    index === currentIndex ? " is-active" : ""
                  }`}
                  aria-label={`Go to ${country.name}`}
                  aria-current={index === currentIndex ? "true" : undefined}
                />
              ))}
            </div>
          </>
        )}

        <div className="visa-finance-content">
          <div className="visa-finance-copy">
            <h2 className="visa-finance-title">
              Get the Schengen visa
              <br className="hidden sm:block" /> from just £30
              <span className="visa-finance-slash">/</span>month
            </h2>

            <p className="visa-finance-description">
              With 0% interest and no fees, split your payment in 3 and get
              access to 29 European countries costs less than a weekend
              eat-out.
            </p>

            <Link href="/get-the-visa" className="visa-finance-cta">
              <Image
                src="/icons/klarna.png"
                width={82}
                height={41}
                alt="Klarna"
                className="visa-finance-klarna-logo"
              />
              <span>ENJOY NOW. PAY LATER</span>
              <ArrowUpRight
                className="visa-finance-cta-icon"
                aria-hidden="true"
              />
            </Link>
          </div>

          <div className="visa-finance-proof-grid">
            {proofPoints.map((point) => (
              <div key={point.value} className="visa-finance-proof">
                <p className="visa-finance-proof-value">{point.value}</p>
                <p className="visa-finance-proof-label">{point.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .visa-finance-section {
          width: 100%;
          background: #ffffff;
          padding: 104px 24px 104px;
        }

        .visa-finance-panel {
          position: relative;
          width: 100%;
          max-width: 86rem;
          min-height: 680px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border-radius: 42px;
          color: #ffffff;
          padding: 56px 80px;
        }

        .visa-finance-backgrounds {
          position: absolute;
          inset: 0;
          z-index: 0;
          overflow: hidden;
          border-radius: inherit;
        }

        .visa-finance-background-layer {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          opacity: 0;
          transition: opacity ${FADE_DURATION_MS}ms ease-in-out;
          will-change: opacity;
        }

        .visa-finance-background-layer.is-active {
          opacity: 1;
        }

        .visa-finance-background-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.52);
          pointer-events: none;
        }

        .visa-finance-carousel-btn {
          position: absolute;
          top: 50%;
          z-index: 2;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px;
          border: none;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          color: rgba(0, 0, 0, 0.8);
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
          cursor: pointer;
          transition:
            background 300ms ease,
            transform 300ms ease;
        }

        .visa-finance-carousel-btn:hover {
          background: #ffffff;
        }

        .visa-finance-carousel-btn:focus-visible {
          outline: 2px solid rgba(255, 255, 255, 0.85);
          outline-offset: 3px;
        }

        .visa-finance-carousel-btn-prev {
          left: 24px;
        }

        .visa-finance-carousel-btn-next {
          right: 24px;
        }

        .visa-finance-carousel-dots {
          position: absolute;
          bottom: 28px;
          left: 50%;
          z-index: 2;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .visa-finance-carousel-dot {
          width: 10px;
          height: 10px;
          padding: 0;
          border: none;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.5);
          cursor: pointer;
          transition:
            width 300ms ease,
            background 300ms ease;
        }

        .visa-finance-carousel-dot.is-active {
          width: 24px;
          background: #ffffff;
        }

        .visa-finance-content {
          position: relative;
          z-index: 3;
          width: 100%;
          min-height: 590px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          pointer-events: none;
        }

        .visa-finance-content :global(a),
        .visa-finance-content :global(button) {
          pointer-events: auto;
        }

        .visa-finance-copy {
          max-width: 860px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .visa-finance-title {
          margin: 0;
          color: #ffffff;
          font-family: "GilroyBold", -apple-system, BlinkMacSystemFont, Roboto,
            "Helvetica Neue", Arial, sans-serif;
          font-size: 64px;
          line-height: 1.08;
          letter-spacing: 0;
          font-weight: 700;
        }

        .visa-finance-slash {
          display: inline-block;
          font-size: 0.84em;
          line-height: 1;
          transform: translateY(0.06em);
        }

        .visa-finance-description {
          max-width: 670px;
          margin: 28px auto 0;
          color: rgba(255, 255, 255, 0.8);
          font-family: "GilroyMedium", -apple-system, BlinkMacSystemFont, Roboto,
            "Helvetica Neue", Arial, sans-serif;
          font-size: 19px;
          line-height: 1.22;
          font-weight: 500;
        }

        :global(.visa-finance-cta) {
          min-width: 330px;
          min-height: 50px;
          margin-top: 28px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 999px;
          background: #f8b4c8;
          color: #000000;
          font-family: "GilroyBold", -apple-system, BlinkMacSystemFont, Roboto,
            "Helvetica Neue", Arial, sans-serif;
          font-size: 15px;
          font-weight: 700;
          line-height: 1;
          text-transform: uppercase;
          text-decoration: none;
          transition: transform 220ms ease;
        }

        :global(.visa-finance-cta:hover) {
          transform: scale(1.03);
        }

        :global(.visa-finance-cta:focus-visible) {
          outline: 2px solid rgba(255, 255, 255, 0.85);
          outline-offset: 4px;
        }

        :global(.visa-finance-cta-icon) {
          width: 16px;
          height: 16px;
        }

        :global(.visa-finance-klarna-logo) {
          height: 31px;
          width: auto;
          border-radius: 5px;
        }

        .visa-finance-proof-grid {
          width: 100%;
          max-width: 920px;
          margin-top: 54px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 40px;
          text-align: left;
        }

        .visa-finance-proof {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .visa-finance-proof-value {
          margin: 0;
          color: #ffffff;
          font-family: "GilroyBold", -apple-system, BlinkMacSystemFont, Roboto,
            "Helvetica Neue", Arial, sans-serif;
          font-size: 54px;
          line-height: 1;
          font-weight: 700;
        }

        .visa-finance-proof-label {
          max-width: 250px;
          margin: 16px 0 0;
          color: rgba(255, 255, 255, 0.8);
          font-family: "GilroyMedium", -apple-system, BlinkMacSystemFont, Roboto,
            "Helvetica Neue", Arial, sans-serif;
          font-size: 16px;
          line-height: 1.22;
          font-weight: 500;
        }

        @media (max-width: 1023px) {
          .visa-finance-panel {
            min-height: 620px;
            padding: 52px 40px;
          }

          .visa-finance-title {
            font-size: 54px;
          }

          .visa-finance-carousel-btn-prev {
            left: 16px;
          }

          .visa-finance-carousel-btn-next {
            right: 16px;
          }
        }

        @media (max-width: 767px) {
          .visa-finance-section {
            padding: 72px 16px 80px;
          }

          .visa-finance-panel {
            min-height: 680px;
            border-radius: 34px;
            padding: 46px 22px;
          }

          .visa-finance-background-layer {
            background-position: 68% center;
          }

          .visa-finance-content {
            min-height: 588px;
          }

          .visa-finance-title {
            font-size: 38px;
          }

          .visa-finance-description {
            margin-top: 24px;
            font-size: 15px;
            line-height: 1.28;
          }

          :global(.visa-finance-cta) {
            width: 100%;
            min-width: 0;
            max-width: 330px;
            font-size: 13px;
          }

          .visa-finance-proof-grid {
            margin-top: 42px;
            grid-template-columns: 1fr;
            gap: 28px;
            text-align: center;
          }

          .visa-finance-proof {
            align-items: center;
          }

          .visa-finance-proof-value {
            font-size: 44px;
          }

          .visa-finance-proof-label {
            margin-top: 12px;
            font-size: 15px;
          }

          .visa-finance-carousel-btn {
            padding: 6px;
          }

          .visa-finance-carousel-btn-prev {
            left: 10px;
          }

          .visa-finance-carousel-btn-next {
            right: 10px;
          }

          .visa-finance-carousel-dots {
            bottom: 18px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .visa-finance-background-layer {
            transition: none;
          }

          .visa-finance-carousel-dot {
            transition: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .visa-finance-background-layer {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
};

export default VisaFinanceFeatureSection;
