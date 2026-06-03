# Tulsi Silks — Complete SEO, GEO & AI Visibility Audit
**Website:** https://tulsisilks.co.in/  
**Audit Date:** 2026-06-03  
**Auditor:** Senior Technical SEO, GEO & Web Performance Architect  
**Framework:** Angular 17 + Angular Universal SSR (Yourstore 1.9.57 platform)

---

## Executive Summary

Tulsi Silks has a **partially functioning SSR implementation** but is critically undermined by a structural flaw: all structured data (JSON-LD), meta tags, canonical URLs, and Open Graph tags are populated **exclusively via client-side JavaScript** — they are absent from the initial server-rendered HTML response. This single failure makes the site largely invisible to AI crawlers (GPT-Bot, ClaudeBot, Googlebot-Extended, PerplexityBot), which either do not execute JavaScript or only partially render it. The site has excellent content depth, a 30-year brand story, and capable engineering — but GEO readiness is at approximately **2.5/10** in its current state.

---

## Phase 1: Crawlability Analysis

### 1.1 Rendering Architecture Assessment

The application uses **Angular Universal (server-side rendering)** via `AppServerModule`. On paper, this should deliver full HTML to crawlers. In practice, critical SEO elements are blocked behind client-side guards:

**Critical Finding — `applyHomePageJsonLd()` is browser-only:**
```typescript
// src/app/services/common.service.ts:656
applyHomePageJsonLd(): void {
  if (!isPlatformBrowser(this.platformId)) return; // ← JSON-LD NEVER runs on SSR
  this.removeElement('home-jsonld');
  this.createJsonLD('home-jsonld', buildHomePageJsonLd(...));
}
```

**Critical Finding — `index.html` has empty meta tags:**
```html
<!-- src/index.html — all SEO fields are empty strings in initial HTML -->
<meta name="robots" content="index">  <!-- Missing "follow" -->
<meta name="description" content="">
<meta property="og:title" content="">
<meta property="og:description" content="">
<meta property="og:image" content="">
<link rel="canonical" href="" id="ccLink">
```

**Critical Finding — Blog publisher logo is localStorage-dependent:**
```typescript
// src/app/views/features/blogs/blog-details/blog-details.component.ts:338
"logo": {
  "url": environment.img_baseurl + 'uploads/' + this.commonService.store_id + 
         '/logo.png?v=' + localStorage.getItem('random_num') // ← localStorage = SSR crash
}
```

### 1.2 Page-by-Page Crawlability Table

| Page | HTML Available | JS Rendered | AI Crawl Risk | Priority |
|------|----------------|-------------|---------------|----------|
| Homepage `/` | Partial — layout structure only | Title, meta desc, OG, canonical, JSON-LD, product names | **CRITICAL** — All schema and meta tags JS-only | P0 |
| Category `/category/[slug]` | Partial — shell only | Product listings, breadcrumbs, all schema, prices | **CRITICAL** — Products invisible without JS | P0 |
| Product `/product/[slug]` | Partial — shell only | Product name, price, description, all schema | **CRITICAL** — Core commerce data JS-only | P0 |
| About Us `/about-us` | Partial — brand story text | Founder names, full bio | **HIGH** — Key entity content JS-dependent | P1 |
| Blog List `/blogs` | SSR — titles visible | Author credits, dates | MEDIUM — titles available | P2 |
| Blog Detail `/blogs/[slug]` | Partial — heading visible | Article body, schema, canonical | **HIGH** — Content JS-rendered | P1 |
| Contact Us `/contact-us` | Partial — form shell | Business hours, map embed | MEDIUM — partial data available | P2 |
| 404 Page `/kanjivaram-silk-sarees` | Yes — 404 content | N/A | **HIGH** — Navigation URLs in menu do not match route pattern | P1 |
| Sitemap `/sitemap.xml` | Yes — full XML | N/A | LOW — present but misconfigured | P2 |
| Robots.txt | Yes | N/A | LOW — permissive, acceptable | P3 |

### 1.3 Content Loading Classification

**Available in SSR HTML (raw response):**
- Page title (from `<title>` tag — but often generic fallback)
- Navigation menu structure
- Footer text ("Weavers of heritage since 1993")
- Blog post titles and dates (blog list page)
- About Us brand story text (partial)

**Loaded via API calls (JS-only):**
- All product names, prices, SKUs, images
- All meta descriptions and canonical URLs
- All JSON-LD structured data
- OG/Twitter Card tags
- Category page product listings (entire grid)
- Individual product details

**Injected through JavaScript bundles:**
- JSON-LD for every page type (home, product, category, blog, breadcrumb)
- Dynamic canonical tags
- `robots` meta tag content beyond "index"

**Hidden from non-JS crawlers:**
- 100% of structured data
- Product inventory (names, prices, availability)
- All SEO meta tags (description, OG, canonical)
- Author bios and credentials
- Review/rating data

### 1.4 URL Structure Issues

Menu navigation links reference `/kanjivaram-silk-sarees` but the actual route is `/category/kanjivaram-silk-sarees`. All category deep-links in menus that drop the `/category/` prefix return **404 errors**. This is a sitemap/navigation consistency problem.

---

## Phase 2: GEO (Generative Engine Optimization) Audit

### 2.1 GEO Scoring Criteria

For each section, scoring is based on:
- LLM extractability (can an AI parse and cite the content?)
- Entity recognition (are named entities properly defined?)
- Knowledge graph readiness (structured data completeness)
- Citation readiness (quotable, sourced, authoritative content)
- Semantic content structure (headings, lists, definitions)
- E-E-A-T signals (expertise, experience, authoritativeness, trust)

### 2.2 GEO Scorecard

| Section | LLM Extract | Entity Ready | Schema | Citation Ready | E-E-A-T | Score |
|---------|------------|--------------|--------|----------------|---------|-------|
| **Homepage** | 4/10 | 3/10 | 3/10 | 3/10 | 4/10 | **3.4/10** |
| **About Us** | 5/10 | 4/10 | 1/10 | 4/10 | 5/10 | **3.8/10** |
| **Brand Story/Founders** | 4/10 | 3/10 | 2/10 | 3/10 | 3/10 | **3.0/10** |
| **Product Pages** | 5/10 | 6/10 | 7/10 | 4/10 | 4/10 | **5.2/10** |
| **Category Pages** | 4/10 | 5/10 | 6/10 | 3/10 | 3/10 | **4.2/10** |
| **Blog Content** | 6/10 | 5/10 | 5/10 | 6/10 | 5/10 | **5.4/10** |
| **Contact/Local** | 7/10 | 7/10 | 5/10 | 6/10 | 6/10 | **6.2/10** |
| **Store Heritage** | 5/10 | 4/10 | 2/10 | 4/10 | 4/10 | **3.8/10** |

**Overall GEO Score: 4.4/10**

### 2.3 Detailed GEO Findings

**Homepage (3.4/10)**
- The H1 "Premium Sarees in Chennai, Crafted for Every Occasion" is a fallback string in TypeScript — not visible in raw HTML until JS runs
- Brand statement "Weavers of heritage since 1993" is in footer HTML — SSR-available, suitable for AI citation
- No Speakable schema to mark AI-readable content zones
- No FAQPage schema on homepage despite having clear Q&A opportunities
- Organization and Store schemas exist but are browser-only injected
- `foundingDate: '1993'` and `founders: [Suresh Parekh, Santosh Parekh]` are in schema code but never reach SSR HTML

**About Us (3.8/10)**
- Contains: "Founded in 1993 by Suresh and Santosh Parekh"
- Brand pillars are visible: Handwoven Indian Heritage, Classic Meets Contemporary, Cherished Through Generations
- **Missing:** Detailed biographies, professional credentials, photos with alt text
- **Missing:** Person entity schema for founders
- **Missing:** foundingDate, founders, knowsAbout properties in any visible schema
- Author "Suresh Parekh" appears in blog posts but has no dedicated profile page
- Founder bio in About Us: "vision centers on textile expertise and quality commitment" — too generic for AI citation

**Product Pages (5.2/10)**
- Best-scored section due to explicit `createJsonLD()` Product schema
- Schema includes: name, sku, brand, offers (price/currency/availability), AggregateRating, Review
- Product schema includes `shippingDetails` and `hasMerchantReturnPolicy` (excellent)
- **Problem:** All schema is injected client-side after API call — AI crawlers see empty `<app-root>`
- `additionalProperty` includes fabric measurements (saree/dupatta/blouse) — good for LLMs
- Color property extracted from tag list — good entity signal
- Blog publisher logo uses `localStorage` — crashes SSR schema generation

**Category Pages (4.2/10)**
- Strong `@graph` schema hardcoded in `category.component.ts` with: Organization, BreadcrumbList, CollectionPage, LocalBusiness
- FAQ schema for categories with FAQs — good
- `ItemList` with product data in schema — good
- `priceRange` added to LocalBusiness — good
- **Problem:** All schema is client-side injected
- **Problem:** BreadcrumbList `@id` anchor is missing from category page HEAD

**Blog Content (5.4/10)**
- BlogPosting schema implemented with: headline, author, publisher, datePublished, dateModified, keywords
- Author credit visible (Suresh Parekh) — but no bio link, credentials, or Person entity
- Article structure uses H2 hierarchy well
- Publication dates visible in SSR
- **Missing:** Article schema @id, isPartOf WebSite, speakable zones
- **Missing:** Canonical tag on blog posts
- Author bio: "Decades of experience in sarees and textiles" — too vague for E-E-A-T
- Image alt text: "blog-image" is generic — fails image entity recognition

---

## Phase 3: Leadership / Founders Page Analysis

### 3.1 Current State

The site has **no dedicated leadership or founders page**. Founder information is confined to:
- About Us page: "Founded in 1993 by Suresh and Santosh Parekh"
- Blog author credits: "Suresh Parekh"
- Schema code: `founders: [{ '@type': 'Person', name: 'Suresh Parekh' }, { '@type': 'Person', name: 'Santosh Parekh' }]` — browser-only

### 3.2 Person Entity Assessment

| Signal | Status | Issue |
|--------|--------|-------|
| Full name | Present | Both names in About Us text |
| Photograph | Missing | No founder photo on About Us |
| Biography | Stub only | "vision centers on textile expertise" — not citable |
| Professional credentials | Missing | No mention of industry roles, awards, memberships |
| Social profiles | Missing | No LinkedIn, no individual social presence |
| Person schema | Present in code | Never reaches HTML (browser-only) |
| `sameAs` for persons | Missing | No Wikidata/LinkedIn/social links for persons |
| `knowsAbout` | Missing | No topic expertise linked to founders |
| `affiliation` | Missing | No industry body membership |

### 3.3 AI Visibility for Founders

**Can AI systems identify Suresh or Santosh Parekh as saree experts?** — Currently **NO**.

The Person entities exist only in a browser-only JSON-LD block. No content page creates a searchable, citable bio. When ChatGPT/Gemini/Perplexity receive a query like "Who are the founders of Tulsi Silks Chennai?" — there is no extractable answer in the static HTML.

### 3.4 Recommendations

**Content improvements:**
- Create `/about-us/suresh-parekh` and `/about-us/santosh-parekh` person profile pages
- Include: full bio (300+ words), year founded, industry expertise areas, awards/recognition, media mentions
- Add founder photo with descriptive alt text: `alt="Suresh Parekh, co-founder of Tulsi Silks Chennai, established 1993"`
- Reference specific expertise: "30+ years experience in Kanjivaram silk weaving, supplier relationships with Kanchipuram weavers"

**Schema improvements:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://tulsisilks.co.in/about-us#suresh-parekh",
  "name": "Suresh Parekh",
  "jobTitle": "Co-Founder & Managing Director",
  "worksFor": { "@id": "https://tulsisilks.co.in/#organization" },
  "foundingDate": "1993",
  "knowsAbout": ["Kanjivaram silk", "Indian textiles", "Handloom weaving", "Saree curation"],
  "description": "Co-founder of Tulsi Silks with 30+ years expertise in traditional Indian silk sarees...",
  "image": "https://tulsisilks.co.in/assets/images/suresh-parekh.jpg",
  "url": "https://tulsisilks.co.in/about-us#suresh-parekh"
}
```

**Internal linking improvements:**
- Every blog post by Suresh Parekh should link to his profile page
- About Us should link to individual founder profiles
- Add "Author" section at bottom of every blog post linking to founder profile

---

## Phase 4: Structured Data Audit

### 4.1 Schema Inventory

| Schema Type | Status | Where | SSR? | Valid? |
|-------------|--------|--------|------|--------|
| Organization | Present | `home-page-json-ld.ts` | ❌ Browser-only | ✅ |
| Store (LocalBusiness) | Present | `home-page-json-ld.ts` + `category.component.ts` | ❌ Browser-only | ✅ |
| WebSite + SearchAction | Present | `home-page-json-ld.ts` | ❌ Browser-only | ✅ |
| Product | Present | `product.component.ts` | ❌ Browser-only | ✅ |
| BreadcrumbList | Present | `common.service.ts:breadCrumbList()` | ❌ Browser-only | ✅ |
| CollectionPage + ItemList | Present | `category.component.ts` | ❌ Browser-only | ✅ |
| BlogPosting | Present | `blog-details.component.ts` | ❌ Browser-only | Partial* |
| FAQPage (category) | Present | `category.component.ts` | ❌ Browser-only | ✅ |
| FAQPage (blog) | Present | `blog-details.component.ts` | ❌ Browser-only | ✅ |
| MerchantReturnPolicy | Present | `home-page-json-ld.ts` | ❌ Browser-only | ✅ |
| Person | Present in code only | `home-page-json-ld.ts` (founders) | ❌ Browser-only | Partial |
| OfferShippingDetails | Present | `category.component.ts` | ❌ Browser-only | ✅ |
| AggregateRating | Present | `product.component.ts` | ❌ Browser-only | ✅ |
| Review | Present | `product.component.ts` | ❌ Browser-only | ✅ |
| SpeakableSpecification | **MISSING** | N/A | N/A | N/A |
| HowTo | **MISSING** | N/A | N/A | N/A |
| VideoObject | **MISSING** | N/A | N/A | N/A |
| ImageObject | **MISSING** | N/A | N/A | N/A |

*BlogPosting publisher logo uses `localStorage.getItem('random_num')` which is `null` in SSR, producing an invalid URL.

### 4.2 Critical Schema Bugs

**Bug 1 — Homepage JSON-LD never reaches SSR HTML:**
```typescript
// common.service.ts:656
applyHomePageJsonLd(): void {
  if (!isPlatformBrowser(this.platformId)) return; // ← FIX: Remove this guard
```
**Fix:** Remove the `isPlatformBrowser` guard and call this during server-side initialization.

**Bug 2 — Blog publisher logo crashes on SSR:**
```typescript
// blog-details.component.ts:338
"url": environment.img_baseurl + 'uploads/' + this.commonService.store_id + 
       '/logo.png?v=' + localStorage.getItem('random_num') // ← localStorage = null on server
```
**Fix:** Use `environment.img_baseurl + 'uploads/' + this.commonService.store_id + '/logo.png'`

**Bug 3 — `robots` meta tag missing "follow":**
```html
<!-- index.html:9 -->
<meta name="robots" content="index"> <!-- Should be "index, follow" -->
```

**Bug 4 — Canonical link is empty in initial HTML:**
```html
<link rel="canonical" href="" id="ccLink"> <!-- Empty until JS runs -->
```
AI crawlers parsing raw HTML see an empty canonical, which can cause duplicate content signals.

### 4.3 Missing Critical Schemas — JSON-LD Examples

**Missing: EducationalOrganization / Store (Homepage — should be in SSR):**
Already present in code but needs SSR delivery. No changes to schema content needed, only delivery method.

**Missing: SpeakableSpecification (Homepage):**
```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".hero-heading", ".brand-story-intro", ".store-description"]
  },
  "url": "https://tulsisilks.co.in/"
}
```

**Missing: Person schema (About Us — must be in SSR):**
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://tulsisilks.co.in/about-us#suresh-parekh",
      "name": "Suresh Parekh",
      "jobTitle": "Co-Founder",
      "worksFor": { "@id": "https://tulsisilks.co.in/#organization" },
      "knowsAbout": ["Kanjivaram silk", "Banarasi silk", "Indian textiles", "Handloom weaving"],
      "description": "Co-founder of Tulsi Silks with over 30 years expertise in traditional Indian silk sarees and handloom textiles."
    },
    {
      "@type": "Person",
      "@id": "https://tulsisilks.co.in/about-us#santosh-parekh",
      "name": "Santosh Parekh",
      "jobTitle": "Co-Founder",
      "worksFor": { "@id": "https://tulsisilks.co.in/#organization" }
    }
  ]
}
```

**Missing: VideoObject (for any product videos):**
```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "Kanjivaram Silk Saree — Weaving Process",
  "description": "Watch how our Kanjivaram silk sarees are handwoven by artisans in Kanchipuram.",
  "thumbnailUrl": "https://...",
  "uploadDate": "2026-01-15",
  "duration": "PT3M20S",
  "contentUrl": "https://..."
}
```

**Missing: HowTo (for styling blogs):**
```json
{
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Wear a Cotton Saree Perfectly",
  "description": "Step-by-step guide to draping a cotton saree elegantly.",
  "step": [
    { "@type": "HowToStep", "name": "Tuck the plain end", "text": "..." },
    { "@type": "HowToStep", "name": "Make pleats", "text": "..." }
  ]
}
```

---

## Phase 5: AI Visibility Audit

### 5.1 AI Crawler Access Assessment

| AI System | Crawler Name | Renders JS? | Can Access Content? | Current Risk |
|-----------|-------------|-------------|---------------------|--------------|
| ChatGPT / OpenAI | GPTBot | No | Only static HTML | **CRITICAL** |
| Google AI Overviews | Googlebot | Yes (partial) | Partial — limited JS | HIGH |
| Gemini | Google-Extended | Yes (partial) | Partial | HIGH |
| Perplexity | PerplexityBot | No | Only static HTML | **CRITICAL** |
| Claude / Anthropic | ClaudeBot | No | Only static HTML | **CRITICAL** |
| Microsoft Copilot | Bingbot | Partial | Limited JS | HIGH |

### 5.2 Content Citability Assessment

| Content | Citable by AI? | Reason |
|---------|---------------|--------|
| "Weavers of heritage since 1993" | ✅ Yes | In SSR footer HTML |
| "Founded in 1993 by Suresh and Santosh Parekh" | ✅ Partial | In About Us SSR text |
| Brand story / founding narrative | ✅ Partial | SSR HTML — but generic |
| Product names and prices | ❌ No | JS-only via API |
| Product descriptions | ❌ No | JS-only via API |
| Category listings | ❌ No | JS-only via API |
| Structured data (all types) | ❌ No | Browser-only injection |
| Blog article bodies | ❌ Partial | Editor.js content JS-rendered |
| Blog titles | ✅ Yes | Visible in SSR |
| Author bios | ❌ No | Too brief; JS-loaded context |
| Contact information | ✅ Partial | Phone/address in header HTML |
| Business hours | ❌ No | JS-loaded |

### 5.3 AI Visibility Score by System

| AI System | Score | Key Barrier |
|-----------|-------|------------|
| ChatGPT (GPTBot) | 1.5/10 | No JS rendering; sees empty app-root |
| Google AI Overviews | 3.5/10 | Partial JS; schema not in SSR |
| Gemini (Google-Extended) | 3.0/10 | Schema absent from initial response |
| Perplexity (PerplexityBot) | 1.5/10 | No JS rendering |
| Claude (ClaudeBot) | 1.5/10 | No JS rendering |
| Microsoft Copilot (Bingbot) | 2.5/10 | Limited JS rendering |
| **Overall AI Visibility** | **2.3/10** | **Schema delivery failure** |

### 5.4 Which Pages Likely Appear in AI Answers

Currently, only the following content is likely to appear in AI-generated answers:
- Generic brand mention: "Tulsi Silks is a saree store in Mylapore, Chennai, established in 1993"
- Footer copy if crawled directly
- Blog titles (e.g. "Why Organza Sarees Are Perfect for Summer Weddings")
- Contact details if parsed from header/footer HTML

**NOT appearing in AI answers:**
- Specific product recommendations
- Price ranges
- Founder expertise/credentials
- Category expertise content
- Craft process details
- Weave-specific knowledge

---

## Phase 6: Technical Implementation Plan

### 6.1 Angular Universal SSR — Critical Fixes

**Priority 1: Move JSON-LD injection to work on server side**

In `common.service.ts`, the `applyHomePageJsonLd()` method must be updated:
```typescript
// BEFORE (browser-only — AI sees nothing):
applyHomePageJsonLd(): void {
  if (!isPlatformBrowser(this.platformId)) return;
  ...
}

// AFTER (works on server AND browser):
applyHomePageJsonLd(): void {
  this.removeElement('home-jsonld');
  this.createJsonLD('home-jsonld', buildHomePageJsonLd(this.buildHomeJsonLdInput()));
}
```

**Priority 2: Move meta tag population to SSR-safe code**

Currently `setSiteMetaData()` is called only after API responses (browser-side). The Angular `Meta` and `Title` services work on both server and browser. The store SEO details must be fetched during SSR initialization (in `AppServerModule` or a server-side resolver) and meta tags applied before HTML is serialized.

Recommended approach: Angular route-level resolvers that fetch SEO data SSR-first:
```typescript
// home.resolver.ts
@Injectable({ providedIn: 'root' })
export class HomeResolver implements Resolve<any> {
  resolve(route: ActivatedRouteSnapshot): Observable<any> {
    return this.storeApi.STORE_SEO_DETAILS().pipe(
      tap(data => this.commonService.setSiteMetaData(data.seo_details, null)),
      tap(() => this.commonService.applyHomePageJsonLd())
    );
  }
}
```

**Priority 3: Static meta fallbacks in `index.html`**

Add meaningful static fallbacks for the initial HTML:
```html
<title>Tulsi Silks Chennai | Finest Kanjivaram & Banarasi Silk Sarees</title>
<meta name="robots" content="index, follow">
<meta name="description" content="Tulsi Silks — premium handwoven silk sarees in Chennai since 1993. Shop Kanjivaram, Banarasi, Organza sarees. Free delivery across India. Est. 68, Luz Church Rd, Mylapore.">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Tulsi Silks">
<meta property="og:title" content="Tulsi Silks Chennai | Finest Kanjivaram & Banarasi Silk Sarees">
<meta property="og:description" content="Premium handwoven silk sarees since 1993. Kanjivaram, Banarasi, Organza. Free India delivery.">
<link rel="canonical" href="https://tulsisilks.co.in/">
```

**Priority 4: Inject static JSON-LD in `index.html` (homepage only)**

For Googlebot and AI crawlers, add a static JSON-LD block directly in `index.html` for the homepage. The Angular service will update it on hydration:
```html
<script type="application/ld+json" id="home-jsonld-static">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://tulsisilks.co.in/#organization",
      "name": "Tulsi Silks",
      "url": "https://tulsisilks.co.in/",
      "foundingDate": "1993",
      "founders": [
        { "@type": "Person", "name": "Suresh Parekh" },
        { "@type": "Person", "name": "Santosh Parekh" }
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "68, Luz Church Rd, CIT Colony, Mylapore",
        "addressLocality": "Chennai",
        "addressRegion": "Tamil Nadu",
        "postalCode": "600004",
        "addressCountry": "IN"
      },
      "telephone": "+918072444353",
      "email": "orders@tulsisilks.com",
      "sameAs": [
        "https://www.instagram.com/tulsisilks/",
        "https://www.facebook.com/tulsisilks",
        "https://x.com/TulsiSilks"
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://tulsisilks.co.in/#website",
      "url": "https://tulsisilks.co.in/",
      "name": "Tulsi Silks",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://tulsisilks.co.in/search?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

### 6.2 Prerendering Strategy

For an e-commerce Angular Universal site, the optimal strategy is:

| Page Type | Strategy | Rationale |
|-----------|----------|-----------|
| Homepage `/` | SSR + Static fallback JSON-LD in index.html | Highest traffic, most AI visibility value |
| Category pages | SSR with route resolvers | Dynamic inventory, needs fresh data |
| Product pages | SSR with TransferState | Product data must match server state |
| About Us | **Prerender (static)** | Content rarely changes |
| Blog posts | **Prerender (static)** | Content static after publish |
| Contact Us | **Prerender (static)** | Contact data changes rarely |
| Policy pages | **Prerender (static)** | Fully static |

Add prerender configuration in `angular.json`:
```json
{
  "prerender": {
    "routes": [
      "/",
      "/about-us",
      "/contact-us",
      "/blogs",
      "/privacy-policy",
      "/shipping-policy",
      "/cancellation-policy",
      "/terms-and-conditions"
    ]
  }
}
```

### 6.3 Sitemap Improvements

**Current issues:**
- All 900+ URLs have `<priority>1.00</priority>` — meaningless signal
- No `<changefreq>` tags
- All URLs have identical `<lastmod>` date

**Recommended sitemap structure:**
```xml
<!-- Priority tiers -->
Homepage:           priority 1.0, changefreq daily
Category pages:     priority 0.8, changefreq weekly
Product pages:      priority 0.7, changefreq weekly
Blog posts:         priority 0.6, changefreq monthly
Static pages:       priority 0.4, changefreq yearly
```

Add an **image sitemap** for product images:
```xml
<url>
  <loc>https://tulsisilks.co.in/product/blue-kanjivaram-silk-saree</loc>
  <image:image>
    <image:loc>https://yourstore.io/api/uploads/.../product.webp</image:loc>
    <image:title>Blue Kanjivaram Silk Saree</image:title>
    <image:caption>Handwoven blue Kanjivaram silk saree with gold zari border from Tulsi Silks</image:caption>
  </image:image>
</url>
```

### 6.4 Robots.txt Improvements

**Current:**
```
User-Agent: *
Allow: /
Sitemap: https://tulsisilks.co.in/sitemap.xml
```

**Recommended:**
```
User-Agent: *
Allow: /
Disallow: /account
Disallow: /cart
Disallow: /checkout
Disallow: /wishlist
Disallow: /guest-login
Disallow: /vendor-login
Disallow: /vendor-register
Disallow: /vendor-enquiry
Disallow: /search
Disallow: /order-review/
Disallow: /service-confirmed/
Crawl-delay: 1

# Allow AI crawlers explicitly
User-Agent: GPTBot
Allow: /

User-Agent: ClaudeBot
Allow: /

User-Agent: Google-Extended
Allow: /

User-Agent: PerplexityBot
Allow: /

User-Agent: Bingbot
Allow: /

Sitemap: https://tulsisilks.co.in/sitemap.xml
Sitemap: https://tulsisilks.co.in/sitemap-images.xml
```

### 6.5 Metadata Automation

Create a centralized metadata service that runs SSR-safe:

```typescript
// src/app/services/seo.service.ts
@Injectable({ providedIn: 'root' })
export class SeoService {
  setProductMeta(product: any): void {
    // Works on both server and browser
    this.title.setTitle(product.seo_details?.page_title || product.name);
    this.meta.updateTag({ name: 'description', content: product.seo_details?.meta_desc || '' });
    this.meta.updateTag({ property: 'og:title', content: product.name });
    this.meta.updateTag({ property: 'og:image', content: this.imgBase + product.image });
    this.meta.updateTag({ property: 'og:type', content: 'product' });
    // Set canonical
    const canonicalEl = this.doc.getElementById('ccLink') as HTMLLinkElement;
    if (canonicalEl) canonicalEl.href = this.origin + this.router.url.split('?')[0];
  }
}
```

---

## Phase 7: GEO Roadmap

### Quick Wins (1–2 Days)

| Task | Impact | Difficulty | Priority | Expected GEO Improvement |
|------|--------|-----------|----------|--------------------------|
| 1. Fix `robots` meta: add "follow" to `index.html` | Medium | Easy | P0 | +0.2 score |
| 2. Add static meta description fallback to `index.html` | High | Easy | P0 | +0.5 score |
| 3. Add static JSON-LD block to `index.html` (Organization + WebSite) | Very High | Easy | P0 | +1.5 score |
| 4. Remove `isPlatformBrowser` guard from `applyHomePageJsonLd()` | Very High | Easy | P0 | +1.0 score |
| 5. Fix blog publisher logo: remove `localStorage.getItem('random_num')` | High | Easy | P0 | +0.3 score |
| 6. Add `og:title`, `og:description`, `og:image` static fallbacks | Medium | Easy | P1 | +0.3 score |
| 7. Add `twitter:card`, `twitter:title`, `twitter:description` static tags | Medium | Easy | P1 | +0.2 score |
| 8. Fix sitemap priority tiers (not all 1.0) | Medium | Easy | P1 | +0.2 score |
| 9. Update `robots.txt` with explicit AI bot directives + disallow private routes | Medium | Easy | P1 | +0.1 score |
| 10. Add `<changefreq>` to sitemap | Low | Easy | P2 | +0.1 score |

**Day 1–2 combined GEO improvement: ~+4.4 points (from 2.3 to ~6.7/10 AI visibility)**

### Medium Improvements (1 Week)

| Task | Impact | Difficulty | Priority | Expected GEO Improvement |
|------|--------|-----------|----------|--------------------------|
| 1. Move SEO data fetching to Angular SSR resolvers | Very High | Medium | P0 | +1.5 score |
| 2. Create About Us founder profile pages with detailed bios | High | Medium | P1 | +1.0 score |
| 3. Add Person schema to About Us (SSR-rendered) | High | Medium | P0 | +0.8 score |
| 4. Add SpeakableSpecification schema to homepage and blogs | High | Medium | P1 | +0.6 score |
| 5. Implement prerendering for About Us, Contact, Blog posts, static pages | Very High | Medium | P0 | +1.2 score |
| 6. Add canonical tags SSR-side using Angular Meta service | High | Medium | P0 | +0.5 score |
| 7. Improve blog author bios (150+ word expertise statements) | High | Medium | P1 | +0.7 score |
| 8. Add HowTo schema to styling/draping blog posts | Medium | Medium | P2 | +0.4 score |
| 9. Add image alt text strategy: descriptive alts with product/fabric names | Medium | Medium | P1 | +0.3 score |
| 10. Fix URL 404s: menu links should use `/category/` prefix | High | Medium | P0 | +0.3 score |

### Major Improvements (1 Month)

| Task | Impact | Difficulty | Priority | Expected GEO Improvement |
|------|--------|-----------|----------|--------------------------|
| 1. Full SSR-safe meta/schema pipeline for all page types | Critical | Hard | P0 | +2.0 score |
| 2. Product page prerendering for top 500 SKUs | Very High | Hard | P1 | +1.5 score |
| 3. Craft Process knowledge base pages (how Kanjivaram is made, etc.) | Very High | Medium | P1 | +1.5 score |
| 4. Expert article series by Suresh Parekh with detailed credentials | High | Medium | P1 | +1.0 score |
| 5. Image sitemap with descriptive captions | High | Medium | P1 | +0.5 score |
| 6. Wikidata entity creation for Tulsi Silks + founders | High | Hard | P2 | +0.8 score |
| 7. Wikipedia-style brand history page | Very High | Medium | P1 | +1.2 score |
| 8. VideoObject schema for product/process videos | Medium | Medium | P2 | +0.4 score |
| 9. Review/ratings aggregate visible in SSR HTML | High | Hard | P1 | +0.6 score |
| 10. Add `speakable` CSS classes + schema to all content zones | High | Medium | P1 | +0.5 score |

---

## Phase 8: Final Scorecard

| Category | Score | Key Issue |
|----------|-------|-----------|
| **Technical SEO** | **4.5/10** | Meta/canonical tags empty in initial HTML; sitemap priorities flat |
| **Structured Data** | **3.5/10** | All JSON-LD browser-only; never in SSR HTML |
| **AI Crawlability** | **2.3/10** | GPTBot/ClaudeBot/PerplexityBot see empty app-root |
| **Knowledge Graph** | **3.0/10** | No Person entities visible; Organization only in JS |
| **Founder Discoverability** | **2.0/10** | No profile pages; bio too brief for AI citation |
| **GEO Readiness** | **2.5/10** | No Speakable; no citable expertise content in static HTML |
| **Core Web Vitals (SSR)** | **6.0/10** | SSR implemented; hero preloads good; CSS inline good |
| **Content Depth** | **6.0/10** | Blog content good; product descriptions need work |
| **E-E-A-T Signals** | **3.5/10** | Founders exist but not credentialed in visible content |
| **Local SEO** | **6.5/10** | Address/phone visible; GeoCoordinates in schema |

---

## Top 10 Issues Preventing AI Visibility

1. **JSON-LD never reaches SSR HTML** — `isPlatformBrowser` guard in `applyHomePageJsonLd()` prevents ALL structured data from appearing in the server-rendered response. This is the single highest-impact fix.

2. **Meta description, OG tags, and canonical are empty strings in `index.html`** — AI crawlers reading raw HTML see no description, no title context, and no canonical URL.

3. **Product content is entirely JS-dependent** — All product names, descriptions, prices, and availability are fetched via API after JavaScript executes. Non-JS crawlers see an empty product page.

4. **No citable founder/expert profile pages** — Tulsi Silks cannot appear in AI answers about "saree experts" or "Kanjivaram specialists" because no text-based, SSR-available content establishes this expertise.

5. **Blog publisher logo uses `localStorage`** — This crashes BlogPosting schema generation on SSR, producing invalid structured data for the blog's most valuable citation content.

6. **Category menu links 404** — Menu links to `/kanjivaram-silk-sarees` return 404 (correct path is `/category/kanjivaram-silk-sarees`). Search engines and AI crawlers cannot follow broken links.

7. **No Speakable schema** — Google's AI Overviews, Gemini, and voice assistants cannot identify which content zones are authoritative/citable without SpeakableSpecification.

8. **Sitemap has all priorities at 1.0** — No crawl budget signal differentiation. High-value category and product pages are not distinguished from checkout or account pages.

9. **Author bios are too brief for E-E-A-T** — "Decades of experience in sarees and textiles" is one sentence. Google's quality guidelines require specific, detailed expertise demonstration for AI citation eligibility.

10. **`robots` meta tag missing "follow"** — `content="index"` without "follow" may prevent link equity flow. Should be `content="index, follow"`.

---

## Top 10 Quick Wins

1. **Add static JSON-LD to `index.html`** — Organization + WebSite schema visible to every crawler immediately, zero API dependency.

2. **Remove `isPlatformBrowser` from `applyHomePageJsonLd()`** — One-line fix enabling homepage schema in SSR HTML.

3. **Fix `index.html` meta description** — Change `content=""` to the actual store description (150 characters).

4. **Fix `robots` meta: `index` → `index, follow`** — One-character change.

5. **Fix blog publisher logo** — Remove `localStorage.getItem('random_num')` from publisher logo URL.

6. **Add explicit AI crawler directives to `robots.txt`** — Allow GPTBot, ClaudeBot, PerplexityBot, Google-Extended.

7. **Add `Disallow` rules for private routes in `robots.txt`** — `/account`, `/cart`, `/checkout`, `/wishlist`.

8. **Fix sitemap priority tiers** — At minimum, homepage = 1.0, category = 0.8, product = 0.7.

9. **Add meaningful founder bio text to About Us** — Even 200 extra words about specific expertise, years of weaver relationships, and regional knowledge dramatically improves AI citability.

10. **Add `<changefreq>` to sitemap** — Helps search engine crawl scheduling.

---

## Exact Development Tasks

### Frontend Team

| # | Task | File(s) | Effort |
|---|------|---------|--------|
| F1 | Add static JSON-LD block to `index.html` (Organization + WebSite) | `src/index.html` | 1h |
| F2 | Add static meta description and OG fallbacks to `index.html` | `src/index.html` | 30m |
| F3 | Fix `robots` meta to `content="index, follow"` | `src/index.html` | 5m |
| F4 | Add canonical link `href="https://tulsisilks.co.in/"` in `index.html` | `src/index.html` | 10m |
| F5 | Remove `isPlatformBrowser` guard from `applyHomePageJsonLd()` | `src/app/services/common.service.ts:656` | 10m |
| F6 | Fix blog publisher logo to not use `localStorage` | `src/app/views/features/blogs/blog-details/blog-details.component.ts:338` | 15m |
| F7 | Create Angular route resolvers for SSR-safe meta/schema on: home, category, product, blog | New files + routing | 2 days |
| F8 | Add `TransferState` for SEO data to avoid re-fetching on hydration | `src/app/services/common.service.ts` | 4h |
| F9 | Add Person schema to About Us component (SSR-rendered) | `src/app/views/properties/about-us/about-us.component.ts` | 2h |
| F10 | Add SpeakableSpecification schema to home and blog components | `home.component.ts`, `blog-details.component.ts` | 2h |
| F11 | Add prerender configuration for static pages in `angular.json` | `angular.json` | 1h |
| F12 | Create founder profile subpages under `/about-us` route | New module + component | 1 day |
| F13 | Add HowTo schema builder to blog component (conditional on content type) | `blog-details.component.ts` | 3h |
| F14 | Fix category menu link URLs (add `/category/` prefix where missing) | Main header template | 2h |
| F15 | Add `twitter:card` meta tags to `index.html` static fallbacks | `src/index.html` | 15m |

### Backend Team

| # | Task | Effort |
|---|------|--------|
| B1 | Create API endpoint that returns store SEO data for SSR preloading (fast, cached) | 4h |
| B2 | Update sitemap generation: add `changefreq`, differentiate `priority` by page type | 4h |
| B3 | Add image sitemap generation with `image:title` and `image:caption` | 4h |
| B4 | Add `lastmod` per URL based on actual content modification date | 2h |
| B5 | Create blog post author profile API (`/api/authors/suresh-parekh`) | 3h |
| B6 | Add `canonical_url` field to product/category/blog API responses for SSR use | 2h |
| B7 | Ensure `og:image` absolute URLs are returned in API responses | 1h |
| B8 | Add blog post `dateModified` to API response (currently only `created_on`) | 1h |

### SEO/Content Team

| # | Task | Effort |
|---|------|--------|
| C1 | Write 300+ word biography for Suresh Parekh: specific expertise, weaver relationships, awards | 4h |
| C2 | Write 300+ word biography for Santosh Parekh: business background, brand vision | 4h |
| C3 | Add professional headshot photos for both founders (with descriptive alt text) | 2h |
| C4 | Update blog author bio from 1 sentence to 150+ words with credentials | 2h |
| C5 | Add founding story section to About Us: specific year/context, why Chennai/Mylapore, weaver community relationships | 4h |
| C6 | Create "How Kanjivaram Silk is Made" knowledge page (craft process, region, artisans) | 1 day |
| C7 | Create "How Banarasi Silk is Made" knowledge page | 1 day |
| C8 | Update all product image alt text: replace generic alts with descriptive fabric+color+occasion text | 2 days |
| C9 | Add FAQ section to homepage (minimum 5 Q&As about shipping, authenticity, care) | 3h |
| C10 | Add descriptive captions to all blog images (not just "blog-image") | 2h |
| C11 | Create Wikidata entity for Tulsi Silks | 2h |
| C12 | Submit to Google Business Profile; ensure NAP consistency matches schema | 1h |

---

*Audit completed: 2026-06-03. Next recommended re-audit: After Phase 1 (Quick Wins) implementation, estimated 4–6 weeks.*
