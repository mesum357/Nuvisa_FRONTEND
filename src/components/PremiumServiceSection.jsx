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

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = current.clientWidth;
      current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      // Precision ke liye 10px ka buffer rakha hai
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  };

  useEffect(() => {
    const current = scrollRef.current;
    if (current) {
      current.addEventListener("scroll", checkScroll);
      // Initial check after mount
      setTimeout(checkScroll, 100);
      window.addEventListener("resize", checkScroll);
    }
    return () => {
      current?.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  return (
    <div className="bg-[#fefffe] text-black py-20 pb-10 px-6">
      {/* Updated SVG Shapes */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="shape4" clipPathUnits="objectBoundingBox">
            <path strokeLinejoin="round" transform="translate(0.5, 0.5) scale(0.0026) translate(-240, -240)" d="M409 295.9a79 79 0 0 1 .7-112.5A80 80 0 0 0 296.6 70.3 79 79 0 0 1 184 71a80.7 80.7 0 0 0-113.4-1.1C39 101 39 152 70.3 183.4s30.5 82.7.7 112.5a80.7 80.7 0 0 0-1.1 113.4 80 80 0 0 0 113.5.4 79 79 0 0 1 113.2 0 80 80 0 0 0 113.5-.4c31-31.4 30-82.2-1.1-113.4Z" />
          </clipPath>
          <clipPath id="shape5" clipPathUnits="objectBoundingBox">
            <rect transform="translate(0.5, 0.5) scale(0.002) translate(-240, -240)" width="480" height="480" rx="160" ry="160" />
          </clipPath>
          <clipPath id="shape6" clipPathUnits="objectBoundingBox">
            <path transform="translate(0.5, 0.5) scale(0.002) translate(-240, -240)" d="M480,240c0,66.3-53.7,120-120,120c0,66.3-53.7,120-120,120s-120-53.7-120-120c-66.3,0-120-53.7-120-120s53.7-120,120-120c0-66.3,53.7-120,120-120s120,53.7,120,120C426.3,120,480,173.7,480,240z" />
          </clipPath>
        </defs>
      </svg>

      <div className="max-w-[85rem] mx-auto flex items-center flex-col justify-center text-black">
        {/* Header Section */}
        <div className="flex flex-col w-full lg:flex-row justify-between items-start lg:items-center mb-16 relative">
          <div className="mb-8 lg:mb-0 md:ml-5 max-md:w-fit max-md:mx-auto">
            <h1 className="text-[32px] max-md:text-center md:text-[40px] lg:text-[64px] font-bold leading-tight">
              Premium service,
              <br />
              End-to-end security
            </h1>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-6 max-md:w-fit max-md:mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <Image src="/image/gdpr.webp" alt="GDPR" width={150} height={150} className="object-contain" priority />
              <Image src="/image/ICO-new.png" alt="ICO" width={150} height={150} className="object-contain" priority />
              <Image src="/image/pci-dss.png" alt="PCI" width={150} height={150} className="object-contain" priority />
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="w-full flex justify-end gap-3 mb-6 pr-5">
          <button
            onClick={() => scroll("left")}
            className={`p-3 rounded-full border border-gray-200 transition-all duration-300 ${
              canScrollLeft ? "opacity-100 bg-gray-400 hover:bg-[#6B4EFF] cursor-pointer" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={() => scroll("right")}
            className={`p-3 rounded-full border border-gray-200 transition-all duration-300 ${
              canScrollRight ? "opacity-100 bg-gray-400 hover:bg-[#6B4EFF] cursor-pointer" : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Feature Cards Container */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex w-full overflow-x-auto hide-scrollbar select-none touch-pan-x ${isDragging ? "cursor-grabbing" : "cursor-grab"} ${isDragging ? "" : "scroll-smooth"}`}
          style={{ scrollSnapType: isDragging ? "none" : "x mandatory" }}
        >
          {/* Card 1 */}
          <div className="min-w-full flex-shrink-0 px-2 md:px-5 snap-center">
            <div className="rounded-[120px] h-auto md:h-[500px] w-full flex flex-col md:flex-row items-center justify-between p-8 md:p-16 relative overflow-hidden transition-all duration-300 hover:shadow-2xl" style={{ backgroundColor: "#daee69" }}>
              <div className="w-full md:w-1/2 text-left z-10 text-black">
                <h3 className="text-[40px] md:text-[64px] font-bold leading-tight mb-4">Always in touch</h3>
                <p className="text-[18px] md:text-[20px] font-medium opacity-90 max-w-md mb-8">Got any question? Get in touch with 24/7 live human support available.</p>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-10 md:mt-0">
                <div className="relative w-[300px] h-[300px] md:w-[420px] md:h-[420px] bg-white/20" style={{ clipPath: "url(#shape4)", WebkitClipPath: "url(#shape4)" }}>
                  <Image src="/image/grid-showcase-1.png" alt="Icon" fill className="object-contain p-6 pointer-events-none" priority />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="min-w-full flex-shrink-0 px-2 md:px-5 snap-center">
            <div className="rounded-[120px] h-auto md:h-[500px] w-full flex flex-col md:flex-row items-center justify-between p-8 md:p-16 relative overflow-hidden transition-all duration-300 hover:shadow-2xl" style={{ backgroundColor: "#ffb1ee" }}>
              <div className="w-full md:w-1/2 text-left z-10 text-black">
                <h3 className="text-[40px] md:text-[64px] font-bold leading-tight mb-4">Realtime reporting</h3>
                <p className="text-[18px] md:text-[20px] font-medium opacity-90 max-w-md mb-8">On the go online updates for your visa process with instant handy notifications.</p>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-10 md:mt-0">
                <div className="relative w-[300px] h-[300px] md:w-[420px] md:h-[420px] bg-white/20" style={{ clipPath: "url(#shape5)", WebkitClipPath: "url(#shape5)" }}>
                  <Image src="/image/grid-showcase-2.png" alt="Icon" fill className="object-contain p-6 pointer-events-none" priority />
                </div>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="min-w-full flex-shrink-0 px-2 md:px-5 snap-center">
            <div className="rounded-[120px] h-auto md:h-[500px] w-full flex flex-col md:flex-row items-center justify-between p-8 md:p-16 relative overflow-hidden transition-all duration-300 hover:shadow-2xl" style={{ backgroundColor: "#5f9aff" }}>
              <div className="w-full md:w-1/2 text-left z-10">
                <h3 className="text-[40px] md:text-[64px] font-bold leading-tight mb-4">Peace of mind</h3>
                <p className="text-[18px] md:text-[20px] font-medium opacity-90 max-w-md mb-8">Registered with ICO & GDPR compliant. End-to-end security, no data sharing.</p>
              </div>
              <div className="w-full md:w-1/2 flex justify-center md:justify-end mt-10 md:mt-0">
                <div className="relative w-[300px] h-[300px] md:w-[420px] md:h-[420px] bg-white/20" style={{ clipPath: "url(#shape6)", WebkitClipPath: "url(#shape6)" }}>
                  <Image src="/image/grid-showcase-3.webp" alt="Icon" fill className="object-contain p-6 pointer-events-none" priority />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Link href={"/get-the-visa"}>
          <button className="group flex items-center bg-[#6B4EFF] text-white gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb] mt-10">
            <span className="mr-3 text-2xl uppercase">Get the visa</span>
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