/** Local country card / carousel assets under /public/image/country */
const LOCAL_COUNTRY_PATH =
  /^\/image\/country\/([^/?#]+)\.(jpe?g|webp|png)$/i;

export const DEFAULT_COUNTRY_IMAGE = "/image/country/Germany.webp";

/** Matches files shipped in public/image/country/ (see git). */
const COUNTRIES_WITH_WEBP = new Set([
  "Belgium",
  "Bulgaria",
  "Estonia",
  "Finland",
  "France",
  "Germany",
  "Greece",
  "Hungary",
  "Iceland",
  "Italy",
  "Latvia",
  "Lithuania",
  "Malta",
  "Netherlands",
  "Norway",
  "Poland",
  "Portugal",
  "Spain",
  "Switzerland",
]);

function normalizeCountryName(name) {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "";
  if (trimmed.toUpperCase() === "NORWAY") return "Norway";
  return trimmed;
}

function countryWebpPath(countryName) {
  return `/image/country/${encodeURIComponent(countryName)}.webp`;
}

/**
 * Resolve a country image URL or name to a WebP path under /public/image/country.
 * Falls back to Germany when no asset exists for that country.
 */
export function resolveCountryImage(imageUrlOrName) {
  if (!imageUrlOrName || typeof imageUrlOrName !== "string") {
    return DEFAULT_COUNTRY_IMAGE;
  }

  const trimmed = imageUrlOrName.trim();
  const match = trimmed.match(LOCAL_COUNTRY_PATH);
  const countryName = normalizeCountryName(
    match ? decodeURIComponent(match[1]) : trimmed.replace(/^\/+/, ""),
  );

  if (COUNTRIES_WITH_WEBP.has(countryName)) {
    return countryWebpPath(countryName);
  }

  return DEFAULT_COUNTRY_IMAGE;
}

export function getCountryImagePath(countryName) {
  return resolveCountryImage(countryName);
}

/** Normalize admin paths (/image/country/X.jpg) to deployed WebP paths. */
export function preferCountryWebp(imageUrl) {
  return resolveCountryImage(imageUrl);
}

export function isLocalCountryImagePath(url) {
  return Boolean(url && LOCAL_COUNTRY_PATH.test(String(url).trim()));
}
