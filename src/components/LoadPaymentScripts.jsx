import Script from "next/script";

/** Google Pay — checkout routes only. Stripe is loaded once via @stripe/stripe-js in StripeProvider. */
export default function LoadPaymentScripts() {
  return (
    <Script src="https://pay.google.com/gp/p/js/pay.js" strategy="lazyOnload" />
  );
}
