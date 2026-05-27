import { loadStripe } from "@stripe/stripe-js";
import { getPublicApiBase } from "@/utils/adminApiBase";

const KLARNA_FAILURE_REDIRECT_STATUSES = new Set([
  "failed",
  "canceled",
  "requires_payment_method",
]);

const TERMINAL_FAILURE_PI_STATUSES = new Set([
  "canceled",
  "requires_payment_method",
  "failed",
]);

export function isExplicitKlarnaRedirectFailure(redirectStatus) {
  return Boolean(
    redirectStatus && KLARNA_FAILURE_REDIRECT_STATUSES.has(redirectStatus)
  );
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function isSuccessfulPaymentIntentStatus(status) {
  return (
    status === "succeeded" ||
    status === "processing" ||
    status === "requires_capture"
  );
}

function parseSessionMetadataResponse(json) {
  const results =
    json?.data?.results ??
    json?.results ??
    (json?.data?.metadata ? json.data : null) ??
    {};

  const metadata =
    results.metadata && typeof results.metadata === "object"
      ? results.metadata
      : {};

  const paymentIntentStatus =
    results.paymentIntentStatus ??
    results.status ??
    json?.data?.paymentIntentStatus ??
    null;

  return { metadata, paymentIntentStatus };
}

async function retrieveStatusViaStripeJs(clientSecret) {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publishableKey || !clientSecret) {
    return null;
  }

  try {
    const stripe = await loadStripe(publishableKey);
    if (!stripe) return null;

    const { paymentIntent, error } = await stripe.retrievePaymentIntent(
      clientSecret
    );

    if (error) {
      console.warn("[KlarnaRedirect] Stripe.js retrievePaymentIntent error:", error);
      return null;
    }

    return paymentIntent?.status ?? null;
  } catch (err) {
    console.warn("[KlarnaRedirect] Stripe.js exception:", err);
    return null;
  }
}

/**
 * Fetch PaymentIntent status from our backend (Stripe secret key server-side).
 */
export async function fetchStripePaymentVerification(paymentId) {
  const apiBase = getPublicApiBase();
  if (!paymentId || !apiBase) {
    console.warn("[KlarnaRedirect] missing paymentId or API base URL");
    return { metadata: {}, paymentIntentStatus: null };
  }

  const url = `${apiBase}/stripe_payment/session-metadata?payment_id=${encodeURIComponent(paymentId)}`;

  try {
    const res = await fetch(url);
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.warn("[KlarnaRedirect] session-metadata HTTP error:", res.status, json);
      return { metadata: {}, paymentIntentStatus: null };
    }

    const parsed = parseSessionMetadataResponse(json);
    console.log("[KlarnaRedirect] session-metadata parsed:", parsed);
    return parsed;
  } catch (err) {
    console.warn("[KlarnaRedirect] session-metadata fetch failed:", err);
    return { metadata: {}, paymentIntentStatus: null };
  }
}

/**
 * Resolve Klarna return — NEVER treat redirect_status alone as failure when we can verify the PI.
 */
export async function resolveKlarnaRedirectSuccess({
  redirectStatus,
  paymentIntentId,
  paymentIntentClientSecret,
  maxPollAttempts = 12,
  pollIntervalMs = 1000,
}) {
  console.log("[KlarnaRedirect] resolve start:", {
    redirectStatus,
    paymentIntentId,
    hasClientSecret: Boolean(paymentIntentClientSecret),
  });

  if (redirectStatus === "succeeded") {
    return { succeeded: true, source: "redirect_status" };
  }

  if (isExplicitKlarnaRedirectFailure(redirectStatus)) {
    return {
      succeeded: false,
      source: "redirect_status",
      redirectStatus,
    };
  }

  const tryStatus = (status, source) => {
    if (isSuccessfulPaymentIntentStatus(status)) {
      return { succeeded: true, source, paymentIntentStatus: status };
    }
    if (status && TERMINAL_FAILURE_PI_STATUSES.has(status)) {
      return { succeeded: false, source, paymentIntentStatus: status };
    }
    return null;
  };

  for (let attempt = 1; attempt <= maxPollAttempts; attempt++) {
    if (paymentIntentClientSecret) {
      const stripeJsStatus = await retrieveStatusViaStripeJs(
        paymentIntentClientSecret
      );
      console.log("[KlarnaRedirect] Stripe.js poll:", { attempt, stripeJsStatus });
      const fromStripe = tryStatus(stripeJsStatus, "stripe_js");
      if (fromStripe) return fromStripe;
    }

    if (paymentIntentId) {
      const { paymentIntentStatus } = await fetchStripePaymentVerification(
        paymentIntentId
      );
      console.log("[KlarnaRedirect] backend poll:", { attempt, paymentIntentStatus });
      const fromBackend = tryStatus(paymentIntentStatus, "backend_api");
      if (fromBackend) return fromBackend;
    }

    if (attempt < maxPollAttempts) {
      await sleep(pollIntervalMs);
    }
  }

  if (
    redirectStatus === "processing" &&
    (paymentIntentId || paymentIntentClientSecret)
  ) {
    return { succeeded: true, source: "redirect_status_processing" };
  }

  console.error("[KlarnaRedirect] payment verification failed after all attempts", {
    redirectStatus,
    paymentIntentId,
  });

  return {
    succeeded: false,
    source: "verification_exhausted",
    redirectStatus,
    paymentIntentId,
  };
}

export function isStripeRedirectReturn({ redirectStatus, paymentIntentId }) {
  return !!(redirectStatus || paymentIntentId);
}
