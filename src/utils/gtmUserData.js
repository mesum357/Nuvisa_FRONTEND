/**
 * Shared GTM / GA4 user_data helpers.
 *
 * Rules:
 *  - Never include hardcoded or stale data.
 *  - Return undefined (not an empty object) when no real data is available so
 *    the caller can omit the user_data key from the dataLayer push entirely.
 *  - All data must come from the current checkout session:
 *      • email   → component state typed by the user THIS visit
 *      • phone   → component state typed by the user THIS visit
 *      • address → Klarna billing form fields (current session only)
 */

/**
 * Normalise a raw phone string to E.164 format (+44…).
 * Returns undefined if the input is empty or cannot be normalised.
 */
export const normalizePhoneE164 = (rawPhone) => {
  if (!rawPhone) return undefined;
  const digits = String(rawPhone).replace(/\D/g, "");
  if (!digits) return undefined;
  if (digits.startsWith("44") && digits.length >= 12) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0"))
    return `+44${digits.slice(1)}`;
  if (digits.length === 10) return `+44${digits}`;
  if (digits.length > 10) return `+${digits}`;
  return undefined;
};

/**
 * Build a clean GA4 user_data object from current-session values only.
 *
 * @param {object} opts
 * @param {string} [opts.email]       - Email address typed by the user this session.
 * @param {string} [opts.phone]       - Raw phone number typed by the user this session.
 * @param {string} [opts.firstName]   - First name (Klarna billing form only).
 * @param {string} [opts.lastName]    - Last name (Klarna billing form only).
 * @param {string} [opts.street]      - Street address (Klarna billing form only).
 * @param {string} [opts.city]        - City (Klarna billing form only).
 * @param {string} [opts.postalCode]  - Postal code (Klarna billing form only).
 * @param {string} [opts.country]     - Country code (Klarna billing form only).
 *
 * @returns {object|undefined} A GA4-compatible user_data object, or undefined if
 *   no meaningful data is available (caller should omit user_data from the push).
 */
export const buildGtmUserData = ({
  email,
  phone,
  firstName,
  lastName,
  street,
  city,
  postalCode,
  country,
} = {}) => {
  const normalizedEmail = email?.trim() || undefined;
  const normalizedPhone = normalizePhoneE164(phone);

  const hasAddress =
    firstName || lastName || street || city || postalCode || country;

  if (!normalizedEmail && !normalizedPhone && !hasAddress) return undefined;

  const userData = {};

  if (normalizedEmail) userData.email = normalizedEmail;
  if (normalizedPhone) userData.phone_number = normalizedPhone;

  if (hasAddress) {
    userData.address = {
      first_name: firstName?.trim() || undefined,
      last_name: lastName?.trim() || undefined,
      street: street?.trim() || undefined,
      city: city?.trim() || undefined,
      postal_code: postalCode?.trim() || undefined,
      country: country?.trim() || undefined,
    };
  }

  return userData;
};

/**
 * Computes the per-unit discount amount strictly attributable to the active
 * coupon code.  Returns 0 when:
 *  - No coupon / appliedDiscount is provided.
 *  - The item quantity does not meet the coupon threshold (GROUP20 requires ≥ 3).
 *
 * Supported codes:
 *  - STUDENT10 : 10% off the pre-coupon line total (percentage stored in Redux).
 *  - GROUP20   : 20% off the base-discounted total, attributed to the coupon when
 *                qty ≥ 3 (the auto-quantity discount fires at the same threshold).
 *
 * Usage: set `item.discount` only when this returns > 0.
 *
 * @param {number} finalLineFees    - Total line-item price AFTER coupon applied.
 * @param {number} qty              - Item quantity (must be > 0).
 * @param {object|null|undefined} appliedDiscount - Redux appliedDiscount object
 *   ({ code, percentage, … }).  Pass null/undefined when no coupon is active.
 * @returns {number} Per-unit coupon discount rounded to 2 decimal places.
 */
export const computeCouponDiscountPerUnit = (
  finalLineFees,
  qty,
  appliedDiscount,
) => {
  if (!appliedDiscount?.code || !qty || qty <= 0 || !finalLineFees) return 0;
  const code = appliedDiscount.code;

  if (code === "STUDENT10") {
    const pct = Number(appliedDiscount.percentage) || 10;
    // finalLineFees = priceBeforeCoupon × (1 − pct/100)
    // couponSavingsTotal = priceBeforeCoupon − finalLineFees
    //                    = finalLineFees × pct / (100 − pct)
    const savingsTotal = (finalLineFees * pct) / (100 - pct);
    return Number((savingsTotal / qty).toFixed(2));
  }

  if (code === "GROUP20") {
    // The 20% quantity discount auto-fires at qty >= 3, and GROUP20 represents
    // that discount.  When the item qualifies we attribute the 20% saving to
    // the coupon so GA4 receives the correct discount value.
    //
    // finalLineFees = baseDiscountedFees × 0.80  (20% already applied)
    // savingsTotal  = baseDiscountedFees × 0.20
    //               = (finalLineFees / 0.80) × 0.20
    //               = finalLineFees × 0.25
    if (qty >= 3) {
      const savingsTotal = finalLineFees * 0.25;
      return Number((savingsTotal / qty).toFixed(2));
    }
    return 0;
  }

  return 0;
};

/**
 * Builds the GA4 `coupon` string for a single line-item.
 *
 * Rules:
 *  - GROUP20 is only included when it is the *active* applied code AND the
 *    quantity threshold is met (`qualifies === true`).  This prevents the
 *    coupon from being stuck on items when the traveler count drops below 3.
 *  - Any other active code (e.g. STUDENT10) is always included when present.
 *  - Returns undefined (not an empty string) when no codes apply so the caller
 *    can safely use `if (coupon) item.coupon = coupon` to omit the field.
 *
 * @param {boolean} qualifies  - Whether the item meets the GROUP20 threshold.
 * @param {string|undefined} baseCode - The currently active discount code.
 * @returns {string|undefined}
 */
export const resolveCoupon = (qualifies, baseCode) => {
  const codes = [];
  if (qualifies && baseCode === "GROUP20") codes.push("GROUP20");
  if (baseCode && baseCode !== "GROUP20") codes.push(baseCode);
  return codes.length > 0 ? codes.join(",") : undefined;
};

/**
 * Clears GTM-related user identity keys that were persisted from a previous
 * checkout session. Call this on checkout component mount so stale data from
 * previous visits / test sessions cannot contaminate the current user's events.
 *
 * NOTE: userEmail is intentionally kept because OrderCheckout uses it for
 * pre-filling the contact form. It is safe — the contact form always shows the
 * pre-filled value to the user, who can change it before paying.
 */
export const clearStaleGtmUserData = () => {
  if (typeof window === "undefined") return;
  try {
    // These keys are populated by the Klarna billing form and must not bleed
    // into a new checkout session where the user may not be using Klarna.
    localStorage.removeItem("klarnaFormData");
    localStorage.removeItem("userFirstName");
    localStorage.removeItem("userLastName");
    // userPhone is session-scoped — clear it so previous test numbers don't leak.
    localStorage.removeItem("userPhone");
    // Session flag used to validate whether klarnaFormData is current-session.
    sessionStorage.removeItem("klarnaFormDataSet");
  } catch {
    // Ignore storage errors (private browsing / quota exceeded).
  }
};
