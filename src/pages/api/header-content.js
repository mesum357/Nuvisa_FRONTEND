import { getHeaderCacheStore } from "@/lib/contentApiCache";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

const DEFAULT_TTL_MS = CONTENT_API_CACHE_TTL_MS;
const UPSTREAM_TIMEOUT_MS = 6000;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { section } = req.query;
  const sectionKey = section || "__all__";
  const now = Date.now();
  const cacheStore = getHeaderCacheStore();
  const cached = cacheStore.get(sectionKey);

  if (cached && now - cached.timestamp < (process.env.HEADER_CONTENT_TTL_MS ? Number(process.env.HEADER_CONTENT_TTL_MS) : DEFAULT_TTL_MS)) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(cached.data);
  }

  try {
    const endpoint = section ? `?section=${encodeURIComponent(section)}` : "";
    const { getAdminApiBase } = await import("@/utils/adminApiBase");
    const adminUrl = getAdminApiBase();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(`${adminUrl}/api/public/header-content${endpoint}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`Admin panel responded with status: ${response.status}`);
    }

    const data = await response.json();
    cacheStore.set(sectionKey, { data, timestamp: now });
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching header content:", error?.message || error);

    if (cached?.data) {
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
      return res.status(200).json(cached.data);
    }

    return res.status(200).json({ success: true, data: [] });
  }
}
