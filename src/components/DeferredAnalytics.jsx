"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GTM_ID = "GTM-K2KZ5XR4";

export default function DeferredAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const enable = () => setEnabled(true);
    const timer = window.setTimeout(enable, 5000);
    const events = ["scroll", "click", "keydown", "touchstart"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, enable, { once: true, passive: true });
    });

    return () => {
      window.clearTimeout(timer);
      events.forEach((eventName) => {
        window.removeEventListener(eventName, enable);
      });
    };
  }, []);

  if (!enabled) return null;

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
