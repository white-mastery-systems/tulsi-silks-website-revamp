# Same-day PSI / mobile performance plan

For a bullet-only checklist (done items, deploy, next steps), see **[PERFORMANCE_CHECKLIST.md](./PERFORMANCE_CHECKLIST.md)**.

Lab scores (PSI “Mobile”, Slow 4G + Moto G emulation) bounce **±10 points** between runs—treat deltas as directional, run **3 PSI runs**, report the median.

## What moved the needle (already deployed / in repo)

1. **Nginx SSR cache keyed by device** — avoids wrong HTML bucket (hydration breakage).
2. **Express 404 for missing static files** (`/favicon.ico`, `/manifest.webmanifest`, etc.) — stops **755 KB SSR HTML** from being mistaken for icons/manifest/old JS filenames.
3. **Hidden hero `<img>` hack removed** from `app.component.html` — no duplicate `fetchpriority="high"` + cache-busting query vs preload.

Latest code also adds:

4. **`DynamicAssetLoaderService` de-duplication** — many `[appHomeSwiper]` directives all called `load('swiper-js','swiper-css')` in parallel **before `loaded` flipped true**, injecting **duplicate Swiper `<script>/<link>`** and re-parsing bundle after bundle. Guarded by in-flight promises.
5. **Home swiper work deferred (`requestIdleCallback`, max wait ~2.4s)** + **MutationObserver coalescing** (`requestAnimationFrame`) — less main-thread work stacked on top of Angular bootstrap (targets **TBT** and **Speed Index**).
6. **Google Analytics / gtag injected on `requestIdleCallback`** instead of fixed +5 s timer — trims contention during critical window.

## Do today — deployment checklist

- [ ] `npm run build:ssr` locally; upload **whole** `dist/ecommerce/browser` (do not prune old hashed files mid-deploy if you rotate traffic; preferably atomic swap).
- [ ] Restart Node / PM2 **after** files are present.
- [ ] **Purge nginx HTML cache**: `sudo rm -rf /var/cache/nginx/tulsisilks/*` then reload nginx (`nginx -t` then `reload`).
- [ ] Sanity curl (production):

```bash
curl -sI https://tulsisilks.co.in/favicon.ico | head -5
curl -sI "https://tulsisilks.co.in/$(curl -s https://tulsisilks.co.in/ | grep -oE 'main\.[a-f0-9]+\.js' | head -1)" | grep -i content-type
```

Expect `404`/small body on favico; **`application/javascript`** (not `text/html`) for current `main.*.js`.

## Remaining bottleneck (truth for “boss”: not cache-only)

| Metric driver | Typical cause here | Same-day mitigation |
|---|---|---|
| **LCP 5–10s +** | **`main.*.js` ≈790 KB uncompressed** Slow 4G downloads + parses long | Swiper/asset fixes above; tomorrow: split routes / defer heavy libs (Plyr, editor,Photoswipe) | 
| | **CDN hero `.webp`** still large vs viewport | Compress `mobile_primary_slider.webp` (~40–120 KB mobile target); add `sizes`/`width` on `<picture>` if multiple widths exist |
| **TBT 1–2s** | Hydration + long tasks from Angular + carousels + analytics | Deferred Swiper init + idle GA ✓ ; **`ngx-quicklink` removed** (`NoPreloading`) so homepage doesn’t prefetch competing route chunks |

## PSI protocol (today)

Run PageSpeed Insights **3×** (“Analyze” → wait → repeat). Ignore single outlier spikes. Field data (**CrUX**) lags deployments by weeks—report lab + “field passes/fails separately”.

## If score still stalls after this deploy

1. Lighthouse → **Treemap / coverage** on `main.*.js` — top 5 modules decide what gets dynamic-imported next.
2. Verify **single** `<script>` for `swiper.min.js` and **single** stylesheet in Network (no duplicates).
3. **Image**: serve **AVIF** with WebP fallback in first `<picture>` source for mobile slider.
