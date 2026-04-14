"use client";
import ComparisonSection from "@/components/ComparisonSection";
import CountryCardsSection from "@/components/CountryCardsSection";
import VisaHeroSection from "@/components/CountryRotator";
import FeaturesSection from "@/components/FeaturesSection";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import OurMission from "@/components/OurMission";
import PremiumServiceSection from "@/components/PremiumServiceSection";
import VisaSolution from "@/components/VisaSolution";
import AppDownloadPopup from "@/components/AppDownloadPopup";
import { useHeroContent } from "@/hooks/useHeroContent";
import { Info } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import StickyBottomBar from "@/components/StickyBottomBar";
import Reviews from "@/components/Reviews";
import VisaProcessSection from "@/components/home/VisaProcessSection";
import DiscountTicket from "@/components/DiscountTicket";
import { useState, useEffect, useRef } from "react";
import { getAdminApiBase } from "@/utils/adminApiBase";
import FAQSection from "@/components/Faqs";

const defaultContactCards = {
  reduce: {
    title: "Reduce your odds of rejection",
    description:
      "Benefit from document pre-checks, error-proof form filling, and personalised visa guidance, powered by AI with human oversight at critical checkpoints — all designed to prevent delays, mistakes, and rejections, allowing our customers to benefit from a 99.3% approval rate.",
  },
  touch: {
    title: "Always in touch",
    description: "Got any question? Get in touch with 24/7 live human support available.",
  },
  reporting: {
    title: "Realtime reporting",
    description: "On the go online updates for your visa process with instant handy notifications.",
  },
  mind: {
    title: "Peace of mind",
    description: "Registered with ICO & GDPR compliant. End-to-end security, no data sharing.",
  },
};

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
  const [visaSolutionContent, setVisaSolutionContent] = useState(defaultVisaSolutionContent);
  const [everydayStealsCountries, setEverydayStealsCountries] = useState(defaultEverydayStealsCountries);
  const [occasionContent, setOccasionContent] = useState(null);
  const [occasionSubtitle, setOccasionSubtitle] = useState(null);
  const [urgentDescription, setUrgentDescription] = useState("");

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
        const adminBase = getAdminApiBase();

        const [contentRes] = await Promise.all([
          fetch(`${adminBase}/api/content?t=${Date.now()}`),
        ]);

        if (contentRes.ok) {
          const contentJson = await contentRes.json();
          const contentRows = Array.isArray(contentJson?.data) ? contentJson.data : [];
          const byKey = contentRows.reduce((acc, row) => {
            if (row?.key) acc[row.key] = row.value;
            return acc;
          }, {});
          setContactCards({
            reduce: {
              title: byKey.contact_reduce_title || defaultContactCards.reduce.title,
              description:
                byKey.contact_reduce_description || defaultContactCards.reduce.description,
            },
            touch: {
              title: byKey.contact_touch_title || defaultContactCards.touch.title,
              description:
                byKey.contact_touch_description || defaultContactCards.touch.description,
            },
            reporting: {
              title: byKey.contact_reporting_title || defaultContactCards.reporting.title,
              description:
                byKey.contact_reporting_description || defaultContactCards.reporting.description,
            },
            mind: {
              title: byKey.contact_mind_title || defaultContactCards.mind.title,
              description:
                byKey.contact_mind_description || defaultContactCards.mind.description,
            },
          });

          setUrgentDescription(
            byKey.urgent_description ||
              "*If require urgent appointment in 3-4 days kindly email support@nuvisa.co.uk do not follow the standard visa process."
          );
          setOccasionContent(byKey.ocassion_title || null);
          setOccasionSubtitle(byKey.ocassion_subtitle || null);
          setVisaSolutionContent({
            title: byKey.visasolution_title || defaultVisaSolutionContent.title,
            subtitle: byKey.visasolution_subtitle || defaultVisaSolutionContent.subtitle,
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
            parsedCountries.length > 0 ? parsedCountries : defaultEverydayStealsCountries
          );
        }

      } catch (_error) {
        // Keep defaults on fetch failure
      }
    };

    fetchHomepageDynamicContent();
  }, []);

  const secondSectionCountries = everydayStealsCountries
    .filter((country) => !country.isHidden)
    .map((country) => ({
      name: country.name,
      image: buildCountryImagePath(country.name),
      bgColor: country.bgColor,
    }));

  return (
    <div className="w-full mx-auto h-full min-h-screen">
      <div className="pri_bg text-white pb-[34px]">
        <Navbar />

        <main className="flex items-center justify-center flex-col pb-[45px] mt-4 md:min-h-[calc(100vh-200px)] px-5 md:px-6">
          <DiscountTicket loading={loading} content={heroContent} />
          <div className="relative flex flex-col items-center justify-center text-left sm:text-center max-w-[1200px] min-h-[350px] sm:min-h-[500px] w-full overflow-hidden rounded-[30px] px-4 sm:px-8 pt-3 sm:pt-8 pb-12 sm:pb-20">
            <div className="absolute inset-0 -z-0">
              <video
                className="w-full h-full object-cover scale-[1.2]"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              >
                <source src="/video/nuvisa.mp4" type="video/mp4" />
              </video>
              <div className="absolute inset-0 bg-black/45" />
            </div>

            <div className="relative z-10 max-w-4xl">
              <div className="hidden lg:block" />
              <h1 className="text-4xl sm:text-4xl md:text-[5.5rem] font-gilroy-bold leading-tight mb-2 max-sm:mb-2 sm:mb-8 max-sm:tracking-tighter">
                {loading ? "Don't Postpone Your Happiness!" : heroContent.title}
              </h1>

              <p className="text-[25px] md:text-[28px] font-extrabold leading-tight">
                {loading ? (
                  "Flat £200 fee, faster processing, dedicated support"
                ) : heroContent.description?.includes("+Link+") ? (
                  heroContent.description.split(" I ").map((part, index, array) => {
                    const isLast = index === array.length - 1;
                    if (part.includes("+Link+")) {
                      const [text, url] = part.split("+Link+");
                      return (
                        <span key={index}>
                          <Link href={url.trim()} className="hover:underline decoration-white/50 transition-all">
                            {text.trim()}
                          </Link>
                          {!isLast && " I "}
                        </span>
                      );
                    }
                    return (
                      <span key={index}>
                        {part}
                        {!isLast && " I "}
                      </span>
                    );
                  })
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
      <VisaSolution />
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
          urgentDescription={urgentDescription}
        />
      </div>

      <PremiumServiceSection contactCardsData={contactCards} />

      {/* Price Guarantee Section */}
      <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
        <div className="py-16 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="bg-[#1E1E27] rounded-4xl py-6 px-10 text-center shadow-2xl border border-gray-800">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="flex items-center gap-3 justify-center flex-wrap">
                  <Image src="/image/BadgeIcon.png" width={40} height={40} alt="Badge Icon" />
                  <h2 className="text-[26px] lg:text-[32px] font-gilroy-bold text-white leading-tight">
                    Price match guarantee
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
                      onMouseEnter={() => { if (!isMobile) setShowTooltip(true); }}
                      onMouseLeave={() => { if (!isMobile) setShowTooltip(false); }}
                    />
                    {showTooltip && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-3 bg-[#6F48FF] text-white text-[12px] font-normal leading-tight rounded-xl shadow-2xl z-50">
                        <p>Find it cheaper, we'll match the price</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[#6F48FF]" />
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-400 text-sm md:text-md max-w-2xl font-gilroy-medium">
                  At NUvisa, we want you to get your Schengen visa with total confidence,
                  knowing you're getting the best price in the market.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-purple-100 to-[#f3e6ff]">
        <OurMission />
        <Footer />
      </div>

      <StickyBottomBar key="index-page" />
      <AppDownloadPopup />
    </div>
  );
};

export default Index;