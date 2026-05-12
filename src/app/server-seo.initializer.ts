import { PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformServer } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

import { environment } from '../environments/environment';
import { CommonService } from './services/common.service';
import { StoreApiService } from './services/store-api.service';

/** Writes SEO directly into SSR Domino document — guarantees serialized HTML includes tags. */
function patchHeadForSeo(doc: Document, seo: Record<string, unknown>, commonService: CommonService): void {
  const title = seo['page_title'] as string | undefined;
  if (!title || !doc?.head) {
    return;
  }
  doc.title = title;

  const setContent = (selector: string, content: string) => {
    const el = doc.querySelector(selector);
    if (el) {
      el.setAttribute('content', content ?? '');
    }
  };

  const metaDesc = (seo['meta_desc'] as string) ?? '';

  setContent('meta[name="theme-color"]', String(seo['tile_color'] ?? ''));
  setContent('meta[name="description"]', metaDesc);
  setContent('meta[property="og:site_name"]', title);
  setContent('meta[property="og:title"]', title);
  setContent('meta[property="og:description"]', metaDesc);

  const logo =
    commonService.social_logo != null && commonService.social_logo !== ''
      ? `${environment.img_baseurl}${commonService.social_logo}`
      : `${environment.img_baseurl}uploads/${commonService.store_id}/social_logo.jpg`;
  setContent('meta[property="og:image"]', logo);
  setContent('meta[property="og:image:width"]', '1200');
  setContent('meta[property="og:image:height"]', '630');
}

/**
 * SSR only: prefetch store SEO before bootstrap so view-source includes title + meta.
 * Also patches `document.head` directly — Meta/Title services alone were not reflected
 * in some serialized outputs.
 */
export function serverSeoInitializerFactory(
  platformId: object,
  document: Document,
  storeApi: StoreApiService,
  commonService: CommonService,
): () => Promise<void> {
  return () => {
    if (!isPlatformServer(platformId)) {
      return Promise.resolve();
    }
    return firstValueFrom(
      storeApi.STORE_DETAILS().pipe(
        tap((result) => {
          if (!result?.status || result.store_details?.status !== 'active') {
            return;
          }
          const seo = result.store_details?.seo_details;
          if (!seo) {
            return;
          }
          commonService.seo_details = seo;
          if (!commonService.social_logo && commonService.store_id) {
            commonService.social_logo = `uploads/${commonService.store_id}/social_logo.jpg`;
          }
          commonService.setSiteMetaData(commonService.seo_details, null);
          patchHeadForSeo(document, seo as Record<string, unknown>, commonService);
        }),
        catchError((err) => {
          console.error('[SSR SEO] STORE_DETAILS failed:', err?.message ?? err);
          return of(null);
        }),
      ),
    ).then(() => undefined);
  };
}

export const SERVER_SEO_INITIALIZER_DEPS = [
  PLATFORM_ID,
  DOCUMENT,
  StoreApiService,
  CommonService,
] as const;
