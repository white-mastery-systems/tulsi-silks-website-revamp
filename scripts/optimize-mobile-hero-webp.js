/**
 * Download the live mobile primary hero WebP from yourstore.io, re-encode with
 * sharp to ~720px width and tune quality until output lands in the 60–120 KB
 * band (LCP-friendly for Slow 4G / PSI).
 *
 * Output: scripts/output/mobile_primary_slider.webp
 * Upload that file in Yourstore/CMS to the SAME path:
 *   uploads/<store_id>/layouts/mobile_primary_slider.webp
 * so index.html preload + SSR <picture> stay valid without code changes.
 *
 * Usage:
 *   npm run optimize:mobile-hero
 *   HERO_STORE_ID=xxx node scripts/optimize-mobile-hero-webp.js
 *   node scripts/optimize-mobile-hero-webp.js --from ./my-source.png
 *   node scripts/optimize-mobile-hero-webp.js --url https://.../mobile_primary_slider.webp
 */

const fs = require('fs');
const https = require('https');
const path = require('path');
const sharp = require('sharp');

const STORE_ID = process.env.HERO_STORE_ID || '5d30013a5c83a702392c4c8b';
const DEFAULT_URL = `https://yourstore.io/api/uploads/${STORE_ID}/layouts/mobile_primary_slider.webp`;

const MIN_BYTES = 60 * 1024;
const MAX_BYTES = 120 * 1024;

const args = process.argv.slice(2);
const fromIdx = args.indexOf('--from');
const urlIdx = args.indexOf('--url');
const localPath = fromIdx !== -1 ? args[fromIdx + 1] : null;
const sourceUrl = urlIdx !== -1 ? args[urlIdx + 1] : DEFAULT_URL;

const OUT_DIR = path.join(__dirname, 'output');
const OUT_FILE = path.join(OUT_DIR, 'mobile_primary_slider.webp');

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const get = (u) => {
      https
        .get(u, { headers: { 'User-Agent': 'YS-Tulsi-Silks-hero-optimizer/1.0' } }, (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            return get(new URL(res.headers.location, u).href);
          }
          if (res.statusCode !== 200) {
            res.resume();
            reject(new Error(`GET ${u} -> HTTP ${res.statusCode}`));
            return;
          }
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => resolve(Buffer.concat(chunks)));
        })
        .on('error', reject);
    };
    get(url);
  });
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  return `${(b / 1024).toFixed(1)} KB`;
}

async function encodeWebp(input, width, quality) {
  return sharp(input, { failOn: 'none' })
    .rotate()
    .resize({
      width,
      withoutEnlargement: true,
      fit: 'inside',
    })
    .webp({
      quality,
      effort: 5,
      smartSubsample: true,
    })
    .toBuffer();
}

/**
 * When the coarse search stays under MIN_BYTES (tiny source), bump quality so
 * visuals stay stronger while still respecting MAX_BYTES.
 */
async function raiseQualityToBand(inputBuffer, width, quality, buf) {
  if (buf.length >= MIN_BYTES || buf.length > MAX_BYTES) {
    return { buf, quality };
  }
  let q = quality;
  let prev = { buf, quality: q };
  const maxQ = Math.min(quality + 20, 95);
  while (q < maxQ) {
    q += 1;
    const next = await encodeWebp(inputBuffer, width, q);
    if (next.length > MAX_BYTES) {
      return prev;
    }
    prev = { buf: next, quality: q };
    if (next.length >= MIN_BYTES) {
      return prev;
    }
  }
  return prev;
}

async function findBest(inputBuffer) {
  const widths = [720, 640, 828];
  let best = null;

  for (const w of widths) {
    for (let q = 82; q >= 64; q -= 2) {
      const buf = await encodeWebp(inputBuffer, w, q);
      if (buf.length <= MAX_BYTES) {
        if (!best || buf.length > best.length) {
          best = { buf, width: w, quality: q, size: buf.length };
        }
        if (buf.length >= MIN_BYTES && buf.length <= MAX_BYTES) {
          return { buf, width: w, quality: q };
        }
      }
    }
    const mid = await encodeWebp(inputBuffer, w, 72);
    if (mid.length <= MAX_BYTES && (!best || mid.length > best.length)) {
      best = { buf: mid, width: w, quality: 72, size: mid.length };
    }
  }

  if (best) {
    const raised = await raiseQualityToBand(
      inputBuffer,
      best.width,
      best.quality,
      best.buf
    );
    return { buf: raised.buf, width: best.width, quality: raised.quality };
  }

  const fallback = await encodeWebp(inputBuffer, 600, 68);
  const raisedFb = await raiseQualityToBand(inputBuffer, 600, 68, fallback);
  return { buf: raisedFb.buf, width: 600, quality: raisedFb.quality };
}

async function main() {
  let inputBuffer;
  if (localPath) {
    inputBuffer = fs.readFileSync(path.resolve(localPath));
    console.log(`Source: local file ${path.resolve(localPath)} (${fmtBytes(inputBuffer.length)})`);
  } else {
    console.log(`Downloading: ${sourceUrl}`);
    inputBuffer = await downloadBuffer(sourceUrl);
    console.log(`Downloaded: ${fmtBytes(inputBuffer.length)}`);
  }

  const meta = await sharp(inputBuffer).metadata();
  console.log(`Input: ${meta.width}x${meta.height} ${meta.format || 'unknown'}`);

  const { buf, width, quality } = await findBest(inputBuffer);

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUT_FILE, buf);

  console.log('');
  console.log(`Output: ${OUT_FILE}`);
  console.log(`Size:   ${fmtBytes(buf.length)} (target band ${fmtBytes(MIN_BYTES)}–${fmtBytes(MAX_BYTES)})`);
  console.log(`Params: max width ${width}px, WebP quality ${quality}`);
  if (buf.length > MAX_BYTES) {
    console.warn('Warning: still above 120 KB — try a shorter source or lower -- quality manually in script.');
  }
  console.log('');
  console.log('Next: copy to src/assets/perf/ via `npm run optimize:mobile-hero:install`,');
  console.log('      or deploy as a static asset; keep staticMobileHeroWebpUrl + index.html preload URLs in sync.');
  console.log('      (No CMS upload required when using /assets/perf/mobile_primary_slider.webp.)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
