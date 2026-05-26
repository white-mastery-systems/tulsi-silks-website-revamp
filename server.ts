import 'zone.js/node';

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

import 'localstorage-polyfill';

(globalThis as { localStorage?: Storage }).localStorage = localStorage;

/** Cached STORE_DETAILS JSON — same endpoint as StoreApiService.STORE_DETAILS().
 *  Bumped from 2 min → 10 min so we don't hit the upstream API on every SSR
 *  miss. The store details payload (catalog list, store config) changes at most
 *  a few times per day, so 10 min lag is invisible to users. */
let storeDetailsCache: { at: number; json: unknown } | null = null;
const STORE_DETAILS_TTL_MS = 600_000;

function fetchStoreDetailsV3(): Promise<any> {
  return new Promise((resolve, reject) => {
    const now = Date.now();
    if (storeDetailsCache && now - storeDetailsCache.at < STORE_DETAILS_TTL_MS) {
      resolve(storeDetailsCache.json);
      return;
    }
    const url = `${environment.ws_url}/store_details/details_v3?json=1&store_id=${environment.store_id}`;
    https
      .get(url, (res) => {
        let body = '';
        res.on('data', (ch) => {
          body += ch;
        });
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            storeDetailsCache = { at: Date.now(), json };
            resolve(json);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
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
  const request = require('request');
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

  // sitemap
  server.use('/sitemap.xml', function (req, res) {
    // res.sendFile(join(DIST_FOLDER,'sitemap.xml'));
    request.get("https://yourstore.io/api/store_details/sitemap?store_id="+environment.store_id, function (err, response, body) {
      res.type('application/xml');
      res.send(body);
    });
  });

  // robots
  server.use('/robots.txt', function (req, res) {
    res.type('text/plain');
    res.send("User-Agent: *\n"+robotsAccess+": /\nSitemap: https://"+environment.domain+"/sitemap.xml");
  });

  // link redirection
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

  server.get('*', (req, res, next) => {
    const { protocol, originalUrl, baseUrl, headers } = req;
    const pathOnly = (originalUrl || '/').split('?')[0];
    const isHomePath = pathOnly === '/' || pathOnly === '';
    commonEngine
      .render({
        bootstrap,
        documentFilePath: indexHtml,
        url: `${protocol}://${headers.host}${originalUrl}`,
        publicPath: distFolder,
        providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
      })
      .then(async (html) => {
        let out = html;
        /* Home: default store SEO. Other routes rely on route components — do not overwrite with store meta. */
        if (isHomePath && (htmlHasEmptyTitle(out) || metaDescriptionIsEmpty(out))) {
          try {
            const api = await fetchStoreDetailsV3();
            out = injectStoreSeoIntoHtml(out, api);
          } catch (e) {
            const err = e as Error;
            console.error('[SSR] store SEO inject failed:', err?.message ?? e);
          }
        }
        const ae = String(req.headers['accept-encoding'] || '');
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Vary', 'Accept-Encoding');
        // Aggressive cache: 1 h fresh + 24 h stale-while-revalidate. This collapses the
        // cold-cache PSI problem — by the time PSI re-tests, the entry is still warm,
        // so TTFB stays ~130 ms (Nginx) instead of 1.5–2.2 s (SSR re-render).
        // CMS tradeoff: admin content edits propagate to public visitors within 1 h
        // (worst case 24 h if no traffic). For Tulsi Silks the upstream content
        // (products, banners, blogs) updates at most a few times per day so this is
        // an acceptable tradeoff. To purge immediately, restart Nginx or curl with
        // `PURGE` on the proxy_cache path.
        // Personalized data (cart, wishlist, user) is hydrated client-side, so the
        // cached HTML is safe to share between visitors.
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        if (ae.includes('br')) {
          res.setHeader('Content-Encoding', 'br');
          const br = createBrotliCompress({
            params: { [zlibConstants.BROTLI_PARAM_QUALITY]: 4 },
          });
          br.pipe(res);
          br.end(out);
        } else if (ae.includes('gzip')) {
          res.setHeader('Content-Encoding', 'gzip');
          const gz = createGzip({ level: 6 });
          gz.pipe(res);
          gz.end(out);
        } else {
          res.send(out);
        }
      })
      .catch((err) => {
        console.error('[SSR] render error for', originalUrl, ':', err?.message ?? err);
        next(err);
      });
  });

  return server;
}

function run(): void {
  const port = Number(process.env['PORT'] ?? environment.port);
  const srv = app();
  srv.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export default bootstrap;
