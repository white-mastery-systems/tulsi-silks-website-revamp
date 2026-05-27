# PageSpeed / PSI — client-ready summary (paste & fill)

## What was going wrong (technical root cause)

Measured on `https://tulsisilks.co.in/` with a mobile user agent:

- **Time to first byte (TTFB) ~10–12 s** and **full HTML response ~30+ s** are far beyond what PageSpeed Insights/Lighthouse tolerates reliably.
- The **HTML payload was ~1.2 MB uncompressed** because the same store API data was being **embedded twice** into the document:
  1. Angular’s **HTTP transfer cache** (verbatim `details_v3` JSON, etc.)
  2. Your custom **`SSR_STATE_KEY` snapshot** (`store_details`, `menu_list`, …) which already contains the same catalogue data as `store_details.section_list`.

That much HTML forces the browser to **download, decompress, and parse** a near‑megabyte document **before** executing your ~700 KB JS bundle. PSI often shows **errors or unstable scores** under those conditions (timeouts, flaky runs, collapsing Speed Index and inflating TBT from parse work alone).

## What we changed (this repo)

1. **Stop duplicating `details_v3` / `footer_seo_links` in the HTTP transfer cache** when the same data is already represented in `SSR_STATE_KEY` (`app.module.ts`).
2. **Stop serialising `catalog_list` twice**: it is reconstructed on the client from `store_details.section_list` (`app.component.ts`, `common.service.ts`).
3. **Nginx** (`tulsisilks.conf`): removed `Connection: upgrade` on every HTML request (incorrect for normal page loads), and **raised proxy read/send timeouts to 120 s** so occasional slow SSR does not cut the connection before PSI finishes.

## What you should report as “after deploy” numbers

Run **three** times and use the **median** (PSI varies ±10):

```bash
curl -sS -o /dev/null -w "TTFB=%{time_starttransfer}s total=%{time_total}s bytes=%{size_download} code=%{http_code}\n" \
  -H "User-Agent: Mozilla/5.0 (Linux; Android 10)" \
  --compressed "https://tulsisilks.co.in/"
```

Expect **HTML bytes to drop sharply** (often 50–75% vs the previous ~1.2 MB class) and **TTFB/SI to improve once nginx SSR cache is warm**. First request after deploy may still be slow until the cache refills.

## Deploy checklist (do not skip)

1. Rebuild Docker image / run `npm run build:ssr`.
2. Deploy `dist/ecommerce` + reload Node/PM2.
3. **`sudo rm -rf /var/cache/nginx/tulsisilks/*`** then **`sudo nginx -t && sudo systemctl reload nginx`** so old gigantic HTML responses are not served from disk.
4. Re-run PSI **3×** on the production URL; attach screenshots of **Performance score**, **LCP**, **TBT**, **SI**, and **TTFB**.

## Honest caveat for the client

If the PSI **Performance** score target is extremely high (**90+ mobile**), additional work is still required on **`main.*.js` size** (~700 KB+) and upstream API latency—that is separate from removing the **`~1 MB HTML self‑DOS`**.
