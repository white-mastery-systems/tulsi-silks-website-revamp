/**
 * Kanjivaram domination plan (section B): explicit noindex slugs until merchandising
 * restocks or backend exposes per-category robots flags.
 */
export const KANJIVARAM_FORCE_NOINDEX_SLUGS: ReadonlySet<string> = new Set([
  'kanjivaram-pure-silk-cotton-sarees',
  'daily-wear-kanjivaram-silk-sarees',
  'office-wear-kanjivaram-silk-sarees',
  'simple-kanjivaram-silk-sarees',
  'small-border-kanjivaram-silk-sarees',
  'zari-work-border-kanjivaram-silk-sarees',
  'designer-kanjivaram-silk-sarees',
  'embroidery-kanjivaram-silk-sarees',
  'printed-kanjivaram-silk-sarees',
  'akai-printed-kanjivaram',
  'kanjivaram-semi-silk-sarees',
  'kanjivaram-silk-blend-sarees',
  'kanjivaram-semi-raw-silk-sarees',
  'navy-blue-kanjivaram-silk-sarees',
  'turquoise-blue-kanjivaram-silk-sarees',
  'teal-kanjivaram-silk-sarees',
  'sea-green-kanjivaram-silk-sarees',
  'fluorescent-green-kanjivaram-silk-sarees',
  'mauve-kanjivaram-silk-sarees',
  'violet-kanjivaram-silk-sarees',
  'rose-kanjivaram-silk-sarees',
  'coral-kanjivaram-silk-sarees',
  'nude-kanjivaram-silk-sarees',
  'champagne-kanjivaram-silk-sarees',
  'bronze-kanjivaram-silk-sarees',
  'copper-kanjivaram-silk-sarees',
  'trending-colour-kanjivaram-silk-sarees',
  'vibrant-colour-kanjivaram-silk-sarees',
  'neutral-colour-kanjivaram-silk-sarees',
  'dark-neutral-colour-kanjivaram-silk-sarees',
]);

/** Plan rule (20 Dec): Kanjivaram URLs with fewer products are not indexed. */
export const KANJIVARAM_MIN_PRODUCTS_TO_INDEX = 4;

export function categorySlugFromPageUrl(pageUrl: string): string {
  const path = String(pageUrl ?? '').split('?')[0].replace(/\/+$/, '');
  const prefix = '/category/';
  if (!path.startsWith(prefix)) return '';
  return path.slice(prefix.length);
}

export function isKanjivaramCategorySlug(slug: string): boolean {
  const s = String(slug ?? '').toLowerCase();
  return s.includes('kanjivaram') || s.includes('kanjeevaram') || s.includes('kanchipuram') || s.includes('kanchi');
}

export function isForceNoindexKanjivaramSlug(pageUrl: string): boolean {
  const slug = categorySlugFromPageUrl(pageUrl);
  return slug.length > 0 && KANJIVARAM_FORCE_NOINDEX_SLUGS.has(slug);
}
