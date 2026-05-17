import { fetchFaqsFromDb } from "@/lib/faqsDb";

const ADMIN_FAQ_BASES = () => {
  const fromEnv = [
    process.env.NEXT_PUBLIC_ADMIN_API_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.ADMIN_PUBLIC_URL,
  ]
    .filter(Boolean)
    .map((u) => String(u).replace(/\/+$/, ""));

  return [...new Set([...fromEnv, "https://nuvisa-admin.vercel.app"])];
};

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = { data: null, expiresAt: 0 };

async function fetchAdminPublicFaqs(queryString = "") {
  for (const base of ADMIN_FAQ_BASES()) {
    const url = `${base}/api/public/faqs${queryString}`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
        cache: "no-store",
      });
      clearTimeout(timeout);

      if (!response.ok) continue;

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
  }
  return [];
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category, faqType, isFeatured } = req.query;
  const query = new URLSearchParams();
  const categoryFilter = category || faqType;
  if (categoryFilter) query.set("category", String(categoryFilter));
  if (isFeatured !== undefined) query.set("isFeatured", String(isFeatured));
  const queryString = query.toString() ? `?${query.toString()}` : "";

  const now = Date.now();
  const cacheKey = queryString || "__all__";
  if (cache.data?.[cacheKey] && cache.expiresAt > now) {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, data: cache.data[cacheKey] });
  }

  // 1) Direct DB — same `faqs` table as nuvisa-admin
  let faqs = await fetchFaqsFromDb(
    categoryFilter ? { category: String(categoryFilter) } : {}
  );

  // 2) Admin public HTTP fallback
  if (!faqs.length) {
    faqs = await fetchAdminPublicFaqs(queryString);
  }

  if (!cache.data) cache.data = {};
  cache.data[cacheKey] = faqs;
  cache.expiresAt = now + CACHE_TTL_MS;

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ success: true, data: faqs });
}
