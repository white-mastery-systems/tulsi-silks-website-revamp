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
import { timeout, catchError } from 'rxjs/operators';

/** Per-URL SSR timeouts (ms). Prevents one slow API from blocking render for 10+ s. */
const SSR_TIMEOUT_MS: Record<string, number> = {
  '/store_details/details_v3': 2500,
  '/store_details/layouts': 2500,
  '/store_details/footer_seo_links': 1500,
  '/store_details/blogs': 1500,
  '/store_details/contact_page': 1200,
  '/store_details/ai_styles': 1200,
};

const DEFAULT_SSR_TIMEOUT_MS = 2000;

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
    return next.handle(req).pipe(
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
