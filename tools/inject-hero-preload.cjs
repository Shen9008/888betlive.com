/**
 * Injects <!-- SEO --> hero WebP preload after the first <link rel="canonical"> per page.
 * Run after WebP sidecars exist (npm run build:webp).
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const hub = [
  ['index.html', 'home.webp'],
  ['slots.html', 'slot.webp'],
  ['live-casino.html', 'live-casino.webp'],
  ['table-games.html', 'table-games.webp'],
  ['promotions.html', 'promotions.webp'],
  ['about-us.html', 'about-us.webp'],
  ['help-center.html', 'help-center.webp'],
  ['terms.html', 'terms.webp'],
  ['blog/index.html', 'blog.webp'],
];

function injectHub(rel, webp) {
  const fp = path.join(ROOT, rel.split('/').join(path.sep));
  let s = fs.readFileSync(fp, 'utf8');
  const href = `/images/hero-banners/${webp}`;
  if (s.includes(`href="${href}"`) && s.includes('rel="preload"')) {
    return;
  }
  const block = `    <!-- SEO / perf: LCP hero preload (WebP) -->\n    <link rel="preload" as="image" href="${href}" type="image/webp">\n`;
  const next = s.replace(/(\n\s*<link rel="canonical" href="[^"]+"\s*>)/, `$1\n${block}`);
  if (next === s) {
    console.warn('No canonical match:', rel);
    return;
  }
  fs.writeFileSync(fp, next, 'utf8');
  console.log('preload', rel);
}

function injectBlogPosts() {
  const blogRoot = path.join(ROOT, 'blog');
  const href = '/images/hero-banners/home.webp';
  for (const ent of fs.readdirSync(blogRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    const fp = path.join(blogRoot, ent.name, 'index.html');
    if (!fs.existsSync(fp)) continue;
    let s = fs.readFileSync(fp, 'utf8');
    if (s.includes('href="/images/hero-banners/home.webp"') && s.includes('rel="preload"')) continue;
    const block = `  <!-- SEO / perf: LCP hero preload (blog shares home hero in CSS) -->\n  <link rel="preload" as="image" href="${href}" type="image/webp">\n`;
    const next = s.replace(/(\n\s*<link rel="canonical" href="[^"]+"\s*>)/, `$1\n${block}`);
    if (next === s) {
      console.warn('No canonical (blog):', ent.name);
      continue;
    }
    fs.writeFileSync(fp, next, 'utf8');
    console.log(`preload blog/${ent.name}`);
  }
}

function main() {
  for (const [rel, webp] of hub) {
    injectHub(rel, webp);
  }
  injectBlogPosts();
}

main();
