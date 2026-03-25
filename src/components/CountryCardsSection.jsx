import React, { useEffect, useMemo, useState, useCallback } from "react";
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

const CountryCardsSection = ({ specificCountries, image, id }) => {
  const [showAll, setShowAll] = useState(false);
  const [sectionContent, setSectionContent] = useState({
    title: "Choose Your Country",
    description: "We support 20 countries over all the visa centres in the UK",
  });
  const router = useRouter();
  const dispatch = useAppDispatch();
  const visaState = useAppSelector((state) => state.visa);
  const [countryPricingList, setCountryPricingList] = useState([]);
  const [isVisaPricingLoading, setIsVisaPricingLoading] = useState(true);

  const [occasions, setOccasions] = useState([]);

  const normalizeCountryKey = useCallback((value) => String(value || "").trim().toLowerCase(), []);

  // Memoize handleCountrySelect to prevent unnecessary re-renders
  const handleCountrySelect = useCallback((countryName) => {
    // Get dynamic fees based on selected country
    const countryConfig = getCountryConfig(countryName);

    // Preserve existing traveler count, default to 0 if not set
    const currentTravelerCount = visaState.travelers !== undefined && visaState.travelers !== null
      ? visaState.travelers
      : 0;

    // Store the selected country and dynamic fees in Redux
    dispatch(setSelectedCountry(String(countryName)));
    dispatch(setVisaFees(Number(countryConfig.visaFee)));
    dispatch(setInsuranceFees(Number(countryConfig.insuranceFee)));
    dispatch(setTravelers(Number(currentTravelerCount)));

    // Redirect to checkout with dynamic country information
    router.push(
      `/get-the-visa?selectedCountry=${encodeURIComponent(
        countryName
      )}&visaFees=${countryConfig.visaFee}&insuranceFees=${countryConfig.insuranceFee
      }&travelers=${currentTravelerCount}`
    );
  }, [visaState.travelers, dispatch, router]);

  const [dynamicSection, setDynamicSection] = useState(null);
  const [isDynamicLoading, setIsDynamicLoading] = useState(true);

  useEffect(() => {
    // Only fetch dynamic section for "everyday-steals" section
    if (id !== 'everyday-steals') {
      setIsDynamicLoading(false);
      return;
    }

    const fetchDynamicSection = async () => {
      try {
        const adminApiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';
        console.log(`[DEBUG] Fetching from: ${adminApiUrl}/api/occasion-content`);

        // Fetch Occasion Content if this is the everyday-steals section
        if (id === 'everyday-steals') {
          // Add timestamp to bypass any browser/nextjs caching
          const url = `${adminApiUrl}/api/occasion-content?t=${Date.now()}`;
          const occRes = await fetch(url);
          const occResult = await occRes.json();

          console.log("[DEBUG] Occasion Result:", occResult);

          if (occResult.success && occResult.data) {
            setDynamicSection(occResult.data);
            setSectionContent({
              title: occResult.data.title,
              description: occResult.data.description
            });
            if (occResult.data.occasions && Array.isArray(occResult.data.occasions)) {
              console.log("[DEBUG] Setting occasions:", occResult.data.occasions);
              setOccasions(occResult.data.occasions);
            }
          }
        }
        else {
          // Standard country section fetch
          const res = await fetch(`${adminApiUrl}/api/country-section`);
          const result = await res.json();
          if (result.success && result.data) {
            setDynamicSection(result.data);
            setSectionContent({
              title: result.data.title,
              description: result.data.description
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch dynamic section:", error);
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

  useEffect(() => {
    // Only update if we don't have dynamic section data
    if (dynamicSection) return;

    if (appointmentTexts && appointmentTexts.length > 0) {
      const recordWithSectionContent =
        appointmentTexts.find(
          record => record.sectionTitle && record.sectionDescription
        ) || appointmentTexts[0];

      setSectionContent({
        title: recordWithSectionContent.sectionTitle || "Choose Your Country",
        description:
          recordWithSectionContent.sectionDescription ||
          "We support 20 countries over all the visa centres in the UK"
      });
      return;
    }

    if (!loading) {
      setSectionContent({
        title: "Choose Your Country",
        description:
          "We support 20 countries over all the visa centres in the UK"
      });
    }
  }, [appointmentTexts, loading, dynamicSection]);

  const homepageCountries = useMemo(() => {
    // If we have dynamic section data (only for everyday-steals), use it
    if (dynamicSection && dynamicSection.countries && dynamicSection.countries.length > 0) {
      // Merge dynamic items with rich data from hookCountries (especially images)
      return dynamicSection.countries.map(dynCountry => {
        const richMatch = hookCountries.find(
          h => h.name.toLowerCase() === dynCountry.name.toLowerCase()
        );
        return {
          ...richMatch,
          ...dynCountry,
          // Ensure image falls back to richMatch if dynCountry is missing it
          image: dynCountry.image || richMatch?.image || "/image/country/Germany.jpg",
          appointmentText: dynCountry.appointmentText || richMatch?.appointmentText || "Appointment in 10 days or less"
        };
      });
    }
    // Otherwise use hook countries (normal section)
    return hookCountries;
  }, [dynamicSection, hookCountries]);

  const displayedCountries = useMemo(() => {
    let list = homepageCountries;

    // Fallback if filtering resulted in an empty list but we have dynamic data
    if (list.length === 0 && dynamicSection) {
      list = homepageCountries;
    }

    return showAll ? list : list.slice(0, 9);
  }, [homepageCountries, showAll, dynamicSection]);


  return (
    <div className="max-w-6xl mx-auto px-6" id={id}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Large 2x2 Image Card (Visible on lg screens) */}
        {!loading && !error && (
          <div className="lg:block lg:col-span-3 lg:row-span-3 relative rounded-2xl overflow-hidden group h-full min-h-[600px]">
            <Image
              src={image || "/image/choose_country.png"}
              alt="Choose Country"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-xl font-gilroy-bold mb-0.5">
                {dynamicSection ? dynamicSection.title : (image ? "Everyday Steals" : sectionContent.title)}
              </h3>
              <p className="text-xs opacity-90">
                {dynamicSection ? dynamicSection.description : (image ? "Best deals on flights and hotels" : sectionContent.description)}
              </p>
            </div>
          </div>
        )}

        {id === "everyday-steals" ? (
          <div className="lg:col-span-3 grid grid-cols-2 gap-4 h-full">
            {occasions.map((occ, idx) => (
              <div key={idx} className="flex flex-col gap-2 h-full">
                <div
                  style={{
                    backgroundImage: `url(${occ.img})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}

                  className="relative flex-1 min-h-[150px] rounded-xl flex items-center justify-center p-4 text-center cursor-pointer hover:scale-[1.02] transition-transform duration-300 shadow-md overflow-hidden group"
                >
                  
                  <div className="absolute inset-0 transition-colors"></div>

                  <h4 style={{ color: occ.textColor }} className="relative z-10 text-[14px] md:text-[16px] font-gilroy-bold leading-tight uppercase drop-shadow-lg">
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
          !loading && !error && displayedCountries.map((country, index) => (
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

                {!isVisaPricingLoading && country.isActive !== false && countryPricingLookup[normalizeCountryKey(country.name)] && (
                  <div className="mt-1 text-white text-[10px] font-gilroy-bold">
                    from £{countryPricingLookup[normalizeCountryKey(country.name)].basePrice}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* See More Button - Only for Country view */}
      {id !== "everyday-steals" && !image && !showAll && homepageCountries.length > 4 && (
        <div className="text-center mt-12">
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
      {id !== "everyday-steals" && showAll && homepageCountries.length > 4 && (
        <div className="text-center mt-12">
          <button
            onClick={() => setShowAll(false)}
            className="inline-flex items-center gap-2 bg-gray-700 text-white px-8 py-3 rounded-full font-medium hover:bg-gray-600 transition-colors duration-300"
          >
            Show Less
            <ChevronDown className="w-5 h-5 rotate-180" />
          </button>
        </div>
      )}

      <div className="my-14 sm:mt-12 sm:mb-0 max-sm:w-full flex items-center justify-center flex-col gap-10">
        <p className={`text-[18px] mt-3 ${image ? "text-white" : "text-white"} font-gilroy-bold text-center`}>
          *If require urgent appointment in 4-5 days kindly email
          support@nuvisa.co.uk do not follow the standard visa process.
        </p>

        <div className="mb-10 md:mb-20">
          <Link href={"/get-the-visa#required-documents"}>
            <button className="group flex items-center bg-[#6B4EFF] text-white gap-[12px] font-medium px-[24px] py-3 rounded-3xl cursor-pointer transition-all duration-300 hover:bg-[#5a3ddb]">
              <span className="mr-3 text-md md:text-2xl uppercase">Check Required Document</span>
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