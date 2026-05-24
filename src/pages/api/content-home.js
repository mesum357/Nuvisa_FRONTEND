/** Public homepage key/value content — backend CMS + Nuvisa-Admin site_content. */
import { fetchWithTimeout } from "@/utils/fetchWithTimeout";

import {
  getContentHomeCache,
  setContentHomeCache,
} from "@/lib/contentApiCache";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

const CACHE_TTL_MS = CONTENT_API_CACHE_TTL_MS;

async function fetchAdminSiteContent(adminUrl) {
  if (!adminUrl) return {};
  try {
    const res = await fetchWithTimeout(`${adminUrl}/api/content`, {
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return {};
    const json = await res.json();
    const rows = Array.isArray(json?.data) ? json.data : [];
    const byKey = {};
    for (const row of rows) {
      if (row?.key != null) {
        byKey[row.key] = row.value;
      }
    }
    return byKey;
  } catch (e) {
    console.warn("content-home admin:", e?.message);
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  const cache = getContentHomeCache();
  if (cache.data && cache.expiresAt > now) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(cache.data);
  }

  const byKey = {};
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  if (apiBase) {
    try {
      const cmsRes = await fetchWithTimeout(`${apiBase}/cms/homepage`);
      if (cmsRes.ok) {
        const json = await cmsRes.json();
        Object.assign(byKey, json?.data?.results || json?.results || {});
      }
    } catch (e) {
      console.warn("content-home backend:", e?.message);
    }
  }

  const { getAdminApiBase } = await import("@/utils/adminApiBase");
  const adminUrl = getAdminApiBase();
  const adminKeys = await fetchAdminSiteContent(adminUrl);
  Object.assign(byKey, adminKeys);

  const payload = { success: true, data: byKey };
  setContentHomeCache({ data: payload, expiresAt: now + CACHE_TTL_MS });
  res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
  return res.status(200).json(payload);
}
