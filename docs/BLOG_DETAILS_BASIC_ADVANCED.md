# Blog details page — Basic, Editor.js, and Legacy Advanced

Reference for **YS-Tulsi-Silks** (`/blogs/:blog_id`). Use this doc (and **§12**) to port the same blog-details behaviour to another Yourstore Angular client.

---

## 1) Routing and API

| Item | Value |
|------|--------|
| List route | `/blogs` → `BlogsComponent` |
| Detail route | `/blogs/:blog_id` → lazy `BlogDetailsModule` |
| `blog_id` param | SEO slug (`seo_details.page_url`) **or** Mongo `_id` |
| Detail API | `GET {ws_url}/store_details/blogs/v1?store_id={store_id}&id={blog_id}` |
| List API | `GET {ws_url}/store_details/blogs/v1?store_id={store_id}&skip={n}&limit={n}` |

**Service:** `StoreApiService.BLOG_DETAILS(id)` → `src/app/services/store-api.service.ts`

**Response envelope:**

```json
{
  "status": true,
  "data": { /* blog object — see §2 */ }
}
```

On `status: false`, the app navigates away (home). On success, `result.data` is assigned to `blog_details`.

---

## 2) How the client chooses a renderer

Two CMS fields drive behaviour:

| Field | Values | Meaning |
|-------|--------|---------|
| `type` | `"basic"` \| `"advanced"` | Page **layout family** |
| `editor_type` | `"basic"` \| `"advanced"` \| `"editorjs"` | **Body** format for basic-layout posts |

### Decision logic (`BlogDetailsComponent`)

```typescript
get useEditorJsRenderer(): boolean {
  const et = String(this.blog_details?.editor_type ?? '').toLowerCase();
  if (et !== 'advanced' && et !== 'editorjs') return false;
  const blocks = this.blog_details?.content?.blocks;
  return Array.isArray(blocks) && blocks.length > 0;
}
```

### Template branches (`blog-details.component.html`)

| Condition | What renders |
|-----------|----------------|
| `type === 'basic'` **OR** `editor_type === 'basic'` **OR** `useEditorJsRenderer` | Article column (tags + body) |
| `useEditorJsRenderer === true` | `<app-blog-renderer [blocks]="blog_details.content.blocks">` |
| Same wrap, `!useEditorJsRenderer` | Quill shell: `<div class="ql-editor" [innerHTML]="descriptionHtml">` |
| `type === 'advanced'` **and** `segments?.length` | Legacy **segment** blocks (full-width sections below article column) |

**Important:** Editor.js posts are usually `type: "basic"` with `editor_type: "advanced"` (or `"editorjs"`). They do **not** use `segments[]`.

**Legacy advanced** uses `type: "advanced"` + `segments[]` (flexible HTML, highlighted product, featured product carousel, etc.). That path is unchanged and separate from Editor.js.

---

## 3) API payload shapes (check these in Network tab)

### 3a) Basic + Quill HTML (`editor_type: "basic"` or omitted)

```json
{
  "_id": "64abc...",
  "name": "How to choose a saree",
  "type": "basic",
  "editor_type": "basic",
  "description": "<p>Rich HTML from Quill/CMS...</p>",
  "image": "uploads/{store_id}/blogs/cover.webp",
  "img_alt": "Cover alt",
  "author": "Tulsi Silks",
  "created_on": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-02-01T12:00:00.000Z",
  "tags": ["sarees", "guide"],
  "seo_status": true,
  "seo_details": {
    "page_title": "How to choose a saree | Tulsi Silks",
    "meta_desc": "...",
    "page_url": "how-to-choose-a-saree",
    "h1_tag": "How to choose a saree"
  },
  "faqs": [
    { "ques": "Question?", "answer": "Answer." }
  ],
  "faq_title": "FAQs"
}
```

- `description` must be a **string** (HTML). If API sends `{ html: "..." }`, `normalizeBlogApiFields()` flattens it.
- Body: sanitized with `DomSanitizer.bypassSecurityTrustHtml` → `descriptionHtml`.

### 3b) Basic layout + Editor.js (`editor_type: "advanced"` or `"editorjs"`)

```json
{
  "_id": "64def...",
  "name": "Summer saree guide",
  "type": "basic",
  "editor_type": "advanced",
  "description": "",
  "content": {
    "time": 1710000000000,
    "version": "2.28.0",
    "blocks": [
      {
        "id": "blk1",
        "type": "header",
        "data": { "text": "Introduction", "level": 2, "anchor": "introduction" }
      },
      {
        "id": "blk2",
        "type": "paragraph",
        "data": { "text": "Body copy..." }
      },
      {
        "id": "blk3",
        "type": "tableOfContents",
        "data": {
          "label": "Table of contents",
          "items": [
            { "number": "01", "text": "Introduction", "anchor": "#introduction" }
          ]
        }
      }
    ]
  },
  "image": "uploads/.../hero.webp",
  "seo_status": true,
  "seo_details": { "page_url": "summer-saree-guide", "page_title": "..." }
}
```

- `content` may arrive as a **JSON string**; `normalizeBlogContentField()` parses it to `{ blocks }`.
- Renderer runs only when `content.blocks` is a non-empty array.
- `description` is ignored for body when `useEditorJsRenderer` is true.

### 3c) Legacy advanced (`type: "advanced"`)

```json
{
  "_id": "64ghi...",
  "name": "Legacy editorial",
  "type": "advanced",
  "editor_type": "basic",
  "segments": [
    {
      "type": "flexible",
      "rank": 1,
      "content": "<p>HTML block</p>"
    },
    {
      "type": "highlighted_product",
      "rank": 2,
      "heading": "Featured",
      "product_details": { /* full product */ }
    },
    {
      "type": "featured_product",
      "rank": 3,
      "heading": "More picks",
      "blogs_type": "slider",
      "product_list": [ /* products */ ]
    }
  ]
}
```

Segment types handled in template: `flexible`, `highlighted_product`, `featured_product` (with `appBlogSwiper` for sliders).

### 3d) Optional hero / author fields (all modes)

| Field | Purpose |
|-------|---------|
| `readTime` / `reading_minutes` | Meta line after author |
| `hero_cta_label` + `hero_cta_url` | Pill CTA under title (`heroCtaLabel` getters) |
| `author_profile` | `{ name, role, bio, avatar, link }` |
| `authorAvatar`, `authorRole`, `authorBio`, `authorLink` | Flat aliases |
| `coverImage`, `featuredImage`, `banner_image`, … | Hero image fallbacks via `blogCoverMediaRaw()` |

---

## 4) End-to-end flow

```
GET /blogs/:blog_id
        │
        ▼
BLOG_DETAILS(id) → blog_details
        │
        ├─ normalizeBlogApiFields()     (image aliases, description string)
        ├─ normalizeBlogContentField()  (parse content JSON string)
        ├─ updateMetaData()             (SEO, schema, descriptionHtml)
        └─ loadRelatedBlogs()           (browser only)
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ type === 'advanced' && segments.length?                   │
│   → render legacy segment sections (parallel to basic wrap) │
└───────────────────────────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────────────────────────┐
│ type==='basic' OR editor_type==='basic' OR useEditorJs?   │
│   YES → article wrap                                        │
│     useEditorJs? → app-blog-renderer                      │
│     else         → ql-editor + descriptionHtml            │
└───────────────────────────────────────────────────────────┘
```

---

## 5) Editor.js pipeline

### 5.1 `BlogRendererComponent`

**Files:** `blog-details/blog-renderer/*`

1. Lazy-imports `editorjs-html` (not in initial bundle).
2. Splits `blocks` into segments:
   - Consecutive non-`productCarousel` blocks → HTML chunk via `editorjs-html` + custom parsers.
   - Each `productCarousel` with `data.products[]` → `<app-blog-product-carousel>`.
3. Sanitizes HTML with `bypassSecurityTrustHtml`.
4. Unknown block types: replaced with hidden `unsupported` placeholder (parser does not crash).

### 5.2 Custom parsers

**File:** `blog-details/editorjs-custom-parsers.ts`  
**Factory:** `createEditorJsCustomParsers(imgBaseUrl)`

| Block `type` | Output |
|--------------|--------|
| `header` | `<h1–h6 id="...">` — ids from `data.anchor` or slugified `data.text` |
| `image` | `<figure class="ej-figure">` — `data.file.url` / `data.url` + `imgBaseUrl` |
| `table` | `.ej-table-card` wrapper |
| `list` | `<ul>` / `<ol>` |
| `tableOfContents` | `<details id="ej-toc" class="ej-toc ej-toc--accordion">` |
| `button` | `.ej-btn-wrap` + themed link |
| `productCta` | `.ej-product-cta` + `a.ej-product-cta-btn` + `data-product-id` |
| `ctaBlock` | `.ej-cta-block` + primary/secondary buttons |
| `unsupported` | Hidden fallback for unknown types |

Standard blocks (`paragraph`, `quote`, `delimiter`, `embed`, `code`, `warning`, `checklist`, …) use **editorjs-html** defaults.

### 5.3 Section wrapping (TOC scroll targets)

**File:** `blog-details/editorjs-section-wrap.ts`  
`wrapEditorJsArticleSections(html)` wraps each `h2` / `h3` (with id) in `<section class="ej-section">` so in-page anchors scroll whole sections.

### 5.4 `productCarousel` (Angular component, not HTML)

**Files:** `blog-details/blog-product-carousel/*`

```json
{
  "type": "productCarousel",
  "data": {
    "title": "From the collection",
    "subtitle": "Suggested drapes",
    "productLimit": 8,
    "products": [
      {
        "title": "White Linen Saree",
        "price": 5670,
        "originalPrice": 6990,
        "image": "uploads/.../product.webp",
        "link": "/product/white-linen-saree",
        "brand": "Tulsi Silks"
      }
    ]
  }
}
```

- Products are **embedded in the block** (no category fetch in carousel).
- Swiper loaded via `DynamicAssetLoaderService.load('swiper-js')`.
- Uses `CurrencyConversionService` + Angular `currency` pipe.

---

## 6) Interactive behaviour in `BlogDetailsComponent`

### 6.1 `productCta` quick add to cart

- Parser emits `a.ej-product-cta-btn` with `data-product-id` and/or `href="/product/..."`.
- **Capture** listener on `document` (browser only) intercepts click → `PRODUCT_DETAILS` → `cartService.addToCart`.
- File: `blog-details.component.ts` → `onEjProductCtaClick`.

### 6.2 In-page hash links (TOC, headings)

Two mechanisms:

1. **Capture listener** on `a[href^="#"]` inside host → `scrollToArticleFragment` (smooth, 96px header offset).
2. **`@HostListener('document:click')`** for router fragment sync (`navigate` with `fragment`, then scroll after navigation).

Deep link: `/blogs/my-slug#section-id` → `scheduleScrollToUrlFragment()` after content paints.

### 6.3 Floating scroll button

- Single button (`lucide` `arrow-up`), shown after 520px scroll.
- Click: if below TOC (`#ej-toc`) → scroll to TOC; else → scroll to top.

---

## 7) Module and dependencies

### `BlogDetailsModule`

**File:** `blog-details/blog-details.module.ts`

**Declares:** `BlogDetailsComponent`, `BlogRendererComponent`, `BlogProductCarouselComponent`, `BlogSwiperDirective`

**Imports:** `SharedModule`, `SharedBlogUiModule`, `AccordionModule`, `LucideAngularModule.pick({ ChevronLeft, ChevronRight, ArrowUp, ArrowLeft })`

### npm

```json
"editorjs-html": "^4.0.5"
```

### Assets / global styles

- Swiper: `DynamicAssetLoaderService` key `swiper-js`; CSS via project styles (e.g. `assets/css/swiper.css`).
- Blog tokens: `src/app/views/features/blogs/blogs.tokens.scss` (imported from component SCSS).
- Quill shell styles: `.ql-container` / `.ql-editor` in `blog-details.component.scss`.

---

## 8) Files to copy for another project

```
src/app/views/features/blogs/blog-details/
├── blog-details.component.ts|html|scss
├── blog-details.module.ts
├── blog-details-routing.module.ts
├── editorjs-custom-parsers.ts
├── editorjs-section-wrap.ts
├── blog-renderer/
│   ├── blog-renderer.component.ts|html|scss
├── blog-product-carousel/
│   ├── blog-product-carousel.component.ts|html|scss
│   ├── blog-product-carousel.models.ts
└── directives/
    └── blog-swiper.directive.ts          # only if legacy advanced segments used

src/app/views/features/blogs/shared/
└── shared-blog-ui.module.ts              # blog card for related posts

src/app/views/features/blogs/blogs.tokens.scss   # optional design tokens
```

Wire routing:

```typescript
// blogs-routing.module.ts
{ path: ':blog_id', loadChildren: () => import('./blog-details/blog-details.module').then(m => m.BlogDetailsModule) }
```

---

## 9) Integration checklist

- [ ] `BLOG_DETAILS(id)` API returns `data` with fields in §3.
- [ ] Route `/blogs/:blog_id` passes param to `BLOG_DETAILS`.
- [ ] `environment.img_baseurl` prefixes upload paths (`uploads/...`).
- [ ] `editorjs-html` installed; renderer lazy-imports it.
- [ ] `useEditorJsRenderer` getter matches §2 (`editor_type` + `content.blocks`).
- [ ] `normalizeBlogContentField()` if API sends `content` as string.
- [ ] `BlogDetailsModule` declares renderer + carousel + Lucide icons.
- [ ] Swiper asset loader works for `productCarousel` and legacy `featured_product` segments.
- [ ] Optional: cart service wired for `productCta` clicks.
- [ ] Optional: hash scroll + scroll-to-top button (§6).

---

## 10) Editor.js block JSON quick reference

### `ctaBlock`

```json
{
  "type": "ctaBlock",
  "data": {
    "text": "Take the next step—explore drapes that match this guide.",
    "primaryButton": { "label": "Explore Collection", "link": "/sections/regional-collections" },
    "secondaryButton": { "label": "Shop all", "link": "/all-products" }
  }
}
```

### `productCta`

```json
{
  "type": "productCta",
  "data": {
    "sectionLabel": "Featured product",
    "sectionSubtext": "Add to cart from this article",
    "productName": "Banarasi Silk Saree",
    "productBrand": "Tulsi Silks",
    "productImage": "uploads/.../product.webp",
    "originalPrice": "₹12,000",
    "salePrice": "₹9,500",
    "ctaLabel": "Add to cart",
    "ctaUrl": "/product/banarasi-silk-saree",
    "productId": "507f1f77bcf86cd799439011"
  }
}
```

### `tableOfContents`

```json
{
  "type": "tableOfContents",
  "data": {
    "label": "Table of contents",
    "items": [
      { "number": "01", "text": "Introduction", "anchor": "#introduction" }
    ]
  }
}
```

Anchor ids must match `header` block ids (`data.anchor` or auto-slug from title).

---

## 11) Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Blank article body | `editor_type` not `advanced`/`editorjs`, or `content.blocks` empty |
| Quill HTML shows instead of Editor.js | `editor_type` is `basic` or blocks missing |
| Legacy segments not showing | `type` must be `advanced` and `segments.length > 0` |
| `[object Object]` in body | `description` is object; ensure `normalizeBlogApiFields()` |
| TOC link jumps wrong / loses path | Use capture scroll handlers (§6.2), not native hash only |
| Carousel empty | Block type must be `productCarousel` with non-empty `data.products` |
| Parser crash on new block | Add parser in `editorjs-custom-parsers.ts` or rely on `unsupported` fallback |

---

## 12) Copy-paste prompt — integrate blog details in another Angular (Yourstore) project

Use this prompt in the target repo (adjust store name/paths):

---

**Prompt:**

Implement a Yourstore blog details page matching the Tulsi Silks pattern.

**Routing**
- `/blogs` list, `/blogs/:blog_id` detail (lazy module).
- `blog_id` = `seo_details.page_url` or `_id`.

**API**
- `GET {api}/store_details/blogs/v1?store_id={storeId}&id={blog_id}` → `{ status, data }`.

**Render decision (implement exactly)**
1. If `editor_type` is `advanced` or `editorjs` (case-insensitive) **and** `content.blocks` is a non-empty array → render **Editor.js** via a `BlogRendererComponent`.
2. Else if `type === 'basic'` (or `editor_type === 'basic'`) → render `description` as HTML inside a Quill-style `.ql-editor` shell (sanitized).
3. If `type === 'advanced'` and `segments[]` has items → render **legacy segment** templates (`flexible`, `highlighted_product`, `featured_product`) in addition.

**Normalisation on load**
- Parse `content` if it is a JSON string.
- Coerce `description` to string; if `{ html: "..." }`, use `html`.
- Map hero image from `image`, `coverImage`, `featuredImage`, etc.

**Editor.js renderer**
- Lazy-load `editorjs-html`.
- Pass custom parsers from `createEditorJsCustomParsers(imgBaseUrl)` supporting: `header`, `image`, `table`, `list`, `tableOfContents`, `button`, `productCta`, `ctaBlock`, `unsupported`.
- After parse, run `wrapEditorJsArticleSections(html)` for TOC section anchors.
- Split `productCarousel` blocks out and render `BlogProductCarouselComponent` (Swiper); other blocks → HTML `[innerHTML]`.
- Safe-list unknown block types to `unsupported` so one bad block does not blank the page.

**Interactivity**
- Document capture click on `a.ej-product-cta-btn` → fetch product by `data-product-id` or URL segment → add to cart.
- Smooth scroll for `a[href^="#"]` inside article with fixed header offset (~96px).
- Support `/blogs/slug#fragment` on load.
- Optional floating button: below TOC → scroll to `#ej-toc`, else scroll to top.

**SEO**
- `setSiteMetaData(seo_details, hero image)` when `seo_status`.
- JSON-LD `BlogPosting` + FAQ schema if `faqs[]` present.

**Module**
- Declare: `BlogDetailsComponent`, `BlogRendererComponent`, `BlogProductCarouselComponent`.
- Import: `LucideAngularModule` (ChevronLeft, ChevronRight, ArrowUp, ArrowLeft), shared blog card module.

**Dependencies:** `editorjs-html`, Swiper (dynamic load), existing `StoreApiService`, `CommonService`, cart API for product CTA.

Port reference implementation from Tulsi Silks paths listed in §8.

---

*Last updated: June 2026 — YS-Tulsi-Silks `blog-details` module.*
