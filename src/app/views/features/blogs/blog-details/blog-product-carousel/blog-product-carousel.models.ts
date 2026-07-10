export interface BlogCarouselProduct {
  title: string;
  price?: number;
  originalPrice?: number;
  mrp?: number;
  image: string;
  link: string;
  brand?: string;
  product_id?: string;
}

export interface ProductCarouselBlockData {
  title?: string;
  subtitle?: string;
  /** Editor.js productList block fields */
  heading?: string;
  sub_heading?: string;
  brandLabel?: string;
  category_id?: string;
  catalog_id?: string;
  productLimit?: number;
  limit?: number;
  /** `grid` = CSS grid; anything else = Swiper carousel */
  layout?: 'grid' | 'carousel' | string;
  buttonLabel?: string;
  buttonLink?: string;
  products?: BlogCarouselProduct[];
}

/** Normalize productCarousel / productList Editor.js payloads into one shape. */
export function normalizeProductBlockData(
  raw: Record<string, unknown> | ProductCarouselBlockData | null | undefined,
  _blockType?: string
): ProductCarouselBlockData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as ProductCarouselBlockData;
  // Always use carousel UI so productList matches productCarousel design.
  return {
    ...d,
    title: (d.heading || d.title || '').trim() || undefined,
    subtitle: (d.sub_heading || d.subtitle || '').trim() || undefined,
    productLimit: d.limit ?? d.productLimit,
    layout: 'carousel',
  };
}
