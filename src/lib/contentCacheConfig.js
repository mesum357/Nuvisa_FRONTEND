/** Shared cache TTL + HTTP headers for public content API routes. */

export const CONTENT_API_CACHE_TTL_MS =
  Number(process.env.CONTENT_API_CACHE_TTL_MS) || 120 * 1000;

export const CONTENT_API_HTTP_CACHE =
  "public, s-maxage=120, stale-while-revalidate=300";
