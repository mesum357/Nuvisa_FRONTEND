"use client";

import { useEffect, useRef, useState } from "react";

const MIN_VISIBLE_MS = 280;
const ROUTE_SETTLE_MS = 120;

/**
 * Full-screen loader for the first paint only (route changes stay instant).
 */
export default function SitePageLoader() {
  const [visible, setVisible] = useState(true);
  const shownAtRef = useRef(0);
  const hideTimerRef = useRef(null);

  const hideLoader = () => {
    const elapsed = Date.now() - shownAtRef.current;
    const delay = Math.max(0, MIN_VISIBLE_MS - elapsed) + ROUTE_SETTLE_MS;

    hideTimerRef.current = setTimeout(() => {
      setVisible(false);
      hideTimerRef.current = null;
    }, delay);
  };

  useEffect(() => {
    const finishInitialLoad = () => hideLoader();

    if (document.readyState === "complete") {
      finishInitialLoad();
    } else {
      window.addEventListener("load", finishInitialLoad, { once: true });
    }

    return () => window.removeEventListener("load", finishInitialLoad);
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
