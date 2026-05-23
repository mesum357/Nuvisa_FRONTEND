import dynamic from "next/dynamic";

export const sectionSkeleton =
  (minHeight = "120px") =>
  () =>
    (
      <div
        className="w-full animate-pulse rounded-2xl bg-white/5"
        style={{ minHeight }}
        aria-hidden="true"
      />
    );

export const lazySection = (importFn, minHeight = "120px", options = {}) =>
  dynamic(importFn, {
    loading: sectionSkeleton(minHeight),
    ...options,
  });
