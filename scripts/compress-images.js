/**
 * In-place image compression for `src/assets/images/`.
 *
 * Strategy (chosen for ZERO template/HTML changes):
 *   - PNG  -> Re-encode with `pngquant`-style palette + max zlib compression.
 *             Only writes back if result is smaller.
 *   - JPEG -> Re-encode via `mozjpeg` at quality 80 (visually lossless for
 *             web photography). Only writes back if result is smaller.
 *   - SVG  -> Skipped (already tiny, sharp won't help).
 *   - GIF / WEBP / AVIF -> Skipped (different optimization tracks).
 *
 * No file paths, names, or extensions change — every `<img src="...">` in
 * Angular templates continues to resolve. Safe to run repeatedly: if a file
 * is already optimal, sharp's output won't be smaller and we keep the original.
 *
 * Usage:
 *   node scripts/compress-images.js          # compress src/assets/images
 *   node scripts/compress-images.js --dir <path>  # custom directory
 *   node scripts/compress-images.js --dry-run     # report only, no writes
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const dirIdx = args.indexOf('--dir');
const ROOT = dirIdx !== -1 ? args[dirIdx + 1] : path.join('src', 'assets', 'images');

// Skip tiny files: not worth touching, often already optimal (icons, logos).
const MIN_SIZE_BYTES = 10 * 1024;

// JPEG quality tuning: 80 is the sweet spot for photography on retail/web.
// Below 75 visual quality drops noticeably; above 85 diminishing returns.
const JPEG_QUALITY = 80;

// PNG strategy: palette mode usually shrinks photographic PNGs by 60-80 %
// while staying lossless visually. Compression effort 9 is max but only
// runs at build/compress time (not on every request), so it's fine.
const PNG_COMPRESSION = 9;

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

function fmtBytes(b) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}

async function compressOne(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  if (stat.size < MIN_SIZE_BYTES) return { filePath, skipped: 'too-small', orig: stat.size };

  let buf;
  try {
    // Read the file into a Buffer first and close the handle before sharp opens
    // its own. On Windows, passing a path to `sharp()` can keep a read handle
    // open during async processing, which then blocks our subsequent rename.
    // Initializing sharp from a Buffer eliminates that lock entirely.
    const input = fs.readFileSync(filePath);
    const img = sharp(input, { failOn: 'none' });
    if (ext === '.png') {
      buf = await img.png({ compressionLevel: PNG_COMPRESSION, palette: true, effort: 10 }).toBuffer();
    } else if (ext === '.jpg' || ext === '.jpeg') {
      buf = await img.jpeg({ quality: JPEG_QUALITY, mozjpeg: true, progressive: true }).toBuffer();
    } else {
      return { filePath, skipped: 'unsupported-ext', orig: stat.size };
    }
  } catch (err) {
    return { filePath, skipped: `error:${err.message}`, orig: stat.size };
  }

  const newSize = buf.length;
  // Only replace if the new file is meaningfully smaller (≥ 2 % gain).
  // Sharp on already-optimized files can produce slightly larger output
  // from re-encoding; we skip those to avoid drift on repeat runs.
  if (newSize >= stat.size * 0.98) {
    return { filePath, skipped: 'no-gain', orig: stat.size, candidate: newSize };
  }

  if (!dryRun) {
    // Atomic write: temp file + rename so a Ctrl-C in the middle can never
    // leave a half-written image on disk. Critical when `ng serve` is watching.
    const tmp = filePath + '.tmp-' + process.pid;
    fs.writeFileSync(tmp, buf);
    fs.renameSync(tmp, filePath);
  }
  return { filePath, orig: stat.size, neu: newSize, saved: stat.size - newSize };
}

(async () => {
  if (!fs.existsSync(ROOT)) {
    console.error(`✘ Directory not found: ${ROOT}`);
    process.exit(1);
  }

  const all = walk(ROOT).filter(f => /\.(png|jpe?g)$/i.test(f));
  console.log(`Scanning ${all.length} PNG/JPEG files under ${ROOT}${dryRun ? ' (DRY RUN)' : ''}\n`);

  let totalBefore = 0, totalAfter = 0, totalSaved = 0;
  const results = [];
  for (const f of all) {
    const r = await compressOne(f);
    results.push(r);
    totalBefore += r.orig;
    totalAfter += r.neu ?? r.orig;
    if (r.saved) totalSaved += r.saved;
  }

  const compressed = results.filter(r => r.saved);
  const skipped = results.filter(r => r.skipped);

  // Sort biggest savings first for easy scanning.
  compressed.sort((a, b) => b.saved - a.saved);
  console.log(`Compressed ${compressed.length} files:`);
  for (const r of compressed.slice(0, 20)) {
    const pct = ((r.saved / r.orig) * 100).toFixed(1);
    console.log(`  ${fmtBytes(r.orig).padStart(9)} -> ${fmtBytes(r.neu).padStart(9)}  (-${pct}%)  ${path.relative(ROOT, r.filePath)}`);
  }
  if (compressed.length > 20) console.log(`  ... and ${compressed.length - 20} more`);

  console.log(`\nSkipped ${skipped.length} files (no gain / too small / unsupported)`);
  console.log(`\nTotal: ${fmtBytes(totalBefore)} -> ${fmtBytes(totalAfter)}  (saved ${fmtBytes(totalSaved)}, ${((totalSaved / totalBefore) * 100).toFixed(1)}%)`);
  if (dryRun) console.log('\n(Dry run — no files were modified.)');
})();
