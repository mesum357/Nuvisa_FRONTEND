"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

/**
 * Hero: lightweight poster for LCP; MP4 only on desktop after idle (never on mobile).
 */
export default function DeferredHomeHeroVideo({
  poster = "/image/hero-1104.webp",
}) {
  const containerRef = useRef(null);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const connection = navigator.connection || navigator.mozConnection;
    if (connection?.saveData) return;
    if (
      connection?.effectiveType === "slow-2g" ||
      connection?.effectiveType === "2g" ||
      connection?.effectiveType === "3g"
    ) {
      return;
    }

    // Skip ~25MB video on mobile — largest PageSpeed win on nuvisa.co.uk
    const isMobileViewport = window.matchMedia("(max-width: 767px)").matches;
    if (isMobileViewport) return;

    const loadVideo = () => {
      setShouldLoadVideo(true);
    };

    const delayMs = 2500;
    const timer = window.setTimeout(loadVideo, delayMs);

    const node = containerRef.current;
    if (node) {
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            window.clearTimeout(timer);
            loadVideo();
            observer.disconnect();
          }
        },
        { rootMargin: "120px 0px", threshold: 0.01 }
      );
      observer.observe(node);
      return () => {
        window.clearTimeout(timer);
        observer.disconnect();
      };
    }

    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0">
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
        <Image
          src={poster}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover scale-[1.2]"
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-black/45" />
    </div>
  );
}
