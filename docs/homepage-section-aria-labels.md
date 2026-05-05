# Homepage `<section>` accessible names (ARIA) – Fix Summary

This document records the accessibility work done on the homepage to ensure **every `<section>` has a unique, meaningful accessible name** using either:

- `aria-labelledby="..."` pointing to a visible heading (preferred), or
- `aria-label="..."` for sections without a visible heading (e.g., hero/utility regions).

File updated:
- `src/app/views/home/home.component.html`

---

## Convention used

### `aria-labelledby` + `<h2 id>`
For dynamic homepage segments with a visible heading, sections use:

- **Section attribute**: `[attr.aria-labelledby]="segment.heading ? 'home-' + segment.type + '-title-' + i : null"`
- **Heading id**: `<h2 [attr.id]="'home-' + segment.type + '-title-' + i">{{ segment.heading }}</h2>`

This produces unique ids like:
- `home-featured_section-title-3`
- `home-blogs-title-7`

### Fallback `aria-label`
If a section can render **without** a visible heading, we set a fallback label:

- `[attr.aria-label]="segment.heading ? null : '...'"` (or equivalent logic)

---

## What was fixed (homepage `<section>` list)

### 1) Top-level homepage wrapper
- **Selector**: `<section class="home-section">`
- **Fix**: `aria-label="Homepage content"`

### 2) Primary hero slider (main homepage hero)
- **Selector**: `section.primary-section.home-slider` (primary main slider)
- **Fix**: `aria-label="Homepage hero"`

### 3) Additional homepage slider segments (layout sliders)
- **Selector**: `segment.type == 'primary_slider' || segment.type == 'slider'`
- **Fix**: `aria-label="Homepage slider"`

### 4) About / Our Story segment
- **Selector**: `*ngIf="i == 1" class="primary-section"`
- **Fix**:
  - `aria-labelledby="home-about-title"`
  - `<h2 id="home-about-title">...`

### 5) Section grid blocks
- **Selector**: `segment.type == 'section' && segment.section_grid_type == 'grid_1' ...`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Homepage section"` when `segment.heading` is missing

### 6) Featured sections
- **Selector**: `segment.type == 'featured_section'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Featured sections"`

### 7) Featured products
- **Selector**: `segment.type == 'featured_product'`
- **Fix**:
  - Conditional `aria-labelledby` when `segment.heading` exists
  - Generated `<h2 [attr.id]>` for both heading variants inside this section
  - Fallback `aria-label="Featured products"`

### 8) Multi-tab featured products
- **Selector**: `segment.type == 'multiple_featured_product'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Featured products tabs"`

### 9) Multi-tab featured sections
- **Selector**: `segment.type == 'multiple_featured_section'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Featured sections tabs"`

### 10) Highlighted section (Gift voucher / highlighted content)
- **Selector**: `segment.type == 'highlighted_section'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Highlighted section"`

### 11) Multiple highlighted section (highlighted slider)
- **Selector**: `segment.type == 'multiple_highlighted_section'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Highlighted slider"`

### 12) Secondary banner
- **Selector**: `segment.type == 'secondary'`
- **Fix**:
  - Conditional `aria-labelledby` based on `segment.image_list[0].content_details.heading`
  - `<h2 [attr.id]>` added to the banner heading
  - Fallback `aria-label="Promotional banner"`

### 13) Testimonials
- **Selector**: `segment.type == 'testimonial'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Testimonials"`

### 14) Blogs
- **Selector**: `segment.type == 'blogs'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Blog posts"`

### 15) Shopping assistant
- **Selector**: `segment.type == 'shopping_assistant'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Shopping assistant"`
  - **Nested utility section**: `section.rw-wrapper` → `aria-label="Shopping assistant prompts"`

### 16) Shop the look
- **Selector**: `segment.type == 'shop_the_look'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Shop the look"`

### 17) Video section
- **Selector**: `segment.type == 'video_section'`
- **Fix**:
  - Conditional `aria-labelledby` + generated `<h2 [attr.id]>`
  - Fallback `aria-label="Video"`

### 18) Store location section
- **Selector**: `<section class="primary-section location">`
- **Fix**:
  - `aria-labelledby="home-location-title"`
  - `<h2 id="home-location-title">Visit Our Store</h2>`

---

## Quick manual test checklist

- **DOM check**: Every visible homepage `<section>` should have either `aria-label` or `aria-labelledby`.
- **ID mapping**: Every `aria-labelledby="X"` must reference an element with `id="X"` present in the DOM.
- **Uniqueness**: Generated ids (`home-<type>-title-<i>`) must be unique on the rendered page.
- **Screen readers**:
  - NVDA: use Elements List → Landmarks/Regions and confirm names are announced.
  - VoiceOver: Rotor → Landmarks/Regions and confirm names + order.

