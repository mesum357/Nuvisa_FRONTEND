"use client";

import { useEffect, useRef, useState } from "react";

/** Lazy-loads section MP4 only on desktop after the block is visible. */
export default function DeferredSectionVideo({ src, className = "" }) {
  const ref = useRef(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px", threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`relative w-full aspect-video rounded-[40px] overflow-hidden bg-black/80 ${className}`}>
      {load ? (
        <video
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover scale-[1.15] origin-center"
        />
      ) : null}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />
    </div>
  );
}
