'use strict';

const INTENT_GRADIENTS = {
  navigational:
    'linear-gradient(135deg, #0a0a0a 0%, rgba(212,175,55,0.25) 50%, #141414 100%)',
  commercial:
    'linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(184,150,12,0.35) 55%, #0a0a0a 100%)',
  transactional:
    'linear-gradient(135deg, #141414 0%, rgba(212,175,55,0.2) 45%, #0a0a0a 100%)',
  informational:
    'linear-gradient(135deg, rgba(212,175,55,0.18) 0%, rgba(212,175,55,0.05) 55%, #0a0a0a 100%)',
};

const INTENT_CATEGORIES = {
  navigational: 'Getting Started',
  commercial: 'Reviews',
  transactional: 'Guides',
  informational: 'Informational',
};

/**
 * Strapi media (v4) or plain URL string → usable path/URL (may be relative /uploads/...).
 */
function mediaFieldToUrl(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  const attrs = val.attributes || val;
  const formats = attrs.formats;
  const large = formats && (formats.large || formats.medium || formats.small || formats.xlarge);
  const url =
    attrs.url ||
    (large && large.url) ||
    val.url ||
    val.data?.attributes?.url ||
    val.data?.url;
  if (typeof url === 'string' && url.trim()) return url.trim();
  if (val.data && Array.isArray(val.data) && val.data[0]) return mediaFieldToUrl(val.data[0]);
  if (val.data && typeof val.data === 'object') return mediaFieldToUrl(val.data);
  return '';
}

function extractCoverImageUrl(strapiPost) {
  const fields = [
    strapiPost.cover_image,
    strapiPost.featured_image,
    strapiPost.thumbnail,
    strapiPost.image,
    strapiPost.og_image,
    strapiPost.hero_image,
    strapiPost.header_image,
  ];
  for (const f of fields) {
    const u = mediaFieldToUrl(f);
    if (u) return u;
  }
  return '';
}

/**
 * Normalizes a Strapi post to site schema.
 * @param {object} strapiPost - Raw Strapi post (id, title, slug, shortDescription, publishedAt, etc.)
 * @param {object} [opts] - Options
 * @param {string} [opts.searchIntent] - Override search_intent (from Strapi if available)
 * @param {string[]} [opts.relatedPosts] - Slugs for related posts (from existing blogs.json)
 * @returns {object} Normalized post for blogs.json and render
 */
function normalizePost(strapiPost, opts = {}) {
  const slug = strapiPost.slug || strapiPost.documentId || '';
  const title = strapiPost.title || 'Untitled';
  const publishedAt = strapiPost.publishedAt || strapiPost.createdAt || new Date().toISOString();
  const updatedAt = strapiPost.updatedAt || publishedAt;

  const publishedDate = formatDateISO(publishedAt);
  const searchIntent = (opts.searchIntent || strapiPost.search_intent || 'informational').toLowerCase();
  const gradient = INTENT_GRADIENTS[searchIntent] || INTENT_GRADIENTS.informational;
  const category = INTENT_CATEGORIES[searchIntent] || 'Informational';

  return {
    slug,
    title,
    meta_title: strapiPost.meta_title || title,
    meta_description: strapiPost.meta_description || strapiPost.shortDescription || '',
    focus_keyword: strapiPost.primary_keyword || strapiPost.focus_keyword || title,
    category,
    search_intent: searchIntent.charAt(0).toUpperCase() + searchIntent.slice(1),
    published_date: publishedDate,
    reading_time: formatReadingTime(strapiPost.reading_time),
    excerpt: strapiPost.shortDescription || strapiPost.excerpt || '',
    placeholder_gradient: strapiPost.placeholder_gradient || gradient,
    related_posts: opts.relatedPosts || [],
    keywords: normalizeKeywords(strapiPost.keywords),
    /** Raw image reference from CMS (resolved to absolute URL at render / sync) */
    cover_image: extractCoverImageUrl(strapiPost),

    content: strapiPost.content || '',
    toc_json: strapiPost.toc_json || [],
    published_date_formatted: formatDateLong(publishedAt),
    updated_date_iso: formatDateISO(updatedAt),
  };
}

function normalizeKeywords(raw) {
  if (Array.isArray(raw)) return raw.map(String).map((s) => s.trim()).filter(Boolean);
  if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function formatReadingTime(val) {
  if (val == null || val === '') return '5 min read';
  const num = typeof val === 'number' ? val : parseInt(String(val), 10);
  if (!isNaN(num)) return `${num} min read`;
  return typeof val === 'string' ? val : '5 min read';
}

function formatDateISO(d) {
  if (!d) return '';
  const date = new Date(d);
  return date.toISOString().slice(0, 10);
}

function formatDateLong(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Validates required fields. Throws if invalid.
 */
function validatePost(normalized) {
  if (!normalized.slug || !normalized.title) {
    throw new Error('Post must have slug and title');
  }
  return true;
}

module.exports = { normalizePost, validatePost, formatDateISO, formatDateLong };
