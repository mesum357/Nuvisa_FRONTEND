import { fetchFaqsFromDb } from "@/lib/faqsDb";
import {
  CONTENT_API_CACHE_TTL_MS,
  CONTENT_API_HTTP_CACHE,
} from "@/lib/contentCacheConfig";

let faqsCache = { key: "", data: null, expiresAt: 0 };

const ADMIN_FETCH_TIMEOUT_MS = 5000;

async function fetchAdminPublicFaqs(queryString = "") {
  const { getAdminApiBase } = await import("@/utils/adminApiBase");
  const base = getAdminApiBase();
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

    if (!response.ok) return [];

    const data = await response.json();
    if (data?.success && Array.isArray(data.data)) {
      return data.data.map((row) => ({
        ...row,
        faqType: row.faqType || row.category,
      }));
    }
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
  } catch (error) {
    console.error("Admin FAQs fetch failed:", url, error?.message || error);
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

  // In production prefer the admin public API so renamed FAQ types
  // in the admin UI appear immediately on the public site. Fall
  // back to the shared DB if the admin public endpoint returns nothing.
  const query = new URLSearchParams();
  if (categoryFilter) query.set("category", String(categoryFilter));
  if (isFeatured !== undefined) query.set("isFeatured", String(isFeatured));
  const queryString = query.toString() ? `?${query.toString()}` : "";
  const cacheKey = queryString || "__all__";
  const now = Date.now();

  if (
    faqsCache.key === cacheKey &&
    faqsCache.data &&
    faqsCache.expiresAt > now
  ) {
    res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
    return res.status(200).json({ success: true, data: faqsCache.data });
  }

  let faqs = [];
  if (process.env.NODE_ENV === "production") {
    faqs = await fetchAdminPublicFaqs(queryString);
    if (!faqs.length) {
      faqs = await fetchFaqsFromDb(dbFilters);
    }
  } else {
    faqs = await fetchFaqsFromDb(dbFilters);
    if (!faqs.length) {
      faqs = await fetchAdminPublicFaqs(queryString);
    }
  }

  if (faqs.length > 0) {
    faqsCache = {
      key: cacheKey,
      data: faqs,
      expiresAt: now + CONTENT_API_CACHE_TTL_MS,
    };
  }

  res.setHeader("Cache-Control", CONTENT_API_HTTP_CACHE);
  return res.status(200).json({ success: true, data: faqs });
}
