import { fetchFaqsFromDb } from "@/lib/faqsDb";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";
import {
  getFaqsCache,
  setFaqsCache,
} from "@/lib/contentApiCache";
import { getAdminApiBases } from "@/utils/adminApiBase";

const ADMIN_FETCH_TIMEOUT_MS = 8000;

function normalizeFaqRows(data) {
  if (data?.success && Array.isArray(data.data)) {
    return data.data.map((row) => ({
      ...row,
      faqType: row.faqType || row.category,
    }));
  }
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
}

async function fetchAdminPublicFaqs(queryString = "") {
  for (const base of getAdminApiBases()) {
    const url = `${base}/api/public/faqs${queryString}`;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), ADMIN_FETCH_TIMEOUT_MS);
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (!response.ok) continue;

      const data = await response.json();
      const rows = normalizeFaqRows(data);
      if (rows.length) return rows;
    } catch (error) {
      console.error("Admin FAQs fetch failed:", url, error?.message || error);
    }
  }

  return [];
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category, faqType, isFeatured } = req.query;
  const categoryFilter = category || faqType;

  const dbFilters = {};
  if (categoryFilter) dbFilters.category = String(categoryFilter);
  if (isFeatured !== undefined) dbFilters.isFeatured = String(isFeatured);

  const query = new URLSearchParams();
  if (categoryFilter) query.set("category", String(categoryFilter));
  if (isFeatured !== undefined) query.set("isFeatured", String(isFeatured));
  const queryString = query.toString() ? `?${query.toString()}` : "";
  const cacheKey = queryString || "__all__";
  const bust = req.query?.t;
  const now = Date.now();
  const faqsCache = getFaqsCache();

  if (
    !bust &&
    faqsCache.key === cacheKey &&
    faqsCache.data &&
    faqsCache.expiresAt > now
  ) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json({ success: true, data: faqsCache.data });
  }

  let faqs = await fetchAdminPublicFaqs(queryString);
  if (!faqs.length) {
    faqs = await fetchFaqsFromDb(dbFilters);
  }

  if (faqs.length > 0) {
    setFaqsCache({
      key: cacheKey,
      data: faqs,
      expiresAt: now + CONTENT_API_CACHE_TTL_MS,
    });
  }

  res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
  return res.status(200).json({ success: true, data: faqs });
}
