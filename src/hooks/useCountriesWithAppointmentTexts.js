import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAppointmentTexts } from "@/api/appointmentText";
import { getAdminApiBase } from "@/utils/adminApiBase";
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

    const loadData = async () => {
      try {
        setIsLoading(true);
        const adminBase = getAdminApiBase();
        
        const [appTextsResponse, visaCountriesResponse] = await Promise.all([
          fetchAppointmentTexts(),
          fetch(`${adminBase}/api/visa-countries`).then(res => res.ok ? res.json() : { success: false })
        ]);

        if (!active) return;

        setAppointmentTexts(Array.isArray(appTextsResponse) ? appTextsResponse : []);
        setVisaCountries(visaCountriesResponse.success && Array.isArray(visaCountriesResponse.data) ? visaCountriesResponse.data : []);
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
    const visaCountriesNames = visaCountries
      .map((item) => item?.name)
      .filter(Boolean);

    const allCountryNames = new Set([...staticCountryNames, ...apiCountryNames, ...visaCountriesNames]);

    const visaCountriesMap = visaCountries.reduce((acc, item) => {
      const key = normalizeCountryName(item?.name);
      if (key) {
        acc[key] = item;
      }
      return acc;
    }, {});

    const merged = Array.from(allCountryNames).map((countryName, index) => {
      const normalizedCountryName = normalizeCountryName(countryName);
      const staticCountry = staticCountriesMap[normalizedCountryName];
      const countryData = appointmentTextMap[normalizedCountryName] || {};
      const visaCountry = visaCountriesMap[normalizedCountryName] || {};

      let countryImage = "";
      if (visaCountry.image) {
        countryImage = visaCountry.image.startsWith("http")
          ? visaCountry.image
          : visaCountry.image.startsWith("/")
            ? `${getAdminApiBase()}${visaCountry.image}`
            : `${getAdminApiBase()}/${visaCountry.image}`;
      } else if (countryData.image) {
        countryImage = countryData.image.startsWith("http")
          ? countryData.image
          : countryData.image.startsWith("/")
            ? `${getAdminApiBase()}${countryData.image}`
            : `${getAdminApiBase()}/${countryData.image}`;
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
        price_from: visaCountry.price_from || "From",
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
