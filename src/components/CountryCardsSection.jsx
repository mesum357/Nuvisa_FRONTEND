import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/store";
import { ArrowUpRight } from "lucide-react";
import {
  setSelectedCountry,
  setVisaFees,
  setInsuranceFees,
  setTravelers,
} from "@/store/visaSlice";
import GetTheVisaButton from "./layout/GetTheVisaButton";
import { getCountryConfig } from "@/constants/countryConfig";
import { useCountriesWithAppointmentTexts } from "@/hooks/useCountriesWithAppointmentTexts";
import { staticCountries } from "@/constants/staticCountries";
import Link from "next/link";
import { getAdminApiBase } from "@/utils/adminApiBase";
import { DEFAULT_OCCASIONS } from "@/constants/defaultOccasions";

const CountryCardsSection = ({
  specificCountries,
  image,
  id,
  occasionContent,
  occasionSubtitle,
  urgentDescription,
}) => {
  const [showAll, setShowAll] = useState(false);
  const seeMoreRef = useRef(null);
  const [sectionContent, setSectionContent] = useState({
    title: "Choose Your Country",
    description: "We support 20 countries over all the visa centres in the UK",
  });
  const router = useRouter();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);
  const [countryPricingList, setCountryPricingList] = useState([]);
  const [isVisaPricingLoading, setIsVisaPricingLoading] = useState(true);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [occasions, setOccasions] = useState(() =>
    id === "everyday-steals" ? DEFAULT_OCCASIONS : []
  );

  const normalizeCountryKey = useCallback(
    (value) =>
      String(value || "")
        .trim()
        .toLowerCase(),
    []
  );

  // 1. Move this UP here so the function below can see it!
  const countryPricingLookup = useMemo(() => {
    return countryPricingList.reduce((acc, item) => {
      acc[normalizeCountryKey(item.name)] = item;
      return acc;
    }, {});
  }, [countryPricingList, normalizeCountryKey]);

  // 2. Updated function
  const handleCountrySelect = useCallback(
    (countryName) => {
      const countryConfig = getCountryConfig(countryName);

      // GRAB THE DYNAMIC PRICE (Matching what the user actually sees on the card)
      const normalizedKey = normalizeCountryKey(countryName);
      const dynamicPricing = countryPricingLookup[normalizedKey];
      const finalVisaFee = dynamicPricing
        ? dynamicPricing.basePrice
        : countryConfig.visaFee || 129;

      // 🔥 GA4: Fire view_item event when country is selected
      if (typeof window !== "undefined" && window.dataLayer) {
        window.dataLayer.push({ ecommerce: null }); // Clear previous ecommerce data
        window.dataLayer.push({
          event: "view_item",
          ecommerce: {
            currency: "GBP",
            value: Number(finalVisaFee.toFixed(2)), // Track the actual dynamic price
            items: [
              {
                item_id: `visa_${countryName
                  .toLowerCase()
                  .replace(/\s+/g, "_")}`,
                item_name: `Visa - ${countryName}`,
                item_category: "Schengen Visa",
                item_brand: "NUvisa",
                price: Number(finalVisaFee.toFixed(2)), // Track the actual dynamic price
                quantity: 1,
              },
            ],
          },
        });
      }

      const currentTravelerCount =
        visaState.travelers !== undefined && visaState.travelers !== null
          ? visaState.travelers
          : 0;

      dispatch(setSelectedCountry(String(countryName)));
      dispatch(setVisaFees(Number(finalVisaFee))); // Store dynamic price
      dispatch(setInsuranceFees(Number(countryConfig.insuranceFee)));
      dispatch(setTravelers(Number(currentTravelerCount)));

      router.push(
        `/get-the-visa?selectedCountry=${encodeURIComponent(
          countryName
        )}&visaFees=${finalVisaFee}&insuranceFees=${
          countryConfig.insuranceFee
        }&travelers=${currentTravelerCount}`
      );
    },
    [
      visaState.travelers,
      dispatch,
      router,
      countryPricingLookup,
      normalizeCountryKey,
    ]
  );

  const [dynamicSection, setDynamicSection] = useState(null);
  const [isDynamicLoading, setIsDynamicLoading] = useState(true);

  useEffect(() => {
    // Only fetch dynamic section for "everyday-steals" section
    if (id !== "everyday-steals") {
      setIsDynamicLoading(false);
      return;
    }

    const fetchDynamicSection = async () => {
      try {
        if (id === "everyday-steals") {
          const occRes = await fetch(
            `/api/occasion-content?t=${Date.now()}&defaults=false`
          );

          if (!occRes.ok)
            throw new Error(`HTTP error! status: ${occRes.status}`);

          const occResult = await occRes.json();

          if (occResult.success && occResult.data) {
            setDynamicSection(occResult.data);
            setSectionContent({
              title: occResult.data.title,
              description: occResult.data.description,
            });
            if (
              occResult.data.occasions &&
              Array.isArray(occResult.data.occasions) &&
              occResult.data.occasions.length > 0
            ) {
              setOccasions(occResult.data.occasions);
            } else {
              const fallbackRes = await fetch(
                `/api/country-section?defaults=false&t=${Date.now()}`
              );
              if (fallbackRes.ok) {
                const fallbackJson = await fallbackRes.json();
                if (fallbackJson?.data?.occasions?.length > 0) {
                  setOccasions(fallbackJson.data.occasions);
                  setDynamicSection(fallbackJson.data);
                }
              }
            }
          } else {
            const fallbackRes = await fetch(
              `/api/country-section?defaults=false&t=${Date.now()}`
            );
            if (fallbackRes.ok) {
              const fallbackJson = await fallbackRes.json();
              if (fallbackJson?.data?.occasions?.length > 0) {
                setOccasions(fallbackJson.data.occasions);
              }
            }
          }
        } else {
          const res = await fetch(`/api/country-section?t=${Date.now()}`);

          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

          const result = await res.json();
          if (result.success && result.data) {
            setDynamicSection(result.data);
            setSectionContent({
              title: result.data.title,
              description: result.data.description,
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch dynamic section:", error.message);
        if (id === "everyday-steals") {
          setOccasions(DEFAULT_OCCASIONS);
        }
      } finally {
        setIsDynamicLoading(false);
      }
    };

    fetchDynamicSection();
  }, [id]);

  useEffect(() => {
    let mounted = true;

    const fetchVisaPricing = async () => {
      try {
        setIsVisaPricingLoading(true);
        const apiBase = String(process.env.NEXT_PUBLIC_API_URL || "").replace(
          /\/+$/,
          ""
        );
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
            (item) => item.id && item.name && Number.isFinite(item.basePrice)
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

  const {
    countries: hookCountries,
    appointmentTexts,
    isLoading: loading,
    error,
  } = useCountriesWithAppointmentTexts({
    staticCountries,
    fallbackAppointmentText: "Appointment in 10 days or less",
    includeFees: true,
    sortBy: "id",
    limit: 100, // Increased limit to ensure all countries are available
  });

  // console.log("hook coutries", hookCountries);

  useEffect(() => {
    // Only update if we don't have dynamic section data
    if (dynamicSection) return;

    if (appointmentTexts && appointmentTexts.length > 0) {
      const recordWithSectionContent =
        appointmentTexts.find(
          (record) => record.sectionTitle && record.sectionDescription
        ) || appointmentTexts[0];

      setSectionContent({
        title: recordWithSectionContent.sectionTitle || "Choose Your Country",
        description:
          recordWithSectionContent.sectionDescription ||
          "We support 20 countries over all the visa centres in the UK",
      });
      return;
    }

    if (!loading) {
      setSectionContent({
        title: "Choose Your Country",
        description:
          "We support 20 countries over all the visa centres in the UK",
      });
    }
  }, [appointmentTexts, loading, dynamicSection]);

  const homepageCountries = useMemo(() => {
    // If we have dynamic section data (only for everyday-steals), use it
    if (
      dynamicSection &&
      dynamicSection.countries &&
      dynamicSection.countries.length > 0
    ) {
      // Merge dynamic items with rich data from hookCountries (especially images)
      return dynamicSection.countries.map((dynCountry) => {
        const richMatch = hookCountries.find(
          (h) => h.name.toLowerCase() === dynCountry.name.toLowerCase()
        );
        return {
          ...richMatch,
          ...dynCountry,
          // Ensure image falls back to richMatch if dynCountry is missing it
          image:
            dynCountry.image ||
            richMatch?.image ||
            "/image/country/Germany.jpg",
          appointmentText:
            dynCountry.appointmentText ||
            richMatch?.appointmentText ||
            "Appointment in 10 days or less",
        };
      });
    }
    // Otherwise use hook countries (normal section)
    return hookCountries;
  }, [dynamicSection, hookCountries]);

  const displayedCountries = useMemo(() => {
    let list = homepageCountries;

    if (list.length === 0 && dynamicSection) {
      list = homepageCountries;
    }

    const limit = isMobile ? 5 : 9;
    return showAll ? list : list.slice(0, limit);
  }, [homepageCountries, showAll, dynamicSection, isMobile]);

  // console.log("homepage coutries", homepageCountries);
  // console.log("displayed countries", displayedCountries, loading, error);
  // Resolve occasion dates: use admin-set dates if available, otherwise derive from title
  const getOccasionDates = useCallback((occ) => {
    if (occ.arrivalDate && occ.departureDate) {
      return { arrivalDate: occ.arrivalDate, departureDate: occ.departureDate };
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const title = (occ.title || "").toLowerCase().trim();

    // Map occasion titles to sensible date ranges
    const monthNames = [
      "january",
      "february",
      "march",
      "april",
      "may",
      "june",
      "july",
      "august",
      "september",
      "october",
      "november",
      "december",
    ];
    const monthShort = [
      "jan",
      "feb",
      "mar",
      "apr",
      "may",
      "jun",
      "jul",
      "aug",
      "sep",
      "oct",
      "nov",
      "dec",
    ];

    // Check if title is a month name (e.g. "April", "May")
    let monthIndex = monthNames.findIndex((m) => title.includes(m));
    if (monthIndex === -1)
      monthIndex = monthShort.findIndex(
        (m) => title === m || title.startsWith(m + " ")
      );
    if (monthIndex !== -1) {
      let year = currentYear;
      // Extract year from title if present (e.g. "April 27")
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1]);
      // If month is in the past this year, use next year
      else if (
        monthIndex < now.getMonth() ||
        (monthIndex === now.getMonth() && now.getDate() > 15)
      ) {
        year = currentYear + 1;
      }
      const arrival = `${year}-${String(monthIndex + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(year, monthIndex + 1, 0).getDate();
      const departure = `${year}-${String(monthIndex + 1).padStart(
        2,
        "0"
      )}-${String(lastDay).padStart(2, "0")}`;
      return { arrivalDate: arrival, departureDate: departure };
    }

    // Easter: approximate dates
    if (title.includes("easter")) {
      // Easter 2026 is April 5
      let year = currentYear;
      const easterDates = {
        2025: [4, 20],
        2026: [4, 5],
        2027: [3, 28],
        2028: [4, 16],
      };
      const entry = easterDates[year] || easterDates[year + 1];
      if (entry && new Date(year, entry[0] - 1, entry[1]) < now) year++;
      const e = easterDates[year] || [4, 5];
      const arrival = new Date(year, e[0] - 1, e[1] - 3); // 3 days before Easter
      const departure = new Date(year, e[0] - 1, e[1] + 4); // 4 days after Easter
      return {
        arrivalDate: arrival.toISOString().split("T")[0],
        departureDate: departure.toISOString().split("T")[0],
      };
    }

    // Christmas / Xmas
    if (title.includes("xmas") || title.includes("christmas")) {
      let year = currentYear;
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1]);
      else if (now.getMonth() === 11 && now.getDate() > 26) year++;
      return { arrivalDate: `${year}-12-20`, departureDate: `${year}-12-31` };
    }

    // New Year
    if (title.includes("new year")) {
      let year = currentYear;
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1]);
      else if (now.getMonth() === 0 && now.getDate() > 5) year++;
      return {
        arrivalDate: `${year}-12-28`,
        departureDate: `${year + 1}-01-05`,
      };
    }

    // Half Term (February half term by default)
    if (title.includes("half term")) {
      let year = currentYear;
      const yearMatch = title.match(/\b(\d{2})\b/);
      if (yearMatch) year = 2000 + parseInt(yearMatch[1]);
      else if (now.getMonth() > 1) year++;
      return { arrivalDate: `${year}-02-15`, departureDate: `${year}-02-23` };
    }

    // "Best snow right now" or any unrecognized — use 4 weeks from now + 14 days
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + 28);
    const departure = new Date(arrival);
    departure.setDate(departure.getDate() + 14);
    return {
      arrivalDate: arrival.toISOString().split("T")[0],
      departureDate: departure.toISOString().split("T")[0],
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-6" id={id}>
      {id === "everyday-steals" && (
        <div className="w-full px-4 pt-10 pb-5">
          <div className="bg-[#fdfd55] md:flex-row flex-col text-center md:text-start flex items-center justify-center py-6 px-6 rounded-4xl -mt-8 gap-3 md:gap-6">
            <Image
              src={"/image/nu-logo.png"}
              className="rounded-full"
              width={75}
              height={75}
              alt="Badge Icon"
            />
            <div className="flex flex-col text-white items-center justify-center">
              <div className="flex items-center gap-2">
                <p className="text-[24px] lg:text-[26px] font-gilroy-bold text-black leading-tight">
                  {occasionContent ||
                    dynamicSection?.title ||
                    "Grab £50 off your advance booking"}
                </p>
              </div>

              <div className="flex items-center gap-2 text-gray-500 font-gilroy-medium mt-1">
                <p className="text-[12px] md:text-lg font-semibold">
                  {occasionSubtitle ||
                    dynamicSection?.description ||
                    "Lock it in today to maximise savings."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Large 2x2 Image Card (Visible on lg screens) */}
        {!loading && !error && (
          <div className="lg:block lg:col-span-3 lg:row-span-3 relative rounded-2xl overflow-hidden group h-full min-h-[600px]">
            <Image
              src={image || "/image/choose_country.png"}
              alt="Choose Country"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading={id === "everyday-steals" ? "lazy" : "eager"}
              sizes="(max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-xl font-gilroy-bold mb-0.5">
                {dynamicSection
                  ? dynamicSection.title
                  : image
                  ? "Everyday Steals"
                  : sectionContent.title}
              </h3>
              <p className="text-xs opacity-90">
                {dynamicSection
                  ? dynamicSection.description
                  : image
                  ? "Best deals on flights and hotels"
                  : sectionContent.description}
              </p>
            </div>
          </div>
        )}

        {id === "everyday-steals" ? (
          <div className="lg:col-span-3 grid grid-cols-2 gap-4 h-full">
            {occasions.map((occ, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-2 h-full"
                onClick={() => {
                  const dates = getOccasionDates(occ);
                  const params = new URLSearchParams();
                  if (dates.arrivalDate)
                    params.set("arrivalDate", dates.arrivalDate);
                  if (dates.departureDate)
                    params.set("departureDate", dates.departureDate);
                  params.set("occasionIdx", String(idx));
                  const qs = params.toString();
                  router.push(`/get-the-visa${qs ? `?${qs}` : ""}`);
                }}
              >
                <div
                  style={{
                    backgroundColor: `${occ.bgColor}`,
                  }}
                  className="relative flex-1 min-h-[150px] rounded-xl flex items-center justify-center p-4 text-center cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-md overflow-hidden group"
                >
                  <div className="absolute inset-0 transition-colors"></div>

                  <h4
                    style={{ color: occ.textColor }}
                    className="relative z-10 text-[14px] md:text-[16px] font-gilroy-bold leading-tight uppercase drop-shadow-lg"
                  >
                    {occ.title}
                  </h4>
                </div>
                <p className="text-[10px] font-gilroy-bold text-[#4a90e2] uppercase tracking-tighter">
                  {occ.subTitle}
                </p>
              </div>
            ))}
          </div>
        ) : (
          // RENDER COUNTRIES (Top Section)
          !loading &&
          !error &&
          displayedCountries.map((country, index) => (
            <div
              key={index}
              onClick={() => handleCountrySelect(country.name)}
              className="group relative bg-[#18181e] rounded-xl transform hover:shadow-[0_0_15px_#3ed1ff] transition-shadow duration-300 cursor-pointer overflow-hidden"
            >
              {/* Country Image */}
              <div className="relative h-[130px] md:h-[110px] overflow-hidden">
                <Image
                  src={country.image}
                  alt={country.landmark || country.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 20vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  loading={index < 8 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent"></div>
              </div>

              {/* Card Content */}
              <div className="p-2">
                <div className="mb-1 text-[11px] font-gilroy-bold text-white uppercase tracking-wider">
                  {country.name}
                </div>
                <div className="text-[10px] font-gilroy text-white opacity-80 leading-tight line-clamp-1">
                  {country.appointmentText}
                </div>

                {!isVisaPricingLoading &&
                  country.isActive !== false &&
                  countryPricingLookup[normalizeCountryKey(country.name)] && (
                    <div className="mt-1 text-white text-[10px] font-gilroy-bold">
                      {country.price_from} £
                      {
                        countryPricingLookup[normalizeCountryKey(country.name)]
                          .basePrice
                      }
                    </div>
                  )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* See More Button - Only for Country view */}
      {id !== "everyday-steals" &&
        !image &&
        !showAll &&
        homepageCountries.length > (isMobile ? 5 : 9) && (
          <div ref={seeMoreRef} className="text-center mt-12">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              See More
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        )}

      {/* Show Less Button - Only for Country view */}
      {id !== "everyday-steals" &&
        showAll &&
        homepageCountries.length > (isMobile ? 5 : 9) && (
          <div className="text-center mt-12">
            <button
              onClick={() => {
                setShowAll(false);
                setTimeout(() => {
                  seeMoreRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                  });
                }, 0);
              }}
              className="inline-flex items-center gap-2 bg-gray-700 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-600 transition-colors duration-300"
            >
              Show Less
              <ChevronDown className="w-5 h-5 rotate-180" />
            </button>
          </div>
        )}

      <div className="my-14 sm:mt-12 sm:mb-0 max-sm:w-full flex items-center justify-center flex-col gap-10">
        <p
          className={`text-[18px] mt-3 ${
            image ? "text-white" : "text-white"
          } font-gilroy-bold text-center`}
        >
          {id !== "everyday-steals" && urgentDescription
            ? urgentDescription
            : ""}
        </p>

        <div className="mb-10 md:mb-20">
          <Link href={"/get-the-visa#required-documents"}>
            <button className="group flex items-center bg-[#6B4EFF] text-white gap-[12px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
              <span className="mr-3 text-md md:text-2xl uppercase">
                Check Required Document
              </span>
              <span className="bg-white rounded-full p-1.5 transition-transform duration-300 group-hover:rotate-45 group-hover:translate-x-1 group-hover:-translate-y-0">
                <ArrowUpRight className="w-5 h-5 text-[#6B4EFF]" />
              </span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CountryCardsSection;
