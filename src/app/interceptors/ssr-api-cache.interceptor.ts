import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
} from '@angular/common/http';
import { isPlatformServer } from '@angular/common';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

/**
 * Cross-render SSR API response cache.
 *
 * Problem it solves:
 *   Angular SSR creates fresh service instances per render. There is no
 *   built-in mechanism to share API responses across concurrent or sequential
 *   SSR renders in the same Node.js process. Each SSR render therefore makes
 *   its own HTTPS calls to yourstore.io/api — STORE_DETAILS, LAYOUT_LIST,
 *   FOOTER_SEO_LINKS, etc. — even when the previous render completed 50 ms
 *   ago with identical results. Because those API calls are sequential and
 *   each can take 1–3 s, a single cold render takes 10–13 s.
 *
 * How it works:
 *   The module-level `_cache` Map is a Node.js singleton — it is allocated
 *   once per process and survives across all Angular SSR renders. The DI
 *   interceptor reads from it (returning an immediate synthetic HttpResponse)
 *   or writes to it after the first real network call completes.
 *
 *   First render (cold cache):  real HTTPS calls, ~10 s, populates cache.
 *   Second render (warm cache): all GET responses served from cache, ~100 ms.
 *   After TTL:                  stale entry evicted, next render re-fetches.
 *
 * TTL:
 *   Default 60 s — configurable via SSR_API_CACHE_TTL_MS env var.
 *   Set to 0 to disable (useful in dev where you want fresh data every render).
 *   Content editors: a CMS publish → new data visible within 60 s on the
 *   NEXT cold SSR render. Nginx caches the rendered HTML for 1 h anyway, so
 *   end-user visibility of CMS changes is already ≥ 1 h.
 *
 * Only runs on the server; browser requests are passed through unchanged.
 */

// ── Module-level singleton ────────────────────────────────────────────────

interface CacheEntry {
  at: number;
  body: unknown;
}

const _cache = new Map<string, CacheEntry>();
/** In-flight GETs/POSTs shared across concurrent SSR renders (thundering-herd). */
const _inflight = new Map<string, Observable<HttpEvent<unknown>>>();

/**
 * Catalog POSTs that are read-only. Without this, every product/category SSR
 * misses the GET-only cache and fires a fresh HTTPS call — Googlebot crawling
 * the sitemap then stampedes Node (10–18 s TTFB / 504).
 */
const CACHEABLE_POST_NEEDLES = [
  '/store_details/product/details',
  '/store_details/product/list_v4',
  '/store_details/product/available_filters',
  '/store_details/product/filter',
];

const CACHE_TTL_MS = (() => {
  const raw = (
    globalThis as { process?: { env?: Record<string, string | undefined> } }
  ).process?.env?.['SSR_API_CACHE_TTL_MS'];
  const n = Number(raw ?? 60_000);
  return Number.isFinite(n) && n >= 0 ? n : 60_000;
})();

function cacheGet(url: string): unknown | null {
  if (CACHE_TTL_MS === 0) return null;
  const entry = _cache.get(url);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    _cache.delete(url);
    return null;
  }
  return entry.body;
}

function cacheSet(url: string, body: unknown): void {
  if (CACHE_TTL_MS === 0) return;
  _cache.set(url, { at: Date.now(), body });
}

/**
 * Called from server.ts BEFORE commonEngine.render() to pre-seed the cache
 * with data already fetched at the Express level. This eliminates the HTTPS
 * round-trip that Angular would otherwise make for that URL during SSR —
 * the interceptor returns the seeded value instantly on first access.
 */
export function seedSsrApiCache(url: string, body: unknown): void {
  cacheSet(url, body);
}

function requestCacheKey(req: HttpRequest<unknown>): string {
  if (req.method === 'GET') {
    return req.url;
  }
  return `${req.method}:${req.url}:${JSON.stringify(req.body ?? '')}`;
}

function shouldCacheRequest(req: HttpRequest<unknown>): boolean {
  if (req.method === 'GET') {
    return true;
  }
  if (req.method !== 'POST') {
    return false;
  }
  return CACHEABLE_POST_NEEDLES.some((needle) => req.url.includes(needle));
}

// ── DI interceptor ────────────────────────────────────────────────────────

@Injectable()
export class SsrApiCacheInterceptor implements HttpInterceptor {
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  intercept(
    req: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    if (!isPlatformServer(this.platformId) || !shouldCacheRequest(req)) {
      return next.handle(req);
    }

    const key = requestCacheKey(req);
    const hit = cacheGet(key);

    if (hit !== null) {
      // Return immediately — zero network latency for all subsequent SSR renders.
      return of(new HttpResponse({ status: 200, body: hit, url: req.url }));
    }

    const pending = _inflight.get(key);
    if (pending) {
      return pending;
    }

    // Cache miss: one network call shared by every concurrent render of this URL.
    const shared = next.handle(req).pipe(
      tap((event) => {
        if (
          event instanceof HttpResponse &&
          event.status === 200 &&
          event.body != null &&
          // Do NOT cache explicit API errors — { status: false } is the fallback
          // body emitted by SsrHttpTimeoutInterceptor when an API call times out.
          // Caching it would lock all subsequent SSR renders into an empty-store
          // shell for up to 60 s even after the upstream API recovers.
          (event.body as any)?.status !== false
        ) {
          cacheSet(key, event.body);
        }
      }),
      finalize(() => {
        _inflight.delete(key);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    _inflight.set(key, shared);
    return shared;
  }
}
