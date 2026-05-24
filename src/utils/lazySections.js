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

export const lazySection = (importFn, minHeight = "120px", options = {}) => {
  const { ssr = true, loading, ...rest } = options;

  return dynamic(importFn, {
    ssr,
    loading:
      loading !== undefined
        ? loading
        : ssr === false
          ? () => null
          : sectionSkeleton(minHeight),
    ...rest,
  });
};
