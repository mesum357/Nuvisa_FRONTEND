"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Defers loading the large hero MP4 until the hero is near the viewport.
 * Uses a lightweight poster for LCP instead of preload="auto" on a ~25MB file.
 */
export default function DeferredHomeHeroVideo({ poster = "/image/banner.png" }) {
  const containerRef = useRef(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const connection = navigator.connection || navigator.mozConnection;
    const saveData = connection?.saveData;
    const slowNetwork =
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "3g";

    if (saveData || slowNetwork) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 -z-0">
      {shouldLoadVideo ? (
        <video
          className="w-full h-full object-cover scale-[1.2]"
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          poster={poster}
        >
          <source src="/video/nuvisa.mp4" type="video/mp4" />
        </video>
      ) : (
        <div
          className="w-full h-full bg-cover bg-center scale-[1.2]"
          style={{ backgroundImage: `url(${poster})` }}
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
}
