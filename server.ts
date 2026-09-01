import 'zone.js/node';

// Suppress DEP0040: built-in `punycode` is deprecated in Node 22 but still
// functional. The warning comes from transitive deps (request, tough-cookie,
// psl, uri-js) that we don't control. Overriding emitWarning (rather than
// listening to the 'warning' event) is the only way to prevent the default
// stderr print. Filter only this code so real warnings remain visible.
const _origEmitWarning = process.emitWarning.bind(process);
(process as any).emitWarning = (warning: any, ...args: any[]) => {
  const code = typeof warning === 'string' ? args[1] : (warning as any)?.code;
  if (code === 'DEP0040') return;
  return _origEmitWarning(warning, ...args);
};

// Polyfill browser-only globals used by third-party libs (e.g. ngx-slider) during SSR.
// Must run before any Angular/component code is imported.
if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
  (globalThis as any).requestAnimationFrame = (cb: (...args: any[]) => void) => setTimeout(cb, 16);
  (globalThis as any).cancelAnimationFrame  = (id: number) => clearTimeout(id);
}

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import express from 'express';
import { existsSync } from 'fs';
import https from 'https';
import { join } from 'path';
import { createGzip, createBrotliCompress, constants as zlibConstants } from 'zlib';

import { environment } from './src/environments/environment';
import bootstrap from './src/main.server';
// Pre-seeds the Angular SSR API response cache so the first render doesn't
// need to make its own HTTPS call for LAYOUT_LIST / STORE_DETAILS.
import { seedSsrApiCache } from './src/app/interceptors/ssr-api-cache.interceptor';

import 'localstorage-polyfill';

(globalThis as { localStorage?: Storage }).localStorage = localStorage;

/** Cached STORE_DETAILS JSON — same endpoint as StoreApiService.STORE_DETAILS().
 *  10-min TTL: store config / catalog changes a few times a day at most. */
let storeDetailsCache: { at: number; json: unknown } | null = null;
const STORE_DETAILS_TTL_MS = 600_000;

/**
 * Express-level LAYOUT_LIST cache (same endpoint as StoreApiService.LAYOUT_LIST()).
 *
 * Why this exists separately from the Angular SsrApiCacheInterceptor:
 *   The Angular cache only activates on the SECOND SSR render (the first must
 *   still make real HTTPS calls to populate it). If the server is freshly
 *   restarted and two concurrent PSI requests arrive, BOTH hit the Angular
 *   cache cold and make simultaneous LAYOUT_LIST calls. This Express-level cache
 *   serialises that: `fetchLayoutList()` resolves immediately for the second
 *   caller once the first one finishes. TTL = 90 s (slightly longer than the
 *   Angular cache's 60 s so there is always a warm entry for the Angular layer).
 */
let layoutListCache: { at: number; json: unknown } | null = null;
const LAYOUT_LIST_TTL_MS = 90_000;

function fetchLayoutList(): Promise<any> {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (layoutListCache && now - layoutListCache.at < LAYOUT_LIST_TTL_MS) {
      resolve(layoutListCache.json);
      return;
    }
    const url = `${environment.ws_url}/store_details/layouts?json=1&store_id=${environment.store_id}`;
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (ch: string) => { body += ch; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          layoutListCache = { at: Date.now(), json };
          resolve(json);
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(4000, () => { req.destroy(); reject(new Error('layoutList timeout')); });
  });
}

/** Express-level cache for footer SEO links — same TTL as LAYOUT_LIST. */
let footerSeoLinksCache: { at: number; json: unknown } | null = null;
const FOOTER_SEO_LINKS_TTL_MS = 90_000;

function fetchFooterSeoLinks(): Promise<any> {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (footerSeoLinksCache && now - footerSeoLinksCache.at < FOOTER_SEO_LINKS_TTL_MS) {
      resolve(footerSeoLinksCache.json);
      return;
    }
    const url = `${environment.ws_url}/store_details/footer_seo_links?store_id=${environment.store_id}`;
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (ch: string) => { body += ch; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          footerSeoLinksCache = { at: Date.now(), json };
          resolve(json);
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('footerSeoLinks timeout')); });
  });
}

/**
 * In-process SSR HTML cache for public pages.
 *
 * Homepage used to be the only cached path. Googlebot crawling thousands of
 * unique /product and /category sitemap URLs therefore always hit a cold
 * CommonEngine.render() — Node's event loop stacked 10–18 s TTFB and nginx
 * returned 504. Cache key still includes device bucket so mobile HTML is never
 * served to desktop (hydration mismatch).
 */
const ssrHtmlCache = new Map<string, { at: number; html: string }>();
const SSR_HTML_CACHE_TTL_MS = Number(process.env['SSR_HTML_CACHE_TTL_MS'] ?? 120_000);
const SSR_HTML_CACHE_MAX = Number(process.env['SSR_HTML_CACHE_MAX'] ?? 400);
const MAX_CONCURRENT_SSR = Number(process.env['SSR_MAX_CONCURRENT'] ?? 2);
const SSR_QUEUE_WAIT_MS = Number(process.env['SSR_QUEUE_WAIT_MS'] ?? 12_000);
const SSR_RENDER_TIMEOUT_MS = Number(process.env['SSR_RENDER_TIMEOUT_MS'] ?? 15_000);

const SSR_NO_CACHE_PREFIXES = [
  '/cart',
  '/checkout',
  '/account',
  '/wishlist',
  '/guest-login',
  '/search',
  '/vendor-login',
  '/vendor-register',
  '/vendor-enquiry',
];

function isSsrHtmlCacheable(pathOnly: string): boolean {
  const p = (pathOnly || '/').toLowerCase();
  return !SSR_NO_CACHE_PREFIXES.some((prefix) => p === prefix || p.startsWith(`${prefix}/`));
}

function ssrHtmlCacheGet(key: string, allowStale = false): { at: number; html: string } | undefined {
  const hit = ssrHtmlCache.get(key);
  if (!hit) return undefined;
  const fresh = Date.now() - hit.at < SSR_HTML_CACHE_TTL_MS;
  if (!fresh && !allowStale) return undefined;
  ssrHtmlCache.delete(key);
  ssrHtmlCache.set(key, hit);
  return hit;
}

function ssrHtmlCacheSet(key: string, html: string): void {
  if (ssrHtmlCache.has(key)) ssrHtmlCache.delete(key);
  ssrHtmlCache.set(key, { at: Date.now(), html });
  while (ssrHtmlCache.size > SSR_HTML_CACHE_MAX) {
    const oldest = ssrHtmlCache.keys().next().value;
    if (oldest === undefined) break;
    ssrHtmlCache.delete(oldest);
  }
}

let activeSsrRenders = 0;
const ssrWaitQueue: Array<() => void> = [];
const ssrInflight = new Map<string, Promise<string>>();

function acquireSsrSlot(): Promise<void> {
  if (activeSsrRenders < MAX_CONCURRENT_SSR) {
    activeSsrRenders++;
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      const i = ssrWaitQueue.indexOf(entry);
      if (i >= 0) ssrWaitQueue.splice(i, 1);
      reject(Object.assign(new Error('SSR_QUEUE_TIMEOUT'), { code: 'SSR_QUEUE_TIMEOUT' }));
    }, SSR_QUEUE_WAIT_MS);
    const entry = () => {
      clearTimeout(timer);
      activeSsrRenders++;
      resolve();
    };
    ssrWaitQueue.push(entry);
  });
}

function releaseSsrSlot(): void {
  activeSsrRenders = Math.max(0, activeSsrRenders - 1);
  const next = ssrWaitQueue.shift();
  if (next) next();
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(label)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

function sendCompressedHtml(
  req: express.Request,
  res: express.Response,
  html: string,
  cacheStatus: 'HIT' | 'MISS' | 'STALE',
): void {
  const ae = String(req.headers['accept-encoding'] || '').toLowerCase();
  const pathOnly = (req.originalUrl || '/').split('?')[0];
  const isBlogPath = pathOnly.startsWith('/blogs');
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Vary', 'Accept-Encoding');
  res.setHeader('X-SSR-Cache', cacheStatus);
  res.setHeader(
    'Cache-Control',
    isBlogPath
      ? 'public, max-age=300, stale-while-revalidate=600'
      : 'public, max-age=3600, stale-while-revalidate=86400',
  );
  if (ae.includes('gzip')) {
    res.setHeader('Content-Encoding', 'gzip');
    const gz = createGzip({ level: 6 });
    gz.pipe(res);
    gz.end(html);
  } else if (ae.includes('br')) {
    res.setHeader('Content-Encoding', 'br');
    const br = createBrotliCompress({
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 4,
        [zlibConstants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(html, 'utf8'),
      },
    });
    br.pipe(res);
    br.end(html);
  } else {
    res.send(html);
  }
}

let sitemapCache: { at: number; xml: string } | null = null;
const SITEMAP_TTL_MS = 3_600_000;

function fetchSitemapXml(): Promise<string> {
  if (sitemapCache && Date.now() - sitemapCache.at < SITEMAP_TTL_MS) {
    return Promise.resolve(sitemapCache.xml);
  }
  return new Promise((resolve, reject) => {
    const url = `https://yourstore.io/api/store_details/sitemap?store_id=${environment.store_id}`;
    const req = https.get(url, (up) => {
      const chunks: Buffer[] = [];
      up.on('data', (ch: Buffer) => { chunks.push(ch); });
      up.on('end', () => {
        const xml = Buffer.concat(chunks).toString('utf8');
        if (up.statusCode && up.statusCode >= 200 && up.statusCode < 300 && xml.includes('<urlset')) {
          sitemapCache = { at: Date.now(), xml };
          resolve(xml);
        } else if (sitemapCache) {
          resolve(sitemapCache.xml);
        } else {
          reject(new Error(`sitemap upstream ${up.statusCode}`));
        }
      });
      up.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('sitemap timeout')); });
  });
}

/** Matches the same UA patterns as the Nginx $ts_device_type map. */
function uaDeviceBucket(ua: string): 'mobile' | 'desktop' {
  return /Mobile|Android|iPhone|iPad|iPod|BlackBerry|Windows Phone|Opera Mini|IEMobile/i.test(ua)
    ? 'mobile'
    : 'desktop';
}

function fetchStoreDetailsV3(): Promise<any> {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (storeDetailsCache && now - storeDetailsCache.at < STORE_DETAILS_TTL_MS) {
      resolve(storeDetailsCache.json);
      return;
    }
    const url = `${environment.ws_url}/store_details/details_v3?json=1&store_id=${environment.store_id}`;
    const req = https.get(url, (res) => {
      let body = '';
      res.on('data', (ch) => { body += ch; });
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          storeDetailsCache = { at: Date.now(), json };
          resolve(json);
        } catch (e) { reject(e); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    // 3-second hard cap. Without this, a slow/unreachable API blocks the
    // post-render SEO injection step for 10+ seconds (the main cause of 13 s SSR).
    req.setTimeout(3000, () => { req.destroy(); reject(new Error('storeDetailsV3 timeout')); });
  });
}

function escapeHtmlAttr(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;');
}

function htmlHasEmptyTitle(html: string): boolean {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return !m || !String(m[1]).trim();
}

function metaDescriptionIsEmpty(html: string): boolean {
  const m = html.match(/<meta\s+name="description"[^>]*>/i);
  if (!m) {
    return true;
  }
  const tag = m[0];
  const quoted = tag.match(/content\s*=\s*["']([^"']*)["']/i);
  if (quoted) {
    return !String(quoted[1]).trim();
  }
  return true;
}

/** Patch head when SSR still emitted an empty &lt;title&gt; (timing / optimizers). */
function injectStoreSeoIntoHtml(html: string, apiJson: any): string {
  const seo = apiJson?.store_details?.seo_details;
  if (!seo?.page_title) {
    return html;
  }
  const title = escapeHtmlAttr(seo.page_title);
  const desc = escapeHtmlAttr(seo.meta_desc ?? '');
  const tile = escapeHtmlAttr(String(seo.tile_color ?? ''));
  const ogImg = escapeHtmlAttr(`${environment.img_baseurl}uploads/${environment.store_id}/social_logo.jpg`);

  let out = html;
  out = out.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${title}</title>`);
  out = out.replace(/<meta name="theme-color"[^>]*>/i, `<meta name="theme-color" content="${tile}">`);
  out = out.replace(/<meta name="description"[^>]*>/i, `<meta name="description" content="${desc}">`);
  out = out.replace(/<meta property="og:site_name"[^>]*>/i, `<meta property="og:site_name" content="${title}">`);
  out = out.replace(/<meta property="og:title"[^>]*>/i, `<meta property="og:title" content="${title}">`);
  out = out.replace(/<meta property="og:description"[^>]*>/i, `<meta property="og:description" content="${desc}">`);
  out = out.replace(/<meta property="og:image"[^>]*>/i, `<meta property="og:image" content="${ogImg}">`);
  out = out.replace(/<meta property="og:image:width"[^>]*>/i, `<meta property="og:image:width" content="1200">`);
  out = out.replace(/<meta property="og:image:height"[^>]*>/i, `<meta property="og:image:height" content="630">`);
  return out;
}

export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/ecommerce/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? join(distFolder, 'index.original.html')
    : join(distFolder, 'index.html');

  /** Angular 20 SSR SSRF guard — without this, localhost requests fall back to CSR (empty shell meta in view-source). */
  const allowedHostsFromEnv = String(process.env['NG_ALLOWED_HOSTS'] ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const commonEngineAllowedHosts = [
    ...new Set([
      'localhost',
      '127.0.0.1',
      '148.113.6.22',
      'tulsisilks.co.in',
      environment.domain,
      ...(environment.domain ? [`www.${environment.domain}`] : []),
      ...allowedHostsFromEnv,
    ]),
  ];
  console.log('[SSR] allowedHosts:', commonEngineAllowedHosts);
  const commonEngine = new CommonEngine({
    allowedHosts: commonEngineAllowedHosts,
  });
  const robotsAccess = 'Allow';

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // sitemap — cached 1 h so Googlebot / GSC never wait on a cold upstream generate
  server.use('/sitemap.xml', function (req, res) {
    fetchSitemapXml()
      .then((xml) => {
        res.type('application/xml');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        res.send(xml);
      })
      .catch((err) => {
        console.error('[SSR] sitemap fetch failed:', (err as Error)?.message ?? err);
        if (sitemapCache) {
          res.type('application/xml');
          res.setHeader('Cache-Control', 'public, max-age=120');
          res.send(sitemapCache.xml);
          return;
        }
        res.status(502).type('text/plain').send('Sitemap unavailable');
      });
  });

  // robots
  server.use('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-Agent: *\n"+robotsAccess+": /\nSitemap: https://"+environment.domain+"/sitemap.xml");
  });

  // link redirection
  server.use('/sections/by-category', function(req, res) {
    res.redirect(301, '/sections/regional-collections');
  });
  server.use('/sections/by-colours', function(req, res) {
    res.redirect(301, '/sections/sarees-by-colour');
  });
  server.use('/saree/kanjivaram-silk-sarees.html', function(req, res) {
    res.redirect('/category/kanjivaram-silk-sarees');
  });
  server.use('/saree/soft-silk.html', function(req, res) {
    res.redirect('/category/soft-silk');
  });
  server.use('/saree/ikat.html', function(req, res) {
    res.redirect('/category/ikat');
  });
  server.use('/saree/tussar-silk.html', function(req, res) {
    res.redirect('/category/tussar-silk-sarees');
  });
  server.use('/saree/cotton-sarees.html', function(req, res) {
    res.redirect('/category/cotton');
  });
  server.use('/saree/banaras-sarees.html', function(req, res) {
    res.redirect('/category/banaras-sarees');
  });
  server.use('/saree/linen-silk.html', function(req, res) {
    res.redirect('/category/linen-silk');
  });
  server.use('/blogs/trending-saree-blouse-designs-for-designer-sarees-and-how-to-make-them', function(req, res) {
    res.redirect('/blogs/20-saree-blouse-neck-designs-front-and-back');
  });
  server.use('/home', function(req, res) {
    res.redirect('/');
  });
  server.use('/product/beige-and-black-tussar-printed-saree-t588564-shipping-10-to-15-days-t588564', function(req, res) {
    res.redirect('/product/beige-and-black-tussar-printed-saree-t588564-t588564');
  });
  server.use('/product/beige-and-yellow-tussar-printed-saree-t588562-shipping-10-to-15-days-t588562', function(req, res) {
    res.redirect('/product/beige-and-yellow-tussar-printed-saree-t588562-t588562');
  });
  server.use('/category/5d3aba773880672656301ac6', function(req, res) {
    res.redirect('/category/view-all-six-yards');
  });
  server.use('/category/5d38185edf972007f663040e', function(req, res) {
    res.redirect('/category/traditional-kanjivaram-silk-sarees');
  });
  server.use('/category/tissue-kanjivaram', function(req, res) {
    res.redirect('/category/kanjivaram-tissue-silk-sarees');
  });
  server.use('/category/5d32c0fcc3fd167a10dcfca2', function(req, res) {
    res.redirect('/category/bridal-kanjivaram-silk-sarees');
  });
  server.use('/category/5d381824df972007f6630409', function(req, res) {
    res.redirect('/category/checked-kanjivaram-silk-sarees');
  });
  server.use('/category/5d38596cdf972007f6630528', function(req, res) {
    res.redirect('/category/chiffon');
  });
  server.use('/category/5d385966df972007f6630525', function(req, res) {
    res.redirect('/category/crepe');
  });
  server.use('/category/5d32c153c3fd167a10dcfcba', function(req, res) {
    res.redirect('/category/dupatta');
  });
  server.use('/category/5d38595fdf972007f6630523', function(req, res) {
    res.redirect('/category/georgette');
  });
  server.use('/category/5d381295df972007f66303f1', function(req, res) {
    res.redirect('/category/kani-silk');
  });
  server.use('/category/5d381801df972007f6630402', function(req, res) {
    res.redirect('/category/korvai-kanjivaram-silk-sarees');
  });
  server.use('/category/5d38341bdf972007f6630477', function(req, res) {
    res.redirect('/category/linen-embroidery');
  });
  server.use('/category/5d383328df972007f6630456', function(req, res) {
    res.redirect('/category/tussar');
  });
  server.use('/category/5d3834f8df972007f66304a2', function(req, res) {
    res.redirect('/category/tussar-kota');
  });
  server.use('/category/5d38336cdf972007f663046a', function(req, res) {
    res.redirect('/category/woven-raw-silk');
  });
  server.use('/blogs/12-latest-saree-trends-in-2025', function(req, res) {
    res.redirect('/blogs/latest-saree-trends-in-2025-new-trend-saree-collection-for-women');
  });
  server.use('/blogs/12-different-types-of-silk-and-sarees-made-from-them', function(req, res) {
    res.redirect('/blogs/12-different-types-of-silk-sarees-made-for-every-indian-women');
  });
  server.use('/category/view-all-kanjivaram', function(req, res) {
    res.redirect('/category/kanjivaram-silk-sarees');
  });
  server.use('/category/kanjivaram-saree', function(req, res) {
    res.redirect('/category/kanjivaram-silk-sarees');
  });
  server.use('/category/pattupettu', function(req, res) {
    res.redirect('/category/kanjivaram-pattu-silk-sarees');
  });
  server.use('/category/korvai', function(req, res) {
    res.redirect('/category/korvai-kanjivaram-silk-sarees');
  });
  server.use('/category/without-border', function(req, res) {
    res.redirect('/category/borderless-kanjivaram-silk-sarees');
  });
  server.use('/category/checks', function(req, res) {
    res.redirect('/category/checked-kanjivaram-silk-sarees');
  });
  server.use('/category/traditional', function(req, res) {
    res.redirect('/category/traditional-kanjivaram-silk-sarees');
  });
  server.use('/category/zari-brocade', function(req, res) {
    res.redirect('/category/brocade-kanjivaram-silk-sarees');
  });
  server.use('/category/classic', function(req, res) {
    res.redirect('/category/kanjivaram-classic-silk-sarees');
  });
  server.use('/category/bridal-kanjivaram', function(req, res) {
    res.redirect('/category/bridal-kanjivaram-silk-sarees');
  });
  server.use('/category/engagement-sarees', function(req, res) {
    res.redirect('/category/engagement-kanjivaram-silk-sarees');
  });
  server.use('/category/embroidery', function(req, res) {
    res.redirect('/category/embroidery-kanjivaram-silk-sarees');
  });
  server.use('/category/tussar', function(req, res) {
    res.redirect('/category/tussar-banarasi-silk-sarees');
  });
  server.use('/category/banaras-georgette', function(req, res) {
    res.redirect('/category/georgette-banarasi-silk-sarees');
  });
  server.use('/category/organza', function(req, res) {
    res.redirect('/category/organza-banarasi-silk-sarees');
  });
  server.use('/category/banaras-cotton', function(req, res) {
    res.redirect('/category/cotton-banarasi-silk-sarees');
  });
  server.use('/category/banaras-kathan-silk', function(req, res) {
    res.redirect('/category/kathan-banarasi-silk-sarees');
  });
  server.use('/category/view-all-banaras', function(req, res) {
    res.redirect('/category/banarasi-silk-sarees');
  });
  server.use('/category/banarasi-silk', function(req, res) {
    res.redirect('/category/banarasi-silk-sarees');
  });
  server.use('/category/view-all-organza', function(req, res) {
    res.redirect('/category/organza-sarees');
  });
  server.use('/category/woven-organza', function(req, res) {
    res.redirect('/category/woven-organza-sarees');
  });
  server.use('/category/printed-organza', function(req, res) {
    res.redirect('/category/printed-organza-sarees');
  });
  server.use('/category/organza-embroidery', function(req, res) {
    res.redirect('/category/embroidered-organza-sarees');
  });
  server.use('/category/black-party-wear-sarees', function(req, res) {
    res.redirect('/category/party-wear-black-sarees');
  });
  server.use('/category/black-festive-wear-sarees', function(req, res) {
    res.redirect('/category/festive-wear-black-sarees');
  });
  server.use('/category/black-traditional-sarees', function(req, res) {
    res.redirect('/category/traditional-black-sarees');
  });
  server.use('/category/black-office-wear-sarees', function(req, res) {
    res.redirect('/category/office-wear-black-sarees');
  });
  server.use('/category/black-daily-wear-sarees', function(req, res) {
    res.redirect('/category/daily-wear-black-sarees');
  });
  server.use('/category/black-farewell-sarees', function(req, res) {
    res.redirect('/category/farewell-black-sarees');
  });
  server.use('/category/black-printed-sarees', function(req, res) {
    res.redirect('/category/printed-black-sarees');
  });
  server.use('/category/black-embroidered-sarees', function(req, res) {
    res.redirect('/category/embroidered-black-sarees');
  });
  server.use('/category/black-floral-sarees', function(req, res) {
    res.redirect('/category/floral-black-sarees');
  });
  server.use('/category/black-bandhani-sarees', function(req, res) {
    res.redirect('/category/bandhani-black-sarees');
  });
  server.use('/category/black-brocade-sarees', function(req, res) {
    res.redirect('/category/brocade-black-sarees');
  });
  server.use('/category/black-checked-sarees', function(req, res) {
    res.redirect('/category/checked-black-sarees');
  });
  server.use('/category/black-borderless-sarees', function(req, res) {
    res.redirect('/category/borderless-black-sarees');
  });
  server.use('/category/black-big-border-sarees', function(req, res) {
    res.redirect('/category/big-border-black-sarees');
  });
  server.use('/category/black-small-border-sarees', function(req, res) {
    res.redirect('/category/small-border-black-sarees');
  });
  server.use('/category/black-kantha-work-sarees', function(req, res) {
    res.redirect('/category/kantha-work-black-sarees');
  });
  server.use('/category/black-fancy-sarees', function(req, res) {
    res.redirect('/category/fancy-black-sarees');
  });
  server.use('/category/black-plain-sarees', function(req, res) {
    res.redirect('/category/plain-black-sarees');
  });
  server.use('/category/black-woven-sarees', function(req, res) {
    res.redirect('/category/woven-black-sarees');
  });
  server.use('/category/black-zari-weave-sarees', function(req, res) {
    res.redirect('/category/zari-weave-black-sarees');
  });
  server.use('/category/black-korvai-weave-sarees', function(req, res) {
    res.redirect('/category/korvai-weave-black-sarees');
  });
  server.use('/category/black-kora-weave-sarees', function(req, res) {
    res.redirect('/category/kora-weave-black-sarees');
  });
  server.use('/category/view-all-cotton', function(req, res) {
    res.redirect('/category/cotton-sarees');
  });

  server.use('/google9a3e8f0e11ae13bf.html', function(req, res) {
    res.type('text/html').send('google-site-verification: google9a3e8f0e11ae13bf.html');
  });

  server.get('*.*', express.static(distFolder, {
    setHeaders(res, filePath) {
      const normalized = filePath.replace(/\\/g, '/');
      if (/\.[0-9a-f]{8,}\.(js|css|woff2?|png|jpg|webp|svg)$/i.test(filePath)) {
        // Content-hashed bundles: cache forever
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (/\/assets\/fonts\/.+\.woff2?$/i.test(normalized)) {
        // Self-hosted fonts have stable filenames (no content hash) but the file
        // contents never change unless we explicitly replace them. Cache for 1 year
        // without `immutable` so we can override by renaming if we ever update.
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      } else {
        // Non-hashed assets (script.js, images, fonts without hash): always revalidate
        res.setHeader('Cache-Control', 'no-cache');
      }
      res.setHeader('Vary', 'Accept-Encoding');
    }
  }));

  // CRITICAL: any URL with a file extension that falls through express.static
  // (because the file does not exist in distFolder) MUST return a hard 404 —
  // NEVER let it fall through to the SSR catch-all below.
  //
  // Why: when an old content-hashed JS bundle (e.g. main.7a6af9ad...js from a
  // previous deploy) is requested by a stale cached HTML or a user with stale
  // browser cache, the SSR catch-all happily rendered the full home page HTML
  // (755 KB!) and returned it with content-type: text/html. The browser then
  // either silently refused to execute the response (strict MIME) or wasted
  // ~750 KB of high-priority bandwidth, dragging LCP to 16+ s on Slow 4G.
  //
  // Same problem hit /favicon.ico — the project does not ship a favicon, so
  // every fresh visit (including every PSI run) was downloading 755 KB of
  // junk for the default browser favicon request.
  //
  // After this middleware: missing static assets return a 22-byte 404 (compresses
  // to ~30 bytes on the wire) instead of 750 KB of SSR HTML. Frees the network
  // for the actual LCP image.
  server.get('*.*', (req, res) => {
    res.status(404).type('text/plain').send('Not Found');
  });

  server.get('*', async (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const pathOnly = (originalUrl || '/').split('?')[0];
    const isHomePath = pathOnly === '/' || pathOnly === '';
    const cacheable = isSsrHtmlCacheable(pathOnly);
    const device = uaDeviceBucket(String(headers['user-agent'] ?? ''));
    const cacheKey = `${headers.host}|${pathOnly}|${device}`;

    if (cacheable && SSR_HTML_CACHE_TTL_MS > 0) {
      const hit = ssrHtmlCacheGet(cacheKey);
      if (hit) {
        console.log(
          `[SSR] cache HIT ${originalUrl} — 0 ms, ${Math.round(Buffer.byteLength(hit.html, 'utf8') / 1024)} KB raw`,
        );
        sendCompressedHtml(req, res, hit.html, 'HIT');
        return;
      }
    }

    const existing = ssrInflight.get(cacheKey);
    if (existing) {
      try {
        const html = await withTimeout(existing, SSR_RENDER_TIMEOUT_MS, 'SSR_RENDER_TIMEOUT');
        sendCompressedHtml(req, res, html, 'HIT');
      } catch (err) {
        const message = (err as Error)?.message ?? String(err);
        if (message === 'SSR_RENDER_TIMEOUT') {
          const stale = cacheable ? ssrHtmlCacheGet(cacheKey, true) : undefined;
          if (stale) {
            sendCompressedHtml(req, res, stale.html, 'STALE');
          } else {
            res.status(503).setHeader('Retry-After', '10').type('text/plain').send('Service busy, retry shortly');
          }
          return;
        }
        console.error('[SSR] inflight render failed for', originalUrl, ':', message);
        next(err);
      }
      return;
    }

    const ssrStartMs = Date.now();

    // Register inflight BEFORE waiting for a concurrency slot so two Googlebot
    // hits on the same URL share one render instead of taking two slots.
    const renderPromise = (async (): Promise<string> => {
      await acquireSsrSlot();
      try {
        const seeds: Promise<unknown>[] = [
          fetchStoreDetailsV3().then((json) => {
            if (json?.store_details) {
              const u = `${environment.ws_url}/store_details/details_v3?json=1&store_id=${environment.store_id}`;
              seedSsrApiCache(u, json);
            }
          }),
          fetchFooterSeoLinks().then((json) => {
            if (json) {
              const u = `${environment.ws_url}/store_details/footer_seo_links?store_id=${environment.store_id}`;
              seedSsrApiCache(u, json);
            }
          }),
        ];
        if (isHomePath) {
          seeds.push(
            fetchLayoutList().then((json) => {
              if (json) {
                const u = `${environment.ws_url}/store_details/layouts?json=1&store_id=${environment.store_id}`;
                seedSsrApiCache(u, json);
              }
            }),
          );
        }
        await Promise.allSettled(seeds);
        const html = await commonEngine.render({
          bootstrap,
          documentFilePath: indexHtml,
          url: `${protocol}://${headers.host}${originalUrl}`,
          publicPath: distFolder,
          providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
        });
        let out = html;
        if (isHomePath && storeDetailsCache && (htmlHasEmptyTitle(out) || metaDescriptionIsEmpty(out))) {
          try {
            const api = await fetchStoreDetailsV3();
            out = injectStoreSeoIntoHtml(out, api);
          } catch (e) {
            const err = e as Error;
            console.error('[SSR] store SEO inject failed:', err?.message ?? e);
          }
        }
        if (cacheable && SSR_HTML_CACHE_TTL_MS > 0) {
          ssrHtmlCacheSet(cacheKey, out);
        }
        return out;
      } finally {
        releaseSsrSlot();
      }
    })();

    ssrInflight.set(cacheKey, renderPromise);
    renderPromise.finally(() => {
      if (ssrInflight.get(cacheKey) === renderPromise) {
        ssrInflight.delete(cacheKey);
      }
    });

    try {
      const out = await withTimeout(renderPromise, SSR_RENDER_TIMEOUT_MS, 'SSR_RENDER_TIMEOUT');
      const ssrMs = Date.now() - ssrStartMs;
      const ssrRawBytes = Buffer.byteLength(out, 'utf8');
      const level = ssrRawBytes > 250_000 || ssrMs > 800 ? 'WARN' : 'info';
      console[level === 'WARN' ? 'warn' : 'log'](
        `[SSR] ${level} ${originalUrl} — ${ssrMs} ms, ${Math.round(ssrRawBytes / 1024)} KB raw`
      );
      if (level === 'WARN') {
        console.warn(`[SSR] bottleneck hint: slow render or payload — enable SSR_DIAG=1 on Node for API marks`);
      }
      sendCompressedHtml(req, res, out, 'MISS');
    } catch (err) {
      const message = (err as Error)?.message ?? String(err);
      if (message === 'SSR_RENDER_TIMEOUT' || (err as { code?: string })?.code === 'SSR_QUEUE_TIMEOUT') {
        const stale = cacheable ? ssrHtmlCacheGet(cacheKey, true) : undefined;
        if (stale) {
          console.warn(`[SSR] ${message} — serving STALE ${originalUrl}`);
          sendCompressedHtml(req, res, stale.html, 'STALE');
        } else {
          console.warn(`[SSR] ${message} ${originalUrl} — 503 (prevents 504)`);
          res.status(503).setHeader('Retry-After', '10').type('text/plain').send('Service busy, retry shortly');
        }
      } else {
        console.error('[SSR] render error for', originalUrl, ':', message);
        next(err);
      }
    }
  });

  return server;
}

/**
 * Warm up the SSR API cache and in-process HTML cache by firing internal
 * requests right after the server starts. This hides the 10-13 s cold-render
 * cost from the first real visitor — by the time traffic arrives the Angular
 * SsrApiCacheInterceptor and ssrHtmlCache are already populated.
 *
 * Two renders (desktop UA + mobile UA) are triggered in parallel so both
 * device-type branches of the HTML cache are warm. The requests hit the
 * loopback interface and are never exposed externally.
 *
 * If the warm-up fails (API down at boot time) the server still serves traffic
 * normally — the first real request will just be the usual cold render.
 */
function warmUpSsr(port: number): void {
  const UAS = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
  ];

  const http = require('http') as typeof import('http');

  const renderOne = (ua: string): Promise<void> =>
    new Promise<void>((resolve) => {
      const req = http.get(
        { host: '127.0.0.1', port, path: '/', headers: { 'user-agent': ua, 'accept-encoding': 'gzip' } },
        (res) => { res.resume(); res.on('end', resolve); res.on('error', resolve); },
      );
      req.on('error', resolve);
      req.setTimeout(30_000, () => { req.destroy(); resolve(); });
    });

  const start = Date.now();
  Promise.all(UAS.map(renderOne)).then(() => {
    console.log(`[SSR] warm-up complete — ${Date.now() - start} ms (API + HTML cache hot)`);
  }).catch((e) => {
    console.warn('[SSR] warm-up error:', (e as Error)?.message ?? e);
  });
}

function run(): void {
  const port = Number(process.env['PORT'] ?? environment.port);
  const srv = app();
  srv.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
    warmUpSsr(port);
  });
}

declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export default bootstrap;
