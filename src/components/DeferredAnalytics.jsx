import Script from "next/script";

const GTM_ID = "GTM-K2KZ5XR4";

export default function DeferredAnalytics() {
  return (
    <>
      <Script id="gtm-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({'gtm.start': new Date().getTime(), event: 'gtm.js'});
        `}
      </Script>
      <Script
        id="gtm-script"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`}
      />
    </>
  );
}
