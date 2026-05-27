# Performance & PSI — master checklist

Quick reference: done work, deploy steps, and next moves. For narrative and curl examples see [PERFORMANCE_SAME_DAY_PLAN.md](./PERFORMANCE_SAME_DAY_PLAN.md). For a fuller 2‑day sprint timeline see [PERFORMANCE_2DAY_PLAN.md](./PERFORMANCE_2DAY_PLAN.md).

---

## Done or in codebase

- [x] Nginx SSR cache keyed by **device** (mobile vs desktop) so cached HTML matches `ngx-device-detector` branches (hydration-safe).
- [x] Express returns **404** for missing static URLs with a file extension (no fall-through to SSR HTML for `/favicon.ico`, dead `main.*.js` hashes, `/manifest.webmanifest`, etc.).
- [x] Removed **hidden hero `<img>`** preload hack (`fetchpriority="high"` + cache-busting query vs `<link rel="preload">`).
- [x] **`DynamicAssetLoaderService`** in-flight dedupe so parallel `swiper-js` / `swiper-css` loads do not inject duplicate tags.
- [x] **`[appHomeSwiper]`** on home: defer Swiper work with **`requestIdleCallback`** (~2.4s cap) + **rAF-batched** `MutationObserver` callbacks.
- [x] **Google Analytics / gtag** injection deferred with **`requestIdleCallback`** (fallback `setTimeout`) instead of a fixed early timer.
- [x] **Narrow `crypto-js` imports** — only `aes` + `enc-utf8` in `CommonService` (smaller **`main`** than full `crypto-js` entry).
- [x] **Disabled route prefetch** — `NoPreloading` instead of `ngx-quicklink` (fewer competing chunk downloads during homepage PSI / first paint).

---

## Every production deploy

- [ ] `npm run build:ssr`
- [ ] Upload **entire** `dist/ecommerce/browser` (prefer atomic swap); restart Node / PM2 **after** files are in place.
- [ ] Purge nginx HTML cache: `sudo rm -rf /var/cache/nginx/tulsisilks/*` then `sudo nginx -t` and `sudo systemctl reload nginx` (paths may differ on your server).
- [ ] Smoke: `curl -sI https://tulsisilks.co.in/favicon.ico` → expect **404**, small body — not `text/html` + 700k+.
- [ ] Smoke: `main.<hash>.js` from current homepage → response **Content-Type: application/javascript**, not `text/html`.
- [ ] Run **PageSpeed Insights Mobile 3×**; report **median** score, **LCP**, **TBT** (lab scores vary ±10 on Slow 4G).

---

## Next wave (biggest remaining wins)

- [ ] **Shrink `main.*.js` further** (~738 KB raw after crypto + quicklink trims; aim below ~650 KB): Lighthouse treemap → more `import()` deferrals.
- [ ] **Hero image (CDN / CMS)**: compress mobile WebP to a **~60–120 KB** target; optional **AVIF** + correct **`sizes` / `srcset`** on first `<picture>` so preload stays a cache hit.
- [ ] **Regression**: home → category → product → cart → checkout → account after material changes.

---

## Boss / stakeholder one-liner

Caching and static-asset fixes removed multi‑megabyte wrong responses and duplicate Swiper work; **score still tracks LCP + TBT**, which are capped by **bundle size** and **hero bytes** until treemap-driven lazy loading and image pipeline work land.
