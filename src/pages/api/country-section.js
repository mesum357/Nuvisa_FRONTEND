/**
 * Proxies nuvisa-admin country-section and normalizes to { title, description, occasions }.
 * Same payload shape as /api/occasion-content for Everyday Steals.
 */
import {
  extractOccasionFromAdminJson,
  finalizeOccasionPayload,
  getAdminApiBases,
  occasionFromCmsFields,
} from "@/utils/occasionData";

async function fetchBackendCms(apiBase) {
  if (!apiBase) return null;
  try {
    const res = await fetch(`${apiBase.replace(/\/+$/, "")}/cms/homepage`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const fields = json?.data?.results || json?.results || {};
    return occasionFromCmsFields(fields);
  } catch {
    return null;
  }
}

async function fetchAdminCountrySection() {
  for (const base of getAdminApiBases()) {
    try {
      const res = await fetch(`${base}/api/country-section`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      if (!res.ok) continue;
      const json = await res.json();
      const extracted = extractOccasionFromAdminJson(json);
      if (extracted) return { ...extracted, source: "admin-country-section" };
    } catch {
      // try next base
    }
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { getPublicApiBase } = await import("@/utils/adminApiBase");
  const apiBase = getPublicApiBase();
  const fromAdmin = await fetchAdminCountrySection();
  const fromCms = await fetchBackendCms(apiBase);

  const merged = {
    title: fromAdmin?.title || fromCms?.title || "",
    description: fromAdmin?.description || fromCms?.description || "",
    occasions:
      fromAdmin?.occasions?.length > 0
        ? fromAdmin.occasions
        : fromCms?.occasions || [],
  };

  const data = finalizeOccasionPayload(merged, {
    allowDefaults: req.query.defaults !== "false",
  });

  return res.status(200).json({
    success: true,
    data,
    source: fromAdmin?.source || (fromCms?.occasions?.length ? "backend-cms" : "defaults"),
  });
}
