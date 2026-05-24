import { fetchOccasionContentFromDb } from "@/lib/occasionContentDb";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

let occasionResponseCache = { data: null, expiresAt: 0 };
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

  const now = Date.now();
  if (occasionResponseCache.data && occasionResponseCache.expiresAt > now) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(occasionResponseCache.data);
  }

  try {
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

    const fromDb = await fetchOccasionContentFromDb();
    const fromCms = await fetchBackendCms(apiBase);
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

    const data = finalizeOccasionPayload(merged, { allowDefaults: true });
    const payload = { success: true, data, source };

    occasionResponseCache = {
      data: payload,
      expiresAt: now + CONTENT_API_CACHE_TTL_MS,
    };
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("occasion-content error:", error?.message || error);
    if (occasionResponseCache.data) {
      res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
      return res.status(200).json(occasionResponseCache.data);
    }
    const data = finalizeOccasionPayload(
      { title: "", description: "", occasions: [] },
      { allowDefaults: true },
    );
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json({ success: true, data, source: "defaults-error" });
  }
}
