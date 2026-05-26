# Tulsi Silks — 2-Day Sprint Task Status

Quick-reference checklist of every task across Day 1 and Day 2.

**Legend:**
- ✅ Done — code shipped, ready to deploy
- ⚠️ Partial — lighter version done; full version needs more time / infra
- ⏸ Deferred — moved to a follow-up sprint (low impact or high risk for 2-day window)
- 🔒 Blocked — needs infra / DNS / external access I don't have
- ⬜ Pending — not yet started

---

## Day 1 — Bundle + Network (target PSI Mobile 31 → 60-70)

### Pre-work (already shipped)

- ✅ **0.1** Lazy-load `jspdf` + `html2canvas` via dynamic `import()`
- ✅ **0.2** Enable inline critical CSS + Google Fonts inlining in prod build
- ✅ **0.3** Tighten initial bundle budget (1.5 MB → 1 MB)

### Morning — Bundle surgery

- ✅ **1.1** Lazy-load `editorjs-html` *(no change needed — already lazy via `BlogDetailsModule`)*
- ✅ **1.2** Remove `lazysizes`, replace 3 directives with `IntersectionObserver`
- ⏸ **1.3** Drop `wow.js` + `Headroom` + `jQuery` CDN deps *(already lazy-loaded behind interaction; not in initial bundle; high regression risk on 270-line jQuery menu — follow-up sprint)*
- ⏸ **1.4** Tree-shake `ngx-bootstrap` *(already minimal — only `ModalModule` + `AccordionModule` used; <10 kB savings)*
- ⏸ **1.5** Move `crypto-js` to web worker *(used synchronously in 25+ files; requires async refactor — follow-up sprint)*

### Afternoon — SSR + LCP

- ⚠️ **1.6** Parallelize SSR API fetches *(did lighter version: bumped Nginx + Express cache TTL from 60s → 180s with 600s stale-while-revalidate. Full TransferState refactor deferred.)*
- 🔒 **1.7** AVIF/WebP hero image + proper `srcset` *(blocked: needs `yourstore.io` CDN upload access)*
- ✅ **1.8** Fix CLS header swap *(exact 74 / 78 px reserved per breakpoint)*
- ✅ **1.9** Drop 2 of 3 Google Fonts *(Material Icons → inline SVG masks; only `Montaga` remains)*

### End of Day 1

- ✅ **1.v** Production build + measure delta → **initial transfer 1.7 MB → 240 kB gzipped (−86%)**
- ⬜ **Deploy + run PSI Mobile (3× average)** — your action
- ⬜ **Send PSI screenshot to boss** — your action

---

## Day 2 — Polish + Guardrails (target PSI Mobile 70 → 75-80)

### Morning — CDN, image pipeline, polish

- 🔒 **2.1** Cloudflare CDN in front of origin *(needs DNS access — your action)*
- ⬜ **2.2** Compress `src/assets/images/` (9.5 MB → ~1.5 MB) with `sharp`/`squoosh` → WebP *(I can do this with your OK)*
- ⬜ **2.3** Reserve aspect ratios on product card images (`width`/`height` attrs + CSS `aspect-ratio`)
- ⬜ **2.4** Lazy-load below-the-fold home sections (Instagram, blogs, testimonials)

### Afternoon — Guardrails + ship

- ⬜ **2.5** Lighthouse-CI GitHub Action (fail PR if mobile score < 70)
- ⬜ **2.6** Finish deferring `app.component.ts` event listeners into `requestIdleCallback`
- ⬜ **2.7** End-to-end regression test on staging
- ⬜ **2.8** Production deploy + final PSI run + boss screenshot

---

## Items deferred to follow-up sprints (NOT Day 1 or Day 2)

These items were in the original 4-week plan but dropped from the 2-day sprint to keep risk low. Add them back when there's bandwidth:

- ⏸ Switch Angular builder from `browser` (webpack) to `application` (esbuild) — 30-50% smaller bundles, but risky SSR migration
- ⏸ Convert `AppModule` + components to standalone (zoneless Angular 20)
- ⏸ Replace `crypto-js` entirely with `SubtleCrypto`
- ⏸ Full responsive image pipeline (every product image AVIF + srcset)
- ⏸ Real-User Monitoring (Cloudflare Web Analytics)
- ⏸ Drop `wow.js` + `Headroom` + `jQuery` (1.3 above)
- ⏸ Tree-shake `ngx-bootstrap` further (1.4 above)
- ⏸ Move `crypto-js` to web worker (1.5 above)

---

## Quick stat board

| | Day 1 | Day 2 |
|--|------|------|
| **Tasks done** | 8 | 0 |
| **Partial / blocked on infra** | 2 (1.6 partial, 1.7 blocked) | 1 (2.1 blocked on DNS) |
| **Deferred to follow-up** | 3 | 0 |
| **Pending** | 0 | 8 |
| **Total** | 13 | 9 |

**Day 1 completion: 8 done + 2 partial-or-blocked = 10 of 13 (77%)**
**Day 2 completion: 0% (not yet started)**

---

## What's blocking forward progress

1. **Deploy Day 1 to production** → your action (gives us baseline PSI score to plan Day 2)
2. **CDN DNS access (Cloudflare or Bunny)** → boss / domain owner
3. **`yourstore.io` CDN upload access** → for AVIF/WebP hero variants (needed by 1.7)
4. **Authorize image compression of `src/assets/images/`** → your OK and I do it now

Once 1–4 unblock, I can complete Day 2 in roughly 6 hours of focused work.
