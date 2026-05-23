# NUvisa frontend performance — baseline vs optimized

Captured on **2026-05-23** against production build (`npx next build` + `next start -p 3010`).

Raw data: `baseline.json`, `optimized.json`. Re-run:

```bash
npm run build   # or: npx next build
npx next start -p 3010
npm run perf:benchmark -- --url http://127.0.0.1:3010 --label optimized --out perf-results/optimized.json
```

## Summary

| Area | Result |
|------|--------|
| **Initial JS (main win)** | `/get-the-visa` **914 KB → 491 KB (−46%)**; `/application-step` **1010 KB → 931 KB (−8%)**; `/` **516 KB → 498 KB** |
| **HTML payload (server)** | `/` **124 KB → 42 KB** (smaller SSR shell; more work deferred to client chunks) |
| **TTFB-style fetch** | All routes faster (e.g. `/` **89 ms → 13 ms** avg) |
| **Lighthouse** | Mixed on `/get-the-visa` (high variance); **checkout +6**, **our-guarantee +6**; home **TBT −29%** |

Lighthouse scores fluctuate run-to-run (especially LCP on heavy pages). **Bundle size and TBT** are the reliable improvements from this pass.

---

## Build: first-load JavaScript per route

| Route | Baseline | Optimized | Change |
|-------|----------|-----------|--------|
| `/get-the-visa` | 914.1 KB | **490.9 KB** | **−423 KB (−46%)** |
| `/application-step` | 1009.5 KB | **930.6 KB** | −79 KB (−8%) |
| `/dashboard` | 632.7 KB | **596.0 KB** | −37 KB |
| `/` | 515.6 KB | **497.5 KB** | −18 KB |
| `/checkout` | 357.7 KB | 357.7 KB | — |

---

## Server response (3× fetch average)

| Route | Baseline avg | Optimized avg | HTML size |
|-------|--------------|---------------|-----------|
| `/` | 89 ms | **13 ms** | 124 KB → **41.5 KB** |
| `/get-the-visa` | 109 ms | **6 ms** | ~3.5 KB → 3.2 KB |
| `/checkout` | 18 ms | **8 ms** | 8.5 KB → 8.8 KB |
| `/our-guarantee` | 12 ms | **5 ms** | 11.2 KB → 11.4 KB |

---

## Lighthouse (performance category)

| Route | Score (B → O) | LCP (B → O) | TBT (B → O) | FCP (B → O) |
|-------|---------------|-------------|-------------|-------------|
| `/` | 39 → 39 | 4354 → 4478 ms | **2584 → 1834 ms** | 1847 → **1105 ms** |
| `/get-the-visa` | 34 → 16* | 9731 → 14266 ms* | **5353 → 4492 ms** | 1634 → 1403 ms |
| `/checkout` | 80 → **84** | 2908 → **2787 ms** | 521 → **463 ms** | 1843 → **923 ms** |
| `/our-guarantee` | 63 → **69** | 3462 → 3730 ms | 512 → **265 ms** | 1839 → **1037 ms** |

\*Single Lighthouse run; `/get-the-visa` LCP/score can swing widely. TBT improved despite lower score (CLS also worse in that run: 0.07 → 0.53).

---

## What changed in code

1. **Route-level code splitting** — `dynamic()` / `lazySection()` for heavy sections (Slider, FAQ, Footer, finance block, application-step steps, dashboard widgets).
2. **`LazyWhenVisible`** — Below-the-fold blocks on home and get-the-visa render only when scrolled near viewport.
3. **`next.config.mjs`** — `optimizePackageImports` (lucide, react-icons), `removeConsole` in production.
4. **`Slider.jsx`** — Lazy datepicker CSS; `priority` / `loading` only on active carousel slide.
5. **`_document.js`** — Preload critical Gilroy font files.
6. **`scripts/perf-benchmark.mjs`** — Repeatable baseline/optimized captures (`npm run perf:benchmark`).

---

## Phase 2 (Slider split + deferred Stripe/payments)

Further changes: `CountryCarousel` module, dynamic Stripe/Expert/ConfirmationModal, `LazyWhenVisible` on payment block, hero `sizes` + preload + `fetchPriority`, removed spurious `priority` on below-fold images.

| Route | LH score (opt → ph2) | LCP (opt → ph2) | TBT (opt → ph2) |
|-------|----------------------|-----------------|-----------------|
| `/` | 39 → **57** | 4478 → **2492 ms** | 1834 → 2930 ms* |
| `/get-the-visa` | 16 → 16 | 14266 → **7864 ms** | 4492 → **2303 ms** |
| `/checkout` | 84 → **81** | 2787 → 3202 ms | 463 → 485 ms |
| `/our-guarantee` | 69 → 68 | 3730 → 3758 ms | 265 → **333 ms** |

\*Home TBT regressed in this single Lighthouse run; LCP and score improved strongly. Re-run for median.

**JS `/get-the-visa` (first-load manifest):** still **~491 KB**; Stripe/Expert now load in **separate async chunks** when the user scrolls near checkout (lower main-thread work at startup).

Raw: `perf-results/phase2.json`

---

## Recommended follow-ups

1. **Further split `Slider.jsx`** — extract checkout form / date-picker panels into lazy modules.
2. **LCP on `/get-the-visa`** — Investigate CLS spikes (layout shift from deferred sections); median Lighthouse over 3 runs.
3. **Images** — Compress source JPGs in `/public/image/country/` (Next Image optimizes on the fly, but smaller sources help).
4. **Third-party scripts** — Defer Klarna/analytics until after first paint where possible.
5. **Admin app** — Separate benchmark pass for `Nuvisa-Admin` if needed.
