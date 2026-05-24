import { extractPaymentApiError } from "./extractPaymentApiError";

/**
 * Normalize axios payment-intent responses into { ok, clientSecret, data, error }.
 */
export function parsePaymentIntentApiResponse(response) {
  if (!response) {
    return {
      ok: false,
      error:
        "Could not reach the payment server. Confirm the backend is running and NEXT_PUBLIC_API_URL is set correctly.",
    };
  }

  const httpStatus = Number(response.status) || 0;
  const body = response.data || {};
  const httpOk = httpStatus >= 200 && httpStatus < 300;

  const results =
    body?.data?.results ??
    body?.results ??
    (body?.status === "success" ? body?.data?.results : null);

  const clientSecret =
    results?.clientSecret ||
    results?.client_secret ||
    body?.clientSecret ||
    body?.client_secret;

  if (httpOk && clientSecret) {
    return {
      ok: true,
      clientSecret,
      data: results && typeof results === "object" ? results : { clientSecret },
    };
  }

  const apiError = extractPaymentApiError(response);
  if (apiError) {
    return { ok: false, error: apiError };
  }

  if (httpStatus === 0) {
    const timeoutHint =
      typeof body?.message === "string" && body.message.includes("timed out")
        ? body.message
        : "Payment request timed out. Please try again.";
    return { ok: false, error: timeoutHint };
  }

  return {
    ok: false,
    error: "Failed to create payment intent. Please try again.",
  };
}
