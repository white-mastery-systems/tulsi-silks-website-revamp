/**
 * Homepage SSR policy — keep above-the-fold / SEO-critical markup on the server;
 * defer heavy widgets to the browser after hydration.
 */

export const SSR_HOME_MAX_PRODUCTS = 4;
export const SSR_HOME_MAX_HERO_SLIDES = 2;
export const SSR_HOME_MAX_LAYOUT_SLIDER_SLIDES = 2;
export const SSR_HOME_MAX_SECTION_BLOCKS = 2;
export const SSR_HOME_MAX_FEATURED_SECTION_BLOCKS = 1;
export const SSR_HOME_MAX_FEATURED_PRODUCT_BLOCKS = 1;

/** Segment types omitted from SSR HTML (loaded client-side after LAYOUT_LIST). */
export const SSR_DEFERRED_SEGMENT_TYPES = new Set<string>([
  'testimonial',
  'blogs',
  'shopping_assistant',
  'shop_the_look',
  'video_section',
  'store_locator',
  'flexible',
  'secondary',
  'multiple_highlighted_section',
  'highlighted_section',
  'multiple_featured_product',
  'multiple_featured_section',
  'instagram',
  'slider',
  'primary_slider',
]);

function limitSlides(imageList: unknown[] | undefined, max: number): unknown[] {
  if (!Array.isArray(imageList)) return [];
  return imageList.slice(0, max);
}

function limitProducts(productList: unknown[] | undefined, max: number): unknown[] {
  if (!Array.isArray(productList)) return [];
  return productList.slice(0, max);
}

function limitSegmentForSsr(seg: any): any {
  if (!seg) return seg;
  const next = { ...seg };
  if (Array.isArray(next.image_list)) {
    const cap =
      next.type === 'slider' || next.type === 'primary_slider'
        ? SSR_HOME_MAX_LAYOUT_SLIDER_SLIDES
        : next.image_list.length;
    next.image_list = limitSlides(next.image_list, cap);
  }
  if (Array.isArray(next.product_list)) {
    next.product_list = limitProducts(next.product_list, SSR_HOME_MAX_PRODUCTS);
  }
  if (next.type === 'section' && Array.isArray(next.image_list)) {
    next.image_list = limitSlides(next.image_list, 6);
  }
  if (Array.isArray(next.multitab_list)) {
    next.multitab_list = next.multitab_list.map((tab: any) => ({
      ...tab,
      product_list: limitProducts(tab?.product_list, SSR_HOME_MAX_PRODUCTS),
      image_list: limitSlides(tab?.image_list, SSR_HOME_MAX_PRODUCTS),
    }));
  }
  return next;
}

/**
 * Returns layout segments to render during SSR (ATF + first product row).
 * Full CMS layout is restored on the client via `HomeComponent.ensureFullHomeLayoutOnClient`.
 */
export function filterLayoutListForSsr(list: any[]): any[] {
  if (!Array.isArray(list)) return [];
  let sectionBlocks = 0;
  let featuredSectionBlocks = 0;
  let featuredProductBlocks = 0;

  const out: any[] = [];
  for (const seg of list) {
    if (!seg?.type) continue;
    if (SSR_DEFERRED_SEGMENT_TYPES.has(seg.type)) continue;

    if (seg.type === 'section') {
      sectionBlocks += 1;
      if (sectionBlocks > SSR_HOME_MAX_SECTION_BLOCKS) continue;
    } else if (seg.type === 'featured_section') {
      featuredSectionBlocks += 1;
      if (featuredSectionBlocks > SSR_HOME_MAX_FEATURED_SECTION_BLOCKS) continue;
    } else if (seg.type === 'featured_product') {
      featuredProductBlocks += 1;
      if (featuredProductBlocks > SSR_HOME_MAX_FEATURED_PRODUCT_BLOCKS) continue;
    } else {
      continue;
    }

    out.push(limitSegmentForSsr(seg));
  }
  return out;
}

/** Trim layout list embedded in HTTP transfer cache (must match server DOM). */
export function trimLayoutListBodyForTransferCache(body: any): any {
  if (!body?.status || !Array.isArray(body.list)) return body;
  return {
    ...body,
    list: filterLayoutListForSsr(body.list),
    _ssrCompact: true,
  };
}

/** Mega-menu snapshot for TransferState — nav labels + links only. */
export function slimMenuListForTransfer(menuList: any[]): any[] {
  return (menuList ?? []).slice(0, 16).map((item) => ({
    name: item?.name,
    link: item?.link,
    link_type: item?.link_type,
    link_status: item?.link_status,
    image: item?.image,
    sub_menu: (item?.sub_menu ?? []).slice(0, 10).map((sub: any) => ({
      name: sub?.name,
      link: sub?.link,
      link_type: sub?.link_type,
      link_status: sub?.link_status,
      image: sub?.image,
      sub_menu: (sub?.sub_menu ?? []).slice(0, 8).map((deep: any) => ({
        name: deep?.name,
        link: deep?.link,
        link_type: deep?.link_type,
        link_status: deep?.link_status,
      })),
    })),
  }));
}

export function limitHeroSlides<T>(slides: T[] | undefined, isBrowser: boolean): T[] {
  const list = slides ?? [];
  if (isBrowser) return list;
  return list.slice(0, SSR_HOME_MAX_HERO_SLIDES);
}
