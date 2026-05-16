import axios from "axios";
import { normalizeFaqList } from "@/utils/faqHelpers";

const ADMIN_FAQ_BASES = () => {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_API_URL || process.env.NEXT_PUBLIC_ADMIN_URL;
  const bases = [];
  if (fromEnv) bases.push(String(fromEnv).replace(/\/+$/, ""));
  bases.push("https://nuvisa-admin.vercel.app");
  return [...new Set(bases)];
};

export const fetchFAQs = async (filters = null) => {
  const normalizedFilters =
    typeof filters === "string" ? { category: filters } : filters || {};

  const query = new URLSearchParams();
  if (normalizedFilters.category) query.set("category", normalizedFilters.category);
  if (normalizedFilters.faqType) query.set("faqType", normalizedFilters.faqType);
  if (normalizedFilters.isFeatured) {
    query.set("isFeatured", String(normalizedFilters.isFeatured));
  }
  const queryString = query.toString() ? `?${query.toString()}` : "";

  const endpoints = [
    ...ADMIN_FAQ_BASES().map((b) => `${b}/api/public/faqs${queryString}`),
    `/api/faqs${queryString}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await axios.get(url, {
        headers: { Accept: "application/json" },
        withCredentials: false,
        timeout: 15000,
        validateStatus: (status) => status < 500,
      });

      const list = normalizeFaqList(res?.data);
      if (list.length > 0) return list;
      if (res?.data?.success && Array.isArray(res.data.data)) return res.data.data;
    } catch (error) {
      console.warn("FAQ fetch attempt failed:", url, error?.message);
    }
  }

  return [];
};
