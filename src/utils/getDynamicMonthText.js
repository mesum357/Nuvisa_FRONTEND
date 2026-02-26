export const getDynamicMonthText = (text) => {
  if (!text || typeof text !== "string") return text;

  const now = new Date();
  const monthShort = new Intl.DateTimeFormat("en-GB", {
    month: "short",
  }).format(now);
  const monthLong = new Intl.DateTimeFormat("en-GB", {
    month: "long",
  }).format(now);
  const year = String(now.getFullYear());

  const replacedPlaceholders = text
    .replace(/\{month\}/gi, monthShort)
    .replace(/\{monthLong\}/gi, monthLong)
    .replace(/\{year\}/gi, year);

  if (replacedPlaceholders !== text) {
    return replacedPlaceholders;
  }

  return text.replace(
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b/g,
    `${monthShort} ${year}`
  );
};