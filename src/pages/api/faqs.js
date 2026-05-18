import { fetchFaqsFromDb } from "@/lib/faqsDb";

const ADMIN_FAQ_BASES = () => {
  const fromEnv = [
    process.env.NEXT_PUBLIC_ADMIN_API_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.ADMIN_PUBLIC_URL,
  ]
    .filter(Boolean)
    .map((u) => String(u).replace(/\/+$/, ""));

  return [
    ...new Set([
      ...fromEnv,
      "https://nuvisa-admin.vercel.app",
      "https://nuvisa-admin-updated.vercel.app",
    ]),
  ];
};

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

  let faqs = [];
  if (process.env.NODE_ENV === 'production') {
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

  res.setHeader("Cache-Control", "no-store, must-revalidate");
  return res.status(200).json({ success: true, data: faqs });
}
