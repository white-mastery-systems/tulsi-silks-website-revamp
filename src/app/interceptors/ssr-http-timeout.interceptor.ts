import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Observable, of, throwError } from 'rxjs';
import { tap, timeout, catchError } from 'rxjs/operators';

/**
 * Per-URL SSR timeouts (ms).
 *
 * Raised to 5 000 ms across the board to give slow/cold APIs enough time to
 * respond before Angular gives up and returns an empty/fallback response.
 */
const SSR_TIMEOUT_MS: Record<string, number> = {
  '/store_details/details_v3':       5000,
  '/store_details/layouts':          5000,
  '/store_details/footer_seo_links': 5000,
  '/store_details/blogs':            5000,
  '/store_details/contact_page':     5000,
  '/store_details/ai_styles':        5000,
  '/store_details/product/details':  3000,
  '/store_details/product/list_v4':  3000,
  '/store_details/product/available_filters': 3000,
  '/store_details/product/filter':   3000,
};

const DEFAULT_SSR_TIMEOUT_MS = 5000;

@Injectable()
export class SsrHttpTimeoutInterceptor implements HttpInterceptor {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (!isPlatformServer(this.platformId)) {
      return next.handle(req);
    }

    const url = req.url;
    let ms = DEFAULT_SSR_TIMEOUT_MS;
    for (const [needle, limit] of Object.entries(SSR_TIMEOUT_MS)) {
      if (url.includes(needle)) {
        ms = limit;
        break;
      }
    }

    const started = Date.now();
    // Log every SSR HTTP call — both hits (fast, from SsrApiCache) and real
    // network fetches.  This makes 10-second renders debuggable without needing
    // SSR_DIAG=1: the timestamps reveal which call is the bottleneck.
    const label = url.replace(/\?.*/, '').split('/').slice(-2).join('/');
    return next.handle(req).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          const ms_ = Date.now() - started;
          const src = ms_ < 5 ? 'cache' : 'net';
          console.log(`[SSR api] ${ms_}ms [${src}] ${label}`);
        }
      }),
      timeout(ms),
      catchError((err) => {
        const elapsed = Date.now() - started;
        console.warn(`[SSR] HTTP timeout/fail ${ms}ms (${elapsed}ms) ${url}`, err?.name ?? err);
        if (url.includes('/store_details/')) {
          return of(new HttpResponse({ status: 200, body: { status: false } }));
        }
        return throwError(() => err);
      }),
    );
  }
}
