"use client";
import dynamic from "next/dynamic";
import Navbar from "@/components/Navbar";
import DeferredHomeHeroVideo from "@/components/home/DeferredHomeHeroVideo";
import LazyWhenVisible from "@/components/LazyWhenVisible";
import { useHeroContent } from "@/hooks/useHeroContent";
import { Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import HeroDescription from "@/components/home/HeroDescription";
import HomePageHead from "@/components/seo/HomePageHead";
import { getCountryImagePath } from "@/utils/countryImage";
import { useState, useEffect, useRef } from "react";

const CountryCardsSection = dynamic(() => import("@/components/CountryCardsSection"), {
  loading: () => <div className="min-h-[120px]" />,
});
const VisaHeroSection = dynamic(() => import("@/components/CountryRotator"), {
  loading: () => <div className="min-h-[80px]" aria-hidden />,
  ssr: false,
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
const StickyBottomBar = dynamic(() => import("@/components/StickyBottomBar"), {
  ssr: false,
  loading: () => (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 h-[72px] pointer-events-none"
      aria-hidden
    />
  ),
});
const Reviews = dynamic(() => import("@/components/Reviews"), {
  loading: () => <div className="min-h-[140px] w-full" aria-hidden />,
});
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

const Index = () => {
  const { heroContent } = useHeroContent();
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
        const [contentHomeRes, occasionRes] = await Promise.all([
          fetch("/api/content-home").catch(() => null),
          fetch("/api/occasion-content").catch(() => null),
        ]);

        const byKey = {};
        if (contentHomeRes?.ok) {
          const contentJson = await contentHomeRes.json();
          Object.assign(byKey, contentJson?.data || {});
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
      image: getCountryImagePath(country.name),
      bgColor: country.bgColor,
    }));

  const secondSectionCountries = everydayStealsCountries
    .filter((country) => !country.isHidden)
    .map((country) => ({
      name: country.name,
      image: getCountryImagePath(country.name),
      bgColor: country.bgColor,
    }));

  return (
    <div className="w-full mx-auto h-full min-h-screen pb-[72px]">
      <HomePageHead />
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
          <DiscountTicket content={heroContent} />
          <div className="relative flex flex-col items-center justify-center text-left sm:text-center max-w-[1200px] min-h-[350px] sm:min-h-[500px] w-full overflow-hidden rounded-[30px] px-4 sm:px-8 pt-3 sm:pt-8 pb-12 sm:pb-20 aspect-[4/3] sm:aspect-auto">
            <DeferredHomeHeroVideo poster="/image/hero-poster.png" />

            <div className="relative z-10 max-w-4xl min-h-[12rem] sm:min-h-[14rem] w-full">
              <div className="hidden lg:block" />
              <h1
                suppressHydrationWarning
                className="text-4xl sm:text-4xl md:text-[5.5rem] font-gilroy-bold leading-tight mb-2 max-sm:mb-2 sm:mb-8 max-sm:tracking-tighter [text-wrap:balance] min-h-[2.75rem] sm:min-h-[3rem] md:min-h-[6.5rem]"
              >
                {heroContent.title}
              </h1>

              <p
                suppressHydrationWarning
                className="text-base sm:text-[25px] md:text-[28px] font-extrabold leading-tight md:text-center min-h-[3.5rem] sm:min-h-[4rem] md:min-h-[4.5rem]"
              >
                <HeroDescription description={heroContent.description} />
              </p>
            </div>
          </div>

          <div className="relative z-20 -mt-2 md:-mt-12">
            <VisaHeroSection />
          </div>
          <LazyWhenVisible
            minHeight="140px"
            className="relative w-screen max-w-none left-1/2 -translate-x-1/2"
          >
            <Reviews />
          </LazyWhenVisible>
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
                  <h2
                    suppressHydrationWarning
                    className="text-[26px] lg:text-[32px] font-gilroy-bold text-white leading-tight"
                  >
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
                        <p suppressHydrationWarning>{priceMatchTooltip}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#6F48FF]" />
                      </div>
                    )}
                  </div>
                </div>

                <p
                  suppressHydrationWarning
                  className="text-gray-400 text-sm md:text-md max-w-2xl font-gilroy-medium"
                >
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
