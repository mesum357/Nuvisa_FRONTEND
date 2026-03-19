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

const VisaSolution = ({ video = false, title = "Top destinations" }) => {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleCountrySelect = (countryName) => {
    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(countryName);

    // Store the selected country and dynamic fees in Redux
    dispatch(setSelectedCountry(countryName));
    dispatch(setTravelers(1));

    // Redirect to checkout with dynamic country information
    router.push(
      `/get-the-visa?selectedCountry=${encodeURIComponent(
        countryName
      )}&travelers=1`
    );
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
          } catch {
            // Try next endpoint
          }
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
          .filter(
            (item) =>
              item.id &&
              item.name &&
              Number.isFinite(item.basePrice)
          );

        setCountryPricingList(normalized);
      } catch (error) {
        console.error("Failed to fetch visa pricing:", error);
      } finally {
        if (mounted) setIsVisaPricingLoading(false);
      }
    };

    fetchVisaPricing();
    return () => {
      mounted = false;
    };
  }, []);

  const countryPricingLookup = useMemo(() => {
    return countryPricingList.reduce((acc, item) => {
      acc[normalizeCountryKey(item.name)] = item;
      return acc;
    }, {});
  }, [countryPricingList, normalizeCountryKey]);



  const { countries: dynamicCountries, isLoading: isCountriesLoading } = useCountriesWithAppointmentTexts({
    staticCountries: [
      { name: "Germany", image: "/image/country/Germany.jpg" },
      { name: "Spain", image: "/image/country/Spain.jpg" },
      { name: "Portugal", image: "/image/country/Portugal.jpg" },
      { name: "Switzerland", image: "/image/country/Switzerland.jpg" },
      { name: "France", image: "/image/country/France.jpg" },
      { name: "Italy", image: "/image/country/Italy.jpg" },
    ]
  });
  const destinations = useMemo(() => {
    if (dynamicCountries.length > 0) {
      return dynamicCountries.map(c => ({
        name: c.name,
        image: c.image || `/image/country/${c.name}.jpg`,
        landmark: c.landmark || c.name,
        isActive: c.isActive !== false // handle undefined as true
      }));
    }
    // Fallback to initial set if API fails or empty
    return [
      {
        name: "Germany",
        image: "/image/country/Germany.jpg",
        landmark: "Brandenburg Gate",
        isActive: true
      },
      {
        name: "Spain",
        image: "/image/country/Spain.jpg",
        landmark: "Sagrada Familia",
        isActive: true
      },
      {
        name: "Portugal",
        image: "/image/country/Portugal.jpg",
        landmark: "Pena Palace",
        isActive: true
      },
      {
        name: "Switzerland",
        image: "/image/country/Switzerland.jpg",
        landmark: "Matterhorn",
        isActive: true
      },
      {
        name: "France",
        image: "/image/country/France.jpg",
        landmark: "Eiffel Tower",
        isActive: true
      },
      {
        name: "Italy",
        image: "/image/country/Italy.jpg",
        landmark: "Colosseum Rome",
        isActive: true
      },
    ];
  }, [dynamicCountries]);

  // Switzerland, France, Italy, Germany, Spain, Portugal
  const galleryRef = useRef(null);
  const scrollPositionRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);
  const speed = 0.5;

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

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused]);

  return (
    <section id="top-destinations" className="w-full pri_bg py-[40px] bg-[#1E1E27] flex items-center justify-center gap-[32px] flex-col">
      <div className="w-full max-w-[86rem] mx-auto flex flex-col gap-6 items-center justify-center">
        <div className=" w-full flex items-center gap-5 md:gap-10 max-md:flex-col max-md:text-center px-6">
          <h2 className="text-2xl sm:text-5xl w-1/2 text-white  md:text-7xl font-extrabold leading-tight flex-1" dangerouslySetInnerHTML={{ __html: title }} />

          {/* Right Side - Description */}
          <p className="text-white text-[13px] md:text-base font-medium leading-relaxed flex-[.6] text-left">
            {/* Benefit from document pre-checks, error-proof form filling, and
            personalized visa guidance, powered by AI with human oversight at
            critical checkpoints - all designed to prevent delays, mistakes, and
            rejections. */}
            If you're frustrated with travel agencies that have substantial fees, confusing conditions, and slow appointments - Meet the next generation peace of mind complete visa solution you've been looking for.
          </p>
        </div>
        {
          video &&
          <div className="relative w-[85%] md:w-[60%] min-h-[180px] overflow-hidden rounded-[30px]">
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
          </div>}
      </div>

      <div className="w-full overflow-hidden mt-20 mb-5">
        <div
          ref={galleryRef}
          className="flex items-center justify-start overflow-x-hidden"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {[...destinations, ...destinations].map((destination, index) => (
            <div
              key={`${destination.name}-${index}`}
              onClick={() => handleCountrySelect(destination.name)}
              className="relative flex-shrink-0 w-[384px] h-[200px]  mx-4 group overflow-hidden rounded-xl cursor-pointer"
            >
              <Image
                src={destination.image}
                alt={destination.name}
                width={384}
                height={200}
                className="w-full h-full object-cover rounded-[16px] shadow-md transition-transform duration-300 group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg"></div>

              {/* Price Tag in Bottom Left */}
              {!isVisaPricingLoading && destination.isActive && countryPricingLookup[normalizeCountryKey(destination.name)] && (
                <div className="absolute bottom-4 right-4 bg-black/20 rounded-full p-3 py-1 w-fit">
                  <h3 className="text-sm uppercase font-medium text-white">
                    from £{countryPricingLookup[normalizeCountryKey(destination.name)].basePrice}
                  </h3>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 bg-black rounded-full p-3 py-1 w-fit">
                <h3 className="text-sm uppercase font-medium text-white">
                  {destination.name}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* <button className="group flex items-center bg-[#6B4EFF] text-white  gap-[16px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
        <span className="mr-3 text-2xl">GET THE VISA</span>
        <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
          <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
        </span>
      </button> */}
      <GetTheVisaButton />
    </section>
  );
};

export default VisaSolution;
