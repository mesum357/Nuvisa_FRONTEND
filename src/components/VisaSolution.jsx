import { ArrowUpRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAppDispatch } from "@/store";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import { getCountryConfig } from "@/constants/countryConfig";
import GetTheVisaButton from "./layout/GetTheVisaButton";
import { getAdminApiBase } from "@/utils/adminApiBase";
import { useCountriesWithAppointmentTexts } from "@/hooks/useCountriesWithAppointmentTexts";

const VisaSolution = ({
  video = false,
  title = "Top Destinations",
  subtitle,
  customColors = [],
  countriesData = []
}) => {

  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  const hasDraggedRef = useRef(false);

  const handleMouseDown = (e) => {
    const slider = galleryRef.current;
    if (!slider) return;

    hasDraggedRef.current = false; // reset
    setIsDragging(true);
    setIsPaused(true);

    startXRef.current = e.pageX - slider.offsetLeft;
    scrollLeftRef.current = slider.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const slider = galleryRef.current;
    if (!slider) return;

    e.preventDefault();

    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;

    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true; // 
    }

    slider.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    const slider = galleryRef.current;
    if (slider) {
      scrollPositionRef.current = slider.scrollLeft;
    }

    setIsDragging(false);
    setIsPaused(false);
  };

  const handleMouseLeaveDrag = () => {
    const slider = galleryRef.current;

    if (isDragging && slider) {
      scrollPositionRef.current = slider.scrollLeft;
      setIsDragging(false);
      setIsPaused(false);
    }
  };

  const router = useRouter();
  const dispatch = useAppDispatch();

  // Premium Colors - Agar customColors prop mein data hoga toh wo use hoga, warna ye default array
  const premiumColors = customColors.length > 0 ? customColors : ['#ffb1ee', '#8f9bfe', '#5f9aff', '#ff8e59', '#daee69', '#b1a0ff'];
  const shapeIds = ["shape1", "shape2", "shape3", "shape4", "shape5", "shape6", "shape7"];

  const handleCountrySelect = (countryName) => {
    const countryConfig = getCountryConfig(countryName);
    dispatch(setSelectedCountry(countryName));
    dispatch(setTravelers(1));
    router.push(`/get-the-visa?selectedCountry=${encodeURIComponent(countryName)}&travelers=1`);
  };

  const [countryPricingList, setCountryPricingList] = useState([]);
  const [isVisaPricingLoading, setIsVisaPricingLoading] = useState(true);

  const normalizeCountryKey = useCallback((value) => String(value || "").trim().toLowerCase(), []);

  useEffect(() => {
    let mounted = true;
    const fetchVisaPricing = async () => {
      try {
        setIsVisaPricingLoading(true);
        const apiBase = String(process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
        const adminBase = getAdminApiBase();
        const candidates = [
          `/api/visa-pricing`,
          `${apiBase}/visa_pricing`,
          `${apiBase}/api/visa_pricing`,
          `${apiBase}/api/public/visa_pricing`,
          `${apiBase}/api/public/visa-pricing`,
          `${adminBase}/api/visa_pricing`,
          `${adminBase}/visa_pricing`,
          `${adminBase}/api/public/visa_pricing`,
          `${adminBase}/api/public/visa-pricing`,
        ].filter((url) => /^https?:\/\//i.test(url) || url.startsWith("/"));

        let payload = null;
        for (const endpoint of candidates) {
          try {
            const res = await fetch(endpoint, { method: "GET" });
            if (!res.ok) continue;
            const json = await res.json();
            const status = String(json?.status || "").toUpperCase();
            if (status === "ERROR") continue;
            payload = json?.data?.results || [];
            if (Array.isArray(payload)) break;
          } catch { }
        }

        if (!mounted) return;
        if (!Array.isArray(payload) || payload.length === 0) {
          setCountryPricingList([]);
          return;
        }

        const normalized = payload
          .map((item) => ({
            id: String(item?.id || ""),
            name: String(item?.name || "").trim(),
            basePrice: Number(item?.basePrice),
          }))
          .filter((item) => item.id && item.name && Number.isFinite(item.basePrice));

        setCountryPricingList(normalized);
      } catch (error) {
        console.error("Failed to fetch visa pricing:", error);
      } finally {
        if (mounted) setIsVisaPricingLoading(false);
      }
    };
    fetchVisaPricing();
    return () => { mounted = false; };
  }, []);

  // Add these new touch handlers
  const handleTouchStart = (e) => {
    const slider = galleryRef.current;
    if (!slider) return;

    hasDraggedRef.current = false;
    setIsPaused(true);

    startXRef.current = e.touches[0].pageX - slider.offsetLeft;
    scrollLeftRef.current = slider.scrollLeft;
  };

  const handleTouchMove = (e) => {
    const slider = galleryRef.current;
    if (!slider) return;

    const x = e.touches[0].pageX - slider.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;

    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }

    slider.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleTouchEnd = () => {
    const slider = galleryRef.current;
    if (slider) {
      scrollPositionRef.current = slider.scrollLeft;
    }
    setIsPaused(false);
  };

  const countryPricingLookup = useMemo(() => {
    return countryPricingList.reduce((acc, item) => {
      acc[normalizeCountryKey(item.name)] = item;
      return acc;
    }, {});
  }, [countryPricingList, normalizeCountryKey]);

  const defaultCountries = [
    { name: "Spain", image: "/image/country/Spain.jpg", bgColor: '#8f9bfe' },
    { name: "Germany", image: "/image/country/Germany.jpg", bgColor: '#5f9aff' },
    { name: "Switzerland", image: "/image/country/Switzerland.jpg", bgColor: '#ff8e59' },
    { name: "France", image: "/image/country/France.jpg", bgColor: '#daee69' },
    { name: "Italy", image: "/image/country/Italy.jpg", bgColor: '#ffb1ee' },
  ];

  const staticData = countriesData.length > 0 ? countriesData : defaultCountries;


  const { countries: dynamicCountries } = useCountriesWithAppointmentTexts({
    staticCountries: staticData
  });

  const destinations = useMemo(() => {
    const list = dynamicCountries.length > 0 ? dynamicCountries : [
      // { name: "Germany", image: "/image/country/Germany.jpg", landmark: "Brandenburg Gate", isActive: true, bgColor: '#ffb1ee' },
      { name: "Spain", image: "/image/country/Spain.jpg", landmark: "Sagrada Familia", isActive: true, bgColor: '#8f9bfe' },
      { name: "Germany", image: "/image/country/Germany.jpg", landmark: "Pena Palace", isActive: true, bgColor: '#5f9aff' },
      { name: "Switzerland", image: "/image/country/Switzerland.jpg", landmark: "Matterhorn", isActive: true, bgColor: '#ff8e59' },
      { name: "France", image: "/image/country/France.jpg", landmark: "Eiffel Tower", isActive: true, bgColor: '#daee69' },
      { name: "Italy", image: "/image/country/Italy.jpg", landmark: "Colosseum Rome", isActive: true, bgColor: '#ffb1ee' },
    ];

    return list.map((d, i) => {
      const matchedStatic = staticData.find(s => s.name === d.name);
      // Agar customColors hain toh wahi apply honge
      const finalColor = customColors.length > 0 ? premiumColors[i % premiumColors.length] : (d.bgColor || matchedStatic?.bgColor || premiumColors[i % premiumColors.length]);

      return {
        ...d,
        shapeId: shapeIds[i % shapeIds.length],
        actualBg: finalColor
      };
    });
  }, [dynamicCountries, premiumColors]);

  const galleryRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const speed = 0.5;
  const defaultSubtitle = title === "Everyday Steals"
    ? "A curated edit of handpicked countries for travellers who are on budget and want to access Schengen countries."
    : "If you're frustrated with travel agencies that have substantial fees, confusing conditions, and slow appointments - Meet the next generation peace of mind complete visa solution you've been looking for.";
  const sectionSubtitle = subtitle || defaultSubtitle;

  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return;
    let animationFrameId;
    const animate = () => {
      if (!isPaused) {
        scrollPositionRef.current += speed;
        if (scrollPositionRef.current >= gallery.scrollWidth / 2) {
          scrollPositionRef.current = 0;
        }
        gallery.scrollLeft = scrollPositionRef.current;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);
    return () => { cancelAnimationFrame(animationFrameId); };
  }, [isPaused]);

  return (
    <section id="top-destinations" className="w-full py-10 md:py-20 bg-[#fefffe] flex items-center justify-center gap-[32px] flex-col">
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="shape1" clipPathUnits="objectBoundingBox">
            <path transform="translate(0.5, 0.5) scale(0.0023) translate(-240, -240)" d="m452.3 154.4 8.5-47.6A75.6 75.6 0 0 0 373.2 19l-47.4 8.5c-16.7 3-34 .2-49-7.8l-1.1-.6c-22.3-12-49-12-71.4 0l-1.2.6c-15 8-32.2 10.8-48.9 7.8L106.7 19A75.6 75.6 0 0 0 19 106.7l8.5 47.5c3 16.7.3 34-7.8 49l-.6 1.1c-12 22.3-12 49 0 71.3l.6 1.3c8 15 10.8 32.2 7.8 48.9L19 373.3a75.6 75.6 0 0 0 87.7 87.7l47.5-8.5c16.7-3 34-.3 49 7.8l1.1.6c22.3 12 49 12 71.3 0l1.3-.6c15-8 32.2-10.8 48.9-7.8l47.5 8.5a75.6 75.6 0 0 0 87.7-87.7l-8.4-47.2c-3-16.9-.2-34.3 8-49.4a75.5 75.5 0 0 0 .3-71.6l-1-1.8c-8-15-10.7-32.2-7.6-48.9Z" />
          </clipPath>
          <clipPath id="shape2" clipPathUnits="objectBoundingBox">
            <path transform="translate(0.5, 0.5) scale(0.0023) translate(-240, -240)" d="M447.6 180.2v-.2A127.3 127.3 0 0 0 300 32S240 0 240 0l-60 32.1h-.2A127.3 127.3 0 0 0 32 179.8v.2L0 240l32.1 60v.2A127.3 127.3 0 0 0 179.8 448h.2l60 32.1 60-32.1h.3a127.3 127.3 0 0 0 147.6-147.7v-.2l32.1-59-32.4-60.8Z" />
          </clipPath>
          <clipPath id="shape3" clipPathUnits="objectBoundingBox">
            <path transform="translate(0.5, 0.5) scale(0.0023) translate(-240, -240)" d="M437.3 158.3A99.5 99.5 0 0 0 321.6 42.8a99.5 99.5 0 0 0-163.4 0A99.5 99.5 0 0 0 42.7 158.3a99.5 99.5 0 0 0 0 163.4 99.5 99.5 0 0 0 115.6 115.6 99.5 99.5 0 0 0 163.4 0 99.5 99.5 0 0 0 115.5-115.6 99.5 99.5 0 0 0 0-163.4Z" />
          </clipPath>
          <clipPath id="shape4" clipPathUnits="objectBoundingBox">
            <path strokeLinejoin="round" transform="translate(0.5, 0.5) scale(0.0026) translate(-240, -240)" d="M409 295.9a79 79 0 0 1 .7-112.5A80 80 0 0 0 296.6 70.3 79 79 0 0 1 184 71a80.7 80.7 0 0 0-113.4-1.1C39 101 39 152 70.3 183.4s30.5 82.7.7 112.5a80.7 80.7 0 0 0-1.1 113.4 80 80 0 0 0 113.5.4 79 79 0 0 1 113.2 0 80 80 0 0 0 113.5-.4c31-31.4 30-82.2-1.1-113.4Z" />
          </clipPath>
          <clipPath id="shape5" clipPathUnits="objectBoundingBox">
            <rect transform="translate(0.5, 0.5) scale(0.002) translate(-240, -240)" width="480" height="480" rx="160" ry="160" />
          </clipPath>
          <clipPath id="shape6" clipPathUnits="objectBoundingBox">
            <path transform="translate(0.5, 0.5) scale(0.002) translate(-240, -240)" d="M480,240c0,66.3-53.7,120-120,120c0,66.3-53.7,120-120,120s-120-53.7-120-120c-66.3,0-120-53.7-120-120s53.7-120,120-120c0-66.3,53.7-120,120-120s120,53.7,120,120C426.3,120,480,173.7,480,240z" />
          </clipPath>
          <clipPath id="shape7" clipPathUnits="objectBoundingBox">
            <path
              transform="translate(0.5, 0.5) scale(0.00208) translate(-240, -240)"
              d="M240,10 C270,10 400,85 425,120 C450,155 450,325 425,360 C400,395 270,470 240,470 C210,470 80,395 55,360 C30,325 30,155 55,120 C80,85 210,10 240,10 Z"
            />
          </clipPath>
        </defs>
      </svg>

      <div id={title === "Everyday Steals" && "everyday-steals"} className="w-full max-w-[86rem] mx-auto flex flex-col gap-6 items-center justify-center">
        <div className=" w-full flex items-center gap-5 md:gap-10 max-md:flex-col max-md:text-left px-6">
          <h2 className="text-4xl whitespace-nowrap sm:text-5xl w-1/2 text-black md:text-7xl font-gilroy-bold font-extrabold leading-tight flex-1 w-full" dangerouslySetInnerHTML={{ __html: title }} />
          <p className="text-gray-600 text-[13px] md:text-base font-medium leading-relaxed flex-[.6] text-left">
            {sectionSubtitle}
          </p>
        </div>
      </div>

      {video && (
        <div className="w-full max-w-[60rem] px-6 mt-10">
          <div className="relative w-full aspect-video rounded-[40px] overflow-hidden bg-black shadow-xl">

            <video
              src="/video/nuvisa.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover scale-[1.15] origin-center"
            />
            <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          </div>
        </div>
      )}

      <div className="w-full overflow-hidden mt-20 mb-5">
        <div
          ref={galleryRef}
          className={`flex items-center justify-start overflow-x-hidden ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => {
            setIsPaused(false);
            handleMouseLeaveDrag();
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {[...destinations, ...destinations].map((destination, index) => {
            const currentShapeId = shapeIds[index % shapeIds.length];
            const currentColor = destination.actualBg;

            return (
              <div
                key={`${destination.name}-${index}`}
                onClick={(e) => {
                  if (hasDraggedRef.current) {
                    e.preventDefault();
                    return; // ❌ stop redirect
                  }
                  handleCountrySelect(destination.name);
                }}
                style={{ backgroundColor: currentColor }}
                className="relative flex-shrink-0 w-[350px] h-[500px] p-10 mx-4 group rounded-[45px] cursor-pointer flex flex-col"
              >
                <div
                  className="w-full aspect-square relative flex items-center justify-center overflow-hidden"
                  style={{
                    clipPath: `url(#${currentShapeId})`,
                    WebkitClipPath: `url(#${currentShapeId})`
                  }}
                >
                  <Image
                    src={destination.image}
                    alt={destination.name}
                    draggable={false}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority
                  />
                </div>

                <div className="mt-8 flex flex-col gap-2">
                  {/* Country Name */}
                  <h3 className="text-3xl font-bold text-black/80 uppercase">
                    {destination.name}
                  </h3>

                  {/* Price (same logic as CountryCardsSection) */}
                  {!isVisaPricingLoading &&
                    destination.isActive !== false &&
                    countryPricingLookup[normalizeCountryKey(destination.name)] && (
                      <div className="text-lg font-gilroy-bold text-black">
                        {destination.price_from} £{countryPricingLookup[normalizeCountryKey(destination.name)].basePrice}
                      </div>
                    )}

                  {/* Button */}
                  <button className="w-fit px-8 py-3 border border-black rounded-full text-xs font-bold text-black hover:bg-black hover:text-white transition-all duration-300 uppercase"> Get It Now </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <GetTheVisaButton />
    </section>
  );
};

export default VisaSolution;