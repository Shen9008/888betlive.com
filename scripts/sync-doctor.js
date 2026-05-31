'use strict';

const { getPostsSyncConfig, buildSamplePostsUrl, assertPostsSiteFilter } = require('./lib/fetch-posts.js');

const cfg = getPostsSyncConfig();
const requireFilter = /^1|true|yes$/i.test(String(process.env.SYNC_REQUIRE_SITE_FILTER || '').trim());

console.log('Posts sync — configuration (copy `scripts/` + env to reuse on other sites)\n');

console.log('  STRAPI_API_URL          ', cfg.base || '(unset)');
console.log('  POSTS_COLLECTION        ', cfg.collection);
console.log('  SITE_DOMAIN             ', cfg.siteDomain || '(unset)');
console.log('  SKIP_POSTS_SITE_FILTER  ', cfg.skipFilter ? 'yes' : 'no');
console.log(
  '  POSTS_SITE_FILTER_KEY   ',
  cfg.filterKey ? cfg.filterKey : '(empty — no domain filter param)',
);
console.log(
  '  STRAPI_API_TOKEN        ',
  process.env.STRAPI_API_TOKEN ? '(set)' : '(not set)',
);
console.log('  SYNC_REQUIRE_SITE_FILTER', requireFilter ? 'yes' : 'no');

console.log('\nSample GET (page 1):\n  ' + buildSamplePostsUrl(cfg, 1) + '\n');

const issues = [];
if (!process.env.STRAPI_API_URL) {
  issues.push('STRAPI_API_URL is not set (defaulting to http://localhost:1337/api).');
}
if (!cfg.siteDomain && !cfg.skipFilter) {
  issues.push('SITE_DOMAIN is unset — sync runs without a site filter (see warning in fetch).');
}

if (requireFilter) {
  try {
    assertPostsSiteFilter();
    console.log('Site filter check: OK (SYNC_REQUIRE_SITE_FILTER=1)\n');
  } catch (err) {
    console.error('Site filter check failed:\n  ' + err.message + '\n');
    process.exit(1);
  }
}

if (issues.length) {
  console.log('Notes:\n  - ' + issues.join('\n  - ') + '\n');
}
