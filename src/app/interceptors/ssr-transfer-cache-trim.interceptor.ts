import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { trimLayoutListBodyForTransferCache } from '../services/ssr-home.config';

/**
 * Server-only interceptor that strips heavy fields from API responses
 * BEFORE Angular's HTTP Transfer Cache serialises them into the SSR HTML.
 *
 * Why this exists:
 *   The transfer cache embeds every cached GET response as inline JSON in a
 *   <script> tag. The LAYOUT_LIST response alone can be 300–500 KB because
 *   each product object carries 10+ image variants, rich descriptions,
 *   metadata, etc. Product *cards* only need a handful of display fields.
 *   Stripping here lets the transfer cache JSON shrink by ~60–80 % while
 *   keeping the client-side rendering identical — the client just has less
 *   JSON to parse on bootstrap.
 *
 * DI interceptors run in the response path BEFORE Angular's functional
 * transfer-cache interceptor (registered by withHttpTransferCacheOptions).
 * This guarantees that what the transfer cache stores is already stripped.
 *
 * Only runs on the server. On the client, the stripped transfer-cache data is
 * replayed; subsequent navigations that call these APIs again get the full
 * response from the network, which is also fine.
 */
@Injectable()
export class SsrTransferCacheTrimInterceptor implements HttpInterceptor {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!isPlatformServer(this.platformId)) {
      return next.handle(req);
    }

    const url = req.url;

    // ── LAYOUT_LIST (/store_details/layouts) ────────────────────────────────
    // Strip product fields to card-display minimum; remove Instagram config
    // body (only the token is needed — the full insta section data is fetched
    // client-side via the INSTAGRAM() API which is excluded from transfer cache
    // via the filter in app.module.ts).
    if (url.includes('/store_details/layouts')) {
      return next.handle(req).pipe(
        map(event => {
          if (!(event instanceof HttpResponse) || !event.body?.status) return event;
          const trimmed = trimLayoutList(event.body);
          return event.clone({ body: trimLayoutListBodyForTransferCache(trimmed) });
        }),
      );
    }

    // ── HOME_PAGE_BLOG_LIST (/store_details/blogs?json=1&limit=…) ───────────
    // Keep only fields the blog carousel renders: title, image, date, URL.
    // This URL pattern deliberately does NOT match BLOG_LIST (/blogs/v1?…).
    if (url.includes('/store_details/blogs?json=1')) {
      return next.handle(req).pipe(
        map(event => {
          if (!(event instanceof HttpResponse) || !event.body?.status) return event;
          return event.clone({ body: trimBlogList(event.body) });
        }),
      );
    }

    return next.handle(req);
  }
}

// ── Pure helpers (no `this` dependency — easier to test) ──────────────────

function trimLayoutList(body: any): any {
  if (!Array.isArray(body.list)) return body;
  return {
    ...body,
    list: body.list.map((seg: any) => {
      if (!seg) return seg;

      if (seg.type === 'featured_product') {
        return { ...seg, product_list: trimProducts(seg.product_list) };
      }

      if (seg.type === 'multiple_featured_product') {
        return {
          ...seg,
          multitab_list: seg.multitab_list?.map((tab: any) => ({
            ...tab,
            product_list: trimProducts(tab.product_list),
          })),
        };
      }

      // Instagram section: keep only the access token so loadHomeContent()
      // can call INSTAGRAM(token) client-side. All post data is excluded.
      if (seg.type === 'instagram') {
        return {
          type: seg.type,
          rank: seg.rank,
          status: seg.status,
          insta_config: seg.insta_config?.token
            ? { token: seg.insta_config.token }
            : undefined,
        };
      }

      return seg;
    }),
  };
}

function trimProducts(products: any[]): any[] {
  if (!Array.isArray(products)) return products ?? [];
  return products.map((p: any) => ({
    _id: p._id,
    name: p.name,
    brand: p.brand,
    seo_status: p.seo_status,
    seo_details: p.seo_details ? { page_url: p.seo_details.page_url } : undefined,
    selling_price: p.selling_price,
    discounted_price: p.discounted_price,
    disc_status: p.disc_status,
    stock: p.stock,
    badge_list: p.badge_list,
    created_on: p.created_on,
    hold_till: p.hold_till,
    hold_qty: p.hold_qty,
    // Max 2 images (cover + hover); only the src and alt text are used in cards.
    image_list: p.image_list?.slice(0, 2).map((img: any) => ({
      image: img.image,
      img_alt: img.img_alt,
    })),
  }));
}

function trimBlogList(body: any): any {
  if (!Array.isArray(body.list)) return body;
  return {
    ...body,
    list: body.list.map((blog: any) => ({
      _id: blog._id,
      title: blog.title,
      category_name: blog.category_name,
      blog_image: blog.blog_image,
      created_on: blog.created_on,
      seo_status: blog.seo_status,
      seo_details: blog.seo_details
        ? { page_url: blog.seo_details.page_url }
        : undefined,
      // Intentionally omitted: body, content, meta_description, keywords,
      // tags, html_content — none of these are rendered in the blog carousel.
    })),
  };
}
