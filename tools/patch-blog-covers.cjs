/**
 * Wire blog cover images into blogs.json and per-post SEO meta after sync-images-from-source.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SITE = 'https://888betlive.com';
const blogsPath = path.join(ROOT, 'assets', 'data', 'blogs.json');

function patchPostHtml(fp, slug, coverUrl) {
  let s = fs.readFileSync(fp, 'utf8');
  s = s.replace(
    /<meta property="og:image" content="[^"]*">/,
    `<meta property="og:image" content="${coverUrl}">`,
  );
  s = s.replace(
    /<meta name="twitter:image" content="[^"]*">/,
    `<meta name="twitter:image" content="${coverUrl}">`,
  );
  s = s.replace(/"image": "https:\/\/888betlive\.com\/images\/[^"]*"/, `"image": "${coverUrl}"`);
  fs.writeFileSync(fp, s, 'utf8');
  console.log('patched cover meta', path.relative(ROOT, fp));
}

const posts = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
let changed = false;

for (const post of posts) {
  const slug = post.slug;
  const localJpg = path.join(ROOT, 'images', 'blog-covers', `${slug}.jpg`);
  if (!fs.existsSync(localJpg)) {
    console.warn('no cover file for', slug);
    continue;
  }
  const coverUrl = `${SITE}/images/blog-covers/${slug}.jpg`;
  if (post.cover_image !== coverUrl) {
    post.cover_image = coverUrl;
    changed = true;
  }
  const fp = path.join(ROOT, 'blog', slug, 'index.html');
  if (fs.existsSync(fp)) patchPostHtml(fp, slug, coverUrl);
}

if (changed) {
  fs.writeFileSync(blogsPath, JSON.stringify(posts, null, 2) + '\n', 'utf8');
  console.log('updated', path.relative(ROOT, blogsPath));
}
