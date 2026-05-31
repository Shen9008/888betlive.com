/**
 * Converts each .jpg / .jpeg / .png under /images to a sibling .webp and removes the original.
 *
 * SEO: Runs before deploy — see seo-task.md Step 4 / package.json build:webp
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const IMG_ROOT = path.join(ROOT, 'images');

/** Designer source trees (sync-images-from-source.cjs) — skip if re-added locally */
/** Keep originals that must stay as JPEG/PNG (e.g. favicon). */
const KEEP_ORIGINAL_BASENAMES = new Set(['favicon.jpg']);

const SKIP_DIR_NAMES = new Set([
  'Game Card',
  'Hero Banners',
  'Blog',
  'Firms logo',
  'Payment logo',
  'Provider Logo',
  'Licensing & live audits',
  'Top games by live category',
  'All ongoing promotions',
  'Hot promotion banners',
]);

async function encodeWebp(srcPath, destPath) {
  const ext = path.extname(srcPath).toLowerCase();
  const buf = await fs.promises.readFile(srcPath);
  let img = sharp(buf);
  const meta = await img.metadata();

  await img
    .webp({
      quality: ext === '.png' && meta.hasAlpha ? 90 : 82,
      effort: 5,
      alphaQuality: meta.hasAlpha ? 90 : undefined,
    })
    .toFile(destPath);
}

async function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === '.git' || ent.name === 'node_modules') continue;
      if (SKIP_DIR_NAMES.has(ent.name)) continue;
      await walk(full);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
    const out = full.replace(/\.(jpe?g|png)$/i, '.webp');
    const rel = path.relative(ROOT, full);
    try {
      await encodeWebp(full, out);
      if (!KEEP_ORIGINAL_BASENAMES.has(ent.name)) {
        await fs.promises.unlink(full);
        console.log(
          'OK',
          rel.replace(/\\/g, '/'),
          '->',
          path.relative(ROOT, out).replace(/\\/g, '/'),
          '(removed original)',
        );
      } else {
        console.log('OK', rel.replace(/\\/g, '/'), '->', path.relative(ROOT, out).replace(/\\/g, '/'), '(kept original)');
      }
    } catch (e) {
      console.error('FAIL', full, e.message);
      process.exitCode = 1;
    }
  }
}

async function main() {
  if (!fs.existsSync(IMG_ROOT)) {
    console.error('Missing images directory:', IMG_ROOT);
    process.exit(1);
  }
  await walk(IMG_ROOT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
