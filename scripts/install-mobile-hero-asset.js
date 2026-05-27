/**
 * Copy `scripts/output/mobile_primary_slider.webp` → `src/assets/perf/mobile_primary_slider.webp`.
 * Run after `npm run optimize:mobile-hero`.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const from = path.join(root, 'scripts', 'output', 'mobile_primary_slider.webp');
const destDir = path.join(root, 'src', 'assets', 'perf');
const to = path.join(destDir, 'mobile_primary_slider.webp');

if (!fs.existsSync(from)) {
  console.error('Missing:', from);
  console.error('Run: npm run optimize:mobile-hero');
  process.exit(1);
}
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}
fs.copyFileSync(from, to);
console.log('Copied:', to);
console.log('Rebuild/deploy the app so /assets/perf/mobile_primary_slider.webp is served.');
