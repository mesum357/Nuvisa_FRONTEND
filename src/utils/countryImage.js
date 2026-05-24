/** Local country card / carousel assets under /public/image/country */
const LOCAL_COUNTRY_PATH =
  /^\/image\/country\/([^/?#]+)\.(jpe?g|webp|png)$/i;

export const DEFAULT_COUNTRY_IMAGE = "/image/country/Germany.webp";

/** Country names that have a .webp file in public/image/country */
export const COUNTRIES_WITH_WEBP = new Set([
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
  "Luxembourg",
  "Malta",
  "Netherlands",
  "Norway",
  "Poland",
  "Portugal",
  "Spain",
  "Switzerland",
]);

/**
 * Build a local country image path (WebP when available, else JPEG).
 */
export function getCountryImagePath(countryName) {
  const name = String(countryName || "").trim();
  if (!name) return DEFAULT_COUNTRY_IMAGE;

  const ext = COUNTRIES_WITH_WEBP.has(name) ? "webp" : "jpg";
  return `/image/country/${encodeURIComponent(name)}.${ext}`;
}

/**
 * Rewrite /image/country/*.jpg → .webp when we ship WebP for that country.
 */
export function preferCountryWebp(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return imageUrl || "";

  const trimmed = imageUrl.trim();
  const match = trimmed.match(LOCAL_COUNTRY_PATH);
  if (!match) return trimmed;

  const countryName = decodeURIComponent(match[1]);
  if (!COUNTRIES_WITH_WEBP.has(countryName)) {
    return trimmed;
  }

  return `/image/country/${encodeURIComponent(countryName)}.webp`;
}

export function isLocalCountryImagePath(url) {
  return Boolean(url && LOCAL_COUNTRY_PATH.test(String(url).trim()));
}
