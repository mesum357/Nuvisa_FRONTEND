import { fetchFaqsFromDb } from "@/lib/faqsDb";

/** Public FAQ feed — same shape as nuvisa-admin `/api/public/faqs`. */
export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { category, faqType } = req.query;
  const filter = category || faqType;

  const faqs = await fetchFaqsFromDb(
    filter ? { category: String(filter) } : {}
  );

  res.setHeader("Cache-Control", "no-store, must-revalidate");
  return res.status(200).json({ success: true, data: faqs });
}
