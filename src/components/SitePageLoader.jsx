"use client";

import { useEffect, useRef, useState } from "react";

const SHOW_DELAY_MS = 400;
const MAX_VISIBLE_MS = 900;

/**
 * Optional overlay — not rendered on SSR so LCP can be the hero poster.
 * Only appears if the page is still loading after SHOW_DELAY_MS.
 */
export default function SitePageLoader() {
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef(null);
  const showTimerRef = useRef(null);

  useEffect(() => {
    const hide = () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
      if (hideTimerRef.current) return;
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, 0);
    };

    const onReady = () => {
      hide();
    };

    if (
      document.readyState === "interactive" ||
      document.readyState === "complete"
    ) {
      onReady();
      return undefined;
    }

    document.addEventListener("DOMContentLoaded", onReady, { once: true });
    const cap = window.setTimeout(onReady, MAX_VISIBLE_MS);

    showTimerRef.current = window.setTimeout(() => {
      if (document.readyState === "loading") {
        setVisible(true);
      }
    }, SHOW_DELAY_MS);

    return () => {
      document.removeEventListener("DOMContentLoaded", onReady);
      window.clearTimeout(cap);
      if (showTimerRef.current) clearTimeout(showTimerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1E1E27]/95 backdrop-blur-sm overscroll-none touch-none"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-2 border-white/15" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#7350FF] border-r-[#7350FF] animate-spin" />
        </div>
        <p className="text-sm font-medium tracking-wide text-white/80">Loading</p>
      </div>
    </div>
  );
}
