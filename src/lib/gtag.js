/**
 * Google Analytics 4 (GA4) + Google Tag Manager (GTM) event helpers
 *
 * The site loads both:
 *   - GTM  (GTM-K2KZ5XR4)  via _document.js  → reads window.dataLayer
 *   - GA4  (G-QZ8V1X83W)   via _document.js  → window.gtag()
 *
 * Every event fires gtag() AND pushes to dataLayer so both receive it.
 */

/**
 * Safe gtag() wrapper — no-ops on SSR or when gtag is blocked.
 */
function fireGtag(...args) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
}

/**
 * Safe dataLayer.push() wrapper — no-ops on SSR.
 */
function pushDataLayer(obj) {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(obj);
  }
}

/**
 * Build a GA4-compatible item array from visa order data.
 */
function buildItems({
  country = "",
  travelers = 1,
  visaFeePerTraveler = 0,
  insurance = false,
  insuranceFeeTotal = 0,
  coupon = "",
  discount = 0,
}) {
  const items = [
    {
      item_id: "VISA_APPLICATION",
      item_name: country ? `${country} Visa Application` : "Visa Application",
      affiliation: "NUvisa",
      coupon: coupon || undefined,
      discount: discount || 0,
      index: 0,
      item_brand: "NUvisa",
      item_category: "Visa",
      item_category2: country || "",
      item_list_id: "visa_checkout",
      item_list_name: "Visa Checkout",
      item_variant: country || "",
      price: visaFeePerTraveler,
      quantity: travelers,
      google_business_vertical: "retail",
    },
  ];

  if (insurance && insuranceFeeTotal > 0) {
    items.push({
      item_id: "TRAVEL_INSURANCE",
      item_name: "Travel Insurance Certificate",
      affiliation: "NUvisa",
      coupon: coupon || undefined,
      discount: 0,
      index: 1,
      item_brand: "NUvisa",
      item_category: "Insurance",
      item_category2: country || "",
      item_list_id: "visa_checkout",
      item_list_name: "Visa Checkout",
      item_variant: country || "",
      price: insuranceFeeTotal,
      quantity: 1,
      google_business_vertical: "retail",
    });
  }

  return items;
}

// ---------------------------------------------------------------------------
// Public event functions — each fires gtag() AND pushes to dataLayer
// ---------------------------------------------------------------------------

/**
 * Fire `add_to_cart`
 * Call when the checkout page mounts / user views the order summary.
 */
export function trackAddToCart({
  country,
  travelers,
  visaFeePerTraveler,
  insurance,
  insuranceFeeTotal,
  totalValue,
  coupon,
  discount,
  currency = "GBP",
}) {
  const eventData = {
    currency,
    value: totalValue,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, coupon, discount }),
  };

  fireGtag("event", "add_to_cart", eventData);

  pushDataLayer({ ecommerce: null }); // clear previous ecommerce object
  pushDataLayer({ event: "add_to_cart", ecommerce: eventData });
}

/**
 * Fire `begin_checkout`
 * Call when the user clicks "Proceed to Payment" and passes validation.
 */
export function trackBeginCheckout({
  country,
  travelers,
  visaFeePerTraveler,
  insurance,
  insuranceFeeTotal,
  totalValue,
  coupon,
  discount,
  currency = "GBP",
}) {
  const eventData = {
    currency,
    value: totalValue,
    coupon: coupon || undefined,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, coupon, discount }),
  };

  fireGtag("event", "begin_checkout", eventData);

  pushDataLayer({ ecommerce: null });
  pushDataLayer({ event: "begin_checkout", ecommerce: eventData });
}

/**
 * Fire `add_payment_info`
 * Call when Stripe confirms the card payment details.
 */
export function trackAddPaymentInfo({
  country,
  travelers,
  visaFeePerTraveler,
  insurance,
  insuranceFeeTotal,
  totalValue,
  coupon,
  discount,
  paymentType = "Credit Card",
  currency = "GBP",
}) {
  const eventData = {
    currency,
    value: totalValue,
    coupon: coupon || undefined,
    payment_type: paymentType,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, coupon, discount }),
  };

  fireGtag("event", "add_payment_info", eventData);

  pushDataLayer({ ecommerce: null });
  pushDataLayer({ event: "add_payment_info", ecommerce: eventData });
}

/**
 * Fire `purchase`
 * Call after a successful payment and application creation (200/201).
 */
export function trackPurchase({
  transactionId,
  country,
  travelers,
  visaFeePerTraveler,
  insurance,
  insuranceFeeTotal,
  totalValue,
  coupon,
  discount,
  tax = 0,
  shipping = 0,
  customerType = "new",
  currency = "GBP",
}) {
  const eventData = {
    transaction_id: transactionId || `TXN_${Date.now()}`,
    currency,
    value: totalValue,
    tax,
    shipping,
    coupon: coupon || undefined,
    customer_type: customerType,
    items: buildItems({ country, travelers, visaFeePerTraveler, insurance, insuranceFeeTotal, coupon, discount }),
  };

  fireGtag("event", "purchase", eventData);

  pushDataLayer({ ecommerce: null });
  pushDataLayer({ event: "purchase", ecommerce: eventData });
}
