import { fetchFaqsFromDb } from "@/lib/faqsDb";
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
      console.warn("Admin FAQs fetch failed:", url, error?.message || error);
    }
  }

  return [];
}

/** Public FAQ feed — same shape as nuvisa-admin `/api/public/faqs`. */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category, faqType } = req.query;
  const filter = category || faqType;

  const query = new URLSearchParams();
  if (category) query.set("category", String(category));
  if (faqType) query.set("faqType", String(faqType));
  const queryString = query.toString() ? `?${query.toString()}` : "";

  const dbFilters = {};
  if (filter) dbFilters.category = String(filter);
  if (faqType) dbFilters.faqType = String(faqType);

  let faqs = await fetchAdminPublicFaqs(queryString);
  if (!faqs.length) {
    faqs = await fetchFaqsFromDb(dbFilters);
  }

  res.setHeader("Cache-Control", "no-store, must-revalidate");
  return res.status(200).json({ success: true, data: faqs });
}
