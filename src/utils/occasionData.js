import { DEFAULT_OCCASION_SECTION, DEFAULT_OCCASIONS } from "@/constants/defaultOccasions";

export function getAdminApiBases() {
  const fromEnv = [
    process.env.NEXT_PUBLIC_ADMIN_API_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    process.env.ADMIN_PUBLIC_URL,
  ]
    .filter(Boolean)
    .map((u) => String(u).replace(/\/+$/, ""));

  const bases = [...fromEnv, "https://nuvisa-admin.vercel.app", "https://nuvisa-admin-updated.vercel.app"];
  return [...new Set(bases)];
}

export function normalizeOccasionCard(raw) {
  if (!raw || typeof raw !== "object") return null;
  const title = String(
    raw.title ?? raw.name ?? raw.label ?? raw.heading ?? ""
  ).trim();
  if (!title) return null;

  return {
    title,
    subTitle: String(
      raw.subTitle ?? raw.subtitle ?? raw.sub_title ?? raw.description ?? ""
    ).trim(),
    bgColor: String(raw.bgColor ?? raw.bg_color ?? raw.color ?? "#5f9aff").trim(),
    textColor: String(raw.textColor ?? raw.text_color ?? "#ffffff").trim(),
    startDate: raw.startDate ?? raw.start_date ?? raw.arrivalDate ?? null,
    endDate: raw.endDate ?? raw.end_date ?? raw.departureDate ?? null,
  };
}

export function normalizeOccasionList(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.occasions)
    ? raw.occasions
    : Array.isArray(raw?.cards)
    ? raw.cards
    : Array.isArray(raw?.items)
    ? raw.items
    : [];

  return list.map(normalizeOccasionCard).filter(Boolean);
}

export function parseOccasionsJson(value) {
  if (!value) return [];
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return normalizeOccasionList(parsed);
  } catch {
    return [];
  }
}

/** Map backend / content-home keys (incl. legacy typos) to one shape. */
export function occasionFromCmsFields(fields = {}) {
  const title =
    fields.occasion_section_title ||
    fields.ocassion_title ||
    fields.occasion_title ||
    "";
  const description =
    fields.occasion_section_subtitle ||
    fields.ocassion_subtitle ||
    fields.occasion_subtitle ||
    "";
  const occasions = parseOccasionsJson(fields.occasions_json);

  return { title, description, occasions };
}

export function finalizeOccasionPayload(partial = {}, { allowDefaults = true } = {}) {
  const title = String(partial.title || "").trim();
  const description = String(partial.description || "").trim();
  const occasions = Array.isArray(partial.occasions) ? partial.occasions : [];

  const hasCustomOccasions = occasions.length > 0;
  const hasCustomCopy = Boolean(title || description);

  return {
    title:
      title ||
      (allowDefaults && !hasCustomCopy
        ? DEFAULT_OCCASION_SECTION.title
        : ""),
    description:
      description ||
      (allowDefaults && !hasCustomCopy
        ? DEFAULT_OCCASION_SECTION.description
        : ""),
    occasions:
      hasCustomOccasions
        ? occasions
        : allowDefaults
        ? DEFAULT_OCCASIONS
        : [],
  };
}

export function extractOccasionFromAdminJson(json) {
  if (!json) return null;
  const data = json.data ?? json.results ?? json;
  if (!data || typeof data !== "object") return null;

  const title = String(
    data.title ?? data.sectionTitle ?? data.section_title ?? ""
  ).trim();
  const description = String(
    data.description ?? data.subtitle ?? data.sectionDescription ?? ""
  ).trim();
  const occasions = normalizeOccasionList(data);

  if (!title && !description && occasions.length === 0) return null;
  return { title, description, occasions };
}
