import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAppointmentTexts } from "@/api/appointmentText";
import { getAdminApiBase, resolveCountryImageUrl } from "@/utils/adminApiBase";
import { getCountryConfig } from "@/constants/countryConfig";

export const useCountriesWithAppointmentTexts = ({
  staticCountries = [],
  fallbackAppointmentText = "Appointment in 10 days or less",
  includeFees = false,
  sortBy = "name",
  limit,
} = {}) => {
  const [appointmentTexts, setAppointmentTexts] = useState([]);
  const [visaCountries, setVisaCountries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeCountryName = useCallback((name) => {
    return String(name || "").trim().toLowerCase();
  }, []);

  useEffect(() => {
    let active = true;

    const normalizeVisaCountriesPayload = (payload) => {
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.data)) return payload.data;
      if (Array.isArray(payload?.data?.results)) return payload.data.results;
      if (Array.isArray(payload?.results)) return payload.results;
      return [];
    };

    const normalizeVisaCountryRecord = (item) => {
      if (!item) return null;

      if (typeof item === "string") {
        const name = item.trim();
        if (!name) return null;
        return {
          name,
          image: "",
          isActive: true,
          price_from: "",
        };
      }

      if (typeof item !== "object") return null;

      const name = String(item?.name || item?.countryName || "").trim();
      if (!name) return null;

      const rawPriceFrom = item?.price_from ?? item?.priceFrom;
      return {
        ...item,
        name,
        image: String(item?.image || ""),
        isActive: item?.isActive ?? true,
        price_from:
          rawPriceFrom === undefined || rawPriceFrom === null
            ? ""
            : String(rawPriceFrom),
      };
    };

    const loadData = async () => {
      try {
        setIsLoading(true);
        const adminBase = getAdminApiBase();

        const [appTextsResponse, visaCountriesResponse] = await Promise.all([
          fetchAppointmentTexts(),
          fetch(`${adminBase}/api/visa-countries?active=true`).then(res => res.ok ? res.json() : { success: false })
        ]);

        if (!active) return;

        setAppointmentTexts(Array.isArray(appTextsResponse) ? appTextsResponse : []);
        const visaCountriesList = normalizeVisaCountriesPayload(visaCountriesResponse)
          .map(normalizeVisaCountryRecord)
          .filter((item) => item?.isActive !== false)
          .filter(Boolean);
        setVisaCountries(visaCountriesList);
        setError(null);
      } catch (err) {
        if (!active) return;
        setAppointmentTexts([]);
        setVisaCountries([]);
        setError(err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  const countries = useMemo(() => {
    const staticCountriesMap = staticCountries.reduce((acc, country) => {
      const key = normalizeCountryName(country?.name);
      if (key) {
        acc[key] = country;
      }
      return acc;
    }, {});

    const appointmentTextMap = appointmentTexts.reduce((acc, item) => {
      const key = normalizeCountryName(item?.countryName);
      if (key) {
        acc[key] = {
          appointmentText: item?.appointmentText,
          image: item?.image || null,
          originalCountryName: item?.countryName,
        };
      }
      return acc;
    }, {});

    const staticCountryNames = staticCountries
      .map((country) => country?.name)
      .filter(Boolean);
    const apiCountryNames = appointmentTexts
      .map((item) => item?.countryName)
      .filter(Boolean);
    const activeVisaCountries = visaCountries.filter((item) => item?.isActive !== false);

    const visaCountriesNames = activeVisaCountries
      .map((item) => item?.name || item?.countryName)
      .filter(Boolean);

    const allCountryNames = new Set([...staticCountryNames, ...apiCountryNames, ...visaCountriesNames]);

    const visaCountriesMap = activeVisaCountries.reduce((acc, item) => {
      const key = normalizeCountryName(item?.name || item?.countryName);
      if (key) {
        acc[key] = item;
      }
      return acc;
    }, {});
    // console.log("visa countries map", visaCountriesMap);
    // console.log("visa countries", visaCountries);
    const merged = Array.from(allCountryNames).map((countryName, index) => {
      const normalizedCountryName = normalizeCountryName(countryName);
      const staticCountry = staticCountriesMap[normalizedCountryName];
      const countryData = appointmentTextMap[normalizedCountryName] || {};
      const visaCountryRaw = visaCountriesMap[normalizedCountryName];
      const visaCountry =
        visaCountryRaw && typeof visaCountryRaw === "object"
          ? visaCountryRaw
          : {};
      let countryImage = "";
      if (visaCountry.image) {
        countryImage = resolveCountryImageUrl(visaCountry.image);
      } else if (countryData.image) {
        countryImage = resolveCountryImageUrl(countryData.image);
      } else if (staticCountry?.image) {
        countryImage = staticCountry.image;
      }

      if (!countryImage || countryImage === "") {
        // Dynamic fallback based on name
        countryImage = `/image/country/${countryName}.jpg`;
      }

      const mergedCountry = {
        id: staticCountry?.id ?? index + 1,
        name: visaCountry.name || staticCountry?.name || countryData.originalCountryName || countryName,
        image: countryImage,
        landmark: staticCountry?.landmark || countryData.originalCountryName || countryName,
        appointmentText: countryData.appointmentText || fallbackAppointmentText,
        isActive: visaCountry.isActive ?? true,
        // Keep API value when present, otherwise default to empty string.
        price_from:
          visaCountry.price_from === undefined || visaCountry.price_from === null
            ? ""
            : String(visaCountry.price_from),
      };

      if (includeFees) {
        const config = getCountryConfig(mergedCountry.name);
        mergedCountry.visaFee = Number(config?.visaFee);
        mergedCountry.insuranceFee = Number(config?.insuranceFee);
      }

      return mergedCountry;
    });

    const deduped = merged.filter((country, index, arr) => {
      const normalized = normalizeCountryName(country?.name);
      
      // Keep only if it's the first occurrence
      if (arr.findIndex((item) => normalizeCountryName(item?.name) === normalized) !== index) {
        return false;
      }

      // AND Keep only if it has a valid image source 
      // (either from staticCountries or from dynamic admin/api sources)
      const isStatic = staticCountryNames.some(sn => normalizeCountryName(sn) === normalized);
      const hasDynamicImage = country.image && !country.image.includes(`/image/country/`) && !country.image.endsWith(`.jpg`);
      
      return isStatic || hasDynamicImage;
    });

    if (sortBy === "id") {
      deduped.sort((a, b) => {
        const aId = Number.isFinite(Number(a?.id)) ? Number(a.id) : Number.MAX_SAFE_INTEGER;
        const bId = Number.isFinite(Number(b?.id)) ? Number(b.id) : Number.MAX_SAFE_INTEGER;

        if (aId === bId) {
          return String(a?.name || "").localeCompare(String(b?.name || ""));
        }

        return aId - bId;
      });
    } else {
      deduped.sort((a, b) => String(a?.name || "").localeCompare(String(b?.name || "")));
    }

    if (typeof limit === "number" && limit > 0) {
      return deduped.slice(0, limit);
    }

    return deduped;
  }, [
    appointmentTexts,
    visaCountries,
    fallbackAppointmentText,
    includeFees,
    sortBy,
    limit,
    normalizeCountryName,
    staticCountries,
  ]);

  return {
    countries,
    appointmentTexts,
    isLoading,
    error,
    normalizeCountryName,
  };
};
