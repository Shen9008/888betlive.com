/**
 * Sync designer Title Case sources under Images/ → canonical lowercase deploy paths.
 * Optimizes rasters (resize + compress) and writes WebP output only.
 *
 * Run: node tools/sync-images-from-source.cjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const IMG = path.join(ROOT, 'images');

function slugifySegment(s) {
  return String(s)
    .replace(/[''´`\u2019]/g, '')
    .replace(/_/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function slugifyFile(fileName) {
  const ext = path.extname(fileName);
  return slugifySegment(fileName.slice(0, -ext.length));
}

function pathsEqualInsensitive(a, b) {
  return path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();
}

const PRESETS = {
  hero: { maxWidth: 1920, jpegQuality: 85, webpQuality: 82, format: 'jpeg' },
  gameCard: { width: 800, height: 500, fit: 'cover', jpegQuality: 85, webpQuality: 82, format: 'jpeg' },
  blog: { width: 1200, height: 630, fit: 'cover', jpegQuality: 85, webpQuality: 82, format: 'jpeg' },
  icon: { width: 128, height: 128, fit: 'inside', pngQuality: 90, webpQuality: 82, format: 'png' },
  logo: { maxWidth: 240, maxHeight: 96, fit: 'inside', pngQuality: 90, webpQuality: 82, format: 'png' },
  promo: { maxWidth: 960, jpegQuality: 85, webpQuality: 82, format: 'jpeg' },
};

async function writeOptimized(srcPath, destBase, preset) {
  const buf = await fs.promises.readFile(srcPath);
  let img = sharp(buf);
  const meta = await img.metadata();

  if (preset.width && preset.height) {
    img = img.resize(preset.width, preset.height, {
      fit: preset.fit || 'cover',
      withoutEnlargement: true,
    });
  } else if (preset.maxWidth || preset.maxHeight) {
    img = img.resize({
      width: preset.maxWidth,
      height: preset.maxHeight,
      fit: preset.fit || 'inside',
      withoutEnlargement: true,
    });
  }

  fs.mkdirSync(path.dirname(destBase), { recursive: true });

  const useJpeg = preset.format === 'jpeg';
  const webpPath = destBase + '.webp';
  const tmpWebp = path.join(os.tmpdir(), `888bet-sync-${process.pid}-${path.basename(webpPath)}`);

  try {
    const hasAlpha = !useJpeg && meta.hasAlpha;
    await img
      .clone()
      .webp({
        quality: hasAlpha ? preset.webpQuality || 90 : preset.webpQuality || 82,
        effort: 5,
        alphaQuality: hasAlpha ? 90 : undefined,
      })
      .toFile(tmpWebp);

    await fs.promises.copyFile(tmpWebp, webpPath);
  } finally {
    try {
      await fs.promises.unlink(tmpWebp);
    } catch (_) {
      /* ignore */
    }
  }

  return { webpPath };
}

const HERO_SOURCES = {
  'Home.jpg': 'home',
  'Slot.jpg': 'slot',
  'Live Casino.jpg': 'live-casino',
  'Table Games.jpg': 'table-games',
  'Promotions.jpg': 'promotions',
  'About Us.jpg': 'about-us',
  'Help center.jpg': 'help-center',
  'Terms.jpg': 'terms',
  'Blog.png': 'blog',
};

const GAME_CARD_SKIP_PREFIXES = [
  path.join('Game Card', 'Game shows & wheels'),
  path.join('Game Card', 'Popular live tables'),
];

const GAME_CARD_SEGMENT = {
  Home: 'home',
  Slots: 'slots',
  'Live Casino': 'live-casino',
  'Table games': 'table-games',
  'Popular slots': 'popular-slots',
  'New releases & exclusives': 'new-releases-exclusives',
  'Popular right now': 'popular-right-now',
  'New releases': 'new-releases',
  'Top RTP picks': 'top-rtp-picks',
  'Game shows & wheels': 'game-shows-wheels',
  'Popular live tables': 'popular-live-tables',
};

const LOGO_FILE_SLUG = {
  'BigTime Gaming.png': 'bigtime-gaming',
  'No limit.png': 'no-limit',
  'PlaynGo.png': 'playngo',
  'Playtech Live.png': 'playtech-live',
  'Pragmatic Live.png': 'pragmatic-live',
  'VISA.png': 'visa',
};

/** Source folder name → deploy folder (avoid Blog/blog case collision on Windows). */
const SOURCE_ROOTS = {
  'Hero Banners': null,
  Blog: 'blog-covers',
  'Firms logo': 'firms-logo',
  'Payment logo': 'payment-logo',
  'Provider Logo': 'provider-logo',
};

function titleToSlug(title) {
  return slugifySegment(title);
}

async function syncHeroes() {
  const srcDir = path.join(IMG, 'Hero Banners');
  const destDir = path.join(IMG, 'hero-banners');
  if (!fs.existsSync(srcDir)) {
    console.warn('skip heroes (no Hero Banners source folder)');
    return;
  }

  for (const [srcName, slug] of Object.entries(HERO_SOURCES)) {
    const src = path.join(srcDir, srcName);
    if (!fs.existsSync(src)) {
      console.warn('skip hero (missing source):', srcName);
      continue;
    }
    const destBase = path.join(destDir, slug);
    await writeOptimized(src, destBase, PRESETS.hero);
    console.log('hero', srcName, '->', path.relative(ROOT, destBase));
  }
}

async function syncGameCard() {
  const srcRoot = path.join(IMG, 'Game Card');
  if (!fs.existsSync(srcRoot)) {
    console.warn('skip Game Card (no source folder)');
    return;
  }

  const jobs = [];
  function walkAsync(dir, relParts) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const rel = path.join(...relParts, ent.name);
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        const skip = GAME_CARD_SKIP_PREFIXES.some((p) => rel.replace(/\\/g, '/').startsWith(p.replace(/\\/g, '/')));
        if (skip) continue;
        walkAsync(full, [...relParts, ent.name]);
        continue;
      }
      if (!/\.(jpe?g|png)$/i.test(ent.name)) continue;
      const segments = relParts.slice(1);
      const mapped = segments.map((s) => GAME_CARD_SEGMENT[s] || slugifySegment(s));
      const fileSlug = slugifyFile(ent.name);
      const destBase = path.join(IMG, 'game-card', ...mapped, fileSlug);
      jobs.push(
        writeOptimized(full, destBase, PRESETS.gameCard).then(() => {
          console.log('game-card', rel.replace(/\\/g, '/'), '->', path.relative(ROOT, destBase));
        }),
      );
    }
  }

  walkAsync(srcRoot, ['Game Card']);
  await Promise.all(jobs);
}

async function syncBlogCovers() {
  const blogSrc = path.join(IMG, 'Blog');
  const blogDest = path.join(IMG, 'blog-covers');
  if (!fs.existsSync(blogSrc)) {
    console.warn('skip Blog covers (no Blog source folder)');
    return {};
  }

  const slugByTitle = {};
  const blogsPath = path.join(ROOT, 'assets', 'data', 'blogs.json');
  if (fs.existsSync(blogsPath)) {
    const posts = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
    for (const post of posts) {
      if (post.title && post.slug) slugByTitle[post.title.trim()] = post.slug;
    }
  }

  const mapped = {};
  for (const name of fs.readdirSync(blogSrc)) {
    if (!/\.png$/i.test(name)) continue;
    const title = name.replace(/\.png$/i, '');
    const slug = slugByTitle[title] || titleToSlug(title);
    const destBase = path.join(blogDest, slug);
    const src = path.join(blogSrc, name);
    await writeOptimized(src, destBase, PRESETS.blog);
    mapped[slug] = `/images/blog-covers/${slug}.webp`;
    console.log('blog', name, '->', path.relative(ROOT, destBase));
  }
  return mapped;
}

async function syncFlatFolder(srcFolder, destFolder, preset, fileSlugMap) {
  const src = path.join(IMG, srcFolder);
  const dest = path.join(IMG, destFolder);
  if (!fs.existsSync(src)) {
    console.warn('skip', srcFolder);
    return;
  }
  for (const name of fs.readdirSync(src)) {
    if (!/\.(jpe?g|png)$/i.test(name)) continue;
    const slug = (fileSlugMap && fileSlugMap[name]) || slugifyFile(name);
    const destBase = path.join(dest, slug);
    await writeOptimized(path.join(src, name), destBase, preset);
    console.log(destFolder, name, '->', slug);
  }
}

async function syncPromos() {
  await syncFlatFolder('promos/All ongoing promotions', 'promos/all-ongoing-promotions', PRESETS.promo);
  await syncFlatFolder('promos/Hot promotion banners', 'promos/hot-promotion-banners', PRESETS.promo);
  const featuredSrc = path.join(IMG, 'promos', 'Featured Promo.jpg');
  if (fs.existsSync(featuredSrc)) {
    const destBase = path.join(IMG, 'promos', 'featured-promo');
    await writeOptimized(featuredSrc, destBase, PRESETS.promo);
    console.log('promos Featured Promo.jpg -> featured-promo');
  }
}

function rmRecursive(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  console.log('removed', path.relative(ROOT, target));
}

function cleanupSources() {
  const dirs = [
    path.join(IMG, 'Game Card'),
    path.join(IMG, 'Blog'),
    path.join(IMG, 'Hero Banners'),
    path.join(IMG, 'Firms logo'),
    path.join(IMG, 'Payment logo'),
    path.join(IMG, 'Provider Logo'),
    path.join(IMG, 'icon', 'Licensing & live audits'),
    path.join(IMG, 'icon', 'Top games by live category'),
    path.join(IMG, 'promos', 'All ongoing promotions'),
    path.join(IMG, 'promos', 'Hot promotion banners'),
  ];
  for (const d of dirs) rmRecursive(d);

  const featuredSrc = path.join(IMG, 'promos', 'Featured Promo.jpg');
  if (fs.existsSync(featuredSrc)) {
    fs.unlinkSync(featuredSrc);
    console.log('removed', path.relative(ROOT, featuredSrc));
  }
}

async function main() {
  if (!fs.existsSync(IMG)) {
    console.error('Missing images directory:', IMG);
    process.exit(1);
  }

  await syncHeroes();
  await syncGameCard();
  const blogMap = await syncBlogCovers();
  await syncFlatFolder('Firms logo', 'firms-logo', PRESETS.logo);
  await syncFlatFolder('Payment logo', 'payment-logo', PRESETS.logo);
  await syncFlatFolder('Provider Logo', 'provider-logo', PRESETS.logo, LOGO_FILE_SLUG);
  await syncFlatFolder('icon/Licensing & live audits', 'icon/licensing-live-audits', PRESETS.icon);
  await syncFlatFolder('icon/Top games by live category', 'icon/top-games-by-live-category', PRESETS.icon);
  await syncPromos();

  cleanupSources();

  const mapPath = path.join(ROOT, 'assets', 'data', 'blog-cover-map.json');
  fs.writeFileSync(mapPath, JSON.stringify(blogMap, null, 2), 'utf8');
  console.log('Wrote', path.relative(ROOT, mapPath), `(${Object.keys(blogMap).length} covers)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
