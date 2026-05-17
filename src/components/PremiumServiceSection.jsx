"use client";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useAppSelector } from "@/store"; // 👉 ADD THIS IMPORT

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

const PremiumServiceSection = ({ contactCardsData }) => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const totalCards = 4;

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const contactCards = contactCardsData || defaultContactCards;

  // 👉 ADD REDUX STATE AND GA4 TRACKING FUNCTION HERE
  const visaState = useAppSelector((state) => state.visa);

  const handleCTAClick = () => {
    // Get the current country & price from Redux state (or fallback to defaults)
    const currentCountry = visaState?.selectedCountry || "Schengen";
    const currentFee = visaState?.visaFees || 129;

    if (typeof window !== "undefined" && window.dataLayer) {
      window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          currency: "GBP",
          value: Number(currentFee.toFixed(2)),
          items: [
            {
              item_id: `visa_${currentCountry
                .toLowerCase()
                .replace(/\s+/g, "_")}`,
              item_name: `Visa - ${currentCountry}`,
              item_category: "Schengen Visa",
              item_brand: "NUvisa",
              price: Number(currentFee.toFixed(2)),
              quantity: 1,
            },
          ],
        },
      });
    }
  };
  // Mouse handlers
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };
  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // Touch handlers
  const touchStartXRef = useRef(0);
  const touchScrollLeftRef = useRef(0);
  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].pageX - scrollRef.current.offsetLeft;
    touchScrollLeftRef.current = scrollRef.current.scrollLeft;
  };
  const handleTouchMove = (e) => {
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = (x - touchStartXRef.current) * 2;
    scrollRef.current.scrollLeft = touchScrollLeftRef.current - walk;
  };

  const scrollToIndex = (index) => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * index;
      scrollRef.current.scrollTo({ left: scrollAmount, behavior: "smooth" });
      setActiveIndex(index);
    }
  };

  useEffect(() => {
    const current = scrollRef.current;
    if (!current) return;
    const handleScroll = () => {
      const index = Math.round(current.scrollLeft / current.clientWidth);
      setActiveIndex(index);
    };
    current.addEventListener("scroll", handleScroll);
    return () => current.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="bg-[#fefffe] text-black py-12 md:py-20 pb-10 px-4 md:px-6">
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <clipPath id="shape4" clipPathUnits="objectBoundingBox">
            <path
              strokeLinejoin="round"
              transform="translate(0.5, 0.5) scale(0.0026) translate(-240, -240)"
              d="M409 295.9a79 79 0 0 1 .7-112.5A80 80 0 0 0 296.6 70.3 79 79 0 0 1 184 71a80.7 80.7 0 0 0-113.4-1.1C39 101 39 152 70.3 183.4s30.5 82.7.7 112.5a80.7 80.7 0 0 0-1.1 113.4 80 80 0 0 0 113.5.4 79 79 0 0 1 113.2 0 80 80 0 0 0 113.5-.4c31-31.4 30-82.2-1.1-113.4Z"
            />
          </clipPath>
          <clipPath id="shape5" clipPathUnits="objectBoundingBox">
            <rect
              transform="translate(0.5, 0.5) scale(0.002) translate(-240, -240)"
              width="480"
              height="480"
              rx="160"
              ry="160"
            />
          </clipPath>
          <clipPath id="shape6" clipPathUnits="objectBoundingBox">
            <path
              transform="translate(0.5, 0.5) scale(0.002) translate(-240, -240)"
              d="M480,240c0,66.3-53.7,120-120,120c0,66.3-53.7,120-120,120s-120-53.7-120-120c-66.3,0-120-53.7-120-120s53.7-120,120-120c0-66.3,53.7-120,120-120s120,53.7,120,120C426.3,120,480,173.7,480,240z"
            />
          </clipPath>
        </defs>
      </svg>

      <div className="max-w-[85rem] mx-auto flex items-center flex-col justify-center text-black">
        {/* Header */}
        <div className="flex flex-col w-full lg:flex-row justify-between items-center lg:items-center mb-10 md:mb-16 gap-6">
          <div className="md:ml-5 text-center lg:text-left">
            <h1 className="text-[28px] sm:text-[36px] md:text-[48px] lg:text-[68px] font-gilroy-bold leading-tight">
              Premium service,
              <br />
              End-to-end encrypted
            </h1>
          </div>
          <div className="flex items-center justify-center">
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6">
              <Image
                src="/image/gdpr.webp"
                alt="GDPR"
                width={175}
                height={175}
                className="w-[120px] md:w-[130px] lg:w-[175px] object-contain"
                loading="lazy"
              />
              <Image
                src="/image/ICO-new.png"
                alt="ICO"
                width={175}
                height={175}
                className="w-[120px] md:w-[130px] lg:w-[175px] object-contain"
                loading="lazy"
              />
              <Image
                src="/image/pci-dss.png"
                alt="PCI"
                width={175}
                height={175}
                className="w-[120px] md:w-[130px] lg:w-[175px] object-contain"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Cards Slider */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className={`flex w-full overflow-x-auto hide-scrollbar select-none touch-pan-x ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          } ${isDragging ? "" : "scroll-smooth"}`}
          style={{ scrollSnapType: isDragging ? "none" : "x mandatory" }}
        >
          {/* Card 4 */}
          <div className="w-full flex-shrink-0 snap-center">
            <div
              className="rounded-[30px] md:rounded-[60px] w-full flex flex-col md:flex-row items-center justify-between p-6 md:py-3 md:px-16 gap-6 md:gap-0 transition-all duration-300 lg:min-h-117.5"
              style={{ backgroundColor: "#daee69" }}
            >
              <div className="w-full md:w-2/3 text-left z-10">
                <h3 className="text-[28px] sm:text-[36px] md:text-[54px] font-extrabold font-gilroy-bold leading-tight mb-3">
                  {/* make last word of title red color */}
                  {contactCards.reduce.title.split(" ").map((word, index) => (
                    <span
                      key={index}
                      className={
                        index ===
                        contactCards.reduce.title.split(" ").length - 1
                          ? "text-[#ff5959]"
                          : ""
                      }
                    >
                      {word}{" "}
                    </span>
                  ))}
                </h3>
                <p className="text-[15px] md:text-[16px] font-medium opacity-90 max-w-3xl mb-6">
                  {contactCards.reduce.description}
                </p>
                <Link
                  href="/our-guarantee"
                  className="w-fit px-6 md:px-8 py-2.5 md:py-3 border border-black rounded-full text-xs font-bold text-black hover:bg-black hover:text-white transition-all duration-300 uppercase"
                >
                  Our Guarantee
                </Link>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                <div
                  className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[450px] md:h-[450px] bg-[#ffffff]/75"
                  style={{
                    clipPath: "url(#shape7)",
                    WebkitClipPath: "url(#shape7)",
                  }}
                >
                  <Image
                    src="/image/hero-poster.png"
                    alt="Icon"
                    fill
                    className="object-contain p-6 md:p-10 pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 1 */}
          <div className="w-full flex-shrink-0 snap-center">
            <div
              className="rounded-[30px] md:rounded-[60px] w-full flex flex-col md:flex-row items-center justify-between p-6 md:py-3 md:px-16 gap-6 md:gap-0 transition-all duration-300 lg:min-h-117.5"
              style={{ backgroundColor: "#ffb1ee" }}
            >
              <div className="w-full md:w-1/2 text-left z-10 text-black">
                <h3 className="text-[28px] sm:text-[36px] md:text-[54px] font-extrabold font-gilroy-bold leading-tight mb-3">
                  {contactCards.touch.title}
                </h3>
                <p className="text-[15px] md:text-[16px] font-medium opacity-90 max-w-3xl mb-6">
                  {contactCards.touch.description}
                </p>
                <Link
                  onClick={handleCTAClick}
                  href="/get-the-visa"
                  className="w-fit px-6 md:px-8 py-2.5 md:py-3 border border-black rounded-full text-xs font-bold text-black hover:bg-black hover:text-white transition-all duration-300 uppercase"
                >
                  Get It Now
                </Link>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                <div
                  className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[420px] md:h-[420px] bg-[#fbc5ef]"
                  style={{
                    clipPath: "url(#shape4)",
                    WebkitClipPath: "url(#shape4)",
                  }}
                >
                  <Image
                    src="/image/grid-showcase-1.png"
                    alt="Icon"
                    fill
                    className="object-contain p-8 md:p-15 pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="w-full flex-shrink-0 snap-center">
            <div
              className="rounded-[30px] md:rounded-[60px] w-full flex flex-col md:flex-row items-center justify-between p-6 md:py-3 md:px-16 gap-6 md:gap-0 transition-all duration-300 lg:min-h-117.5"
              style={{ backgroundColor: "#5f9aff" }}
            >
              <div className="w-full md:w-1/2 text-left z-10 text-black">
                <h3 className="text-[28px] sm:text-[36px] md:text-[54px] font-extrabold font-gilroy-bold leading-tight mb-3">
                  {contactCards.reporting.title}
                </h3>
                <p className="text-[15px] md:text-[16px] font-medium opacity-90 max-w-3xl mb-6">
                  {contactCards.reporting.description}
                </p>
                <Link
                  onClick={handleCTAClick}
                  href="/get-the-visa"
                  className="w-fit px-6 md:px-8 py-2.5 md:py-3 border border-black rounded-full text-xs font-bold text-black hover:bg-black hover:text-white transition-all duration-300 uppercase"
                >
                  Get It Now
                </Link>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                <div
                  className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[420px] md:h-[420px] bg-[#ffe7d5]"
                  style={{
                    clipPath: "url(#shape5)",
                    WebkitClipPath: "url(#shape5)",
                  }}
                >
                  <Image
                    src="/image/grid-showcase-2.png"
                    alt="Icon"
                    fill
                    className="object-contain p-6 pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="w-full flex-shrink-0 snap-center">
            <div
              className="rounded-[30px] md:rounded-[60px] w-full flex flex-col md:flex-row items-center justify-between p-6 md:py-3 md:px-16 gap-6 md:gap-0 transition-all duration-300 lg:min-h-117.5"
              style={{ backgroundColor: "#ff8e59" }}
            >
              <div className="w-full md:w-1/2 text-left z-10">
                <h3 className="text-[28px] sm:text-[36px] md:text-[54px] font-extrabold font-gilroy-bold leading-tight mb-3">
                  {contactCards.mind.title}
                </h3>
                <p className="text-[15px] md:text-[16px] font-medium opacity-90 max-w-3xl mb-6">
                  {contactCards.mind.description}
                </p>
                <Link
                  onClick={handleCTAClick}
                  href="/get-the-visa"
                  className="w-fit px-6 md:px-8 py-2.5 md:py-3 border border-black rounded-full text-xs font-bold text-black hover:bg-black hover:text-white transition-all duration-300 uppercase"
                >
                  Get It Now
                </Link>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end">
                <div
                  className="relative w-[220px] h-[220px] sm:w-[280px] sm:h-[280px] md:w-[450px] md:h-[450px] bg-[#fafafc]/50"
                  style={{
                    clipPath: "url(#shape6)",
                    WebkitClipPath: "url(#shape6)",
                  }}
                >
                  <Image
                    src="/image/grid-showcase-3.webp"
                    alt="Icon"
                    fill
                    className="object-contain p-8 md:p-15 pointer-events-none"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dots Navigation */}
        <div className="flex gap-3 mt-6 mb-10">
          {Array.from({ length: totalCards }).map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToIndex(index)}
              className={`rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "bg-[#6B4EFF] w-8 h-3"
                  : "bg-gray-300 hover:bg-gray-400 w-3 h-3"
              }`}
            />
          ))}
        </div>

        <Link href={"/get-the-visa"}>
          <button className="group flex items-center bg-[#6B4EFF] text-white gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
            <span className="mr-3 text-xl md:text-2xl uppercase">
              Start Application
            </span>
            <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1">
              <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default PremiumServiceSection;
