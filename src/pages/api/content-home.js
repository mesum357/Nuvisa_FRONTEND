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

async function fetchAdminSiteContent() {
  const { fetchAdminJson } = await import("@/utils/adminApiBase");
  const json = await fetchAdminJson("/api/content");
  if (!json) return {};
  const rows = Array.isArray(json?.data) ? json.data : [];
  const byKey = {};
  for (const row of rows) {
    if (row?.key != null) {
      byKey[row.key] = row.value;
    }
  }
  return byKey;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const bust = req.query?.t;
  const now = Date.now();
  const cache = getContentHomeCache();
  if (!bust && cache.data && cache.expiresAt > now) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(cache.data);
  }

  const byKey = {};
  const { getPublicApiBase } = await import("@/utils/adminApiBase");
  const apiBase = getPublicApiBase();

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

  const adminKeys = await fetchAdminSiteContent();
  Object.assign(byKey, adminKeys);

  const payload = { success: true, data: byKey };
  setContentHomeCache({ data: payload, expiresAt: now + CACHE_TTL_MS });
  res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
  return res.status(200).json(payload);
}
