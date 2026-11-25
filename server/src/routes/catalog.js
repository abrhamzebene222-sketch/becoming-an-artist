// Public pages: nested curriculum, course details, pricing, promo boards, payment accounts, contacts. No login required.
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  Category, Course, Lesson, SubmissionLink, ContactInfo, Promo, NewsItem,
} from '../models/index.js';
import { serializeNews } from '../newsLib.js';
import { optionalAuth } from '../auth.js';
import { fail, msg } from '../i18n.js';
import {
  ah, pricing, getSetting, hasCourseAccess, hasGroupAccess, groupSubscriptionQuote,
  getPrices, coursePriceOf, groupPriceOf, lessonBaseOf, lessonHours, courseTokenInfo,
} from '../lib.js';
import { breadcrumb } from '../tree.js';
import { botConfig } from '../telegram.js';
import { searchAll, matchingCourseIds, textMatches } from '../search.js';

const router = Router();
const searchLimiter = rateLimit({
  windowMs: 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: msg(req, 'tooMany') }),
});

async function lessonCounts() {
  const [all, previews] = await Promise.all([
    Lesson.aggregate([{ $group: { _id: '$course', n: { $sum: 1 } } }]),
    Lesson.aggregate([{ $match: { isPreview: true } }, { $group: { _id: '$course', n: { $sum: 1 } } }]),
  ]);
  const p = Object.fromEntries(previews.map((r) => [String(r._id), r.n]));
  return Object.fromEntries(all.map((r) => [String(r._id), { n: r.n, previews: p[String(r._id)] || 0 }]));
}

/**
 * Nested catalog. Every node has:
 *   ownCourses — courses placed directly in this group
 *   courses    — every course in this group AND all sub-groups (flattened; keeps older pages working)
 *   children   — sub-groups (any depth)
 *   lessonCount — total lessons in the subtree (used by the monthly plan builder)
 */
router.get('/catalog', ah(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 80);
  const [cats, courses, counts, matched, prices] = await Promise.all([
    Category.find().sort({ sortOrder: 1, createdAt: 1 }).lean(),
    Course.find({ isPublished: true }).sort({ sortOrder: 1, createdAt: 1 }),
    lessonCounts(),
    q ? matchingCourseIds(q) : null, // courses found by their own text/keywords OR through one of their lessons
    getPrices(),                     // credit-hour prices (computed from the WHOLE tree, so a search never changes a price)
  ]);
  const ids = new Set(cats.map((c) => String(c._id)));
  const nodes = new Map(cats.map((c) => {
    const { _id, __v, ...rest } = c;
    return [String(_id), { ...rest, id: String(_id), parent: c.parent && ids.has(String(c.parent)) ? String(c.parent) : null, children: [], ownCourses: [] }];
  }));
  for (const c of courses) {
    const node = nodes.get(String(c.category));
    if (!node) continue;
    const row = counts[String(c._id)];
    node.ownCourses.push({
      ...c.toJSON(), category: node.id, lessonCount: row?.n || 0, previewCount: row?.previews || 0,
      priceEtb: coursePriceOf(prices, c),                              // credit-hour price once the rate is set in Admin › Settings
      creditHours: prices.cfg.active ? (prices.course.get(String(c._id))?.hours || 0) : undefined,
    });
  }
  const roots = [];
  for (const n of nodes.values()) (n.parent ? nodes.get(n.parent).children : roots).push(n);

  // Post-order walk: filter by search, compute subtree courses & lesson totals
  const walk = (n, trail) => {
    const selfText = `${n.title} ${n.titleAm} ${n.description || ''} ${n.descriptionAm || ''}`;
    const hit = !q || textMatches(q, `${trail} ${selfText}`);   // the group's own name matches → show all its courses
    n.ownCourses = n.ownCourses.filter((c) => hit || matched.has(String(c.id)));
    n.children = n.children.map((ch) => walk(ch, `${trail} ${selfText}`)).filter(Boolean);
    n.courses = [...n.ownCourses, ...n.children.flatMap((ch) => ch.courses)];
    n.lessonCount = n.courses.reduce((s, c) => s + (c.isFree ? 0 : c.lessonCount), 0);
    n.groupPriceEtb = groupPriceOf(prices, n);
    if (prices.cfg.active) { n.priceEtb = n.groupPriceEtb; n.creditHours = prices.group.get(n.id)?.hours || 0; }
    if (q && !hit && !n.courses.length) return null;
    return n;
  };
  res.json(roots.map((r) => walk(r, '')).filter(Boolean));
}));

router.get('/courses/:slug', optionalAuth, ah(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, isPublished: true });
  if (!course) return fail(req, res, 404, 'courseNotFound');
  const [lessons, link, access, crumbs, prices] = await Promise.all([
    Lesson.find({ course: course._id }, 'title titleAm subtitle subtitleAm kind isPreview durationSec sortOrder creditHours blocks.type').sort({ sortOrder: 1, createdAt: 1 }),
    course.submissionLink ? SubmissionLink.findById(course.submissionLink) : SubmissionLink.findOne({ isDefault: true }),
    hasCourseAccess(req.user, course),
    breadcrumb(course.category),
    getPrices(),
  ]);
  const price = coursePriceOf(prices, course);
  // tokens already spent on single lessons of this course + which lessons the student unlocked one by one
  const info = await courseTokenInfo(req.user?.id, course, lessons.length, prices);
  // Groups (sub-group → major group) the student can buy as a whole to unlock this course
  const groupOffers = [];
  for (const g of crumbs.slice().reverse()) {
    const gPrice = groupPriceOf(prices, g);
    if (gPrice > 0 && !g.isFree) groupOffers.push({ ...g, priceEtb: gPrice, owned: await hasGroupAccess(req.user, g.id) });
  }
  const json = course.toJSON();
  const major = crumbs[0] || null;
  res.json({
    ...json,
    priceEtb: price,
    creditHours: prices.cfg.active ? (prices.course.get(String(course._id))?.hours || 0) : undefined,
    tokenRemaining: info.courseRemaining,           // what unlocking the whole course with tokens costs this student now
    category: crumbs.length ? { id: crumbs.at(-1).id, title: crumbs.at(-1).title, titleAm: crumbs.at(-1).titleAm } : null,
    breadcrumb: crumbs,
    majorGroup: major,
    groupOffers,
    lessons: lessons.map((l) => {
      const unlocked = info.unlockedIds.has(l.id);
      const base = lessonBaseOf(prices, l.id, price, lessons.length);
      return {
        id: l.id, title: l.title, titleAm: l.titleAm || '', subtitle: l.subtitle || '', subtitleAm: l.subtitleAm || '',
        kind: l.kind, isPreview: l.isPreview, durationSec: l.durationSec, sortOrder: l.sortOrder,
        blockTypes: [...new Set(l.blocks.map((b) => b.type))],
        creditHours: lessonHours(l, prices.cfg),
        unlocked,                                                                  // bought on its own with tokens
        tokenPrice: !course.isFree && !l.isPreview && !unlocked ? Math.min(base, info.courseRemaining) : 0, // 0 = cannot be bought alone
      };
    }),
    hasPreview: lessons.some((l) => l.isPreview),
    submissionLink: access ? link : null,
    hasAccess: access,
    loggedIn: !!req.user,
  });
}));

/**
 * Search courses AND lessons (titles, Amharic titles, keywords, summaries, group names — never lesson body text).
 *   GET /api/search?q=perspective&courses=6&lessons=12
 * → { q, courseTotal, lessonTotal, courses:[…], lessons:[…] }   (public, same as the catalogue)
 */
router.get('/search', searchLimiter, ah(async (req, res) => {
  const cap = (v, def, max) => Math.min(max, Math.max(1, parseInt(v, 10) || def));
  res.set('Cache-Control', 'no-store');
  res.json(await searchAll(String(req.query.q || ''), { courses: cap(req.query.courses, 8, 20), lessons: cap(req.query.lessons, 20, 50) }));
}));

router.get('/pricing', ah(async (_req, res) => res.json(await pricing())));

/** Live server-side quote for the modular monthly plan (the page also calculates it instantly). */
router.post('/subscription/quote', ah(async (req, res) => {
  res.json(await groupSubscriptionQuote(Array.isArray(req.body?.groups) ? req.body.groups : []));
}));

/** Promo / announcement boards: { boards: {1:[…],2:[…],3:[…]}, telegram: {...} } */
router.get('/promos', ah(async (_req, res) => {
  const list = await Promo.find({ isActive: true }).sort({ board: 1, slot: 1 });
  const boards = { 1: [], 2: [], 3: [] };
  for (const p of list) if (p.title || p.titleAm || p.image?.url) boards[p.board].push(p);
  // Board 1 shows the newest posts from the News menu (Admin > News). "Read more" opens /news/:id.
  // If there is no active news yet, the hand-written units of board 1 are shown instead.
  const latest = await NewsItem.find({ isActive: true }).sort({ createdAt: -1 }).limit(5).lean();
  if (latest.length) {
    const cut = (t, n) => { const x = String(t || '').trim(); return x.length > n ? `${x.slice(0, n).trimEnd()}…` : x; };
    boards[1] = (await serializeNews(latest)).map((n) => ({
      id: `news-${n.id}`, newsId: n.id,
      title: n.title, titleAm: n.titleAm,
      description: n.summary || cut(n.body, 160), descriptionAm: n.summaryAm || cut(n.bodyAm, 160),
      image: n.image,
    }));
  }
  const cfg = await botConfig();
  res.json({
    boards,
    telegram: {
      botUsername: cfg.username || '',
      channel: cfg.channel || '',
      channelUrl: cfg.channel ? `https://t.me/${cfg.channel.replace(/^@/, '')}` : '',
      ready: !!(cfg.token && cfg.username),
    },
  });
}));

router.get('/payment-accounts', ah(async (_req, res) => res.json({
  CBE: { name: await getSetting('cbeAccountName', ''), number: await getSetting('cbeAccountNumber', '') },
  TELEBIRR: { name: await getSetting('telebirrName', ''), number: await getSetting('telebirrNumber', '') },
})));

router.get('/contact', ah(async (_req, res) => res.json({
  contacts: await ContactInfo.find().sort({ sortOrder: 1 }),
  submissionLinks: await SubmissionLink.find().sort({ isDefault: -1, createdAt: 1 }),
})));

export default router;
