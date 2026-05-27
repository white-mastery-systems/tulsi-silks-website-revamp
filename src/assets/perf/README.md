# Self-hosted mobile hero (LCP)

The first homepage hero slide can load **mobile** WebP from this folder instead of the CMS path `uploads/<store_id>/layouts/mobile_primary_slider.webp`.

1. Regenerate the file: `npm run optimize:mobile-hero`
2. Copy into this folder (or use `npm run optimize:mobile-hero:install`):

   `scripts/output/mobile_primary_slider.webp` → `src/assets/perf/mobile_primary_slider.webp`

3. Keep these in sync (same URL string):

   - `environment*.ts` → `staticMobileHeroWebpUrl` (e.g. `/assets/perf/mobile_primary_slider.webp`)
   - `src/index.html` → mobile `<link rel="preload">` and `#pre-bg` `<picture>` `srcset`

To use the CMS image again: set `staticMobileHeroWebpUrl` to `null` in both environment files and point `index.html` back to the yourstore.io `uploads/.../mobile_primary_slider.webp` URLs.
