'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { fetchPosts, assertPostsSiteFilter } = require('./lib/fetch-posts.js');
const { normalizePost, validatePost } = require('./lib/normalize-post.js');
const { renderArticle } = require('./lib/render-article.js');
const { generateSitemap } = require('./lib/generate-sitemap.js');
const { resolvePostImageUrl } = require('./lib/resolve-post-image.js');

const ROOT = path.resolve(__dirname, '..');
const BLOGS_JSON_PATH = path.join(ROOT, 'assets/data/blogs.json');

const BLOGS_JSON_FIELDS = [
  'slug', 'title', 'meta_title', 'meta_description', 'focus_keyword',
  'category', 'search_intent', 'published_date', 'reading_time',
  'excerpt', 'placeholder_gradient', 'related_posts', 'keywords',
  'cms_updated_at', 'content_hash', 'synced_at',
];

function sortBlogsForIndex(a, b) {
  const pb = new Date(b.published_date || 0).getTime();
  const pa = new Date(a.published_date || 0).getTime();
  if (pb !== pa) return pb - pa;
  const cb = new Date(b.cms_updated_at || 0).getTime();
  const ca = new Date(a.cms_updated_at || 0).getTime();
  if (cb !== ca) return cb - ca;
  const sb = new Date(b.synced_at || 0).getTime();
  const sa = new Date(a.synced_at || 0).getTime();
  if (sb !== sa) return sb - sa;
  return String(a.slug).localeCompare(String(b.slug));
}

function hashContent(content) {
  return crypto.createHash('sha256').update(String(content || ''), 'utf8').digest('hex');
}

function cmsUpdatedAt(raw) {
  return raw.updatedAt || raw.publishedAt || '';
}

function postNeedsRefresh(existing, raw) {
  const hash = hashContent(raw.content);
  const updated = cmsUpdatedAt(raw);
  if (!existing.content_hash || !existing.cms_updated_at) return true;
  if (existing.content_hash !== hash) return true;
  if (updated && existing.cms_updated_at !== updated) return true;
  return false;
}

function parseLimit(argv) {
  const idx = argv.indexOf('--limit');
  if (idx === -1 || idx + 1 >= argv.length) return null;
  const n = parseInt(argv[idx + 1], 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseMode(argv) {
  const daily = argv.includes('--daily');
  const refresh = argv.includes('--refresh');
  const force = argv.includes('--force');
  const all = argv.includes('--all');
  const limit = parseLimit(argv);

  if (force) {
    return { name: 'force', includeNew: true, includeChanged: true, newLimit: null, onlyApi: true };
  }
  if (daily) {
    return { name: 'daily', includeNew: true, includeChanged: true, newLimit: 1, onlyApi: false };
  }
  if (refresh) {
    return { name: 'refresh', includeNew: true, includeChanged: true, newLimit: null, onlyApi: false };
  }
  if (all) {
    return { name: 'all', includeNew: true, includeChanged: false, newLimit: null, onlyApi: false };
  }
  return { name: 'sync', includeNew: true, includeChanged: false, newLimit: 1, onlyApi: false };
}

function toBlogsEntry(normalized) {
  const entry = {};
  for (const k of BLOGS_JSON_FIELDS) {
    if (normalized[k] !== undefined) entry[k] = normalized[k];
  }
  return entry;
}

function getRelatedSlugs(blogs, currentSlug, opts = {}, limit = 3) {
  const searchIntent = (opts.searchIntent || 'informational').toLowerCase();
  const category = (opts.category || '').toLowerCase();
  const others = blogs.filter((b) => b.slug !== currentSlug);

  const sameIntent = others
    .filter((b) => (b.search_intent || '').toLowerCase() === searchIntent)
    .sort(sortBlogsForIndex);
  const sameIntentSlugs = new Set(sameIntent.map((b) => b.slug));
  const sameCategory = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && category && (b.category || '').toLowerCase() === category)
    .sort(sortBlogsForIndex);
  const sameCategorySlugs = new Set(sameCategory.map((b) => b.slug));
  const rest = others
    .filter((b) => !sameIntentSlugs.has(b.slug) && !sameCategorySlugs.has(b.slug))
    .sort(sortBlogsForIndex);

  const merged = [...sameIntent, ...sameCategory, ...rest];
  return merged.slice(0, limit).map((b) => b.slug);
}

function loadBlogsJson() {
  try {
    const raw = fs.readFileSync(BLOGS_JSON_PATH, 'utf8');
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveBlogsJson(blogs) {
  const json = JSON.stringify(blogs, null, 2);
  fs.writeFileSync(BLOGS_JSON_PATH, json + '\n', 'utf8');
}

function normalizeSiteDomain(val) {
  return String(val || '')
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
}

function siteDomainFromPost(raw) {
  const site = raw.site;
  if (!site || typeof site !== 'object') return '';
  return normalizeSiteDomain(site.domain || site.attributes?.domain);
}

/** Reject posts whose populated site relation points at a different domain. */
function postMatchesSite(raw, siteDomain) {
  const expected = normalizeSiteDomain(siteDomain);
  if (!expected) return true;

  const fromRelation = siteDomainFromPost(raw);
  if (fromRelation && fromRelation !== expected) {
    console.warn(`Skipping post "${raw.slug}" (site.domain=${fromRelation}, expected ${expected}).`);
    return false;
  }

  return true;
}

function buildWorklist(strapiPosts, existingBlogs, mode) {
  const existingBySlug = new Map(existingBlogs.map((b) => [b.slug, b]));
  const newPosts = [];
  const changedPosts = [];

  for (const raw of strapiPosts) {
    const slug = raw.slug || raw.documentId || '';
    if (!slug) continue;

    const existing = existingBySlug.get(slug);
    if (!existing) {
      newPosts.push(raw);
    } else if (mode.includeChanged && postNeedsRefresh(existing, raw)) {
      changedPosts.push(raw);
    }
  }

  newPosts.sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0));
  changedPosts.sort((a, b) => new Date(a.updatedAt || a.publishedAt || 0) - new Date(b.updatedAt || b.publishedAt || 0));

  let selectedNew = mode.includeNew ? newPosts : [];
  if (mode.newLimit != null) {
    selectedNew = selectedNew.slice(0, mode.newLimit);
  }

  let selectedChanged = mode.includeChanged ? changedPosts : [];

  if (mode.name === 'force') {
    const allApi = [...strapiPosts].filter((p) => p.slug || p.documentId);
    allApi.sort((a, b) => new Date(a.publishedAt || 0) - new Date(b.publishedAt || 0));
    return allApi;
  }

  return [...selectedNew, ...selectedChanged];
}

function applyGlobalLimit(worklist, limit) {
  if (limit == null) return worklist;
  return worklist.slice(0, limit);
}

function upsertPost(raw, blogs, siteOrigin) {
  const slug = raw.slug || raw.documentId || '';
  const related = getRelatedSlugs(blogs, slug, {
    searchIntent: raw.search_intent,
    category: raw.category,
  });

  const normalized = normalizePost(raw, { relatedPosts: related });
  validatePost(normalized);

  renderArticle(normalized, { blogs });

  const entry = toBlogsEntry(normalized);
  entry.synced_at = new Date().toISOString();
  entry.cms_updated_at = cmsUpdatedAt(raw);
  entry.content_hash = hashContent(raw.content);
  entry.cover_image = resolvePostImageUrl(normalized.cover_image, siteOrigin);

  const idx = blogs.findIndex((b) => b.slug === slug);
  if (idx >= 0) {
    blogs[idx] = { ...blogs[idx], ...entry };
  } else {
    blogs.push(entry);
  }

  return { slug, title: normalized.title, action: idx >= 0 ? 'updated' : 'created' };
}

async function run() {
  const argv = process.argv.slice(2);
  const mode = parseMode(argv);
  const globalLimit = parseLimit(process.argv);

  assertPostsSiteFilter();

  const apiUrl = process.env.STRAPI_API_URL || 'http://localhost:1337/api';
  const siteOrigin = String(process.env.SITE_BASE_URL || 'https://888betlive.com').replace(/\/$/, '');

  console.log(`Sync mode: ${mode.name}`);
  console.log('Fetching posts from API...');
  const siteDomain = process.env.SITE_DOMAIN || process.env.site_domain || '';
  const strapiPosts = (await fetchPosts({ baseUrl: apiUrl })).filter((raw) =>
    postMatchesSite(raw, siteDomain),
  );

  const existingBlogs = loadBlogsJson();
  let worklist = buildWorklist(strapiPosts, existingBlogs, mode);
  worklist = applyGlobalLimit(worklist, globalLimit);

  if (worklist.length === 0) {
    console.log('No articles to publish or refresh.');
    return;
  }

  console.log(`Processing ${worklist.length} article(s)...`);

  let blogs = [...existingBlogs];
  let created = 0;
  let updated = 0;

  for (const raw of worklist) {
    const result = upsertPost(raw, blogs, siteOrigin);
    console.log(`  - ${result.action === 'created' ? 'Created' : 'Updated'}: ${result.title} (${result.slug})`);
    if (result.action === 'created') created++;
    else updated++;
  }

  blogs.sort(sortBlogsForIndex);
  blogs = blogs.map((b) => ({
    ...b,
    cover_image: resolvePostImageUrl(b.cover_image || '', siteOrigin),
  }));
  saveBlogsJson(blogs);
  generateSitemap();
  console.log(`Done. ${created} created, ${updated} updated. blogs.json and sitemap.xml updated.`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
