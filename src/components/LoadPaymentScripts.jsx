import Script from "next/script";

/** Stripe + Google Pay — checkout routes only (not loaded on homepage). */
export default function LoadPaymentScripts() {
  return (
    <>
      <Script src="https://js.stripe.com/v3/" strategy="lazyOnload" />
      <Script src="https://pay.google.com/gp/p/js/pay.js" strategy="lazyOnload" />
    </>
  );
}
