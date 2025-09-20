function numericTail(source, length) {
  if (!source) {
    return "".padStart(length, "0");
  }
  let digits = String(source).replace(/\D+/g, "");
  if (digits.length < length) {
    const codes = Array.from(String(source))
      .map((c) => c.charCodeAt(0))
      .join("");
    digits = (digits + codes).replace(/\D+/g, "");
  }
  if (!digits.length) {
    digits = "0".repeat(length);
  }
  return digits.slice(-length).padStart(length, "0");
}

export function formatApplicationId(rawId) {
  return `AI${numericTail(rawId, 8)}`;
}

export function formatOrderId(rawOrderId) {
  return `ORD${numericTail(rawOrderId, 6)}`;
}

export default { formatApplicationId, formatOrderId };
