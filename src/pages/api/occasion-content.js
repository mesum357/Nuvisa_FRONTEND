import { fetchOccasionContentFromDb } from "@/lib/occasionContentDb";
import {
  extractOccasionFromAdminJson,
  finalizeOccasionPayload,
  getAdminApiBases,
  occasionFromCmsFields,
} from "@/utils/occasionData";

const CACHE_TTL_MS = 60 * 1000;
let cache = { data: null, expiresAt: 0 };

async function fetchBackendCms(apiBase) {
  if (!apiBase) return null;
  try {
    const res = await fetch(`${apiBase}/cms/homepage`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const fields = json?.data?.results || json?.results || {};
    const parsed = occasionFromCmsFields(fields);
    if (
      parsed.title ||
      parsed.description ||
      parsed.occasions.length > 0
    ) {
      return { ...parsed, source: "backend-cms" };
    }
  } catch (e) {
    console.warn("occasion-content backend:", e?.message);
  }
  return null;
}

async function fetchAdminOccasions() {
  const paths = ["/api/occasion-content", "/api/country-section"];

  for (const base of getAdminApiBases()) {
    for (const path of paths) {
      try {
        const res = await fetch(`${base}${path}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) continue;
        const json = await res.json();
        const extracted = extractOccasionFromAdminJson(json);
        if (
          extracted &&
          (extracted.title ||
            extracted.description ||
            extracted.occasions.length > 0)
        ) {
          return { ...extracted, source: `admin${path}` };
        }
      } catch (e) {
        console.warn(`occasion-content ${base}${path}:`, e?.message);
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const allowDefaults = req.query.defaults !== "false";
  const now = Date.now();
  const cacheKey = allowDefaults ? "default" : "strict";

  if (cache.data?.[cacheKey] && cache.expiresAt > now) {
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120"
    );
    return res.status(200).json(cache.data[cacheKey]);
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  // 1) Shared Postgres — same table nuvisa-admin saves to (after migration)
  const fromDb = await fetchOccasionContentFromDb();
  // 2) Nest backend site_content CMS
  const fromCms = await fetchBackendCms(apiBase);
  // 3) nuvisa-admin HTTP API fallback
  const fromAdmin = await fetchAdminOccasions();

  const merged = {
    title: fromDb?.title || fromCms?.title || fromAdmin?.title || "",
    description:
      fromDb?.description || fromCms?.description || fromAdmin?.description || "",
    occasions:
      fromDb?.occasions?.length > 0
        ? fromDb.occasions
        : fromCms?.occasions?.length > 0
        ? fromCms.occasions
        : fromAdmin?.occasions || [],
  };

  const source = fromDb?.occasions?.length
    ? fromDb.source
    : fromCms?.occasions?.length
    ? fromCms.source
    : fromAdmin?.occasions?.length
    ? fromAdmin.source
    : fromDb?.title || fromDb?.description
    ? fromDb.source
    : fromCms?.title || fromCms?.description
    ? fromCms.source
    : fromAdmin?.title || fromAdmin?.description
    ? fromAdmin.source
    : "defaults";

  const payload = {
    success: true,
    data: finalizeOccasionPayload(merged, { allowDefaults }),
    source,
  };

  if (!cache.data) cache.data = {};
  cache.data[cacheKey] = payload;
  cache.expiresAt = now + CACHE_TTL_MS;

  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return res.status(200).json(payload);
}
