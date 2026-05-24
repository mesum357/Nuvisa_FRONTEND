import { getHomepageCache, setHomepageCache } from "@/lib/contentApiCache";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

const CACHE_TTL_MS = CONTENT_API_CACHE_TTL_MS;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  const cache = getHomepageCache();
  if (cache.data && cache.expiresAt > now) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(cache.data);
  }

  const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  if (!apiBase) {
    return res.status(200).json({ success: true, data: {} });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`${apiBase}/cms/homepage`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const json = await response.json();
    const payload = {
      success: true,
      data: json?.data?.results || json?.results || {},
    };
    setHomepageCache({ data: payload, expiresAt: now + CACHE_TTL_MS });
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("homepage-content proxy error:", error?.message);
    return res.status(200).json({ success: true, data: getHomepageCache().data?.data || {} });
  }
}
