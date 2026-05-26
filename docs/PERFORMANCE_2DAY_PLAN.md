# Tulsi Silks — 2-Day Performance Sprint Plan

**Goal:** Lift PageSpeed Insights **Mobile score from 31 → 75+** in 2 working days.

**Honest expectation setting:** The original 4-week plan targets 85–90.
Compressed to 2 days the *realistic* target is **70–80**. Anything ≥ 75 is a
huge win and a clear "we are moving forward, not backward" story for leadership.
Pushing past 80 in 48 hours adds significant regression risk on a live store.

---

## What's already shipped (before Day 1 starts)

| # | Change | Effect | File |
|---|--------|--------|------|
| 0.1 | Lazy-load `jspdf` + `html2canvas` (only loads when user clicks "Download PDF") | −1.5 MB from initial bundle | `invoice.component.ts`, `vendor-invoice.component.ts` |
| 0.2 | Enable inline critical CSS + inline Google Fonts in prod build | FCP −300–500 ms | `angular.json` |
| 0.3 | Tighten initial bundle budget from 1.5 MB → 1 MB | Prevents future bloat | `angular.json` |

> **Verify before deploy:** Log in → My Orders → Download PDF.
> Confirm PDF still downloads correctly for both customer and vendor invoices.

---

## Day 1 — Bundle + Network (target: PSI 31 → 60-70)

### Morning — 09:30 to 13:30 (4 hours) — Bundle surgery

| Time | Task | Expected impact |
|------|------|-----------------|
| 09:30 – 10:30 | **1.1 — Lazy-load `editorjs-html`** inside `blog-renderer.component.ts` only. Same dynamic `import()` pattern as PDF libs. | −80 KB initial bundle |
| 10:30 – 11:30 | **1.2 — Remove `lazysizes`** from `package.json`, `angular.json` allowedCommonJsDependencies, and the `app.module`. Replace with native `loading="lazy"` on all `<img>` tags (covered by `ImgLazyLoadDirective`). | −50 KB + one less CDN fetch |
| 11:30 – 12:30 | **1.3 — Drop `wow.js` + `Headroom.js` + `jQuery` CDN loads** from `dynamic-asset-loader.service.ts`. Replace WOW with CSS `@keyframes` reveal (already supported by `IntersectionObserver`). Replace Headroom with ~15 lines of vanilla JS scroll listener. Port the 4 functions in `assets/js/script.js` to TypeScript and delete the CDN load. | −120 KB CDN + faster TBT |
| 12:30 – 13:00 | **1.4 — Tree-shake `ngx-bootstrap`** to only `ModalModule` + `BsDatepickerModule`. Remove unused `accordion` if not used anywhere. | −40 KB |
| 13:00 – 13:30 | **1.5 — Move `crypto-js` localStorage encryption work to the existing Web Worker** (`tsconfig.worker.json` already configured). Cuts main-thread work during bootstrap. | INP −80 ms |

### Lunch — 13:30 to 14:30

### Afternoon — 14:30 to 18:30 (4 hours) — SSR + LCP

| Time | Task | Expected impact |
|------|------|-----------------|
| 14:30 – 16:00 | **1.6 — Parallelize SSR API calls.** In `server.ts`, pre-fetch `STORE_DETAILS_V3` + `LAYOUT_LIST` + `FOOTER_SEO_LINKS` in `Promise.all` **before** rendering. Inject as `TransferState` so the client receives the data in the SSR HTML instead of refetching. | TTFB 2.6 s → ~1.0 s |
| 16:00 – 17:00 | **1.7 — Optimize the hero image.** Generate AVIF + WebP variants at 640w / 960w / 1440w for both `mobile_primary_slider` and `desktop_primary_slider`. Update `index.html` `<picture>` with proper `srcset` / `sizes`. Make sure the *same* `<img>` element is used by the Angular slider so the preload cache is a hit, not a miss. | LCP −1.0 to −1.5 s |
| 17:00 – 17:30 | **1.8 — Fix CLS from header swap.** Replace `body { margin-top: 80px }` placeholder with an inline `<style>` that reserves accurate header height (101 px desktop / 96 px mobile). Use `min-height` instead of `margin-top` on the masthead container. | CLS 0.24 → ~0.05 |
| 17:30 – 18:30 | **1.9 — Drop two of the three Google Fonts.** `Material Icons` + `Material Icons Outlined` are only used by 5 pseudo-elements in `styles.scss`. Replace with inline SVG icons or use one (not two) icon font. Keep `Montaga` (brand font). | −2 render-blocking requests, FCP −150 ms |

### End of Day 1

- Run `ng build --configuration production` and screenshot `vendor.js` + `main.js` sizes.
- Deploy to staging.
- Run **3 PSI Mobile tests** on staging and average them. **Target: 60–70**.
- If score < 55, stop and review — something else is wrong before continuing to Day 2.

---

## Day 2 — Polish + Guardrails (target: 70 → 75-80)

### Morning — 09:30 to 13:30 (4 hours) — CDN, image pipeline, and polish

| Time | Task | Expected impact |
|------|------|-----------------|
| 09:30 – 11:00 | **2.1 — Cloudflare in front of the origin.** Point DNS to Cloudflare, enable Brotli, set page rules: `/` and `/category/*` cache `s-maxage=300, stale-while-revalidate=600`. Existing `Cache-Control` from `server.ts` already declares `max-age=60, stale-while-revalidate=300`, so Cloudflare honors that automatically. | TTFB drops to **edge response** (< 200 ms in India region) |
| 11:00 – 12:00 | **2.2 — Compress all `src/assets/images/`** (9.5 MB → ~1.5 MB) with `sharp` or `squoosh-cli`. WebP for everything, PNG only where alpha is required. Replace `insta1.png`/`insta2.png`/`insta3.png` placeholders too. | −8 MB transfer for repeat visitors / new deploys |
| 12:00 – 12:30 | **2.3 — Reserve aspect ratios on every product card image.** Add `width`/`height` HTML attributes + CSS `aspect-ratio`. | CLS down further |
| 12:30 – 13:30 | **2.4 — Reduce home-page bundle.** Audit `home.module.ts` for any service/component that can be deferred behind a route guard. Move below-the-fold sections (Instagram, blogs, testimonials) into a separate lazy chunk loaded only when scrolled to. | Home initial JS ~ −150 KB |

### Lunch — 13:30 to 14:30

### Afternoon — 14:30 to 18:30 (4 hours) — Guardrails + ship

| Time | Task | Expected impact |
|------|------|-----------------|
| 14:30 – 15:30 | **2.5 — Lighthouse-CI GitHub Action.** Runs on every PR; blocks merge if mobile score drops below 70. Stops backsliding for good. | Long-term safety |
| 15:30 – 16:30 | **2.6 — Defer the rest of `app.component.ts` listeners.** Move `mousemove`, `touchmove`, `scroll`, `click` subscriptions into `requestIdleCallback` (already partly done — finish it). Move `setBodyMarginTop` measurements behind a single `requestAnimationFrame`. | INP 217 ms → ~150 ms |
| 16:30 – 17:30 | **2.7 — End-to-end regression test on staging.** Click through: home → category → product (with images) → add to cart → checkout → account → invoice → download PDF. Confirm nothing regressed. | Risk control |
| 17:30 – 18:30 | **2.8 — Production deploy + final PSI run + boss screenshot.** Run PSI Mobile 3× and average. Document before/after Core Web Vitals. | Done |

### End of Day 2

- Final screenshot: PSI Mobile **≥ 75** (target hit) or 70-74 (still a major win vs. 31).
- Lighthouse-CI now blocks future regressions.
- Write a 2-page wrap-up email to leadership with before/after metrics.

---

## Scope explicitly **dropped** to fit 2 days

These items from the original 4-week plan are **deferred** — list them in your
boss email so expectations are clear:

| Dropped item | Why | When to revisit |
|--------------|-----|-----------------|
| Switch to Angular `application` (esbuild) builder | Risky migration; needs SSR re-validation. Saves another 30–50% but high regression risk. | Week 3 follow-up |
| Convert `AppModule` + components to standalone (zoneless Angular 20) | Touches every component; ≥ 2 days alone. | Week 3 follow-up |
| Replace `crypto-js` entirely (use `SubtleCrypto`) | Web-worker move in Day 1 gives 80% of the benefit. Replacement is a future task. | Week 4 follow-up |
| Full responsive image pipeline (every product image AVIF + srcset) | Hero alone gets the LCP win. Product/category images can be done over the next month. | Ongoing |
| Real-User Monitoring (Cloudflare Web Analytics) | Nice-to-have, not score-moving. | Week 4 |

---

## Risks for the 2-day sprint

1. **No buffer for unknown unknowns.** If any one task takes 1.5× longer than estimated, Day 2 afternoon may not finish. Mitigation: at any check-in, drop the *lowest-impact* remaining task rather than rushing a high-impact one.
2. **Cloudflare DNS propagation can take 5–60 minutes.** Schedule the DNS swap for the start of Day 2 morning so it has time to propagate before the final PSI run.
3. **PDF download regression.** Already mitigated — manual smoke test before deploy.
4. **Cache invalidation on deploy.** New hashed assets are fine; non-hashed `script.js` is already `no-cache` per `server.ts`. Should be safe.
5. **Boss-facing demo on cold render.** PSI hits a cold edge cache, which is exactly what real users get *after* this sprint — so the score the boss sees IS the user's score.

---

## What to tell your boss — short version (paste this in chat/email)

> Sir, the optimization work so far fixed the easy items. The real reasons the
> score is stuck at 31 are (a) a 6.3 MB JavaScript bundle that mobile phones
> take 2–3 seconds to parse, and (b) a 2.6 second server response time on
> uncached page loads. Both of these need structural fixes, which I have
> already started.
>
> Day 1 today — I cut the JavaScript bundle by ~1.5 MB and parallelize the
> server-side API calls. I also fix the layout-shift problem on the homepage
> header. Expected score by end of day: **60–70**.
>
> Day 2 tomorrow — I put Cloudflare in front of the site to take server
> response time from 2.6 s to under 0.3 s, compress all the homepage images,
> and add a Lighthouse check to our build pipeline so the score can never
> drop below 70 again. Expected final score: **75–80**.
>
> I will send a fresh PageSpeed screenshot at end of day 1 and end of day 2,
> so you can see the score climb in real time instead of waiting for one big
> reveal.

---

## Verification checklist (run after each day)

```bash
# 1. Production build + bundle size check
ng build --configuration production
du -sh dist/ecommerce/browser/vendor.js dist/ecommerce/browser/main.js

# Day 1 target: vendor.js ≤ 4.5 MB, main.js ≤ 400 KB
# Day 2 target: vendor.js ≤ 4.0 MB, main.js ≤ 350 KB

# 2. PSI Mobile (run 3 times, average — single-shot PSI has ±10 noise)
# https://pagespeed.web.dev/analysis/https-tulsisilks-co-in/

# 3. WebPageTest mobile 4G profile from Mumbai region
# https://www.webpagetest.org/  (location: Mumbai, browser: Chrome, connection: 4G)

# 4. Manual regression — these flows MUST still work:
#    - Homepage hero loads without flash
#    - Category page filter + pagination
#    - Add to cart + cart drawer
#    - Checkout (guest)
#    - Login + My Orders + Download PDF (verifies lazy import still works)
#    - Blog page (verifies editorjs-html lazy load)
```
