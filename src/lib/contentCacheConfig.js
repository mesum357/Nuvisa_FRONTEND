/** Shared cache TTL + HTTP headers for public content API routes. */

const isDevRuntime =
  process.env.NODE_ENV !== "production" ||
  process.env.NEXT_PUBLIC_NODE_ENV === "development";

export const CONTENT_API_CACHE_TTL_MS = Number(process.env.CONTENT_API_CACHE_TTL_MS) ||
  (isDevRuntime ? 5 * 1000 : 120 * 1000);

export const CONTENT_API_HTTP_CACHE = isDevRuntime
  ? "no-store, must-revalidate"
  : "public, s-maxage=120, stale-while-revalidate=300";
