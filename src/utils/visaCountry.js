import { countryCodeMap } from "@/utils/countryCodeMap";

/** ISO 3166-1 alpha-2 → visa destination display name (matches countryCodeMap keys). */
const ISO2_TO_VISA_COUNTRY_NAME = {
  GB: "United Kingdom",
  UK: "United Kingdom",
  DE: "Germany",
  FR: "France",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  BE: "Belgium",
  AT: "Austria",
  GR: "Greece",
  PT: "Portugal",
  CH: "Switzerland",
  NO: "Norway",
  SE: "Sweden",
  DK: "Denmark",
  FI: "Finland",
  IS: "Iceland",
  PL: "Poland",
  CZ: "Czech Republic",
  HU: "Hungary",
  SK: "Slovakia",
  SI: "Slovenia",
  EE: "Estonia",
  LV: "Latvia",
  LT: "Lithuania",
  MT: "Malta",
  LU: "Luxembourg",
  LI: "Liechtenstein",
};

/**
 * Normalize stored country values for visa applications and UI (never "GB" as destination).
 */
export function resolveVisaCountryName(value) {
  if (value === undefined || value === null) return "";

  const trimmed = String(value).trim();
  if (!trimmed) return "";

  const upper = trimmed.toUpperCase();
  if (ISO2_TO_VISA_COUNTRY_NAME[upper]) {
    return ISO2_TO_VISA_COUNTRY_NAME[upper];
  }

  if (countryCodeMap[trimmed]) {
    return trimmed;
  }

  const matchKey = Object.keys(countryCodeMap).find(
    (key) => key.toLowerCase() === trimmed.toLowerCase()
  );
  if (matchKey) {
    return matchKey;
  }

  return trimmed;
}

export function getFlagCodeForVisaCountry(countryValue) {
  const name = resolveVisaCountryName(countryValue);
  return countryCodeMap[name] || countryCodeMap[countryValue] || null;
}
