# Kanjivaram Domination Plan — Integration Guide (Frontend, Backend, Server)

**Source plan:** `tulsi-kanjivaram-domination-plan.md`  
**Hub:** https://tulsisilks.co.in/category/kanjivaram-silk-sarees  
**Repo:** `tulsi-silks-website-revamp` (Angular SSR storefront)

**Page-by-page checklist (CSV):** [kanjivaram-page-checklist.csv](./kanjivaram-page-checklist.csv) · [Markdown summary](./kanjivaram-page-checklist.md)

This document maps the SEO domination plan to **Frontend**, **Backend (Yourstore API + admin)**, and **Server (`server.ts`)** work.

---

## How the stack splits today

| Layer | Where it lives | What it owns for this plan |
|--------|----------------|----------------------------|
| **Backend** | `yourstore.io` API + store admin (not in this repo) | Categories, product tags, SEO fields, blog HTML, **sitemap XML**, `list_v4` + **`catalog_page_segments`** (H2 blocks, chips, visible FAQ) |
| **Frontend** | Angular app (`category.component`, `catalog-segments`, product cards) | Renders CMS data, **SSR title/H1/meta**, filter/pagination robots rules, **FAQ JSON-LD**, prices via `discounted_price` + currency |
| **Server** | `server.ts` (SSR host) | **301 redirects**, proxies **`/sitemap.xml`**, caching, `/og-image`, etc. |

Category copy and hub blocks are **not** hardcoded in Angular for Kanjivaram—they come from **API + admin segments**. Content fills admin; dev ensures **view-source / SSR** shows it.

---

## Phase 0 — Enablers (do before bulk content)

These unblock sections **C, D, E** (“developer notes” in the source plan).

| # | Work | Frontend | Backend / admin | Server |
|---|------|----------|-----------------|--------|
| **0.1** | Title, H1, meta editable per category | Reads `category_details.seo_details` + `setSiteMetaData()` — confirm SSR on first paint | **Admin fields** for `page_title`, `h1_tag`, `meta_desc` on every category (plan item 5) | SSR SEO initializer patches head; verify meta in view-source |
| **0.2** | Intro above grid | `category-atf-hero` uses `category_details.description` | Store long intro HTML in category **description** (hub E1, spokes D*) | — |
| **0.3** | Hub/spoke **link chips + H2 + visible FAQ + guide row** | `app-catalog-segments` supports `internal_links`, `faq`, `icon_card_grid`, etc. | Configure **`catalog_page_segments`** on hub (E2, E3, E4 L1–L3) via admin/CMS | — |
| **0.4** | Visible FAQ **=** FAQPage JSON-LD | Today: **`category_details.faqs` → JSON-LD only** (not in template). Visible FAQ = segment type **`faq`** | Either duplicate FAQ in **segment `faq_list`**, **or** frontend change to render `category_details.faqs` in accordion and keep one source | — |
| **0.5** | Real prices on cards (not ₹0) | Displays `temp_discounted_price` from API | Fix **product pricing** / visibility in catalog API (plan blocks price claims in copy until fixed) | — |
| **0.6** | Pagination vs SEO blocks | Pagination exists; plan wants **H2/FAQ below grid**, pagination above footer content | Segment **rank** in admin (below product list) | `categoryRobotsContent()` already **noindex** for page > 1, sort, filters |

**Recommendation:** Treat **0.4** as an explicit frontend task (single FAQ source + visible UI + JSON-LD sync) so E3 acceptance passes.

---

## Section A — Redirects and merges

| Item | Action | Frontend | Backend | Server |
|------|--------|----------|---------|--------|
| **A1–A4** | 301 to canonical URLs | Remove **hardcoded** links to old slugs; **A4 engagement** → fix **occasion module** card link in **CMS** (`icon_card_grid` CTA) | Remove old URLs from **sitemap** | Routes exist in `server.ts` but default is **302** → use **`res.redirect(301, ...)`** |
| **A5–A6** | Wedding → bridal, Traditional → classic | Update nav/modules if they still point at wedding/traditional | **Merchandising:** retag products; strategist sign-off | Add **301** routes after approval |
| **Acceptance** | `curl -sI` → 301, sitemap clean, no internal links to sources | Link audit in CMS + templates | Sitemap regenerate / exclude | Implement + verify redirects |

### A redirect table (from source plan)

| # | Source (302 today) | 301 to | Notes |
|---|-------------------|--------|--------|
| A1 | `/category/kanjivaram-saree` | `/category/kanjivaram-silk-sarees` | Matches top query “kanjivaram saree” |
| A2 | `/category/view-all-kanjivaram` | `/category/kanjivaram-silk-sarees` | Duplicate hub |
| A3 | `/category/bridal-kanjivaram` | `/category/bridal-kanjivaram-silk-sarees` | Duplicate bridal URL |
| A4 | `/category/engagement-sarees` | `/category/engagement-kanjivaram-silk-sarees` | Fix hub occasion module link to target directly |
| A5 | `wedding-kanjivaram-silk-sarees` | `bridal-kanjivaram-silk-sarees` | **Strategist sign-off** + retag 29 products |
| A6 | `traditional-kanjivaram-silk-sarees` | `kanjivaram-classic-silk-sarees` | **Strategist sign-off** + retag 77 products |

---

## Section B — Zero-product / thin categories (noindex)

| Item | Action | Frontend | Backend | Server |
|------|--------|----------|---------|--------|
| **B1–B28 + 4 mood pages** | `noindex, follow` + drop from sitemap | Extend **`categoryRobotsContent()`** (or API flag) when **`total < 4`** (auto rule by 20 Dec) or manual noindex list | **Sitemap API** must **omit** those category URLs; optional `robots_noindex` on category | — |
| **Restock (B1, B2, D2)** | — | — | **Merchandising:** tag products (≥8 for restock rule) | — |
| **B3 merge** | 301 → Kanchi cotton page | — | New category + products (D2/G3) after sign-off | 301 when target exists |
| **Blank-count pages** | Manual count check | Apply noindex if 0 | mustard, pastel, silver, khaki, fancy, handwoven, linen, silk-cotton (Kanjivaram) | — |

**Also noindex (products exist, low search value):** trending-colour, vibrant-colour, neutral-colour, dark-neutral-colour Kanjivaram pages — keep `follow`, may stay in nav.

**Rule by 20 Dec:** any Kanjivaram category under **4** products → automatic noindex; remove noindex when **≥ 8** products.

---

## Section C — Five “default title” categories

Content enters copy in admin; dev confirms SSR.

| URL slug | New title (summary) |
|----------|---------------------|
| `brocade-kanjivaram-silk-sarees` | Brocade Kanjivaram Silk Sarees \| Tulsi Silks |
| `burgundy-kanjivaram-silk-sarees` | Burgundy Kanjivaram Silk Sarees \| Tulsi Silks |
| `black-raw-silk-sarees` | Black Raw Silk Sarees \| Tulsi Silks |
| `chanderi-silk` | Chanderi Silk Sarees \| Tulsi Silks |
| `daily-sarees` | Everyday Sarees for Work and Home \| Tulsi Silks |

| Layer | Work |
|-------|------|
| **Frontend** | SSR shows new title/H1/meta when `seo_details` populated |
| **Backend** | Enter SEO + description in admin |
| **Server** | — |

If brocade/burgundy show 0 products when checked → noindex per section B; keep copy for when stock returns.

---

## Section D — Fifteen stocked sub-pages

| Item | Frontend | Backend | Server |
|------|----------|---------|--------|
| **D1–D14** | Intro in **description**; optional **segments** for extra H2 | SEO + intro text; hub link in intro (Content) | — |
| **D2, D15** | Same | **Restock / stock-origin decision** (strategist) | D15 option 2 → **new category** `kanchi-cotton-sarees` |
| **A5/A6 fallback** | — | Retitle wedding/traditional in admin if merges rejected | — |

**Spoke → hub anchors (section F):** Content only in category **description** HTML. One hub link per spoke intro; anchor text limits per source plan.

---

## Section E — Hub page

**URL:** `/category/kanjivaram-silk-sarees`

| Block | Frontend | Backend / admin |
|-------|----------|-----------------|
| **Title/meta** | SSR from `seo_details` | Per developer notes |
| **E1 intro (~192 words)** | `category-atf-hero` + `description` | Category description field |
| **E2 H2 sections (7)** | `catalog-segments` below product grid | One segment per H2, ranked after grid |
| **E3 FAQ (8 Q&As)** | Visible **`faq`** segment + JSON-LD sync (**0.4**) | FAQ content in CMS |
| **E4 L1 chips** | `internal_links` or custom segment | 8 chip anchors/targets (section E4 table in source plan) |
| **L2 colour links** | Inside H2 segment or `internal_links` | Green, blue, pink, purple, yellow, korvai |
| **L3 guides row** | `internal_links` | 4 existing blog URLs |
| **A4** | Occasion card `routerLink` from segment | Engagement → `engagement-kanjivaram-silk-sarees` |

**Acceptance:** FAQ visible in raw HTML; FAQPage JSON-LD matches word-for-word; Rich Results Test passes.

---

## Section F — Spoke to hub anchors

| Anchor (examples) | Used on spokes |
|-------------------|----------------|
| our full Kanjivaram silk saree collection | D1, D7, D12, D15 |
| every Kanchipuram silk saree we stock | D2, D6, D10 |
| the wider Kanjeevaram edit | D3, D8 |
| all Kanchi silk sarees | D4, D9 |

All link to: `https://tulsisilks.co.in/category/kanjivaram-silk-sarees`

**D intros linking to other spokes:** D5 → D1; D11 → D1; D13 → D5; D14 → vs blog.

| Layer | Work |
|-------|------|
| **Content** | Write intros with correct anchors |
| **Frontend** | Renders HTML description |
| **Backend** | Store in category description |

---

## Section G — Blog link placements (12 existing posts)

| Layer | Work |
|-------|------|
| **Backend / admin** | Edit blog body HTML (anchors, fix typos e.g. Knajivaram) |
| **Frontend** | Blog renderer outputs CMS HTML |
| **Server** | — |

No slug changes. Verify each target returns 200.

---

## Section H — Five new guides

| Guide | Slug (under `/blogs/`) | Publish (plan) | Depends on |
|-------|------------------------|----------------|------------|
| G1 | `kanjivaram-kanchipuram-kanjeevaram-names-explained` | 7 Dec | — |
| G2 | `what-decides-kanjivaram-saree-price` | 4 Jan 2027 | Live card prices |
| G3 | `kanchi-cotton-sarees-guide` | 11 Jan 2027 | D15 live |
| G4 | `kanchipuram-pattu-borders-and-motifs` | 14 Dec | D2 restocked |
| G5 | `choosing-a-kanjivaram-colour` | 18 Jan 2027 | — |

| Layer | Work |
|-------|------|
| **Content** | Write + publish |
| **Backend** | Posts in CMS, sitemap |
| **Frontend** | Add to hub L3 when live |

---

## Execution timeline (from source plan section I)

| # | Dates | Action | Owner | Dependency |
|---|-------|--------|-------|------------|
| 1 | 26 Oct – 30 Oct | A1–A4: 301s, sitemap removal, occasion link | Dev | None |
| 2 | 26 Oct – 6 Nov | B noindex (25+4 pages); check 8 blank-count URLs | Dev | None |
| 3 | 26 Oct – 6 Nov | Dev notes 1–4: pagination, prices, visible FAQ, title/meta | Dev | Admin fields |
| 4 | 2 Nov – 6 Nov | Title, H1, meta, intro, link blocks editable + SSR | Dev | Row 3 |
| 5 | 9 Nov – 13 Nov | Hub E1–E4 live | Content | Row 4 |
| 6 | 9 Nov – 20 Nov | C + D1, D3–D14 copy | Content | Row 4 |
| 7 | 9 Nov – 20 Nov | G blog links | Content | None |
| 8 | 16 Nov – 20 Nov | Sign-off A5, A6, B3, D15 | Strategist | None |
| 9 | 16 Nov – 22 Nov | B1, B2, D2 restock; D15 stock check | Merchandising | None |
| 10 | 23 Nov – 4 Dec | A5/A6 301 if approved; D2/D15 copy; noindex B1/B2 if not restocked | Dev + Content | 8, 9 |
| 11 | 7 Dec – 18 Dec | Publish G1, G4 | Content | Row 10 for G4 |
| 12 | 14 Dec – 20 Dec | Auto noindex if &lt; 4 products | Dev | None |
| 13 | 4 Jan – 22 Jan 2027 | Publish G2, G3, G5 | Content | Prices / D15 |
| 14 | 25 Jan 2027 | Cannibalisation review | Strategist | All |

---

## Already in repo vs still to do

### Mostly done (verify / small fix)

- Redirect **targets** for A1–A4 in `server.ts` (fix **301** status).
- Category SSR SEO, intro hero, below-fold **segments**, pagination noindex rules.
- Sitemap served from API via `server.ts` (exclusions are **backend**).

### Still to build or configure

| Area | Gap |
|------|-----|
| **Server** | `301` on Kanjivaram redirects; A5/A6 after sign-off; sitemap cache invalidation after bulk URL changes |
| **Frontend** | Thin-category **noindex**; FAQ **visible + JSON-LD** single source; segment order (pagination vs H2) |
| **Backend** | Admin SEO + segments; **sitemap** omit noindex/redirects; **pricing** on list API; product tagging; **blog** edits |

---

## Roles summary

| Role | Responsibility |
|------|----------------|
| **Strategist** | A5, A6, B3, D15 option 1 vs 2 |
| **Merchandising** | Restock, merge tagging, blank-count checks |
| **Content** | C, D, E copy, G blog links, H new guides |
| **Backend dev** | Admin fields, sitemap, catalog/blog APIs, categories |
| **Frontend dev (this repo)** | SSR/robots/FAQ sync/segment rendering, link audits |
| **Server / DevOps** | `server.ts` redirects, deploy SSR, `curl -sI` + view-source |

---

## Practical checklist

### Backend + admin

1. Category SEO fields + long description + `catalog_page_segments` for hub.
2. Sitemap excludes noindex and redirect sources.
3. Fix product prices in catalog responses.
4. Product tags for merges/restock; new category if D15 option 2.
5. Blog HTML updates (section G).

### Frontend (this repo)

1. Remove stale internal links (CMS + templates).
2. `noindex` for thin/empty categories (+ auto &lt; 4 rule).
3. Render FAQ in HTML and match FAQPage JSON-LD.
4. Confirm SSR outputs title/H1/meta/intro/links for acceptance URLs.

**Key files:**

- `src/app/views/category/category.component.ts` / `.html`
- `src/app/views/category/category-api.helpers.ts` (`categoryRobotsContent`)
- `src/app/views/category/catalog-segments/`
- `src/app/services/common.service.ts` (`setSiteMetaData`)
- `src/app/server-seo.initializer.ts`

### Server (`server.ts`)

1. Change Kanjivaram redirects to **301** (~lines 641–673).
2. Add A5/A6 when approved.
3. Smoke-test `/sitemap.xml` after backend exclusions.

---

## Claims and constraints (from source plan)

- **Confirmed in copy:** since 1993; founders; Mylapore address.
- **Do not claim:** Silk Mark.
- **Do not use:** rupee prices in new guides until product cards show real prices (not ₹0).

---

*Generated for Tulsi Silks website revamp integration planning.*
