/**
 * SEO Steps 2–5: unify blog fonts, Article author (Person + worksFor), SERP-aligned <title>/social titles.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DM_SANS =
  'https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&display=swap';

const ORG_AUTHOR = `"author": {
      "@type": "Organization",
      "name": "888bet Live",
      "url": "https://888betlive.com/"
    }`;

const PERSON_AUTHOR = `"author": {
      "@type": "Person",
      "name": "888bet Live Editorial Desk",
      "url": "https://888betlive.com/about-us.html",
      "jobTitle": "Editorial content",
      "worksFor": {
        "@type": "Organization",
        "name": "888bet Live",
        "url": "https://888betlive.com/"
      }
    }`;

const SERP_TITLES = {
  'exploring-popular-slot-categories-available-on-888betlive':
    'Slot Categories on 888bet Live — Guides and Picks | Blog',
  'how-cashback-systems-work-on-888betlive-casino':
    'How Cashback Works on 888bet Live Casino — Eligibility and Tips | Blog',
  'how-888betlive-is-changing-the-online-gaming-experience-in-asia':
    'How 888bet Live Is Changing Online Gaming in Asia | Blog',
  'why-more-players-are-switching-to-888betlive-for-online-gaming':
    'Why Players Switch to 888bet Live in Malaysia | Blog',
  'how-experienced-players-use-bonus-opportunities-on-888betlive':
    'Bonus Tips for Savvy Players — 888bet Live Blog',
  'what-new-players-usually-explore-first-on-888betlive':
    'What New Players Explore First on 888bet Live | Guide',
  'special-reward-campaigns-frequently-seen-on-888betlive':
    'Reward Campaigns on 888bet Live — What to Expect | Blog',
  'understanding-the-entertainment-features-available-on-888betlive':
    'Entertainment Features on 888bet Live — Player Guide | Blog',
};

function escHtmlText(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escMetaAttr(t) {
  return escHtmlText(t).replace(/"/g, '&quot;');
}

function applySerpTitle(html, slug) {
  const t = SERP_TITLES[slug];
  if (!t) return html;
  let s = html;
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${escHtmlText(t)}</title>`);
  s = s.replace(
    /<meta property="og:title" content="[^"]*">/,
    `<meta property="og:title" content="${escMetaAttr(t)}">`,
  );
  s = s.replace(
    /<meta name="twitter:title" content="[^"]*">/,
    `<meta name="twitter:title" content="${escMetaAttr(t)}">`,
  );
  return s;
}

const posts = fs
  .readdirSync(path.join(ROOT, 'blog'), { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => path.join(ROOT, 'blog', d.name, 'index.html'))
  .filter((p) => fs.existsSync(p));

for (const fp of posts) {
  const slug = path.basename(path.dirname(fp));
  let s = fs.readFileSync(fp, 'utf8');
  s = s.replace(/https:\/\/fonts\.googleapis\.com\/css2\?family=Inter[^"']+/, DM_SANS);
  if (s.includes(ORG_AUTHOR)) {
    s = s.replace(ORG_AUTHOR, PERSON_AUTHOR);
  }
  s = applySerpTitle(s, slug);
  fs.writeFileSync(fp, s, 'utf8');
  console.log('patched', path.relative(ROOT, fp));
}
