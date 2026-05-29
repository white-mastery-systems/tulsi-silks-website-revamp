# Homepage SSR performance

## Targets

| Metric | Before | Target |
|--------|--------|--------|
| SSR render | 10–13 s | &lt; 1 s (warm cache &lt; 200 ms) |
| Raw HTML | ~1005 KB | &lt; 250 KB |
| PSI / Lighthouse | timeouts | stable runs |

## What changed

1. **Selective SSR** (`ssr-home.config.ts`) — server renders hero, up to 2 section grids, 1 featured section, 1 featured product row (4 SKUs). All other CMS blocks load after hydration via `ensureFullHomeLayoutOnClient()`.
2. **HTTP timeouts** (`ssr-http-timeout.interceptor.ts`) — SSR APIs fail fast (2–2.5 s) instead of blocking Node for 10+ s.
3. **Transfer cache trim** — products/blogs/layout segments stripped before inline JSON in HTML.
4. **TransferState** — slim `menu_list` snapshot for header hydration.
5. **Express** — 120 s in-process HTML cache for `/` (`SSR_HTML_CACHE_TTL_MS`), gzip-first compression.
6. **Nginx** — `deploy/nginx-ssr-cache.conf` — `proxy_cache`, stale-while-revalidate, gzip.

## Validation

```bash
# Build SSR bundle
npm run build:ssr

# Run with diagnostics
SSR_DIAG=1 SSR_HTML_CACHE_TTL_MS=120000 node dist/ecommerce/server/main.js

# Watch logs — expect WARN only on cold miss:
# [SSR] info / — <800 ms, <250 KB raw
# [SSR] cache HIT / — 0 ms, ...

# Raw HTML size (no compression)
curl -s -H "Accept-Encoding: identity" http://localhost:4000/ | wc -c

# Lighthouse CI (stable with warm cache)
npx lighthouse http://localhost:4000/ --preset=desktop --only-categories=performance
```

## Nginx deploy

Copy `deploy/nginx-ssr-cache.conf` into your site `server {}` block. Purge cache: delete `/var/cache/nginx/tulsisilks_ssr` or restart nginx.

## SEO

- H1, hero, and first product/section blocks remain in SSR HTML.
- JSON-LD applied client-side (`applyHomePageJsonLd`) — unchanged.
- Full CMS content appears after client `LAYOUT_LIST` (no crawl regression for links in deferred blocks if needed — monitor Search Console).

## Tuning

`src/app/services/ssr-home.config.ts`:

- `SSR_HOME_MAX_PRODUCTS`
- `SSR_HOME_MAX_HERO_SLIDES`
- `SSR_DEFERRED_SEGMENT_TYPES`
