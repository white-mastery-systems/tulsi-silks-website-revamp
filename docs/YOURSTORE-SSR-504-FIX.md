# YourStore Angular SSR — 504 / Slow Catalog Pages Playbook

**Audience:** engineers applying this to any YourStore Angular SSR store  
**First applied:** Tulsi Silks (`tulsisilks.co.in`) — 1 Sep 2026  
**Symptom:** catalog pages take 10–18s; Google Search Console / sitemap URLs return **504 Gateway Timeout**. Backend API is fast (~100ms).

This is **not** a backend outage. It is Angular SSR + nginx giving up under sitemap crawl load.

Related (homepage-only, older): [SSR-PERFORMANCE.md](./SSR-PERFORMANCE.md)

---

## Copy-paste Cursor prompt (use on the next YourStore SSR store)

Paste everything in the block below into Cursor on the other store. Copy `docs/YOURSTORE-SSR-504-FIX.md` (this file) into that repo first.

```
You are fixing Angular SSR 504 / 10–18s catalog pages on a YourStore storefront.

CONTEXT
- Backend API is fast (~100ms). Do not blame or change the API.
- Angular SSR (CommonEngine + Express server.ts) + nginx are the bottleneck.
- Sitemap has thousands of unique /product and /category URLs. Googlebot crawls them in parallel.
- Follow docs/YOURSTORE-SSR-504-FIX.md (and YOURSTORE-SSR-504-FIX.html) from YS-Tulsi-Silks as the reference implementation.
- Do not affect existing shopper functionality (cart, checkout, filters, reviews, hydration).

ROOT CAUSE TO LOOK FOR
1. server.ts HTML cache only for `/` — catalog URLs always cold-render.
2. Zone.js setTimeout on SSR (pageLoader 500ms, setBodyMarginTop 100–1100ms, ngAfterViewInit).
3. SsrApiCacheInterceptor GET-only — PRODUCT_DETAILS / list_v4 / available_filters are POSTs.
4. No SSR concurrency cap / no in-flight coalescing → crawl stampede.
5. Nginx proxy_read_timeout 15s and proxy_cache_lock_timeout 2s → 504.
6. /sitemap.xml proxied with no cache or timeout.
7. Node localStorage polyfill is process-global — never write it on SSR.

IMPLEMENT (merge, don’t rewrite the whole store)
A. server.ts
   - LRU HTML cache for all public GET pages (exclude cart, checkout, account, wishlist, search, vendor-*).
   - Cache key: host|path|device (mobile vs desktop UA).
   - In-flight render coalescing per cache key.
   - Max 2 concurrent CommonEngine.render(); queue 12s then 503 Retry-After: 10 (never hang until nginx 504).
   - Render timeout 15s → 503; let the render finish to populate cache.
   - Pre-seed STORE_DETAILS + FOOTER_SEO_LINKS on EVERY page; LAYOUT_LIST only on home.
   - Cache sitemap.xml in process (1h) with 8s upstream timeout. Do not use the deprecated `request` library without timeout.

B. ssr-api-cache.interceptor.ts
   - Cache GET + read-only catalog POSTs (details, list_v4, available_filters, filter).
   - In-flight shareReplay coalescing.
   - Do not cache { status: false }.

C. ssr-http-timeout.interceptor.ts
   - Product POST timeouts 3000ms.

D. Components
   - Skip SSR Zone timers (browser-only setTimeout for loaders / setBodyMarginTop / localStorage).
   - Skip RANDOM_BLOG_LIST and recently-viewed on SSR.
   - Category: parallel filters + list_v4 when no query-string filters.
   - Keep product details, category grid, reviews, title/meta in SSR.

E. nginx (MERGE into live conf — do not replace)
   - Keep this store’s cache zone name, port, SSL, 301s.
   - location /: proxy_read_timeout 60s, proxy_cache_lock_timeout 30s, proxy_cache_lock_age 30s.
   - location = /sitemap.xml above location / (1h cache, 20s read timeout).
   - Cache key MUST include $ts_device_type.
   - nginx -t before reload.

CONSTRAINTS
- No new features. No markdown unless a playbook already exists to update.
- Verify with curl -sI for /, a category URL (twice), and /sitemap.xml. Expect 200, X-Cache-Status, no 504.
```

---

## 1. Exact issue (for management)

The sitemap lists thousands of unique `/product/…` and `/category/…` URLs. Googlebot requests many of them at once.

Only the **homepage** was HTML-cached in Node. Every other URL ran a full Angular `CommonEngine.render()`.

Each render also:

1. Waited on **Zone.js timers** that do nothing on the server (`setTimeout` 500–1100ms).
2. Re-called store APIs. **Product/category APIs are POSTs**, so they missed the GET-only SSR cache.
3. Ran **with no concurrency cap**. Node is one CPU for Angular render. Crawls queued until TTFB hit 10–18s.

Nginx on production then cut the request at **`proxy_read_timeout 15s`** and released the cache lock at **`proxy_cache_lock_timeout 2s`**. That is the 504.

| Layer | What failed | Result |
|---|---|---|
| Node SSR | Full render per unique sitemap URL, extra timers, uncached POSTs | 10–18s TTFB |
| Nginx | Read timeout 15s, lock timeout 2s | 504 to Googlebot / users |
| Sitemap | Proxied upstream with no cache/timeout | Sitemap itself can 504 |

---

## 2. Do not copy files blindly

Each store has different:

- Domain, SSL paths, Node port (`upstream`)
- Nginx cache **zone name** (`SSR` vs `tulsisilks_ssr`) — already defined in that server’s `nginx.conf`
- Store-specific 301 redirects
- `map` blocks that may already exist at `http {}` level

**Rule:** merge the *settings* below into the live `server {}` block. Do not replace the whole conf if `proxy_cache_path` / `map` already live in `nginx.conf`.

---

## 3. Node / Angular changes (required)

Apply these in the store’s Angular SSR repo. Do not change cart, checkout, account, or user-visible catalog behaviour. Below-fold blogs / recently-viewed still load after hydration.

### 3.1 `server.ts` — HTML cache for all public pages + concurrency

Homepage-only HTML cache is not enough. Sitemap URLs are unique; they never hit `/`.

Implement:

| Piece | Default | Purpose |
|---|---|---|
| In-process HTML cache | TTL 120s, max 400 entries (LRU) | Repeat crawls / users skip Angular |
| Cache key | `host + path + device (mobile/desktop)` | Avoid mobile HTML on desktop (hydration crash) |
| Do **not** cache | `/cart`, `/checkout`, `/account`, `/wishlist`, `/guest-login`, `/search`, `/vendor-*` | Personalized |
| In-flight coalescing | one render per cache key | Two Googlebots, same URL, one render |
| Concurrency cap | `SSR_MAX_CONCURRENT=2` | Stops event-loop melt |
| Queue wait | 12s | Then 503 + `Retry-After: 10` (better than 504) |
| Render timeout | 15s | Same: 503, let render finish to fill cache |
| Pre-seed APIs on **every** page | `STORE_DETAILS` + `FOOTER_SEO_LINKS` | Not only `/` |
| Pre-seed `LAYOUT_LIST` | homepage only | Home CMS layout |
| `/sitemap.xml` | 1h memory cache, 8s upstream timeout | Sitemap no longer 504s |

Env vars (optional):

```bash
SSR_HTML_CACHE_TTL_MS=120000
SSR_HTML_CACHE_MAX=400
SSR_MAX_CONCURRENT=2
SSR_QUEUE_WAIT_MS=12000
SSR_RENDER_TIMEOUT_MS=15000
SSR_API_CACHE_TTL_MS=60000
```

Logs to expect:

```
[SSR] cache HIT /product/… — 0 ms, … KB raw
[SSR] info /category/… — <800 ms, … KB raw
[SSR] queue timeout … — 503 (prevents 504)
```

### 3.2 `ssr-api-cache.interceptor.ts` — cache POSTs + coalesce in-flight

GET-only cache misses every product/category SSR.

- Cache **GET** as before (key = URL).
- Also cache **read-only catalog POSTs** (key = `METHOD:url:JSON.stringify(body)`):
  - `/store_details/product/details`
  - `/store_details/product/list_v4`
  - `/store_details/product/available_filters`
  - `/store_details/product/filter`
- Share in-flight Observables (`shareReplay`) so concurrent renders of the same URL share one HTTPS call.
- Do **not** cache `{ status: false }` (timeout fallback).
- Keep `seedSsrApiCache(url, body)` for Express pre-seed (GET URLs).

### 3.3 `ssr-http-timeout.interceptor.ts`

Cap catalog POSTs so one hung call cannot hold SSR:

```
/store_details/product/details             3000 ms
/store_details/product/list_v4             3000 ms
/store_details/product/available_filters   3000 ms
/store_details/product/filter              3000 ms
```

Store-config GETs can stay at 5000 ms.

### 3.4 Skip Zone.js timers on the server

Angular SSR waits until **all** Zone timers fire. Server callbacks that no-op still delay TTFB.

| Location | Change |
|---|---|
| `app.component.ts` `setBodyMarginTop()` | Return immediately if not browser. Do not `setTimeout(100–1100)` on SSR. |
| `app.component.ts` localStorage writes | `isPlatformBrowser` only (Node `localStorage` polyfill is **process-global**). |
| `product.component.ts` | `finishPageLoader()`: 500ms timeout in browser only; SSR sets `pageLoader = false` immediately. |
| `product.component.ts` `loadBlogAndProducts()` | Skip on server (`RANDOM_BLOG_LIST` is POST, not SEO-critical). |
| `product.component.ts` recently-viewed `localStorage` (`vps`) | Browser only. |
| `category.component.ts` `ngAfterViewInit` | Browser only. |
| `category.component.ts` | Same `finishPageLoader()` pattern. Parallel `AVAILABLE_FILTERS` + `list_v4` when URL has **no** query filters (typical sitemap URL). |
| `common.service.ts` | Read `customer_token` from `localStorage` only in the browser. |
| `blog-details.component.ts` | `requestAnimationFrame` / hash scroll only in the browser. |

Do **not** skip product details, category product grid, or reviews on SSR (SEO / JSON-LD).

### 3.5 Files typically touched (Tulsi Silks reference)

```
server.ts
src/app/interceptors/ssr-api-cache.interceptor.ts
src/app/interceptors/ssr-http-timeout.interceptor.ts
src/app/app.component.ts
src/app/services/common.service.ts
src/app/views/product/product.component.ts
src/app/views/category/category.component.ts
src/app/views/features/blogs/blog-details/blog-details.component.ts
```

---

## 4. Nginx changes (required, merge — do not overwrite)

Keep the store’s existing:

- `upstream` port
- SSL paths
- cache zone name already in `nginx.conf` (often `SSR`)
- store-specific `return 301` locations
- device + compression `map`s if they already exist at `http {}`

### 4.1 Dangerous production defaults (seen on Tulsi)

```nginx
proxy_connect_timeout 15s;
proxy_send_timeout 15s;
proxy_read_timeout 15s;          # 504 if SSR > 15s
proxy_cache_lock on;
proxy_cache_lock_timeout 2s;     # waiters stampede Node
```

### 4.2 Target for `location /`

Use **this store’s** cache zone name (`SSR` below is an example).

```nginx
location / {
    proxy_pass http://STORE_UPSTREAM;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 15s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    proxy_cache SSR;   # or this store’s keys_zone name
    proxy_cache_key "$scheme$request_method$host$uri$is_args$args$ts_device_type$ts_compress_bucket";
    proxy_cache_valid 200 1h;
    proxy_cache_valid 301 302 1h;

    proxy_cache_lock on;
    proxy_cache_lock_timeout 30s;
    proxy_cache_lock_age 30s;
    proxy_cache_background_update on;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;

    add_header X-Cache-Status $upstream_cache_status always;
}
```

Cache key **must** include `$ts_device_type`. Without it, mobile SSR HTML is served to desktop and Angular hydration throws (`hasAttribute is not a function` on the mega-menu).

### 4.3 Dedicated `/sitemap.xml`

Must be **above** `location /`.

```nginx
location = /sitemap.xml {
    proxy_pass http://STORE_UPSTREAM;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    proxy_connect_timeout 15s;
    proxy_send_timeout 20s;
    proxy_read_timeout 20s;

    proxy_cache SSR;
    proxy_cache_key "$scheme$request_method$host$uri";
    proxy_cache_valid 200 1h;
    proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
    proxy_cache_background_update on;
    proxy_cache_lock on;
    proxy_cache_lock_timeout 10s;

    add_header X-Cache-Status $upstream_cache_status always;
}
```

### 4.4 Optional: blogs shorter TTL

```nginx
location ~* ^/blogs/ {
    # same proxy headers as location /
    proxy_read_timeout 60s;
    proxy_cache SSR;
    proxy_cache_valid 200 5m;
    proxy_cache_lock on;
    proxy_cache_lock_timeout 30s;
    proxy_cache_lock_age 30s;
}
```

Place **exact** blog 301s (`location = /blogs/old-slug`) **above** this regex.

---

## 5. Deploy

```bash
# App
npm run build:ssr
pm2 restart <store-ssr-process>   # confirm name + port

# Nginx
nginx -t && nginx -s reload
```

If `nginx -t` fails with `duplicate map` or `duplicate proxy_cache_path`, those already live in `nginx.conf` — do not paste them into `conf.d` again.

---

## 6. Verify

```bash
# Homepage (warm)
curl -sI https://STORE_DOMAIN/ | grep -iE 'HTTP/|x-cache|x-ssr'

# Catalog URL from sitemap (first = MISS, second = HIT)
curl -sI https://STORE_DOMAIN/category/SOME-SLUG | grep -iE 'HTTP/|x-cache|x-ssr'
curl -sI https://STORE_DOMAIN/category/SOME-SLUG | grep -iE 'HTTP/|x-cache|x-ssr'

# Sitemap
curl -sI https://STORE_DOMAIN/sitemap.xml | grep -iE 'HTTP/|x-cache'

# Should be 200, not 504. Cold catalog TTFB target < 2s after Node deploy.
```

Node logs: first catalog URL `MISS` with time; second `cache HIT`. Under crawl load, 503 with Retry-After is acceptable; 504 is not.

Search Console 504s clear on Google’s **next crawl**, not instantly.

---

## 7. What not to break

- Mega-menu: keep device-aware cache keys.
- Do not SSR-cache cart / checkout / account / search.
- Do not write `localStorage` on the server (shared polyfill leaks across requests).
- Do not skip product/category JSON-LD or H1 in SSR HTML.
- Do not raise nginx timeouts instead of fixing Node — timeouts hide the stall; crawlers still get 10–18s pages.
