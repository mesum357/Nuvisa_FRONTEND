export const normalizeCountryKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

export const parseOccasionPrice = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : NaN;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return NaN;

  let normalized = raw.replace(/[^\d.,-]/g, "");
  if (!normalized) return NaN;

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    normalized = normalized.replace(/,/g, "");
  } else if (hasComma && !hasDot) {
    normalized = /,\d{1,2}$/.test(normalized)
      ? normalized.replace(",", ".")
      : normalized.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : NaN;
};
