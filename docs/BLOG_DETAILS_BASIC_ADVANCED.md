## Blog details (Basic vs Advanced) — Yourstore Angular client

This doc explains how the **blog details page** renders content for:
- **basic** blogs (Quill HTML or EditorJS blocks via renderer)
- **advanced** blogs (legacy `segments[]` blocks) and the newer **EditorJS “advanced”** pipeline

It also documents the custom EditorJS blocks we added and how to port the same setup to another Yourstore client project (ex: **Tulsi Madras**).

---

## 1) Blog types in API payload

### Basic blog
Typical fields:
- `type: "basic"`
- `description`: HTML (Quill / CMS HTML)
- Optional: `editor_type: "advanced"` + `content.blocks` (EditorJS JSON)

### Advanced blog (legacy)
Typical fields:
- `type: "advanced"`
- `segments: []` (server-driven blocks used by the old template)

### EditorJS “advanced” (new)
We treat this as **basic page layout** + **EditorJS blocks**:
- `editor_type: "advanced"` (or `editor_type: "editorjs"`)
- `content.blocks: EditorJSBlock[]`

The `BlogDetailsComponent` decides whether to render `content.blocks` through `app-blog-renderer` (EditorJS renderer).

---

## 2) Where the rendering happens

### Page container
File:
- `src/app/views/features/blogs/blog-details/blog-details.component.html`

Key behavior:
- If `useEditorJsRenderer` is true, it renders:
  - `<app-blog-renderer [blocks]="blog_details.content.blocks" [imgBaseUrl]="imgBaseUrl">`
- Otherwise it falls back to Quill HTML (`description`) for basic blogs.
- Legacy advanced `segments[]` rendering still exists for older “advanced” blog type.

### EditorJS renderer
Files:
- `src/app/views/features/blogs/blog-details/blog-renderer/blog-renderer.component.ts`
- `src/app/views/features/blogs/blog-details/blog-renderer/blog-renderer.component.html`
- `src/app/views/features/blogs/blog-details/blog-renderer/blog-renderer.component.scss`

What it does:
- Uses `editorjs-html` to convert EditorJS blocks → HTML
- Uses `createEditorJsCustomParsers(imgBaseUrl)` to support custom blocks
- Uses `wrapEditorJsArticleSections(...)` to wrap heading sections and keep anchor scrolling clean
- Splits out **interactive blocks** (currently `productCarousel`) and renders them as Angular components instead of raw HTML.

---

## 3) Custom EditorJS parsing (block → HTML)

File:
- `src/app/views/features/blogs/blog-details/editorjs-custom-parsers.ts`

Supported blocks (custom):
- **`tableOfContents`**
  - Renders a `<details class="ej-toc ej-toc--accordion" ...>`
  - Has a stable id: `id="ej-toc"` (used by “scroll to TOC”)
- **`ctaBlock`**
  - Renders a beige CTA band with text + two links styled like theme buttons
  - JSON shape:
    - `data.text`
    - `data.primaryButton: { label, link }`
    - `data.secondaryButton: { label, link }`
- **`productCta`** (already present before, still supported)
  - Renders a product CTA row with `a.ej-product-cta-btn` and `data-product-id`
  - `BlogDetailsComponent` intercepts clicks and runs quick-add-to-cart behavior.

Also supported (standard-ish overrides):
- `header` (adds stable ids for TOC anchors)
- `image`, `table`, `list`, `button`

---

## 4) Product carousel (EditorJS interactive block)

Block:
- `type: "productCarousel"`
- `data` example:
  - `title`, `subtitle`
  - `products[]`: `{ title, price, image, link }`
  - optional `productLimit`

Implementation:
- Renderer detects `productCarousel` blocks and inserts:
  - `<app-blog-product-carousel ...>`

Files:
- `src/app/views/features/blogs/blog-details/blog-product-carousel/blog-product-carousel.component.ts`
- `src/app/views/features/blogs/blog-details/blog-product-carousel/blog-product-carousel.component.html`
- `src/app/views/features/blogs/blog-details/blog-product-carousel/blog-product-carousel.component.scss`
- `src/app/views/features/blogs/blog-details/blog-product-carousel/blog-product-carousel.models.ts`

Notes:
- Uses `DynamicAssetLoaderService.load('swiper-js')` to ensure Swiper JS exists.
- Navigation uses `ViewChild` button elements (prev/next) passed directly to Swiper `navigation`.
- Uses `CurrencyConversionService` and Angular `currency` pipe for display.
- Wishlist icon was removed (no heart overlay).

---

## 5) Smooth anchor scrolling (TOC + headings)

Problem we solved:
- EditorJS content is injected HTML; default hash navigation can jump instantly and may break the URL path.

Implementation:
- In `BlogDetailsComponent`, we capture clicks on:
  - `a[href^="#"]` within the blog details host
- We update the URL fragment **without losing `/blogs/:slug`**, then smooth-scroll with header offset.

File:
- `src/app/views/features/blogs/blog-details/blog-details.component.ts`

Helper:
- `scrollToArticleFragment(id, el, behavior)` offsets by fixed header reserve (96px).

---

## 6) “Scroll tool” button (single button: TOC or TOP)

Requirement:
- Only one floating button (icon arrow up), but still keep TOC jump.

Behavior:
- If user is below the TOC position → click jumps to TOC.
- Otherwise → click scrolls to top.

Files:
- `src/app/views/features/blogs/blog-details/blog-details.component.ts`
- `src/app/views/features/blogs/blog-details/blog-details.component.html`
- `src/app/views/features/blogs/blog-details/blog-details.component.scss`

Icon:
- `lucide-angular` `ArrowUp` is picked in the blog module.

---

## 7) Angular module wiring

Blog details module:
- `src/app/views/features/blogs/blog-details/blog-details.module.ts`

Must declare / import:
- `BlogRendererComponent`
- `BlogProductCarouselComponent`
- `SharedBlogUiModule` (exports common blog UI)
- `LucideAngularModule.pick({ ChevronLeft, ChevronRight, ArrowUp })`

---

## 8) Global styles / build warnings you may hit

### CSS nesting error (“Expected ':' … img {”)
Cause:
- A `.css` file contained SCSS-style nesting.

Fix applied in this repo:
- `src/assets/css/quill-core.css`
  - changed nested `.ql-editor { img { ... } }` to `.ql-editor img { ... }`

### Autoprefixer warnings (start/end)
Use:
- `flex-start` / `flex-end`
Instead of:
- `start` / `end`

### Angular style budgets
If your blog SCSS exceeds the default `anyComponentStyle` budget, adjust in:
- `angular.json` → `budgets`
  - `anyComponentStyle`
  - `initial` (optional, if your bundle warnings fail CI)

---

## 9) Porting checklist (Tulsi Madras or any Yourstore client)

Copy these folders/files:

### EditorJS rendering
- `src/app/views/features/blogs/blog-details/editorjs-custom-parsers.ts`
- `src/app/views/features/blogs/blog-details/editorjs-section-wrap.ts`
- `src/app/views/features/blogs/blog-details/blog-renderer/` (all files)

### Product carousel block
- `src/app/views/features/blogs/blog-details/blog-product-carousel/` (all files)

### Blog details integration
- Update your `blog-details.component.html` to render:
  - `<app-blog-renderer [blocks]="blog_details.content.blocks" [imgBaseUrl]="imgBaseUrl">`
- Update `blog-details.component.ts` to include:
  - smooth hash-link scroll capture
  - single scroll tool (TOC/TOP)
  - (optional) productCta click interception if you use `productCta` blocks
- Update `blog-details.component.scss` with the premium spacing + scroll tool styles (or merge into your theme)

### Module
- Ensure `BlogDetailsModule` declares:
  - `BlogRendererComponent`
  - `BlogProductCarouselComponent`
- Ensure it imports:
  - `SharedBlogUiModule`
  - `LucideAngularModule.pick({ ChevronLeft, ChevronRight, ArrowUp })`

### Dependencies / assets
- Ensure `editorjs-html` is installed.
- Ensure Swiper JS asset is loadable via `DynamicAssetLoaderService`:
  - `CssStore` should include `swiper-js` (already in this repo)
- Ensure `src/styles.scss` imports Swiper CSS:
  - `@import "assets/css/swiper.css";`

### API requirements
- Blog details endpoint must return:
  - `content.blocks` (EditorJS JSON) when `editor_type: "advanced"`
- Product carousel block is expected to include `products[]` in the block data (no API fetch by category yet).

---

## 10) EditorJS block JSON examples

### `ctaBlock`
```json
{
  "type": "ctaBlock",
  "data": {
    "text": "Take the next step—explore drapes that match this guide.",
    "primaryButton": { "label": "Explore Collection", "link": "/collection" },
    "secondaryButton": { "label": "Jump to Shop", "link": "/shop" }
  }
}
```

### `productCarousel`
```json
{
  "type": "productCarousel",
  "data": {
    "title": "From the cotton collection",
    "subtitle": "Suggested drapes that pair with this guide",
    "productLimit": 8,
    "products": [
      { "title": "…", "price": 12050, "image": "uploads/...webp", "link": "/product/..." }
    ]
  }
}
```

