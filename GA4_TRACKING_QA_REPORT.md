# GA4 E-Commerce Tracking Flow - QA Audit Report

**Report Date:** May 17, 2026  
**Audit Scope:** End-to-end GA4 funnel validation across checkout and success pages  
**Review Criteria:** Price calculations integrity, sessionStorage payment method tracking, memory leak prevention

---

## EXECUTIVE SUMMARY

🔴 **OVERALL RESULT: FAIL** - Multiple critical compliance violations found

| Phase                                          | Status          | Violations                                              |
| ---------------------------------------------- | --------------- | ------------------------------------------------------- |
| Phase 1: Price Calculation Integrity           | 🔴 FAIL         | 8 violations in Slider.jsx                              |
| Phase 2: Add Payment Info (Checkout Setup)     | 🟡 PARTIAL FAIL | Missing sessionStorage.setItem in Slider.jsx Google Pay |
| Phase 3: Purchase Event Bridge (Success Pages) | 🟢 PASS         | ✓ Correct sessionStorage.getItem usage                  |
| Phase 4: Memory Leak Prevention                | 🔴 FAIL         | Missing cleanup in OrderCheckout.jsx KlarnaForm         |

---

## PHASE 1: PRICE CALCULATION INTEGRITY

**Status: 🔴 FAIL**  
**Requirement:** The `price` property in EVERY `items` array MUST NOT contain division math. Must strictly use total values.

### ✅ PASSING FILES:

- **OrderCheckout.jsx** - All price calculations correct (no division)
- **payment-success/index.jsx** - All price calculations correct (no division)
- **payment-success-full/index.jsx** - All price calculations correct (no division)

### ❌ FAILING FILE: src/components/Slider.jsx

#### **VIOLATION 1: Apple Pay Express Checkout - begin_checkout event**

**File:** `src/components/Slider.jsx`  
**Lines:** ~5020-5040  
**Event:** `begin_checkout`

**Current Problematic Code:**

```javascript
// AROUND LINE 5020 - Apple Pay button
paymentItems.push({
  item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
  item_name: `Visa - ${countryName}`,
  price: Number((expressPaymentData.visaFees / travelers).toFixed(2)), // ❌ DIVISION
  quantity: travelers,
});
// ...
paymentItems.push({
  item_id: "insurance_certificate",
  item_name: "Insurance Certificate",
  price: Number((expressPaymentData.insuranceFees / insuranceCount).toFixed(2)), // ❌ DIVISION
  quantity: insuranceCount,
});
// ...
paymentItems.push({
  item_id: "digital_gift_card",
  item_name: "NUvisa Digital Gift Card",
  price: Number(
    (
      expressPaymentData.giftCardFees / expressPaymentData.giftCardCount
    ).toFixed(2)
  ), // ❌ DIVISION
  quantity: expressPaymentData.giftCardCount,
});
```

**Corrected Code:**

```javascript
// Apple Pay button - begin_checkout event
paymentItems.push({
  item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
  item_name: `Visa - ${countryName}`,
  price: Number(expressPaymentData.visaFees.toFixed(2)), // ✓ NO DIVISION
  quantity: travelers,
});
// ...
paymentItems.push({
  item_id: "insurance_certificate",
  item_name: "Insurance Certificate",
  price: Number(expressPaymentData.insuranceFees.toFixed(2)), // ✓ NO DIVISION
  quantity: insuranceCount,
});
// ...
paymentItems.push({
  item_id: "digital_gift_card",
  item_name: "NUvisa Digital Gift Card",
  price: Number(expressPaymentData.giftCardFees.toFixed(2)), // ✓ NO DIVISION
  quantity: expressPaymentData.giftCardCount,
});
```

---

#### **VIOLATION 2: Google Pay Express Checkout - begin_checkout event**

**File:** `src/components/Slider.jsx`  
**Lines:** ~5120-5150  
**Event:** `begin_checkout`

**Current Problematic Code:**

```javascript
// AROUND LINE 5120 - Google Pay button
paymentItems.push({
  item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
  item_name: `Visa - ${countryName}`,
  price: Number((expressPaymentData.visaFees / travelers).toFixed(2)), // ❌ DIVISION
  quantity: travelers,
});
// ...
paymentItems.push({
  item_id: "insurance_certificate",
  item_name: "Insurance Certificate",
  price: Number((expressPaymentData.insuranceFees / insuranceCount).toFixed(2)), // ❌ DIVISION
  quantity: insuranceCount,
});
// ...
paymentItems.push({
  item_id: "digital_gift_card",
  item_name: "NUvisa Digital Gift Card",
  price: Number(
    (
      expressPaymentData.giftCardFees / expressPaymentData.giftCardCount
    ).toFixed(2)
  ), // ❌ DIVISION
  quantity: expressPaymentData.giftCardCount,
});
```

**Corrected Code:**

```javascript
// Google Pay button - begin_checkout event
paymentItems.push({
  item_id: `visa_${countryName.toLowerCase().replace(/\s+/g, "_")}`,
  item_name: `Visa - ${countryName}`,
  price: Number(expressPaymentData.visaFees.toFixed(2)), // ✓ NO DIVISION
  quantity: travelers,
});
// ...
paymentItems.push({
  item_id: "insurance_certificate",
  item_name: "Insurance Certificate",
  price: Number(expressPaymentData.insuranceFees.toFixed(2)), // ✓ NO DIVISION
  quantity: insuranceCount,
});
// ...
paymentItems.push({
  item_id: "digital_gift_card",
  item_name: "NUvisa Digital Gift Card",
  price: Number(expressPaymentData.giftCardFees.toFixed(2)), // ✓ NO DIVISION
  quantity: expressPaymentData.giftCardCount,
});
```

---

## PHASE 2: ADD PAYMENT INFO (CHECKOUT SETUP)

**Status: 🟡 PARTIAL FAIL**  
**Requirement:** Right before `add_payment_info` event fires, code MUST use `sessionStorage.setItem("ga4_payment_type", ...)` with the exact payment method. `localStorage` must be completely removed.

### ✅ PASSING - OrderCheckout.jsx

**Files:** `src/components/OrderCheckout.jsx` lines ~2451, ~2531, ~2589

**Apple Pay Express Checkout:**

```javascript
setTimeout(() => {
  sessionStorage.setItem("ga4_payment_type", "Apple Pay"); // ✓ CORRECT
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "add_payment_info",
    // ...
  });
}, 300);
```

**Stripe Credit Card:**

```javascript
let ga4PaymentType = "Credit Card";
if (selectedPaymentMethod === "klarna") ga4PaymentType = "Klarna";
if (selectedPaymentMethod === "apple") ga4PaymentType = "Apple Pay";
if (selectedPaymentMethod === "google") ga4PaymentType = "Google Pay";

sessionStorage.setItem("ga4_payment_type", ga4PaymentType); // ✓ CORRECT
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: "add_payment_info",
  // ...
});
```

**Klarna:**

```javascript
sessionStorage.setItem("ga4_payment_type", "Klarna"); // ✓ CORRECT
window.dataLayer.push({ ecommerce: null });
window.dataLayer.push({
  event: "add_payment_info",
  // ...
});
```

---

### ❌ PARTIAL FAILURE - Slider.jsx

#### **VIOLATION 3: Google Pay - Missing sessionStorage.setItem**

**File:** `src/components/Slider.jsx`  
**Lines:** ~5210-5235  
**Event:** `add_payment_info`

**Current Problematic Code:**

```javascript
// GOOGLE PAY BUTTON - add_payment_info event
setTimeout(() => {
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "add_payment_info",
    ecommerce: {
      currency: "GBP",
      value: Number(expressPaymentData.totalAmount.toFixed(2)),
      payment_type: "Google Pay",
      coupon: appliedDiscount?.code || couponCode || undefined,
      items: paymentItems,
    },
  });
  // ❌ NO sessionStorage.setItem() CALL - Data will not persist to success page!
}, 300);
```

**Corrected Code:**

```javascript
// GOOGLE PAY BUTTON - add_payment_info event
setTimeout(() => {
  sessionStorage.setItem("ga4_payment_type", "Google Pay"); // ✓ ADD THIS LINE
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event: "add_payment_info",
    ecommerce: {
      currency: "GBP",
      value: Number(expressPaymentData.totalAmount.toFixed(2)),
      payment_type: "Google Pay",
      coupon: appliedDiscount?.code || couponCode || undefined,
      items: paymentItems,
    },
  });
}, 300);
```

**Impact:** The purchase event on the success page will default to "Credit Card" instead of "Google Pay" because the payment method data will not be available in sessionStorage.

---

## PHASE 3: PURCHASE EVENT BRIDGE (SUCCESS PAGES)

**Status: 🟢 PASS**  
**Requirement:** `purchase` event must retrieve payment method using `sessionStorage.getItem("ga4_payment_type")` with fallback to "Credit Card" (or "Klarna" if redirected).

### ✅ PASSING - payment-success/index.jsx

**File:** `src/pages/payment-success/index.jsx`  
**Lines:** ~739-755

```javascript
// Get and clear payment type from sessionStorage to prevent data leakage
const ga4PaymentType =
  typeof window !== "undefined"
    ? sessionStorage.getItem("ga4_payment_type") ||  // ✓ CORRECT
      (isKlarnaRedirect ? "Klarna" : "Credit Card")
    : "Credit Card";
if (typeof window !== "undefined") {
  try {
    sessionStorage.removeItem("ga4_payment_type");  // ✓ CLEANUP DONE HERE
  } catch {}
}

window.dataLayer.push({
  event: "purchase",
  ecommerce: {
    transaction_id: stripePaymentId || /* ... */,
    value: Number(Number(mergedData.totalAmount || 0).toFixed(2)),
    currency: "GBP",
    payment_type: ga4PaymentType,  // ✓ USES RETRIEVED VALUE
    coupon: /* ... */,
    items: purchaseItems,
  },
});
```

---

### ✅ PASSING - payment-success-full/index.jsx

**File:** `src/pages/payment-success-full/index.jsx`  
**Lines:** ~87-94

```javascript
// Get and clear payment type from sessionStorage to prevent data leakage
const ga4PaymentType =
  typeof window !== "undefined"
    ? sessionStorage.getItem("ga4_payment_type") || "Credit Card"  // ✓ CORRECT
    : "Credit Card";
if (typeof window !== "undefined") {
  try {
    sessionStorage.removeItem("ga4_payment_type");  // ✓ CLEANUP DONE HERE
  } catch {}
}

window.dataLayer.push({
  event: "purchase",
  ecommerce: {
    transaction_id: finalApplicationId || `TXN-${Date.now()}`,
    value: Number((Number(visaState.totalAmount) || 0).toFixed(2)),
    currency: "GBP",
    payment_type: ga4PaymentType,  // ✓ USES RETRIEVED VALUE
    coupon: /* ... */,
    items: purchaseItems,
  },
});
```

---

## PHASE 4: MEMORY LEAK PREVENTION (THE KILL SWITCH)

**Status: 🔴 FAIL**  
**Requirement:** Immediately after `purchase` event fires, there MUST be a `sessionStorage.removeItem("ga4_payment_type");` command to wipe the data and prevent bleeding into next session.

### ✅ PASSING - payment-success/index.jsx

**Lines:** ~744-747

```javascript
if (typeof window !== "undefined") {
  try {
    sessionStorage.removeItem("ga4_payment_type"); // ✓ CLEANUP PRESENT
  } catch {}
}
```

---

### ✅ PASSING - payment-success-full/index.jsx

**Lines:** ~91-94

```javascript
if (typeof window !== "undefined") {
  try {
    sessionStorage.removeItem("ga4_payment_type"); // ✓ CLEANUP PRESENT
  } catch {}
}
```

---

### ❌ FAILING - OrderCheckout.jsx KlarnaForm Callback

**File:** `src/components/OrderCheckout.jsx`  
**Lines:** ~2230-2280  
**Context:** KlarnaForm `onSuccess` callback that fires a purchase event

**Current Problematic Code:**

```javascript
onSuccess={(data) => {
  console.log("Klarna form submitted:", data);
  if (typeof window !== "undefined" && window.dataLayer) {
    const countryName = selectedCountry || "Schengen";
    const paymentItems = [];
    // ... build paymentItems ...

    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: data?.order_id || `klarna_${Date.now()}`,
        currency: "GBP",
        value: Number(total.toFixed(2)),
        payment_type: "Klarna",
        coupon: appliedDiscount?.code || couponCode || undefined,
        items: paymentItems,
      },
    });
    // ❌ NO sessionStorage.removeItem() - Data persists across sessions!
  }
}}
```

**Critical Issue:** This purchase event fires in the checkout component (OrderCheckout.jsx), not on the success page. After this event fires, the ga4_payment_type remains in sessionStorage and could bleed into subsequent transactions.

**Corrected Code:**

```javascript
onSuccess={(data) => {
  console.log("Klarna form submitted:", data);
  if (typeof window !== "undefined" && window.dataLayer) {
    const countryName = selectedCountry || "Schengen";
    const paymentItems = [];
    // ... build paymentItems ...

    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: "purchase",
      ecommerce: {
        transaction_id: data?.order_id || `klarna_${Date.now()}`,
        currency: "GBP",
        value: Number(total.toFixed(2)),
        payment_type: "Klarna",
        coupon: appliedDiscount?.code || couponCode || undefined,
        items: paymentItems,
      },
    });

    // ✓ ADD CLEANUP HERE
    try {
      sessionStorage.removeItem("ga4_payment_type");
    } catch {}
  }
}}
```

---

## SUMMARY TABLE

| Issue # | File              | Location   | Type                                                     | Severity | Status  |
| ------- | ----------------- | ---------- | -------------------------------------------------------- | -------- | ------- |
| 1       | Slider.jsx        | ~5020-5040 | Price Division (Apple begin_checkout)                    | 🔴 HIGH  | ❌ FAIL |
| 2       | Slider.jsx        | ~5120-5150 | Price Division (Google begin_checkout)                   | 🔴 HIGH  | ❌ FAIL |
| 3       | Slider.jsx        | ~5210-5235 | Missing sessionStorage.setItem (Google add_payment_info) | 🔴 HIGH  | ❌ FAIL |
| 4       | OrderCheckout.jsx | ~2230-2280 | Missing sessionStorage.removeItem (Klarna purchase)      | 🔴 HIGH  | ❌ FAIL |

---

## REQUIRED FIXES

### PRIORITY 1 (CRITICAL - Must fix immediately)

1. ✅ **Slider.jsx:** Remove ALL division operators from price calculations in Apple/Google Pay begin_checkout events
2. ✅ **Slider.jsx:** Add `sessionStorage.setItem("ga4_payment_type", "Google Pay")` before add_payment_info push
3. ✅ **OrderCheckout.jsx:** Add `sessionStorage.removeItem("ga4_payment_type")` after purchase event in KlarnaForm onSuccess

---

## COMPLIANCE CHECKLIST

- [x] Phase 1: No division in OrderCheckout.jsx, payment-success/index.jsx, payment-success-full/index.jsx
- [ ] Phase 1: **PENDING** - No division in Slider.jsx (8 violations)
- [x] Phase 2: sessionStorage.setItem in OrderCheckout.jsx Express/Standard checkout
- [ ] Phase 2: **PENDING** - sessionStorage.setItem in Slider.jsx Google Pay
- [x] Phase 3: sessionStorage.getItem in success pages ✓
- [x] Phase 3: No localStorage usage in success pages ✓
- [x] Phase 4: sessionStorage.removeItem in payment-success/index.jsx ✓
- [x] Phase 4: sessionStorage.removeItem in payment-success-full/index.jsx ✓
- [ ] Phase 4: **PENDING** - sessionStorage.removeItem in OrderCheckout.jsx KlarnaForm callback

---

## RECOMMENDATION

**Do NOT deploy** until all Phase 1 and Phase 4 violations are resolved. Current state will:

1. Send incorrect unit prices to GA4 instead of line-item totals (Slider.jsx)
2. Lose payment method data for Google Pay transactions (Slider.jsx)
3. Allow payment type data to bleed across sessions (OrderCheckout.jsx Klarna)

**Next Steps:** Apply corrected code blocks to Slider.jsx and OrderCheckout.jsx, then re-test.
