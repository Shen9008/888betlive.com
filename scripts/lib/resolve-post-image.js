'use strict';

require('./load-env.js');

/** Site-local fallback when a post has no CMS image */
const DEFAULT_POST_IMAGE_PATH = '/images/post-default.webp';

function strapiPublicBase() {
  const explicit = process.env.STRAPI_UPLOAD_BASE_URL || process.env.STRAPI_PUBLIC_URL;
  if (explicit) return String(explicit).replace(/\/$/, '');
  const api = process.env.STRAPI_API_URL || '';
  try {
    const parsed = new URL(api);
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, '');
  } catch {
    return '';
  }
}

/**
 * Absolute URL for Open Graph, Twitter, and <img src>.
 * @param {string} [raw] - URL from CMS (absolute, protocol-relative, or path)
 * @param {string} siteOrigin - e.g. https://888betlive.com (no trailing slash)
 */
function resolvePostImageUrl(raw, siteOrigin) {
  const origin = String(siteOrigin || '').replace(/\/$/, '');
  const fallback = `${origin}${DEFAULT_POST_IMAGE_PATH}`;
  if (!raw || typeof raw !== 'string' || !raw.trim()) return fallback;
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (t.startsWith('//')) return `https:${t}`;
  const path = t.startsWith('/') ? t : `/${t}`;
  if (/^\/uploads?\b/i.test(path)) {
    const base = strapiPublicBase();
    if (base) return `${base}${path}`;
  }
  if (path.startsWith('/')) return `${origin}${path}`;
  return fallback;
}

module.exports = { resolvePostImageUrl, DEFAULT_POST_IMAGE_PATH, strapiPublicBase };
