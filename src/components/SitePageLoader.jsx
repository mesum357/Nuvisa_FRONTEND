"use client";

import { useEffect, useRef, useState } from "react";

const MAX_VISIBLE_MS = 900;

/**
 * Brief first-visit overlay only. Dismisses on DOMContentLoaded (not window.load)
 * so a 26MB hero MP4 does not block LCP.
 */
export default function SitePageLoader() {
  const [visible, setVisible] = useState(true);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const hide = () => {
      if (hideTimerRef.current) return;
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
        hideTimerRef.current = null;
      }, 0);
    };

    if (
      document.readyState === "interactive" ||
      document.readyState === "complete"
    ) {
      hide();
    } else {
      document.addEventListener("DOMContentLoaded", hide, { once: true });
    }

    const cap = window.setTimeout(hide, MAX_VISIBLE_MS);

    return () => {
      document.removeEventListener("DOMContentLoaded", hide);
      window.clearTimeout(cap);
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1E1E27]/95 backdrop-blur-sm"
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
