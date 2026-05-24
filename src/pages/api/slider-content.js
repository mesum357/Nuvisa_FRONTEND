import { getSliderCacheStore } from "@/lib/contentApiCache";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

const CACHE_KEY = "__all__";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const now = Date.now();
  const store = getSliderCacheStore();
  const cached = store.get(CACHE_KEY);
  if (cached && now - cached.timestamp < CONTENT_API_CACHE_TTL_MS) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(cached.data);
  }

  try {
    const { getAdminApiBase } = await import("@/utils/adminApiBase");
    const adminUrl = getAdminApiBase();
    const response = await fetch(`${adminUrl}/api/public/slider-content`, {
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Admin panel responded with status: ${response.status}`);
    }

    const data = await response.json();
    store.set(CACHE_KEY, { data, timestamp: now });
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(data);
  } catch (error) {
    console.error("slider-content proxy error:", error?.message);
    if (cached?.data) {
      res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
      return res.status(200).json(cached.data);
    }
    return res.status(500).json({ error: "Failed to fetch slider content" });
  }
}
