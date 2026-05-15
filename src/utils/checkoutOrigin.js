/**
 * Origin used for Stripe return_url / cancel_url (Klarna redirect).
 * Must match the browser tab where checkout started — not WEBSITE_URL on the server.
 */
export function getCheckoutOriginForStripe() {
  if (typeof window === "undefined") return "";
  return window.location.origin.replace(/\/+$/, "");
}

export function buildCheckoutReturnUrl(path) {
  const origin = getCheckoutOriginForStripe();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${normalizedPath}` : normalizedPath;
}
