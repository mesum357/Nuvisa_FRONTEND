import { mergeSliderContentResponse } from "@/constants/sliderContentDefaults";
import { getSliderCacheStore } from "@/lib/contentApiCache";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";
import { fetchAdminJson } from "@/utils/adminApiBase";

const CACHE_KEY = "__all__";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const bust = req.query?.t;
  const now = Date.now();
  const store = getSliderCacheStore();
  const cached = store.get(CACHE_KEY);

  if (!bust && cached && now - cached.timestamp < CONTENT_API_CACHE_TTL_MS) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(mergeSliderContentResponse(cached.data));
  }

  try {
    const data = mergeSliderContentResponse(
      await fetchAdminJson("/api/public/slider-content"),
    );

    if (!data?.data?.length) {
      throw new Error("No slider content from admin panel");
    }

    store.set(CACHE_KEY, { data, timestamp: now });
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json(data);
  } catch (error) {
    console.error("slider-content proxy error:", error?.message);
    if (cached?.data) {
      res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
      return res.status(200).json(mergeSliderContentResponse(cached.data));
    }
    return res.status(200).json(mergeSliderContentResponse(null));
  }
}
