"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

const GTM_ID = "GTM-K2KZ5XR4";
const IDLE_TIMEOUT_DESKTOP_MS = 6500;
const IDLE_TIMEOUT_MOBILE_MS = 10000;

function getAnalyticsIdleTimeoutMs() {
  if (typeof window === "undefined") return IDLE_TIMEOUT_DESKTOP_MS;
  return window.matchMedia("(max-width: 767px)").matches
    ? IDLE_TIMEOUT_MOBILE_MS
    : IDLE_TIMEOUT_DESKTOP_MS;
}

function markAnalyticsReady() {
  if (typeof window === "undefined") return;
  window.__gtmEnabled = true;
  window.dataLayer = window.dataLayer || [];
  const queued = window.__gtmPageviewQueue;
  if (Array.isArray(queued) && queued.length > 0) {
    queued.forEach((url) => {
      window.dataLayer.push({ event: "pageview", page: url });
    });
    window.__gtmPageviewQueue = [];
  }
}

export default function DeferredAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    window.__gtmPageviewQueue = window.__gtmPageviewQueue || [];

    const enable = () => {
      markAnalyticsReady();
      setEnabled(true);
    };

    let idleId;
    let fallbackTimer;

    const idleTimeoutMs = getAnalyticsIdleTimeoutMs();

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(enable, { timeout: idleTimeoutMs });
    } else {
      fallbackTimer = window.setTimeout(enable, idleTimeoutMs);
    }

    const events = ["scroll", "click", "keydown", "touchstart", "pointerdown"];
    events.forEach((eventName) => {
      window.addEventListener(eventName, enable, { once: true, passive: true });
    });

    return () => {
      if (idleId != null && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
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
