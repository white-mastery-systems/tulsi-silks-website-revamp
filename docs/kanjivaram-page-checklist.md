# Kanjivaram page checklist — where to create sections

**CSV (filter in Excel):** [kanjivaram-page-checklist.csv](./kanjivaram-page-checklist.csv)

**Legend**

| Column | Meaning |
|--------|---------|
| **New_CMS_Segments = Y** | Add or edit `catalog_page_segments` on that category in admin (`list_v4`) |
| **SEO_Title_H1_Meta = Y** | Fill `seo_details` (title, H1, meta) in category admin |
| **Intro_Description = Y** | Fill category **description** (intro HTML above/below grid) |

---

## The only page that needs **new CMS sections**

### `/category/kanjivaram-silk-sarees` (hub)

| Segment to create | Type | CMS hint | Plan ref |
|-------------------|------|----------|----------|
| L1 chip row under intro | `internal_links` | `theme: above_grid`, **one** `group_list` with 8 `link_list` items | E4 L1 |
| Seven H2 articles below grid | existing types (`content_checklist_split`, `feature_list`, etc.) | One segment per H2, ranked after products | E2 |
| Colour link row | `internal_links` | `layout: chips` inside H2 #3 content **or** grouped chips | E4 L2 |
| Guide row | `internal_links` | `layout: chips`, 4 blog links | E4 L3 |
| FAQ | `faq` **or** category **`faqs`** in API | 8 questions; must match visible accordion + JSON-LD | E3 |
| Hub intro + title | — | **description** + **seo_details** (not a segment) | E1 |

**Do not** copy the full multi-group “Explore Our Weaves & Fabrics” accordion onto the hub unless you want that footer twice. That block stays on whichever category already has it (same `internal_links` shape, **no** `theme` / `layout` → accordion).

---

## Pages that need **SEO + intro only** (no new segments)

### Section C (5 URLs)

- `/category/brocade-kanjivaram-silk-sarees`
- `/category/burgundy-kanjivaram-silk-sarees`
- `/category/black-raw-silk-sarees`
- `/category/chanderi-silk`
- `/category/daily-sarees`

### Section D (15 spokes)

- `/category/bridal-kanjivaram-silk-sarees`
- `/category/kanjivaram-pattu-silk-sarees` *(restock first)*
- `/category/kanjivaram-pure-silk-sarees`
- `/category/kanjivaram-classic-silk-sarees`
- `/category/muhurtham-pattu-sarees`
- `/category/checked-kanjivaram-silk-sarees`
- `/category/kanjivaram-tissue-silk-sarees`
- `/category/korvai-kanjivaram-silk-sarees`
- `/category/green-kanjivaram-silk-sarees`
- `/category/blue-kanjivaram-silk-sarees`
- `/category/pink-kanjivaram-silk-sarees`
- `/category/purple-kanjivaram-silk-sarees`
- `/category/yellow-kanjivaram-silk-sarees`
- `/category/soft-silk`
- `/category/silk-cotton` *(strategist: option 1 vs new `kanchi-cotton-sarees`)*

**Work:** title, H1, meta, intro in admin — **one hub link** in intro (anchors in plan section F).

---

## Pages that need **no new sections** (tech / catalog only)

| Group | Action | Owner |
|-------|--------|-------|
| **A1–A4** redirect sources | 301 + sitemap + fix links | Dev |
| **A5–A6** | 301 after sign-off + retag products | Strategist, Merch, Dev |
| **B4–B28 + 4 mood URLs** | noindex + sitemap remove | Dev *(frontend list already)* |
| **B1–B3** | restock / merge / noindex | Merchandising |
| **12 blogs (G)** | edit post body links | Content |
| **5 new guides (H)** | new blog posts | Content |

---

## Priority order

1. **Week 1:** Redirects (A), noindex URLs (B), hub **SEO fields** started  
2. **Week 2–3:** Hub **segments** (table above) + hub intro  
3. **Week 3:** Spokes **C + D** copy (no segments)  
4. **Week 3–4:** Blogs (G), restock (B1/B2/D2), merges if approved (A5/A6)  

---

## `internal_links` quick reference (your existing JSON)

| Admin sets | Storefront |
|------------|------------|
| Nothing extra (your “Explore Our Weaves” JSON) | Accordion by group |
| `theme: above_grid` | Chip row **under intro** |
| `layout: chips` (or `section_grid_type: chips`) | Chip row **below grid** |

Same `group_list` + `link_list` structure for all three.
