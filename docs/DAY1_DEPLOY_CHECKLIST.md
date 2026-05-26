# Day 1 — Deploy & Verification Checklist

Use this checklist after the Day 1 performance changes are merged.
Companion to `docs/PERFORMANCE_2DAY_PLAN.md`.

---

## Summary of Day 1 changes shipped

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Initial JS transfer (gzipped)** | ~1.7 MB | **240 kB** | **−86%** |
| `vendor.js` raw | 6.3 MB | merged into `main.js` (768 kB raw / 199 kB gzipped) | −88% |
| `jspdf` | bundled eagerly | **97 kB lazy chunk** (loads on PDF click only) | off critical path |
| `html2canvas` | bundled eagerly | **37 kB lazy chunk** | off critical path |
| `canvg` | bundled eagerly | **44 kB lazy chunk** | off critical path |
| `dompurify` | bundled eagerly | **7 kB lazy chunk** | off critical path |
| `lazysizes` (~50 kB) | bundled | **removed entirely** | −50 kB |
| Google Fonts requests | 3 | **1** (Montaga only) | −2 render-blocking |
| Header CLS fallback | 80 px (wrong for both breakpoints) | 74 / 78 px (exact) | CLS drops ~0.15 |

---

## Files changed in Day 1

| File | Change |
|------|--------|
| `src/app/views/account/my-orders/invoice/invoice.component.ts` | Lazy-load `jspdf` + `html2canvas` via dynamic `import()` |
| `src/app/views/account/my-orders/vendor-invoice/vendor-invoice.component.ts` | Lazy-load `jspdf` + `html2canvas` via dynamic `import()` |
| `src/app/shared/directives/img-lazy-load.directive.ts` | Rewrote with `IntersectionObserver` (removed `lazysizes`) |
| `src/app/shared/directives/lqimg-load.directive.ts` | Rewrote with `IntersectionObserver` (removed `lazysizes`) |
| `src/app/shared/directives/small-img.directive.ts` | Rewrote with `IntersectionObserver` (removed `lazysizes`) |
| `src/assets/js/ls.unveilhooks.js` | **Deleted** |
| `package.json` | Removed `lazysizes` dependency |
| `angular.json` | Removed `lazysizes` from `allowedCommonJsDependencies`; added inline critical CSS + font inlining; tightened bundle budget to 1 MB |
| `src/index.html` | Responsive header height variable (74 px / 78 px); dropped 2 Google Fonts preloads |
| `src/styles.scss` | Material Icons → inline SVG via `mask-image` (currentColor-aware) |
| `src/app/views/home/home.component.ts` | Aligned `MASTHEAD_FALLBACK_PX` from 80 → 74 |
| `server.ts` | `Cache-Control: max-age=180, stale-while-revalidate=600` (up from 60 / 300) |
| `tulsisilks.conf` | Nginx `proxy_cache_valid 200 60s` → `3m` |

---

## Deploy steps (in order)

```bash
# 1. Install (lazysizes is being removed from node_modules)
npm install

# 2. Smoke-test locally first
#    - Visit http://localhost:4200
#    - Quick click-through of the regression checklist below

# 3. Production build (verify it succeeds with no errors)
npm run build

# 4. Restart SSR server with the new build
#    (PM2 example — substitute your actual process manager command)
pm2 restart tulsisilks-ssr
#    or: node dist/ecommerce/server/main.js

# 5. Reload Nginx so the new tulsisilks.conf (3-min cache) is active
sudo nginx -t        # test config syntax first — must say "syntax is ok"
sudo nginx -s reload
```

---

## Regression test BEFORE deploying to live

Run on **staging** (or local first). Takes ~5 minutes.

| # | Step | What to confirm |
|---|------|-----------------|
| 1 | Open homepage `/` on **mobile viewport** | Hero image appears immediately. **No layout jump** when Angular hydrates. |
| 2 | Open homepage on **desktop** | Same — no jump. Header icons (menu / search / account / wishlist / cart) all visible and crisp. |
| 3 | Click hamburger / mobile menu | Mega menu opens correctly. *(This is the path most likely to regress because of the `lazysizes` removal.)* |
| 4 | Open a **category page** (`/category/kanjivaram-silk-sarees`) | Scroll down — product images lazy-load as they enter viewport with blur-up effect. |
| 5 | Open a **product detail page** | Product image gallery loads, swiper works. |
| 6 | Open a **blog detail page** (`/blogs/...`) | Article HTML renders correctly. |
| 7 | Login → **My Orders → Download PDF** | PDF generates correctly. *This verifies the dynamic `import()` for `jspdf` + `html2canvas` works in production build.* If this fails, the lazy-loaded chunk has a problem — do NOT deploy. |
| 8 | View the **header icons** | They should look identical to before (just SVG now instead of icon font). Color should match parent text color. |

**If all 8 pass → safe to deploy to production.**
**If any fail → STOP, fix the failure, do not deploy.**

---

## PageSpeed Insights verification

After production deploy:

```bash
# 1. Warm the Nginx + browser caches with one quick visit (any user-agent works)
curl -A "Mozilla/5.0 Mobile" https://tulsisilks.co.in/ > /dev/null

# 2. Wait 5 seconds, then run PageSpeed Insights Mobile 3 times in a row and average
#    https://pagespeed.web.dev/analysis/https-tulsisilks-co-in/
```

### Expected results after Day 1

| Metric | Before | Day 1 target |
|--------|--------|--------------|
| **Mobile score** | 31 | **55 – 65** |
| LCP | 5.0 s | ~3.5 s |
| CLS | 0.24 | **≤ 0.10** (should turn green) |
| TTFB | 2.6 s | ~2.0 s (full fix requires Day 2 CDN) |
| FCP | 2.9 s | ~2.2 s |
| INP | 217 ms | ~180 ms |

### Interpreting the result

- **Score ≥ 55** → Changes are working. Continue to Day 2 (CDN + image compression + Lighthouse-CI).
- **Score 45 – 54** → Improving but slower than expected. Likely cause: TTFB still high (cold cache). Verify Nginx reload was successful and `Cache-Control` headers show `max-age=180`.
- **Score < 45** → Something is wrong. Share the PSI URL and the browser console errors from the live site before proceeding.

### How to verify the Nginx cache is being honoured

```bash
curl -I https://tulsisilks.co.in/
```

Look for the response header `X-Cache-Status` — values mean:
- `MISS` → first hit, SSR is rendering fresh. Subsequent hits within 3 min should be `HIT`.
- `HIT` → served from Nginx in-memory cache. Fast.
- `UPDATING` → serving stale while fetching fresh in background. Fast.

If you only ever see `MISS`, the cache isn't working — check `proxy_cache_path` mount in `/var/cache/nginx/tulsisilks` and confirm Nginx user has write permission to it.

---

## Rollback procedure (if anything breaks on production)

```bash
# Revert the commit(s) and rebuild
git log --oneline -10                       # find the merge commit
git revert <commit-hash>                    # one or more reverts
npm install                                  # restores lazysizes if it was the cause
npm run build
pm2 restart tulsisilks-ssr

# Restore the previous Nginx config (if you backed it up before editing)
sudo cp /etc/nginx/sites-enabled/tulsisilks.conf.bak /etc/nginx/sites-enabled/tulsisilks.conf
sudo nginx -t && sudo nginx -s reload
```

All Day 1 changes are isolated to:
- Source files (revert with `git`)
- `tulsisilks.conf` (revert manually if needed)
- `node_modules` (restored by `npm install`)

**No database changes, no irreversible infra changes — safe to roll back at any time.**

---

## After deploy — what to do next

| Result | Next action |
|--------|-------------|
| PSI Mobile ≥ 55 | Resume Day 2 plan — image compression + Lighthouse-CI + CDN setup |
| PSI Mobile < 55 | Share PSI URL + DevTools Performance trace; diagnose blocker before proceeding |
| Any regression test failed | Roll back, fix root cause, re-test |

---

## Boss-facing update (paste this once deploy + PSI run is done)

> "Sir, Day 1 deployed. The initial JavaScript that mobile phones download is
> down 86 % (1.7 MB → 240 KB), the layout-shift problem on the homepage
> header is fixed, and we removed two render-blocking Google Fonts. Updated
> PageSpeed Mobile score is [XX] (was 31). Day 2 tomorrow: CDN setup
> (needs DNS access from you), image compression, and CI guardrails so
> the score never regresses again. Target end of Day 2: 75+."
