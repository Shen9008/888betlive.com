'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DOMAIN = 'https://888betlive.com';
const HOST = '888betlive.com';
const KEY = process.env.INDEXNOW_KEY || '7f03f7567f7a4737b7d9175e9b1c362b';
const KEY_LOCATION =
  process.env.INDEXNOW_KEY_LOCATION ||
  `${DOMAIN}/${KEY}.txt`;
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const LIVE_SITEMAP = `${DOMAIN}/sitemap.xml`;

const ENDPOINTS = [
  'https://api.indexnow.org/indexnow',
  'https://www.bing.com/indexnow',
];

function parseSitemapXml(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

async function readUrls() {
  try {
    const response = await fetch(LIVE_SITEMAP);
    if (response.ok) {
      const urls = parseSitemapXml(await response.text());
      if (urls.length) {
        console.log(`Using live sitemap (${urls.length} URLs)`);
        return urls;
      }
    }
  } catch (err) {
    console.warn(`Live sitemap unavailable (${err.message}); falling back to local sitemap.xml`);
  }

  return parseSitemapXml(fs.readFileSync(SITEMAP_PATH, 'utf8'));
}

async function submitBatch(endpoint, urlList) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      host: HOST,
      key: KEY,
      keyLocation: KEY_LOCATION,
      urlList,
    }),
  });

  const text = await response.text();
  return {
    endpoint,
    status: response.status,
    ok: response.ok,
    body: text,
  };
}

async function run() {
  const urls = await readUrls();
  if (!urls.length) {
    throw new Error('No URLs found for IndexNow submission');
  }

  console.log(`Submitting ${urls.length} URL(s) to IndexNow`);
  console.log(`Host: ${HOST}`);
  console.log(`Key location: ${KEY_LOCATION}`);

  for (const endpoint of ENDPOINTS) {
    const result = await submitBatch(endpoint, urls);
    console.log(
      `${result.endpoint} -> HTTP ${result.status}${
        result.body ? ` (${result.body.trim()})` : ''
      }`
    );
    if (!result.ok && result.status !== 202) {
      process.exitCode = 1;
    }
  }
}

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
