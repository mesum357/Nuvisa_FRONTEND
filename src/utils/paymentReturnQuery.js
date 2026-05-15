/**
 * Read Stripe return query params reliably on Pages Router (router.isReady + window fallback).
 */
export function readPaymentReturnQuery(router) {
  const read = (key) => {
    const q = router?.query?.[key];
    if (typeof q === "string" && q.length > 0) return q;
    if (Array.isArray(q) && q[0]) return String(q[0]);
    if (typeof window !== "undefined") {
      const fromWindow = new URLSearchParams(window.location.search).get(key);
      if (fromWindow) return fromWindow;
    }
    return null;
  };

  return {
    sessionId: read("session_id"),
    redirectStatus: read("redirect_status"),
    paymentIntentId: read("payment_intent"),
    paymentIntentClientSecret: read("payment_intent_client_secret"),
    paymentType: read("payment_type"),
    applicationId: read("application_id"),
    travelerIndex: read("traveler_index"),
  };
}
