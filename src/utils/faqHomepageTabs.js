import { getFaqGroupKey } from "@/utils/faqHelpers";

export const HOMEPAGE_FAQ_TAB_LIMIT = 3;

/** Build up to `limit` homepage section tabs from featured FAQs only. */
export function buildHomepageFaqTabs(faqs, limit = HOMEPAGE_FAQ_TAB_LIMIT) {
  const typeMeta = new Map();

  (Array.isArray(faqs) ? faqs : []).forEach((faq) => {
    if (!faq?.isFeatured && !faq?.is_featured) return;

    const type = getFaqGroupKey(faq);
    if (!type) return;

    const rawCreatedAt = faq?.faqTypeCreatedAt || faq?.createdAt || null;
    const createdAtMs = rawCreatedAt
      ? new Date(rawCreatedAt).getTime()
      : Number.MAX_SAFE_INTEGER;
    const existing = typeMeta.get(type);

    if (!existing) {
      typeMeta.set(type, { label: type, createdAtMs });
      return;
    }

    if (createdAtMs < existing.createdAtMs) {
      existing.createdAtMs = createdAtMs;
    }
  });

  return Array.from(typeMeta.entries())
    .sort((a, b) => {
      if (a[1].createdAtMs !== b[1].createdAtMs) {
        return a[1].createdAtMs - b[1].createdAtMs;
      }
      return a[0].localeCompare(b[0]);
    })
    .slice(0, limit)
    .map(([type, meta]) => ({
      value: type,
      label: meta.label,
    }));
}
