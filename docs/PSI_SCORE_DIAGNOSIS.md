# Why the mobile PSI score may barely move after “Phase 1” JS cleanup

Google PageSpeed’s **overall mobile score** is mostly driven by lab **Performance** metrics. Small code cleanups often **don’t register** unless they hit what PSI actually measures.

## What PSI measures on `/` (homepage)

| If this is red in PSI… | Typical cause in this codebase |
|------------------------|-------------------------------|
| **LCP** slow | SSR paint path, competing requests (fonts, JS), hero `src`/preload mismatch vs live HTML, or cold **TTFB** through nginx/origin |
| **TBT** large | Parsing + compiling **~700 KB+ main JS** plus Angular + vendor bundles after SSR |
| **CLS** high | Header/body margins, sliders, images missing dimensions |

Work that removes **CDN scripts loaded only after scroll or idle** (e.g. old WOW/Headroom) usually **does not** improve homepage LCP/TBT enough to lift the headline score—you were already past the worst part.

## Always read the PSI **Opportunities** and **Diagnostics** tabs

Without this, optimisation is guessing. Paste or screenshot specifically:

1. Largest Contentful Paint element (selector + phase breakdown: **TTFB**, **Load delay**, **Load duration**, **Render delay**)  
2. **Total Blocking Time** and “Reduce unused JavaScript” / “JavaScript execution time” rows  
3. **Server response time** (often **cold SSR** vs **warm nginx disk cache**)  

Cold runs can show **multiple seconds TTFB**; warm repeats look much better—take **median of 3** runs ([checklist](./PERFORMANCE_CHECKLIST.md)).

## Deployment vs local

`serve:ssr` and **production** (`npm run build:ssr` behind nginx SSL + Brotli + `proxy_cache`) behave very differently for **TTFB** and caching. PSI should hit the **real production URL**.

## Highest leverage next steps (conceptual)

1. **Shrink executable JS on the homepage path** (dynamic `import()` for anything not needed for first screen; treemap-guided).  
2. **Speed up HTML** — edge cache / warm SSR, parallel upstream API hints for SSR (Phase 2), smaller JSON.  
3. **Keep the LCP image “clean”** — one URL for preload + static fallback + SSR `<picture>`, small bytes (mobile WebP ≤ ~100 KB is good), minimise competing priority (fonts/third-party).

This repo also applies incremental **critical-path** tweaks in `src/index.html` (documented inline there).
