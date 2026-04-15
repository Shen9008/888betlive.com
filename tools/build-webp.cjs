/**
 * Convert Images/ tree to images/webp/ (optimized WebP).
 * Run: node tools/build-webp.cjs
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'Images');
const OUT = path.join(ROOT, 'images', 'webp');

function slugifySegment(s) {
  return s
    .replace(/['']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function slugifyBase(fileBase) {
  return slugifySegment(fileBase.replace(/\.[^.]+$/i, ''));
}

function walk(dir, base = '') {
  const out = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, name.name);
    const full = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(full, rel));
    else if (/\.(png|jpe?g|gif|webp)$/i.test(name.name)) out.push({ full, rel });
  }
  return out;
}

async function main() {
  const files = walk(SRC);
  const map = {};
  fs.mkdirSync(OUT, { recursive: true });

  for (const { full, rel } of files) {
    const parts = rel.split(/[/\\]/);
    const base = parts.pop();
    const dirParts = parts.map(slugifySegment).filter(Boolean);
    const slug = slugifyBase(base);
    const sub = dirParts.join('/');
    const outDir = dirParts.length ? path.join(OUT, ...dirParts) : OUT;
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, `${slug}.webp`);

    const buf = await fs.promises.readFile(full);
    const img = sharp(buf);
    const meta = await img.metadata();
    const hasAlpha = meta.hasAlpha;

    await img
      .webp({
        quality: base.toLowerCase().endsWith('.png') && hasAlpha ? 90 : 82,
        effort: 5,
        alphaQuality: 90,
      })
      .toFile(outPath);

    const webPath = 'images/webp/' + (sub ? sub + '/' : '') + slug + '.webp';
    const key = rel.replace(/\\/g, '/');
    map[key] = webPath.replace(/\\/g, '/');
    console.log('OK', key, '->', webPath);
  }

  await fs.promises.writeFile(
    path.join(ROOT, 'images', 'asset-map.json'),
    JSON.stringify(map, null, 2),
    'utf8'
  );
  console.log('Wrote images/asset-map.json (' + Object.keys(map).length + ' files)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
