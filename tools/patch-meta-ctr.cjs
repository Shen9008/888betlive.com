/**
 * CTR-optimised meta titles (≤60 chars) and descriptions (≤155 chars).
 * Updates hub pages, blog posts (HTML + og/twitter), and blogs.json.
 *
 * Run: node tools/patch-meta-ctr.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

function escHtml(t) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escAttr(t) {
  return escHtml(t).replace(/"/g, '&quot;');
}

function patchMeta(html, { title, description }) {
  let s = html;
  s = s.replace(/<title>[^<]*<\/title>/, `<title>${escHtml(title)}</title>`);
  s = s.replace(
    /<meta name="description" content="[^"]*">/,
    `<meta name="description" content="${escAttr(description)}">`,
  );
  if (/<meta property="og:title" content="[^"]*">/.test(s)) {
    s = s.replace(
      /<meta property="og:title" content="[^"]*">/,
      `<meta property="og:title" content="${escAttr(title)}">`,
    );
  }
  if (/<meta property="og:description" content="[^"]*">/.test(s)) {
    s = s.replace(
      /<meta property="og:description" content="[^"]*">/,
      `<meta property="og:description" content="${escAttr(description)}">`,
    );
  }
  if (/<meta name="twitter:title" content="[^"]*">/.test(s)) {
    s = s.replace(
      /<meta name="twitter:title" content="[^"]*">/,
      `<meta name="twitter:title" content="${escAttr(title)}">`,
    );
  }
  if (/<meta name="twitter:description" content="[^"]*">/.test(s)) {
    s = s.replace(
      /<meta name="twitter:description" content="[^"]*">/,
      `<meta name="twitter:description" content="${escAttr(description)}">`,
    );
  }
  return s;
}

const HUB = {
  'index.html': {
    title: '888bet Guide: 2,000+ Slots, Live Casino & Bonuses (2026)',
    description:
      'Compare 888bet slots, Evolution live tables and promotions before you play—RTP bands, wagering rules and payout timelines explained. Updated July 2026.',
  },
  'slots.html': {
    title: '888bet Slots: Megaways, Jackpots & RTP Filters (2026)',
    description:
      'Browse 2,000+ 888bet slots by volatility, Megaways, Hold & Win and jackpots. Studio RTP bands, Bonus Buy tips and paytable checks—free guide.',
  },
  'live-casino.html': {
    title: '888bet Live Casino: Roulette, Blackjack & Baccarat',
    description:
      '888bet live streams compared—Evolution & Pragmatic tables, roulette edge, infinite blackjack rules and game-show odds. Latency tips included.',
  },
  'table-games.html': {
    title: '888bet Table Games: Blackjack & Roulette RTP Guide',
    description:
      'RNG blackjack to 99%+, European roulette 97.3%, baccarat banker math. Rule charts, bonus weighting and 888bet dispute steps explained.',
  },
  'promotions.html': {
    title: '888bet Promotions: Welcome Bonus & Free Spins Decoded',
    description:
      'See 888bet welcome match, reloads and free spins with wagering, game weighting and expiry on every card. Claim smarter—not blind.',
  },
  'about-us.html': {
    title: 'About 888bet Live: Editorial Team & Review Method',
    description:
      'Who writes 888bet Live? Independent reviewers—not the operator. Our slots, live and promo methodology, EEAT standards and monthly retests.',
  },
  'help-center.html': {
    title: '888bet Help: KYC, Withdrawals & Bonus Disputes',
    description:
      'Fix 888bet account issues fast—KYC checklist, withdrawal ETAs, bonus dispute templates, live disconnect rules and deposit limits.',
  },
  'terms.html': {
    title: '888bet Live Terms: Bonuses, KYC & Fair Play Rules',
    description:
      'Plain-language 888bet terms—eligibility, AML/KYC, deposits, withdrawals, bonus rules, fair play and dispute resolution. Updated July 2026.',
  },
  'blog/index.html': {
    title: '888bet Blog: Slots, Live Casino & Bonus Guides',
    description:
      'Practical 888bet guides on slot mechanics, live stream checks, promotion math and onboarding—written by our editorial desk. New weekly.',
  },
};

const BLOG = {
  'live-betting-creates-confidence-faster-than-traditional-sports-betting': {
    title: 'Live Betting vs Pre-Match: Which Builds Confidence?',
    description:
      'In-play football betting can sharpen decisions faster than pre-match picks—see when live odds help, when they hurt, and how to stay disciplined.',
  },
  'winning-online-feels-instant-cashing-out-never-does': {
    title: '888bet Withdrawals: Why Cash-Out Takes Longer Than Wins',
    description:
      'Wins feel instant but 888bet withdrawals follow KYC and processing queues—timelines, verification steps and how to avoid payout delays.',
  },
  'why-smooth-loading-speed-matters-more-than-fancy-slot-graphics': {
    title: 'Fast Casino Apps Beat Fancy Slot Graphics—Here\'s Why',
    description:
      'Smooth loading beats flashy slot art for session length and trust. What to test on mobile before you deposit—and red flags to skip.',
  },
  'why-fish-shooting-games-still-have-a-massive-fanbase-in-asia': {
    title: 'Why Fish Shooting Games Dominate Asia\'s Online Casinos',
    description:
      'Arcade-style fishing games keep huge Asian player bases—gameplay loops, social hooks and what they teach about session design on 888bet.',
  },
  '5-signs-an-online-casino-platform-is-built-for-long-term-players': {
    title: '5 Signs a Casino Platform Is Built for Long-Term Players',
    description:
      'Spot safe betting platforms before you deposit—KYC clarity, withdrawal history, game integrity, limits and support quality on one checklist.',
  },
  'the-new-trend-of-treating-online-casinos-like-entertainment-platforms': {
    title: 'Casinos as Entertainment Hubs—The 2026 Player Trend',
    description:
      'Online casino entertainment now means streams, missions and social layers—not just reels. How 888bet-style lobbies keep casual players engaged.',
  },
  'younger-bettors-prefer-esports-to-traditional-sports': {
    title: 'Why Younger Bettors Choose Esports Over Traditional Sports',
    description:
      'Esports betting in Malaysia draws digital-native players—shorter matches, live data and markets that fit mobile sessions. What to compare first.',
  },
  'why-near-miss-moments-feel-so-powerful-in-online-slots': {
    title: 'Near-Miss Slots: Why Almost-Wins Feel So Powerful',
    description:
      'Slot psychology behind near misses—how reel design triggers urgency, what RTP cannot tell you, and habits to keep sessions controlled.',
  },
  'why-rtp-alone-doesnt-tell-the-full-story-about-slot-games': {
    title: 'RTP Isn\'t Everything: What Slots Hide Beyond the Number',
    description:
      'High RTP slots can still drain bankrolls—volatility, hit frequency, bonus buy cost and max win caps explained in a practical RTP slot guide.',
  },
  'why-fast-withdrawals-matter-more-than-huge-welcome-bonuses': {
    title: 'Instant Payout vs Welcome Bonus: What Malaysian Players Pick',
    description:
      'Fast withdrawals often beat oversized welcome offers—compare wagering traps, KYC delays and why instant payout Malaysia ranks higher in surveys.',
  },
  'the-sudden-rise-of-turbo-games-and-fast-betting-formats': {
    title: 'Turbo Casino Games: Why Fast Formats Are Taking Over',
    description:
      'Turbo casino games compress decisions into seconds—crash, mines and rapid rounds. Pros, cons and bankroll rules before you chase speed.',
  },
  'why-baccarat-dealers-became-the-face-of-online-live-casinos': {
    title: 'Why Baccarat Dealers Became Live Casino\'s Signature Face',
    description:
      'Baccarat dealers anchor trust on streamed tables—camera work, pacing and why live baccarat rooms convert faster than RNG alone.',
  },
  'smart-ways-experienced-players-avoid-emotional-betting-decisions': {
    title: '7 Ways Smart Players Avoid Emotional Betting Decisions',
    description:
      'Responsible gambling Malaysia starts with pre-set limits, cooldown rules and stake caps—tactics veteran 888bet players use to stay rational.',
  },
  'how-modern-casino-lobbies-are-designed-to-keep-players-exploring': {
    title: 'How Casino Lobby Design Keeps You Exploring (On Purpose)',
    description:
      'Casino UX design uses tiles, badges and filters to extend sessions—decode lobby patterns so you choose games deliberately, not reactively.',
  },
  'pragmatic-play-vs-playn-go-which-slot-style-creates-longer-sessions': {
    title: 'Pragmatic Play vs Play\'n GO: Which Slots Last Longer?',
    description:
      'Compare Pragmatic Play and Play\'n GO slot styles—volatility curves, feature frequency and which studio fits short vs long mobile sessions.',
  },
  'why-bonus-buy-slots-appeal-to-high-risk-players': {
    title: 'Bonus Buy Slots: Why High-Risk Players Love Them',
    description:
      'Bonus buy slots trade upfront cost for instant features—variance spikes, bankroll rules and when the math favours patient base-game grinders.',
  },
  'the-real-reason-players-keep-switching-between-slots-and-baccarat': {
    title: 'Why Players Switch Between Slots and Baccarat Mid-Session',
    description:
      'Volatility fatigue drives baccarat and slots switching—when table games reset variance, and how to plan hybrid sessions without tilt.',
  },
  'what-makes-progressive-jackpots-feel-more-exciting-than-regular-slots': {
    title: 'Progressive Jackpots: Why They Feel Bigger Than Slots',
    description:
      'Progressive jackpot Malaysia pools grow in public view—network vs local links, true odds and why near-miss hype hits harder on jackpots.',
  },
  'why-most-players-now-gamble-in-short-micro-sessions-on-mobile': {
    title: 'Micro Sessions: Why Mobile Players Gamble in 5-Minute Bursts',
    description:
      'Smartphone slots fit commutes and breaks—session length trends, notification traps and settings that protect micro-session bankrolls.',
  },
  'why-hd-live-dealer-streams-changed-online-gambling-forever': {
    title: 'HD Live Dealer Streams Changed Online Gambling Forever',
    description:
      'Live dealer Malaysia quality now rivals floor tables—bitrate, latency, table limits and how HD streams rebuilt trust in remote play.',
  },
  'fair-play-systems-and-game-integrity-on-888betlive': {
    title: '888bet Fair Play: How Game Integrity Is Checked',
    description:
      '888betlive fair play relies on licensed RNG, third-party audits and dispute paths—what to verify before you trust any platform claim.',
  },
  'how-888betlive-maintains-secure-gaming-transactions': {
    title: '888bet Security: How Gaming Transactions Stay Protected',
    description:
      '888betlive security covers encryption, AML checks and payment routing—red flags, 2FA habits and how to spot phishing around withdrawals.',
  },
  'player-opinions-and-trends-surrounding-888betlive-casino': {
    title: '888bet Player Reviews: Trends & Honest Feedback (2026)',
    description:
      '888betlive player feedback themes—payout speed, game variety, promo clarity and support quality—synthesised from community signals.',
  },
  'what-makes-888betlive-different-from-other-gaming-platforms': {
    title: '888bet Review: What Sets It Apart From Other Casinos',
    description:
      'Independent 888betlive review—live depth, slot filters, promo transparency and mobile UX compared to typical regional competitors.',
  },
  'understanding-risk-and-reward-in-games-on-888betlive': {
    title: '888bet Gameplay Tips: Balancing Risk and Reward',
    description:
      '888betlive gameplay tips for sizing bets to volatility—when to press, when to flat-bet, and how bonus weighting changes effective RTP.',
  },
  'building-better-casino-habits-while-playing-on-888betlive': {
    title: 'Better Casino Habits: A Practical 888bet Strategy Guide',
    description:
      '888betlive strategy for sustainable play—session budgets, win/loss stops, game rotation and weekly reviews that cut impulsive deposits.',
  },
  'why-mobile-players-prefer-using-888betlive-on-smartphones': {
    title: '888bet Mobile Gaming: Why Players Choose Smartphones',
    description:
      '888betlive mobile gaming wins on load speed, thumb-friendly lobbies and biometric login—compare iOS vs Android experience before you switch.',
  },
  'the-mobile-gaming-experience-offered-by-888betlive': {
    title: '888bet Mobile Casino: Full App & Browser Experience',
    description:
      '888betlive mobile casino walkthrough—navigation, live stream quality, deposit flows and battery-friendly settings for long sessions.',
  },
  'what-players-should-know-about-withdrawals-on-888betlive': {
    title: '888bet Withdrawal Guide: Timelines, Limits & KYC Steps',
    description:
      '888betlive withdrawal checklist—methods, minimums, verification documents, weekend delays and how to track payout status.',
  },
  'managing-digital-transactions-on-888betlive': {
    title: '888bet Payment Methods: Deposits, E-Wallets & Fees',
    description:
      '888betlive payment methods compared—cards, e-wallets, processing times, FX fees and how to keep transaction records for disputes.',
  },
  'exploring-popular-football-and-esports-markets-on-888betlive': {
    title: '888bet Sports Betting: Football & Esports Markets Guide',
    description:
      '888betlive sports betting markets—match odds, live lines, esports props and liquidity tips for Premier League and mobile-friendly esports.',
  },
  'how-sports-fans-use-888betlive-for-live-match-betting': {
    title: '888bet Sportsbook: How Fans Bet Live During Matches',
    description:
      '888betlive sportsbook live tools—cash-out, momentum shifts, latency and bankroll splits for in-play football without chasing losses.',
  },
  'comparing-baccarat-and-roulette-experiences-on-888betlive': {
    title: '888bet Baccarat vs Roulette: Which Table Fits You?',
    description:
      '888betlive baccarat roulette compared—house edge, pace, bonus weighting and live vs RNG paths so you pick the right table first time.',
  },
  'the-appeal-of-real-time-dealer-games-on-888betlive': {
    title: '888bet Live Casino: Why Real-Time Dealers Win Players',
    description:
      '888betlive live casino streams—table limits, side bets, chat etiquette and how to test video quality before you commit a session bankroll.',
  },
  'the-difference-between-classic-and-modern-slots-on-888betlive': {
    title: 'Classic vs Modern 888bet Slots: Formats Compared',
    description:
      '888betlive slot games split into fruit classics and feature-heavy video slots—RTP ranges, volatility and which style suits your budget.',
  },
  '888betlive-welcome-bonus-explained-how-to-claim-it': {
    title: '888bet Welcome Bonus: How to Claim It (Step-by-Step)',
    description:
      'Casino welcome bonus on 888bet—eligibility, opt-in clicks, wagering math, game weighting and expiry clocks before you accept any offer.',
  },
  'exploring-popular-slot-categories-available-on-888betlive': {
    title: '888bet Slot Categories: Megaways, Jackpots & More',
    description:
      '888betlive slots sorted by category—Megaways, Hold & Win, jackpots and classics with filters that match volatility to your session goal.',
  },
  'how-experienced-players-use-bonus-opportunities-on-888betlive': {
    title: '888bet Bonus Tips: How Experienced Players Optimise Offers',
    description:
      '888betlive bonus tips from veteran players—stacking reloads, avoiding weighted traps and tracking playthrough without overspending.',
  },
  'special-reward-campaigns-frequently-seen-on-888betlive': {
    title: '888bet Promotions: Reward Campaigns You\'ll See Most Often',
    description:
      '888betlive promotions cycle through reloads, races and VIP boosts—typical terms, caps and how to read the fine print fast.',
  },
  'why-more-players-are-switching-to-888betlive-for-online-gaming': {
    title: 'Why Players Switch to 888bet Live in Malaysia (2026)',
    description:
      '888betlive Malaysia growth drivers—live depth, mobile speed, promo clarity and payout reputation compared to legacy alternatives.',
  },
  'understanding-the-entertainment-features-available-on-888betlive': {
    title: '888bet Platform Features: Live, Slots & Entertainment Hub',
    description:
      '888betlive platform tour—lobby filters, live categories, missions and social layers that shape how new players explore on day one.',
  },
  'what-new-players-usually-explore-first-on-888betlive': {
    title: '888bet Guide for New Players: What to Explore First',
    description:
      '888betlive guide for first sessions—where beginners start (slots vs live), demo paths, deposit limits and promo cards to skip early.',
  },
  'how-888betlive-is-changing-the-online-gaming-experience-in-asia': {
    title: 'How 888bet Live Is Reshaping Online Gaming in Asia',
    description:
      '888betlive online casino trends in Asia—mobile-first lobbies, local payments, HD live tables and faster KYC shaping regional play.',
  },
  'understanding-the-888betlive-casino-cashback-system': {
    title: '888bet Cashback Explained: Rates, Rules & Eligibility',
    description:
      '888betlive cashback tiers—how losses convert to returns, wagering on cashback credits and weekly vs VIP schedules compared.',
  },
  'understanding-rtp-how-to-choose-digital-games-with-the-best-payout-rates': {
    title: 'High RTP Games: How to Pick the Best Payout Rates',
    description:
      'High RTP digital games still differ by volatility—use paytables, provider docs and session goals to choose slots with better long-run value.',
  },
  'how-cashback-systems-work-on-888betlive-casino': {
    title: '888bet Cashback: How It Works & How to Maximise Returns',
    description:
      '888betlive cashback mechanics—qualifying bets, calculation windows, opt-in rules and mistakes that void returns on table and slot play.',
  },
};

function lenCheck(label, text, max) {
  if (text.length > max) {
    console.warn(`WARN ${label} (${text.length}/${max}): ${text}`);
  }
}

for (const [rel, meta] of Object.entries(HUB)) {
  lenCheck(`title ${rel}`, meta.title, 60);
  lenCheck(`desc ${rel}`, meta.description, 155);
  const fp = path.join(ROOT, rel.split('/').join(path.sep));
  if (!fs.existsSync(fp)) {
    console.warn('skip missing', rel);
    continue;
  }
  const raw = fs.readFileSync(fp, 'utf8');
  const next = patchMeta(raw, meta);
  if (next !== raw) {
    fs.writeFileSync(fp, next, 'utf8');
    console.log('hub', rel);
  }
}

const blogsPath = path.join(ROOT, 'assets', 'data', 'blogs.json');
const blogs = JSON.parse(fs.readFileSync(blogsPath, 'utf8'));
let blogPatched = 0;

for (const post of blogs) {
  const meta = BLOG[post.slug];
  if (!meta) {
    console.warn('no BLOG meta for', post.slug);
    continue;
  }
  lenCheck(`title blog/${post.slug}`, meta.title, 60);
  lenCheck(`desc blog/${post.slug}`, meta.description, 155);
  post.meta_title = meta.title;
  post.meta_description = meta.description;

  const fp = path.join(ROOT, 'blog', post.slug, 'index.html');
  if (!fs.existsSync(fp)) continue;
  const raw = fs.readFileSync(fp, 'utf8');
  const next = patchMeta(raw, meta);
  if (next !== raw) {
    fs.writeFileSync(fp, next, 'utf8');
    blogPatched++;
  }
}

fs.writeFileSync(blogsPath, JSON.stringify(blogs, null, 2) + '\n', 'utf8');
console.log(`blogs.json updated (${blogs.length} posts), HTML patched: ${blogPatched}`);
