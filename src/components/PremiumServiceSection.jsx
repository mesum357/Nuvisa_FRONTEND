"use client";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";

const PremiumServiceSection = () => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Dragging States
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // 1. Mouse Drag Logic
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
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  // 2. Button Scroll Function
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = window.innerWidth > 768 ? 545 + 32 : 370 + 16;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // 3. Scroll Visibility Detection
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 20);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    const current = scrollRef.current;
    if (current) {
      current.addEventListener("scroll", checkScroll);
      checkScroll();
    }
    return () => current?.removeEventListener("scroll", checkScroll);
  }, []);

  return (
    <div className="bg-[#fefffe ] text-black py-20 pb-10 px-6">
      <div className="max-w-[85rem] mx-auto flex items-center flex-col justify-center text-black">

        {/* Header Section */}
        <div className="flex flex-col w-full lg:flex-row justify-between items-start lg:items-center mb-16 relative">
          <div className="mb-8 lg:mb-0 md:ml-5 max-md:w-fit max-md:mx-auto">
            <h1 className="text-[32px] max-md:text-center md:text-[40px] lg:text-[64px] font-gilroy-bold leading-tight">
              Premium service,
              <br />
              End-to-end security
            </h1>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-6 max-md:w-fit max-md:mx-auto">
            {/* Compliance Badges */}
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Image src="/image/gdpr.webp" alt="GDPR" width={150} height={150} className="object-contain" priority />
              <Image src="/image/ICO-new.png" alt="ICO" width={150} height={150} className="object-contain" priority />
              <Image src="/image/pci-dss.png" alt="PCI" width={150} height={150} className="object-contain" priority />
            </div>
          </div>
        </div>

        {/* Arrows positioned just above the cards div on the right */}
        <div className="w-full flex justify-end gap-3 mb-6">
          <button
            onClick={() => scroll("left")}
            className={`p-3 rounded-full border border-white/20 transition-all ${canScrollLeft ? "opacity-100 bg-gray-400 hover:bg-[#6B4EFF]" : "opacity-0 pointer-events-none"
              }`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => scroll("right")}
            className={`p-3 rounded-full border border-white/20 transition-all ${canScrollRight ? "opacity-100 bg-gray-400 hover:bg-[#6B4EFF]" : "opacity-0 pointer-events-none"
              }`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Feature Cards Container (Updated for Snap) */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex w-full overflow-x-auto hide-scrollbar select-none touch-pan-x ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${isDragging ? "" : "scroll-smooth"}`}
          style={{ 
            scrollSnapType: isDragging ? "none" : "x mandatory",
            // Gap ko zero ya minimal rakhein agar full width use kar rahe hain
          }}
        >
          {/* Always in Touch Card - min-w-full added */}
          <div className="min-w-full flex-shrink-0 px-2 md:px-5" style={{ scrollSnapAlign: "center" }}>
            <div className="rounded-3xl h-[450px] w-full mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-2xl bg-[linear-gradient(to_bottom,#FCB398_26%,#FB7F94_90%)]">
              <Image src="/image/grid-showcase-1.png" alt="Icon" width={1000} height={800} className="w-full h-full object-contain pointer-events-none" priority />
            </div>
            <div>
              <h3 className="text-[32px] md:text-[45px] font-gilroy-bold mb-1 md:mb-3 text-center md:text-left">Always in touch</h3>
              <p className="text-black text-[16px] font-gilroy-bold opacity-80 text-center md:text-left">Got any question? Get in touch with 24/7 live human support available.</p>
            </div>
          </div>

          {/* Realtime Reporting Card - min-w-full added */}
          <div className="min-w-full flex-shrink-0 px-2 md:px-5" style={{ scrollSnapAlign: "center" }}>
            <div className="rounded-3xl h-[450px] w-full mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-2xl bg-[linear-gradient(to_top_right,#A9F423,#3ACDFB,#62DCAA)]">
              <Image src="/image/grid-showcase-2.png" alt="Icon" width={1000} height={800} className="w-full h-full object-contain pointer-events-none" priority />
            </div>
            <div>
              <h3 className="text-[32px] md:text-[45px] font-gilroy-bold mb-1 md:mb-3 text-center md:text-left">Realtime reporting</h3>
              <p className="text-black text-[16px] font-gilroy-bold opacity-80 text-center md:text-left">On the go online updates for your visa process with instant handy notifications.</p>
            </div>
          </div>

          {/* Peace of Mind Card - min-w-full added */}
          <div className="min-w-full flex-shrink-0 px-2 md:px-5" style={{ scrollSnapAlign: "center" }}>
            <div className="rounded-3xl h-[450px] w-full mb-6 relative overflow-hidden transform transition-all duration-300 hover:shadow-2xl bg-[linear-gradient(to_top,#F2BBA0,#E8A4BD,#DD8CDC)]">
              <Image src="/image/grid-showcase-3.webp" alt="Icon" width={1000} height={800} className="w-full h-full object-contain pointer-events-none" priority />
            </div>
            <div>
              <h3 className="text-[32px] md:text-[45px] font-gilroy-bold mb-1 md:mb-3 text-center md:text-left">Peace of mind</h3>
              <div className="text-black text-[16px] font-gilroy-bold opacity-80 text-center md:text-left">
                <div>Registered with ICO & GDPR compliant.</div>
                <div>End-to-end security, no data sharing with third parties.</div>
              </div>
            </div>
          </div>
        </div>

        <Link href={"/get-the-visa"}>
          <button className="group flex items-center bg-[#6B4EFF] text-white gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb] mt-10">
            <span className="mr-3 text-2xl">GET THE VISA</span>
            <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
              <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
};

export default PremiumServiceSection;