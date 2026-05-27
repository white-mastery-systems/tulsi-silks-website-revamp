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
- [x] **Lazy `editorjs-html`** — `blog-renderer` loads it via `import()` so it is not in the initial JS graph; ships as a separate chunk when a blog is opened.
- [x] **No WOW.js / Headroom.js CDN** — scroll-reveal uses `IntersectionObserver` + `.wow-in-view` (see `custom.scss`); sticky header uses vanilla scroll logic + `headroom.css` bundled in `styles.scss` (no extra CDN script or late `load('headroom-css')` on scroll).
- [x] **Material Icons eager** — **`material-icons.woff2` preloaded** + **`material-icons-deferred.css`** as a normal blocking `<link>` (pseudo-element separators like breadcrumbs/FAQ used to show ligature text `chevron_right`/`add` when the font stylesheet was deferred). **removed `preconnect` to cdnjs** where applicable.
- [x] **TBT — unpatch `scroll` + passive listeners on Home/Blog Detail** (`zone-flags.ts`, `home.component.ts`, `blog-details.component.ts`): **`NgZone.run()` only when scroll-to-top / scroll-toolbar booleans change**, instead of Angular CD every scroll pixel.
- For **why the headline PSI score may stay flat** after non–critical-path fixes, see [PSI_SCORE_DIAGNOSIS.md](./PSI_SCORE_DIAGNOSIS.md).

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

- [ ] **Shrink `main.*.js` further** (~740 KB raw; aim below ~650 KB): Lighthouse treemap → more `import()` deferrals (home-only services, third parties, etc.).
- [ ] **Hero image (mobile)**:
  - **Frontend-only path (no CMS overwrite):** put **`src/assets/perf/mobile_primary_slider.webp`** in the repo (from **`npm run optimize:mobile-hero`** then **`npm run optimize:mobile-hero:install`**). Keep **`environment.staticMobileHeroWebpUrl`** aligned with **`src/index.html`** homepage-only hero preload URLs (same string as mobile WebP path). Target **60–120 KB**.
  - **Or CMS path:** upload **`scripts/output/mobile_primary_slider.webp`** to **`uploads/<store_id>/layouts/mobile_primary_slider.webp`**, set **`staticMobileHeroWebpUrl`** to **`null`**, and revert **`index.html`** mobile URLs to yourstore **`uploads/...`**. Optional AVIF later.
- [ ] **Regression**: home → category → product → cart → checkout → account after material changes.

---

## Boss / stakeholder one-liner

Caching and static-asset fixes removed multi‑megabyte wrong responses and duplicate Swiper work; **score still tracks LCP + TBT**, which are capped by **bundle size** and **hero bytes** until treemap-driven lazy loading and image pipeline work land.
