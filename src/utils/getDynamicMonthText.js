export const getDynamicMonthText = (text, monthOffset = 0) => {
  if (!text || typeof text !== "string") return text;

  const now = new Date();
  const targetDate = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);

  const monthShort = new Intl.DateTimeFormat("en-GB", {
    month: "short",
  }).format(targetDate);
  const monthLong = new Intl.DateTimeFormat("en-GB", {
    month: "long",
  }).format(targetDate);
  const year = String(targetDate.getFullYear());

  let replaced = text
    .replace(/\{month\}/gi, monthShort)
    .replace(/\{monthLong\}/gi, monthLong)
    .replace(/\{year\}/gi, year);

  // If no placeholders were replaced, fallback to replacing hardcoded month names
  if (replaced === text) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthLongNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const allMonthsRegex = new RegExp(`\\b(${monthNames.join("|")}|${monthLongNames.join("|")})\\b`, "gi");

    replaced = text.replace(allMonthsRegex, (match) => {
      const isLong = monthLongNames.some(m => m.toLowerCase() === match.toLowerCase());
      const monthIndex = targetDate.getMonth();
      return isLong ? monthLongNames[monthIndex] : monthNames[monthIndex];
    });

    // Also replace year if present and we've replaced a month
    if (replaced !== text) {
      replaced = replaced.replace(/\b\d{4}\b/g, year);
    }
  }

  return replaced;
};