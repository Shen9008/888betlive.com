/**
 * SEO: wrap root /images/*.jpg|png in <picture> when sidecar .webp exists; fill empty alts on tiles/promos.
 * Idempotent — does not double-wrap imgs already inside <picture>.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function readableFromFilename(src) {
  const base = path.basename(src, path.extname(src));
  return base
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function guessAlt(src, tag) {
  const lower = tag.toLowerCase();
  if (/promos\/all-ongoing-promotions\/free-spin/i.test(src)) {
    return 'Midweek free spins promotional banner at 888bet Live.';
  }
  if (/promos\/all-ongoing-promotions\/slot-races/i.test(src)) {
    return 'Roulette races leaderboard promotion at 888bet Live.';
  }
  if (/promos\/all-ongoing-promotions\/vip-boost/i.test(src)) {
    return 'VIP tier boost weekend loyalty promotion at 888bet Live.';
  }
  if (/promos\/featured-promo/i.test(src)) {
    return 'Featured 888bet Live casino promotion artwork.';
  }
  if (/promos\/hot-promotion-banners\/weekend-reload/i.test(src)) {
    return 'Weekend reload bonus promotion banner.';
  }
  if (/promos\/hot-promotion-banners\/live-golden-hour/i.test(src)) {
    return 'Live casino golden hour promotion banner.';
  }
  if (/promos\/hot-promotion-banners\/vip-gifts/i.test(src)) {
    return 'VIP gifts and rewards promotion banner.';
  }
  if (lower.includes('game-tile__cover') || lower.includes('/game-card/')) {
    const name = readableFromFilename(src);
    return `${name} — slot or table game thumbnail on 888bet Live.`;
  }
  if (lower.includes('provider-logo') || lower.includes('provider-card__logo')) {
    return `${readableFromFilename(src)} live casino software provider logo.`;
  }
  if (lower.includes('category-card__icon') || /icon\/top-games-by-live-category/i.test(src)) {
    return `${readableFromFilename(src)} live casino category icon.`;
  }
  if (lower.includes('cert-badge') || /licensing-live-audits/i.test(src)) {
    return `${readableFromFilename(src)} licensing and audit icon.`;
  }
  if (lower.includes('firms-logo') || /favicon/i.test(src)) return null;
  return `${readableFromFilename(src)} — image on 888bet Live.`;
}

function enrichAlt(tag) {
  const altM = /\balt\s*=\s*""/i;
  if (!altM.test(tag)) return tag;
  const srcM = /\bsrc="(\/[^"]+)"/i.exec(tag);
  if (!srcM) return tag;
  const altText = guessAlt(srcM[1], tag);
  if (!altText) return tag;
  return tag.replace(altM, `alt="${altText.replace(/"/g, '&quot;')}"`);
}

function webpPathForSrc(src) {
  if (!src.startsWith('/images/')) return null;
  if (!/\.(jpe?g|png)$/i.test(src)) return null;
  return src.replace(/\.(jpe?g|png)$/i, '.webp');
}

function fileExistsForUrl(urlPath) {
  const rel = urlPath.replace(/^\//, '').split('/').join(path.sep);
  return fs.existsSync(path.join(ROOT, rel));
}

function insidePicture(html, offset) {
  const before = html.slice(0, offset);
  const lastOpen = before.lastIndexOf('<picture');
  const lastClose = before.lastIndexOf('</picture>');
  return lastOpen !== -1 && lastOpen > lastClose;
}

function processHtml(html) {
  return html.replace(/<img\b[^>]*>/gi, (tag, offset) => {
    let out = enrichAlt(tag);

    if (insidePicture(html, offset)) {
      return out;
    }

    const srcM = /\bsrc="(\/[^"]+)"/i.exec(out);
    if (!srcM) return out;

    const webpUrl = webpPathForSrc(srcM[1]);
    if (!webpUrl || !fileExistsForUrl(webpUrl)) {
      return out;
    }

    return `<picture>\n<source type="image/webp" srcset="${webpUrl}" />${out}\n</picture>`;
  });
}

function main() {
  const targets = [];

  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (ent.name === '.git' || ent.name === 'node_modules') continue;
        walk(full);
      } else if (ent.name.endsWith('.html')) {
        if (full.includes(`${path.sep}scripts${path.sep}`)) continue;
        targets.push(full);
      }
    }
  }

  walk(ROOT);

  let changed = 0;
  for (const fp of targets) {
    const raw = fs.readFileSync(fp, 'utf8');
    const next = processHtml(raw);
    if (next !== raw) {
      fs.writeFileSync(fp, next, 'utf8');
      changed++;
      console.log('updated', path.relative(ROOT, fp));
    }
  }
  console.log('html-enrich-images: files changed:', changed);
}

main();
