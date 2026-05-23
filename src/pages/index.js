"use client";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import DeferredHomeHeroVideo from "@/components/home/DeferredHomeHeroVideo";
import LazyWhenVisible from "@/components/LazyWhenVisible";
import { useHeroContent } from "@/hooks/useHeroContent";
import { Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

const CountryCardsSection = dynamic(() => import("@/components/CountryCardsSection"), {
  loading: () => <div className="min-h-[120px]" />,
});
const VisaHeroSection = dynamic(() => import("@/components/CountryRotator"), {
  loading: () => <div className="min-h-[80px]" />,
});
const sectionSkeleton = (minH = "120px") => () => (
  <div className="animate-pulse bg-gray-100/40 dark:bg-gray-800/30 rounded-lg min-h-[120px]" style={{ minHeight: minH }} />
);
const Footer = dynamic(() => import("@/components/Footer"), {
  loading: sectionSkeleton("200px"),
});
const OurMission = dynamic(() => import("@/components/OurMission"), {
  loading: sectionSkeleton(),
});
const PremiumServiceSection = dynamic(() => import("@/components/PremiumServiceSection"), {
  loading: sectionSkeleton(),
});
const VisaSolution = dynamic(() => import("@/components/VisaSolution"), {
  loading: sectionSkeleton(),
});
const VisaFinanceFeatureSection = dynamic(
  () => import("@/components/home/VisaFinanceFeatureSection"),
  { loading: sectionSkeleton("360px") }
);
const StickyBottomBar = dynamic(() => import("@/components/StickyBottomBar"), { ssr: false });
const Reviews = dynamic(() => import("@/components/Reviews"), { loading: () => null });
const VisaProcessSection = dynamic(() => import("@/components/home/VisaProcessSection"));
const DiscountTicket = dynamic(() => import("@/components/DiscountTicket"));
const FAQSection = dynamic(() => import("@/components/Faqs"), {
  loading: sectionSkeleton("240px"),
});
const AppDownloadPopup = dynamic(() => import("@/components/AppDownloadPopup"), {
  ssr: false,
  loading: () => null,
});

const defaultContactCards = {
  reduce: {
    title: "Reduce your odds of rejection",
    description:
      "Benefit from document pre-checks, error-proof form filling, and personalised visa guidance, powered by AI with human oversight at critical checkpoints — all designed to prevent delays, mistakes, and rejections, allowing our customers to benefit from a 99.3% approval rate.",
  },
  touch: {
    title: "Always in touch",
    description:
      "Got any question? Get in touch with 24/7 live human support available.",
  },
  reporting: {
    title: "Realtime reporting",
    description:
      "On the go online updates for your visa process with instant handy notifications.",
  },
  mind: {
    title: "Peace of mind",
    description:
      "Registered with ICO & GDPR compliant. End-to-end security, no data sharing.",
  },
};

const defaultTopDestinationContent = {
  title: "Top Destinations",
  subtitle:
    "Explore our most popular visa destinations loved by travellers worldwide.",
};

const defaultTopDestinationCountries = [
  { name: "France", bgColor: "#5f9aff", isHidden: false },
  { name: "Spain", bgColor: "#ff8e59", isHidden: false },
  { name: "Italy", bgColor: "#daee69", isHidden: false },
  { name: "Germany", bgColor: "#fdfd55", isHidden: false },
  { name: "Netherlands", bgColor: "#ffb1ee", isHidden: false },
];

const defaultVisaSolutionContent = {
  title: "Everyday Steals",
  subtitle:
    "A curated edit of handpicked countries for travellers who are on budget and want to access Schengen countries.",
};

const defaultEverydayStealsCountries = [
  { name: "Lithuania", bgColor: "#5f9aff", isHidden: false },
  { name: "Greece", bgColor: "#ff8e59", isHidden: false },
  { name: "Malta", bgColor: "#daee69", isHidden: false },
  { name: "Latvia", bgColor: "#fdfd55", isHidden: false },
  { name: "Luxembourg", bgColor: "#ffb1ee", isHidden: false },
];

const buildCountryImagePath = (countryName) =>
  `/image/country/${encodeURIComponent(String(countryName || "").trim())}.jpg`;

const Index = () => {
  const { heroContent, loading } = useHeroContent();
  const [showTooltip, setShowTooltip] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const tooltipRef = useRef(null);
  const [contactCards, setContactCards] = useState(defaultContactCards);
  const [topDestinationContent, setTopDestinationContent] = useState(
    defaultTopDestinationContent
  );
  const [topDestinationCountries, setTopDestinationCountries] = useState(
    defaultTopDestinationCountries
  );
  const [visaSolutionContent, setVisaSolutionContent] = useState(
    defaultVisaSolutionContent
  );
  const [everydayStealsCountries, setEverydayStealsCountries] = useState(
    defaultEverydayStealsCountries
  );
  const [occasionContent, setOccasionContent] = useState(null);
  const [occasionSubtitle, setOccasionSubtitle] = useState(null);
  const [occasionSectionData, setOccasionSectionData] = useState(null);
  const [urgentDescription, setUrgentDescription] = useState("");
  const [priceMatchTitle, setPriceMatchTitle] = useState(
    "The NUvisa Price Match Promise"
  );
  const [priceMatchDescription, setPriceMatchDescription] = useState(
    "At NUvisa, we want you to get your Schengen visa with total confidence, that's why we regularly review our prices. In fact, we promise to match any like-for-like Schengen visa price, so you can apply with peace of mind."
  );
  const [priceMatchTooltip, setPriceMatchTooltip] = useState(
    "We pride ourselves on our fair prices, expertise, and simplicity. Meaning you won't find better value elsewhere, thanks to our unbeatable prices. Find it cheaper, and we'll match the price — that's a promise."
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!showTooltip) return;
    const handleClickOutside = (e) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target)) {
        setShowTooltip(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showTooltip]);

  useEffect(() => {
    const fetchHomepageDynamicContent = async () => {
      try {
        const [contentHomeRes, backendCmsRes, occasionRes] = await Promise.all([
          fetch(`/api/content-home?t=${Date.now()}`).catch(() => null),
          fetch(`/api/homepage-content?t=${Date.now()}`).catch(() => null),
          fetch("/api/occasion-content").catch(() => null),
        ]);

        const byKey = {};
        if (contentHomeRes?.ok) {
          const contentJson = await contentHomeRes.json();
          Object.assign(byKey, contentJson?.data || {});
        }
        if (backendCmsRes?.ok) {
          const backendJson = await backendCmsRes.json();
          const backendData = backendJson?.data || {};
          Object.assign(byKey, backendData);
        }
        if (occasionRes?.ok) {
          const occJson = await occasionRes.json();
          const occData = occJson?.data || {};
          if (occJson?.success && occData) {
            setOccasionSectionData(occData);
          }
          if (occData.title) {
            byKey.occasion_section_title = occData.title;
            byKey.ocassion_title = occData.title;
          }
          if (occData.description) {
            byKey.occasion_section_subtitle = occData.description;
            byKey.ocassion_subtitle = occData.description;
          }
        }

        if (Object.keys(byKey).length > 0) {
          setContactCards({
            reduce: {
              title:
                byKey.contact_reduce_title || defaultContactCards.reduce.title,
              description:
                byKey.contact_reduce_description ||
                defaultContactCards.reduce.description,
            },
            touch: {
              title:
                byKey.contact_touch_title || defaultContactCards.touch.title,
              description:
                byKey.contact_touch_description ||
                defaultContactCards.touch.description,
            },
            reporting: {
              title:
                byKey.contact_reporting_title ||
                defaultContactCards.reporting.title,
              description:
                byKey.contact_reporting_description ||
                defaultContactCards.reporting.description,
            },
            mind: {
              title: byKey.contact_mind_title || defaultContactCards.mind.title,
              description:
                byKey.contact_mind_description ||
                defaultContactCards.mind.description,
            },
          });

          setUrgentDescription(byKey.urgent_description);
          setOccasionContent(
            byKey.occasion_section_title || byKey.ocassion_title || null
          );
          setOccasionSubtitle(
            byKey.occasion_section_subtitle || byKey.ocassion_subtitle || null
          );
          setVisaSolutionContent({
            title: byKey.visasolution_title || defaultVisaSolutionContent.title,
            subtitle:
              byKey.visasolution_subtitle ||
              defaultVisaSolutionContent.subtitle,
          });

          let parsedCountries = [];
          if (byKey.visasolution_everyday_countries) {
            try {
              const parsed = JSON.parse(byKey.visasolution_everyday_countries);
              if (Array.isArray(parsed)) {
                parsedCountries = parsed
                  .map((item) => ({
                    name: String(item?.name || "").trim(),
                    bgColor: String(item?.bgColor || "").trim() || "#5f9aff",
                    isHidden: Boolean(item?.isHidden),
                  }))
                  .filter((item) => item.name);
              }
            } catch {
              // Keep defaults if malformed.
            }
          }

          setEverydayStealsCountries(
            parsedCountries.length > 0
              ? parsedCountries
              : defaultEverydayStealsCountries
          );

          setTopDestinationContent({
            title:
              byKey.topdestination_title || defaultTopDestinationContent.title,
            subtitle:
              byKey.topdestination_subtitle ||
              defaultTopDestinationContent.subtitle,
          });

          let parsedTopCountries = [];
          if (byKey.topdestination_countries) {
            try {
              const parsed = JSON.parse(byKey.topdestination_countries);
              if (Array.isArray(parsed)) {
                parsedTopCountries = parsed
                  .map((item) => ({
                    name: String(item?.name || "").trim(),
                    bgColor: String(item?.bgColor || "").trim() || "#5f9aff",
                    isHidden: Boolean(item?.isHidden),
                  }))
                  .filter((item) => item.name);
              }
            } catch {
              // Keep defaults if malformed.
            }
          }

          setTopDestinationCountries(
            parsedTopCountries.length > 0
              ? parsedTopCountries
              : defaultTopDestinationCountries
          );

          if (byKey.price_match_title) setPriceMatchTitle(byKey.price_match_title);
          if (byKey.price_match_description)
            setPriceMatchDescription(byKey.price_match_description);
          if (byKey.price_match_tooltip) setPriceMatchTooltip(byKey.price_match_tooltip);
        }
      } catch (_error) {
        // Keep defaults on fetch failure
      }
    };

    fetchHomepageDynamicContent();
  }, []);

  const topDestinationSectionCountries = topDestinationCountries
    .filter((country) => !country.isHidden)
    .map((country) => ({
      name: country.name,
      image: buildCountryImagePath(country.name),
      bgColor: country.bgColor,
    }));

  const secondSectionCountries = everydayStealsCountries
    .filter((country) => !country.isHidden)
    .map((country) => ({
      name: country.name,
      image: buildCountryImagePath(country.name),
      bgColor: country.bgColor,
    }));

  return (
    <div className="w-full mx-auto h-full min-h-screen">
      <style>{`
        @keyframes draw-guarantee {
          from { stroke-dashoffset: 1; }
          to   { stroke-dashoffset: 0; }
        }
        .guarantee-wrapper .guarantee-oval-stroke {
          stroke-dasharray: 1;
          stroke-dashoffset: 0;
        }
        .guarantee-wrapper:hover .guarantee-oval-stroke {
          animation: draw-guarantee 0.8s ease-out forwards;
        }
      `}</style>
      <div className="pri_bg text-white pb-[34px]">
        <Navbar />

        <main className="flex items-center justify-center flex-col pb-[45px] mt-4 md:min-h-[calc(100vh-200px)] px-5 md:px-6">
          <DiscountTicket loading={loading} content={heroContent} />
          <div className="relative flex flex-col items-center justify-center text-left sm:text-center max-w-[1200px] min-h-[350px] sm:min-h-[500px] w-full overflow-hidden rounded-[30px] px-4 sm:px-8 pt-3 sm:pt-8 pb-12 sm:pb-20">
            <DeferredHomeHeroVideo poster="/image/hero-poster.png" />

            <div className="relative z-10 max-w-4xl">
              <div className="hidden lg:block" />
              <h1 className="text-4xl sm:text-4xl md:text-[5.5rem] font-gilroy-bold leading-tight mb-2 max-sm:mb-2 sm:mb-8 max-sm:tracking-tighter">
                {loading ? "Don't Postpone Your Happiness!" : heroContent.title}
              </h1>

              <p className="text-base sm:text-[25px] md:text-[28px] font-extrabold leading-tight md:text-center">
                {loading ? (
                  "Flat £200 fee, faster processing, dedicated support"
                ) : heroContent.description?.includes("+Link+") ? (
                  <span className="inline-flex items-center gap-x-1 sm:gap-x-3 gap-y-2 border rounded-4xl px-2 sm:px-3 py-1.5 sm:px-5 sm:py-3">
                    {heroContent.description
                      .split(" I ")
                      .map((part, index, array) => {
                        const isLast = index === array.length - 1;
                        if (part.includes("+Link+")) {
                          const [text, url] = part.split("+Link+");
                          const isGuarantee =
                            text.trim().toLowerCase() === "our guarantee";
                          return (
                            <span
                              key={index}
                              className="inline-flex items-center gap-x-1 sm:gap-x-3"
                            >
                              <span
                                className={
                                  isGuarantee
                                    ? "relative inline-block guarantee-wrapper text-nowrap"
                                    : "text-nowrap"
                                }
                                style={
                                  isGuarantee ? { overflow: "visible" } : {}
                                }
                              >
                                <Link
                                  href={url.trim()}
                                  className={`hover:underline decoration-white/50 transition-all text-xs sm:text-xl${
                                    isGuarantee ? " relative z-10" : ""
                                  }`}
                                >
                                  {text.trim()}
                                </Link>
                                {isGuarantee && (
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 620 280"
                                    aria-hidden="true"
                                    className="absolute pointer-events-none h-auto sm:h-[200%]"
                                    style={{
                                      width: "135%",
                                      left: "50%",
                                      top: "50%",
                                      transform: "translate(-50%, -50%)",
                                    }}
                                    preserveAspectRatio="xMidYMid meet"
                                  >
                                    <defs>
                                      <mask id="guarantee-oval-mask">
                                        <g transform="matrix(1,0,0,1,-18.687,-10.376)">
                                          <g transform="matrix(1,0,0,1,320.411,150.613)">
                                            <path
                                              fill="white"
                                              d="M309.216,-11.293 C307.551,21.085 277.486,52.938 209.061,81.44 C202.201,84.296 195.167,86.773 188.044,88.959 C167.086,95.429 131.531,106.503 127.357,107.727 C-32.052,147.098 -206.581,124.134 -253.052,100.587 C-266.743,93.65 -266.188,108.98 -258.774,110.991 C-166.707,150.013 57.534,150.363 178.411,105.774 C293.481,66.81 320.161,22.863 318.176,-19.686 C315.841,-69.579 282.561,-99.508 188.161,-125.737 C99.393,-150.363 -159.614,-147.215 -248.966,-88.085 C-248.966,-88.085 -297.334,-59 -301.071,-20.356 C-305.42,24.553 -288.927,48.101 -225.263,79.458 C-161.599,110.816 -46.268,110.379 -28.315,111.865 C-4.233,113.876 -8.495,100.529 -16.873,100.878 C-186.732,101.519 -249.754,54.191 -269.545,40.582 C-289.336,26.972 -320.161,-22.921 -262.773,-67.655 C-205.385,-112.389 -62.176,-126.669 51.93,-126.669 C157.598,-126.669 229.001,-105.249 262.131,-84.995 C287.291,-69.637 310.586,-50.606 309.216,-11.293z"
                                            />
                                          </g>
                                        </g>
                                      </mask>
                                    </defs>
                                    <g mask="url(#guarantee-oval-mask)">
                                      <g transform="matrix(1,0,0,1,-48.922,-12.63)">
                                        <g transform="matrix(1,0,0,1,343.425,178.867)">
                                          <path
                                            className="guarantee-oval-stroke"
                                            pathLength="1"
                                            fill="none"
                                            stroke="rgb(85, 51, 222)"
                                            strokeWidth="26"
                                            strokeLinecap="butt"
                                            strokeLinejoin="miter"
                                            strokeMiterlimit="10"
                                            d="M20.767,78.349 C20.767,78.349 -150.952,91.853 -242.525,35.688 C-300.177,0.328 -330.925,-79.233 -196.787,-128.045 C-91.477,-166.367 71.105,-159.562 71.105,-159.562 C71.105,-159.562 313.014,-159.443 321.701,-45.794 C330.925,74.892 -47.659,166.367 -289.526,66.645"
                                          />
                                        </g>
                                      </g>
                                    </g>
                                  </svg>
                                )}
                              </span>
                              {!isLast && (
                                <span className="text-white/50 select-none">
                                  I
                                </span>
                              )}
                            </span>
                          );
                        }
                        return (
                          <span
                            key={index}
                            className="inline-flex items-center gap-x-1 sm:gap-x-3"
                          >
                            <span className="text-sm sm:text-xl">{part}</span>
                            {!isLast && (
                              <span className="text-white/50 select-none">
                                I
                              </span>
                            )}
                          </span>
                        );
                      })}
                  </span>
                ) : (
                  heroContent.description
                )}
              </p>
            </div>
          </div>

          <div className="relative z-20 -mt-2 md:-mt-12">
            <VisaHeroSection />
          </div>
          <Reviews />
        </main>

        <CountryCardsSection urgentDescription={urgentDescription} />
      </div>

      <LazyWhenVisible minHeight="400px" className="w-full">
      <VisaSolution
        title={topDestinationContent.title}
        subtitle={topDestinationContent.subtitle}
        countriesData={topDestinationSectionCountries}
      />
      <VisaFinanceFeatureSection />
      <FAQSection />

      <div className="bg-[#1E1E27] text-white w-full overflow-x-hidden pb-16">
        <VisaProcessSection />
      </div>

      <VisaSolution
        title={visaSolutionContent.title}
        subtitle={visaSolutionContent.subtitle}
        countriesData={secondSectionCountries}
      />

      <div className="bg-[#1E1E27] text-white w-full overflow-x-hidden py-16">
        <CountryCardsSection
          id="everyday-steals"
          image="/image/everyday_steals.png"
          occasionContent={occasionContent}
          occasionSubtitle={occasionSubtitle}
          initialOccasionData={occasionSectionData}
          urgentDescription={urgentDescription}
        />
      </div>

      <PremiumServiceSection contactCardsData={contactCards} />
      </LazyWhenVisible>

      {/* Price Guarantee Section */}
      <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
        <div className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-[#1E1E27] rounded-4xl py-6 px-10 text-center shadow-2xl border border-gray-800">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  <Image
                    src="/image/BadgeIcon.png"
                    width={40}
                    height={40}
                    alt="Badge Icon"
                  />
                  <h2 className="text-[26px] lg:text-[32px] font-gilroy-bold text-white leading-tight">
                    {priceMatchTitle}
                  </h2>

                  {/* Tooltip */}
                  <div ref={tooltipRef} className="relative flex items-center">
                    <Info
                      size={24}
                      className="text-gray-400 hover:text-[#6F48FF] transition-colors cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isMobile) setShowTooltip((prev) => !prev);
                      }}
                      onMouseEnter={() => {
                        if (!isMobile) setShowTooltip(true);
                      }}
                      onMouseLeave={() => {
                        if (!isMobile) setShowTooltip(false);
                      }}
                    />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-[#6F48FF] text-white text-[12px] font-normal leading-tight rounded-xl shadow-2xl z-50">
                        <p>{priceMatchTooltip}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#6F48FF]" />
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-sm md:text-md max-w-2xl font-gilroy-medium">
                  {priceMatchDescription}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LazyWhenVisible minHeight="280px" className="w-full">
        <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
          <OurMission />
          <Footer />
        </div>
      </LazyWhenVisible>

      <StickyBottomBar key="index-page" />
      <AppDownloadPopup />
    </div>
  );
};

export default Index;
