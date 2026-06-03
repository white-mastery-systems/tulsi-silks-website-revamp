# Sections module — image loading

This document describes how category/collection card images are resolved and displayed on the **Sections** feature pages.

**Related code**

| File | Role |
|------|------|
| `src/app/views/features/sections/sections.component.ts` | API calls, image enrichment, navigation |
| `src/app/views/features/sections/sections.component.html` | Card markup and lazy-loaded `<img>` |
| `src/app/views/features/sections/sections.component.scss` | Overlay card design |
| `src/app/services/store-api.service.ts` | `CATALOGS_WITH_SUB_CATALOGS`, `SUB_CATALOG_DETAILS`, `RANDOM_PRODUCT_LIST` |

**Routes**

| URL | Purpose |
|-----|---------|
| `/sections/:page_url` | Sub-catalogs for a collection (e.g. `/sections/regional-collections`) |

There is **no** index page at `/sections`; that path redirects to `/404`.

---

## Why images are resolved in the app

The catalog APIs do **not** return an `image` field today.

**`catalogs_with_sub_catalogs`** returns items like:

```json
{
  "_id": "6a1fcb54ab2cc922badb857f",
  "name": "Regional Collections",
  "page_url": "regional-collections",
  "seo_details": { ... }
}
```

**`sub_catalog_details`** returns sub items like:

```json
{
  "_id": "5fd44eef10aa53701db5840e",
  "name": "Uppada Silk",
  "page_url": "uppada-silk",
  "url": "https://tulsisilks.co.in/category/uppada-silk"
}
```

Because of that, the component loads the list first, then runs **`enrichDisplayImages()`** to attach an image path to each card before the `<img>` is rendered.

---

## End-to-end flow

```
Page load (/sections/:page_url)
    │
    └─ Validate page_url against catalogs_with_sub_catalogs
          └─ GET sub_catalog_details → displayList = sub_catalogs
                │
                ▼
        enrichDisplayImages()  (for each card)
                │
                ├─ 1. catalog_list image (store bootstrap)
                ├─ 2. item.image (if API adds it later)
                └─ 3. random product from sub-catalog category _id
                │
                ▼
        itemImage(item) → full URL (img_baseurl + path)
                │
                ▼
        <img appImgLazyLoad [ImagelazyLoad]="...">  (lazy load in viewport)
```

---

## Step 1 — List data loads

Example: `/sections/regional-collections`

1. Loads `catalogs_with_sub_catalogs` once if not cached (to validate `page_url`).
2. Finds the catalog in `catalog_with_sub_list` by `page_url`.
3. Calls `SUB_CATALOG_DETAILS(catalog._id)` (cached in `commonService.catalog_sub_details_cache`).
4. Sets `displayList = data.sub_catalogs`.
5. Calls `enrichDisplayImages()`.

While the main spinner (`pageLoader`) is active, only the loading UI shows. After the API returns, cards appear with **title + grey placeholder**; images pop in when enrichment completes.

---

## Step 2 — Image enrichment

`enrichDisplayImages()` runs one job per card via `forkJoin`. Each job is `enrichItemImage(item)`.

### Priority 1 — `commonService.catalog_list`

At app bootstrap, `catalog_list` is built from `store_details.section_list`. If a category has an `image` and matches the card by `_id` or `seo_details.page_url`, that path is used:

```typescript
lookupCatalogListImage(item) {
  const cat = catalog_list.find(c =>
    c._id === item._id || c.seo_details?.page_url === item.page_url
  );
  return cat?.image || null;
}
```

Example path shape: `uploads/5d30013a5c83a702392c4c8b/category/1749491887244-965064.webp`

Many categories (including Uppada Silk) have no image in `section_list`, so this step is often skipped.

### Priority 2 — `item.image` from API

If the backend later adds `image` on catalog or sub-catalog objects, it is used as-is (no extra fetch).

### Product thumbnail fallback

Each sub-catalog `_id` is a **category id**. The app calls:

```http
POST https://yourstore.io/api/store_details/product/random_list?store_id={store_id}
Content-Type: application/json

{ "category_id": "<sub_catalog._id>", "limit": 1 }
```

The first product’s `image_list[0].image` becomes the card image (a representative product photo for that category).

---

## Step 3 — Full image URL

`itemImage(item)` builds the string passed to the template:

```typescript
itemImage(item) {
  const path = item.image || lookupCatalogListImage(item);
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return environment.img_baseurl + path;
}
```

Default base URL: `https://yourstore.io/api/`

Final example:

`https://yourstore.io/api/uploads/5d30013a5c83a702392c4c8b/product/....webp`

---

## Step 4 — Template and lazy loading

```html
<img *ngIf="itemImage(x)"
     appImgLazyLoad
     [ImagelazyLoad]="itemImage(x)"
     [alt]="x.name">
```

| Behavior | Detail |
|----------|--------|
| `*ngIf="itemImage(x)"` | `<img>` only renders after a path exists |
| `appImgLazyLoad` | Defers loading until the card is near the viewport (same directive as category/product pages) |
| Placeholder | Grey card background + gradient + title until the image arrives |

---

## Caching

| Cache | Location | Purpose |
|-------|----------|---------|
| `categoryImageCache` | `SectionsComponent` | Avoids duplicate `random_list` calls for the same category id in one session |
| `catalog_with_sub_list` | `CommonService` | Top-level catalog list from first API |
| `catalog_sub_details_cache` | `CommonService` | Sub-catalog details keyed by catalog `_id` |

---

## Worked example: `/sections/regional-collections`

1. Route param `page_url` = `regional-collections`.
2. Match catalog `_id` = `6a1fcb54ab2cc922badb857f`.
3. `SUB_CATALOG_DETAILS` returns sub-catalog **Uppada Silk** (`_id`: `5fd44eef10aa53701db5840e`) — no image in response.
4. `lookupCatalogListImage` — no image on Uppada in `catalog_list`.
5. `RANDOM_PRODUCT_LIST({ category_id: "5fd44eef10aa53701db5840e", limit: 1 })` — returns one saree.
6. `item.image` = product image path under `uploads/.../product/...`.
7. Card renders with lazy-loaded product photo and overlay title **Uppada Silk**.

---

## Current limitations

- Card images are usually **random product thumbnails**, not dedicated category banner art (unless `catalog_list` has a category `image`).
- If `random_list` returns no products, the card stays **title-only on grey** (no `<img>`).
- SSR transfer state trims `catalog_list` to navigation fields only (no `image`), so the catalog_list fallback is less reliable on the client after hydration; product fallback is the main source in practice.

---

## Future: API-provided images

If the backend adds `image` to `catalogs_with_sub_catalogs` or `sub_catalog_details.sub_catalogs[]`, no template change is required. Enrichment will pick it up at priority 2 (`if (item.image) return of(item)`), and `itemImage()` will prefix it with `img_baseurl` when needed.

Recommended API shape:

```json
{
  "_id": "5fd44eef10aa53701db5840e",
  "name": "Uppada Silk",
  "page_url": "uppada-silk",
  "image": "uploads/5d30013a5c83a702392c4c8b/category/....webp",
  "url": "https://tulsisilks.co.in/category/uppada-silk"
}
```

---

*Last updated: June 2026 — Sections dynamic catalog feature.*
