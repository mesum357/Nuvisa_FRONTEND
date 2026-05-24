/**
 * Prefer optimized static assets (WebP) when shipped under /public.
 * Falls back to legacy PNG paths if WebP is not deployed yet.
 */

export const CHOOSE_COUNTRY_IMAGE = "/image/choose_country.webp";
export const CHOOSE_COUNTRY_IMAGE_FALLBACK = "/image/choose_country.png";

/** @param {string} pngPath e.g. "/img/karan.png" */
export function preferWebpAsset(pngPath) {
  if (!pngPath || typeof pngPath !== "string") return pngPath || "";
  return pngPath.replace(/\.(png|jpe?g)$/i, ".webp");
}

export function getChooseCountryImagePath() {
  return CHOOSE_COUNTRY_IMAGE;
}
