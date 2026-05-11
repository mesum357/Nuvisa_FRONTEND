/**
 * Google Analytics 4 (GA4) event helpers
 * GA4 Measurement ID is loaded globally via _document.js
 */

const GA4_ID = "G-QZ8V1X83W";

/**
 * Safe gtag wrapper — no-ops if gtag is not yet available (SSR / blocked).
 */
function gtag(...args) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

/**
 * Build a GA4-compatible item array from visa order data.
 *
 * @param {object} params
 * @param {string} params.country        - Destination country (e.g. "France")
 * @param {number} params.travelers      - Number of travellers
 * @param {number} params.visaFeePerTraveler - Visa fee per traveller (GBP)
 * @param {boolean} params.insurance     - Whether insurance is included
 * @param {number} params.insuranceFeeTotal - Total insurance fee (GBP)
 * @returns {Array}
 */
function buildItems({ country = "", travelers = 1, visaFeePerTraveler = 0, insurance = false, insuranceFeeTotal = 0 }) {
  const items = [
    {
      item_id: "VISA_APPLICATION",
      item_name: country ? `${country} Visa Application` : "Visa Application",
      item_category: "Visa",
      item_category2: country || "",
      price: visaFeePerTraveler,
      quantity: travelers,
      google_business_vertical: "retail",
    },
  ];

  if (insurance && insuranceFeeTotal > 0) {
    items.push({
      item_id: "TRAVEL_INSURANCE",
      item_name: "Travel Insurance Certificate",
      item_category: "Insurance",
      item_category2: country || "",
      price: insuranceFeeTotal,
      quantity: 1,
      google_business_vertical: "retail",
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public event functions
// ---------------------------------------------------------------------------

/**
 * Fire `add_to_cart` — call when the checkout page mounts / user views the order.
 */
export function trackAddToCart({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, totalValue, currency = "GBP" }) {
  gtag("event", "add_to_cart", {
    currency,
    value: totalValue,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal }),
  });
}

/**
 * Fire `begin_checkout` — call when the user initiates the payment flow.
 */
export function trackBeginCheckout({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, totalValue, coupon, currency = "GBP" }) {
  gtag("event", "begin_checkout", {
    currency,
    value: totalValue,
    coupon: coupon || undefined,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal }),
  });
}

/**
 * Fire `add_payment_info` — call when payment details are confirmed.
 */
export function trackAddPaymentInfo({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, totalValue, coupon, paymentType = "Credit Card", currency = "GBP" }) {
  gtag("event", "add_payment_info", {
    currency,
    value: totalValue,
    coupon: coupon || undefined,
    payment_type: paymentType,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal }),
  });
}

/**
 * Fire `purchase` — call after a successful payment / application creation.
 */
export function trackPurchase({ transactionId, country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, totalValue, coupon, currency = "GBP" }) {
  gtag("event", "purchase", {
    transaction_id: transactionId || `TXN_${Date.now()}`,
    currency,
    value: totalValue,
    coupon: coupon || undefined,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal }),
  });
}
