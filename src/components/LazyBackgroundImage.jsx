"use client";

import { useEffect, useRef, useState } from "react";

/** Loads a large CSS background image only when near the viewport. */
export default function LazyBackgroundImage({ src, className = "", children }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={visible ? { backgroundImage: `url('${src}')` } : undefined}
    >
      {children}
    </div>
  );
}
