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
 * details_v3 and layouts are pre-seeded by Express before Angular boots, so
 * their Angular-level calls should always be instant cache hits.  The 1 000 ms
 * here is a safety net for the rare case where Express seeding fails (e.g. cold
 * start with a completely unreachable API).  Cut from 2 500 ms to 1 000 ms so
 * even an unseeded cold-start can't spend more than 1 s per call.
 *
 * footer_seo_links is now also pre-seeded — same rationale, same cap.
 */
const SSR_TIMEOUT_MS: Record<string, number> = {
  '/store_details/details_v3':     1000,
  '/store_details/layouts':        1000,
  '/store_details/footer_seo_links': 800,
  '/store_details/blogs':           800,
  '/store_details/contact_page':    600,
  '/store_details/ai_styles':       600,
};

const DEFAULT_SSR_TIMEOUT_MS = 800;

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
