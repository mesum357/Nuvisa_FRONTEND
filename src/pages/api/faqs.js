const ADMIN_FAQ_URL = "https://nuvisa-admin.vercel.app/api/public/faqs";
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache = { data: null, expiresAt: 0 };

function resolveAdminBase() {
  const raw =
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    process.env.ADMIN_PUBLIC_URL ||
    "https://nuvisa-admin.vercel.app";
  return String(raw).replace(/\/+$/, "");
}

async function fetchAdminFaqs(queryString = "") {
  const bases = [resolveAdminBase(), "https://nuvisa-admin.vercel.app"];
  const seen = new Set();

  for (const base of bases) {
    if (!base || seen.has(base)) continue;
    seen.add(base);
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

      if (!response.ok) {
        console.error("Admin FAQs HTTP", response.status, url);
        continue;
      }

      const data = await response.json();
      if (data?.success && Array.isArray(data.data)) {
        return data.data;
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
  if (category) query.set("category", String(category));
  if (faqType) query.set("faqType", String(faqType));
  if (isFeatured !== undefined) query.set("isFeatured", String(isFeatured));
  const queryString = query.toString() ? `?${query.toString()}` : "";

  const now = Date.now();
  const cacheKey = queryString || "__all__";
  if (cache.data?.[cacheKey] && cache.expiresAt > now) {
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
    return res.status(200).json({ success: true, data: cache.data[cacheKey] });
  }

  const faqs = await fetchAdminFaqs(queryString);

  if (!cache.data) cache.data = {};
  cache.data[cacheKey] = faqs;
  cache.expiresAt = now + CACHE_TTL_MS;

  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  return res.status(200).json({ success: true, data: faqs });
}
