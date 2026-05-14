/**
 * UK targeting for Nest `POST /stripe_payment/session` (Stripe Hosted Checkout).
 * Backend prefers ISO2 `GB` and lowercase `gbp` for UK flows.
 */
export function isLikelyUnitedKingdomCountry(country: unknown): boolean {
  const s = String(country ?? "")
    .trim()
    .toLowerCase();
  if (!s) return false;
  return (
    s === "gb" ||
    s === "uk" ||
    s === "united kingdom" ||
    s === "great britain"
  );
}

/** Map visa-flow country strings to what Nest/Stripe expect for UK. */
export function countryForStripeSession(country: unknown): string {
  if (isLikelyUnitedKingdomCountry(country)) return "GB";
  return String(country ?? "").trim();
}

/**
 * Contract: UK checkout always sends `gbp` (lowercase). Other regions: lowercase ISO4217 from caller.
 */
export function currencyForStripeSession(
  country: unknown,
  currency: unknown
): string {
  if (isLikelyUnitedKingdomCountry(country)) return "gbp";
  const c = String(currency ?? "gbp")
    .trim()
    .toLowerCase();
  return c || "gbp";
}
