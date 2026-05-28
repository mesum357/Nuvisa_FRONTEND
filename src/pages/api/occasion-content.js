import { fetchOccasionContentFromDb } from "@/lib/occasionContentDb";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";
import {
  getOccasionResponseCache,
  setOccasionResponseCache,
} from "@/lib/contentApiCache";
import {
  extractOccasionFromAdminJson,
  finalizeOccasionPayload,
  getAdminApiBases,
  occasionFromCmsFields,
} from "@/utils/occasionData";

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

  const bust = req.query?.t;
  const now = Date.now();
  const occasionResponseCache = getOccasionResponseCache();
  if (
    !bust &&
    occasionResponseCache.data &&
    occasionResponseCache.expiresAt > now
  ) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(occasionResponseCache.data);
  }

  try {
    const { getPublicApiBase } = await import("@/utils/adminApiBase");
    const apiBase = getPublicApiBase();

    const fromDb = await fetchOccasionContentFromDb();
    const fromCms = await fetchBackendCms(apiBase);
    const fromAdmin = await fetchAdminOccasions();

    const pickTitle = (...sources) => {
      for (const source of sources) {
        const value = String(source?.title || "").trim();
        if (value) return value;
      }
      return "";
    };

    const pickDescription = (...sources) => {
      for (const source of sources) {
        const value = String(source?.description || "").trim();
        if (value) return value;
      }
      return "";
    };

    const pickOccasions = (...sources) => {
      for (const source of sources) {
        if (source?.occasions?.length > 0) return source.occasions;
      }
      return [];
    };

    // Admin CMS is the source of truth; local DB / legacy CMS are fallbacks only.
    const merged = {
      title: pickTitle(fromAdmin, fromDb, fromCms),
      description: pickDescription(fromAdmin, fromDb, fromCms),
      occasions: pickOccasions(fromAdmin, fromDb, fromCms),
    };

    const source = fromAdmin?.title || fromAdmin?.description || fromAdmin?.occasions?.length
      ? fromAdmin.source
      : fromDb?.title || fromDb?.description || fromDb?.occasions?.length
      ? fromDb.source
      : fromCms?.title || fromCms?.description || fromCms?.occasions?.length
      ? fromCms.source
      : "defaults";

    const data = finalizeOccasionPayload(merged, { allowDefaults: true });
    const payload = { success: true, data, source };

    setOccasionResponseCache({
      data: payload,
      expiresAt: now + CONTENT_API_CACHE_TTL_MS,
    });
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("occasion-content error:", error?.message || error);
    const staleOccasionCache = getOccasionResponseCache();
    if (staleOccasionCache.data) {
      res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
      return res.status(200).json(staleOccasionCache.data);
    }
    const data = finalizeOccasionPayload(
      { title: "", description: "", occasions: [] },
      { allowDefaults: true },
    );
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json({ success: true, data, source: "defaults-error" });
  }
}
