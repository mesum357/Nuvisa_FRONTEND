/** Admin API uses `category`; legacy code used `faqType`. */
export function getFaqGroupKey(faq) {
  const faqType =
    typeof faq?.faqType === "string" ? faq.faqType.trim() : "";
  const category =
    typeof faq?.category === "string" ? faq.category.trim() : "";
  return faqType || category || "General";
}

export function normalizeFaqList(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
}
