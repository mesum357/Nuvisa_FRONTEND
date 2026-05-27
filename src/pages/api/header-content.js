import { getHeaderCacheStore } from "@/lib/contentApiCache";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";
import { fetchAdminJson } from "@/utils/adminApiBase";

const DEFAULT_TTL_MS = CONTENT_API_CACHE_TTL_MS;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { section, t: bust } = req.query;
  const sectionKey = section || "__all__";
  const now = Date.now();
  const cacheStore = getHeaderCacheStore();
  const cached = cacheStore.get(sectionKey);

  if (
    !bust &&
    cached &&
    now - cached.timestamp < (process.env.HEADER_CONTENT_TTL_MS ? Number(process.env.HEADER_CONTENT_TTL_MS) : DEFAULT_TTL_MS)
  ) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(cached.data);
  }

  try {
    const endpoint = section ? `?section=${encodeURIComponent(section)}` : "";
    const data = await fetchAdminJson(`/api/public/header-content${endpoint}`);

    if (!data) {
      throw new Error("No header content from admin panel");
    }

    cacheStore.set(sectionKey, { data, timestamp: now });
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
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
