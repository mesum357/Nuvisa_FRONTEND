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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const normalizeCountryName = useCallback((name) => {
    return String(name || "").trim().toLowerCase();
  }, []);

  useEffect(() => {
    let active = true;

    const loadAppointmentTexts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAppointmentTexts();
        if (!active) return;
        setAppointmentTexts(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (!active) return;
        setAppointmentTexts([]);
        setError(err);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadAppointmentTexts();

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

    const allCountryNames = staticCountryNames.length > 0
      ? new Set(staticCountryNames)
      : new Set(apiCountryNames);

    const merged = Array.from(allCountryNames).map((countryName, index) => {
      const normalizedCountryName = normalizeCountryName(countryName);
      const staticCountry = staticCountriesMap[normalizedCountryName];
      const countryData = appointmentTextMap[normalizedCountryName] || {};

      let countryImage;
      if (countryData.image) {
        countryImage = countryData.image.startsWith("http")
          ? countryData.image
          : countryData.image.startsWith("/")
            ? `${getAdminApiBase()}${countryData.image}`
            : countryData.image;
      } else if (staticCountry?.image) {
        countryImage = staticCountry.image;
      } else {
        countryImage = "/image/country/default.jpg";
      }

      const mergedCountry = {
        id: staticCountry?.id ?? index + 1,
        name: staticCountry?.name || countryData.originalCountryName || countryName,
        image: countryImage,
        landmark: staticCountry?.landmark || countryData.originalCountryName || countryName,
        appointmentText: countryData.appointmentText || fallbackAppointmentText,
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
      return (
        arr.findIndex(
          (item) => normalizeCountryName(item?.name) === normalized
        ) === index
      );
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
