// Shared business rules: settings, course access, pricing (single course, whole groups, modular monthly plans).
import {
  Setting, Enrollment, GroupEnrollment, Subscription, Course, Lesson, LessonUnlock, User, CreditTransaction,
} from './models/index.js';
import { ancestorIds, ancestorChain, descendantIds, normalizeSelection, getCategories } from './tree.js';

export async function getSetting(key, fallback = null) {
  const s = await Setting.findOne({ key }).lean();
  return s?.value ?? fallback;
}

export const setSetting = (key, value) =>
  Setting.updateOne({ key }, { $set: { value } }, { upsert: true });

export const isAdmin = (user) => String(user?.role || '').toLowerCase() === 'admin';

/** Legacy "all paid courses" monthly plan (subscription without a group list). */
export const activeSubscription = (userId) =>
  Subscription.findOne({ user: userId, endsAt: { $gt: new Date() }, $or: [{ groups: { $exists: false } }, { groups: { $size: 0 } }] })
    .sort({ endsAt: -1 }).lean();

/** Modular group-level monthly plans that are running now. */
export const activeGroupSubscriptions = (userId) =>
  Subscription.find({ user: userId, endsAt: { $gt: new Date() }, 'groups.0': { $exists: true } }).sort({ endsAt: -1 }).lean();

/** Every category id the user has unlocked as a whole (purchase, credit, or modular subscription). */
export async function unlockedGroupIds(userId) {
  const [owned, subs] = await Promise.all([
    GroupEnrollment.find({ user: userId }, 'category').lean(),
    activeGroupSubscriptions(userId),
  ]);
  return new Set([...owned.map((g) => String(g.category)), ...subs.flatMap((s) => s.groups.map(String))]);
}

/**
 * Can this visitor open lessons of this course?
 * - Free course, or inside a free group: everyone, even without logging in.
 * - Paid: admins, buyers of the course, buyers/subscribers of the course's group or ANY ancestor group,
 *   or legacy all-access subscribers.
 */
export async function hasCourseAccess(user, course) {
  if (!course) return false;
  if (course.isFree) return true;
  const chain = await ancestorChain(course.category?._id || course.category);
  if (chain.some((c) => c?.isFree)) return true;
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (await Enrollment.exists({ user: user.id, course: course._id || course.id })) return true;
  const chainIds = chain.map((c) => String(c._id));
  if (await GroupEnrollment.exists({ user: user.id, category: { $in: chainIds } })) return true;
  const groups = await unlockedGroupIds(user.id);
  if (chainIds.some((id) => groups.has(id))) return true;
  return !!(await activeSubscription(user.id));
}

/** Course access, or this single lesson was unlocked with tokens, or the lesson is a free preview. */
export async function hasLessonAccess(user, lesson, course) {
  if (lesson?.isPreview) return true;
  if (await hasCourseAccess(user, course)) return true;
  if (!user) return false;
  return !!(await LessonUnlock.exists({ user: user.id, lesson: lesson._id || lesson.id }));
}

// ---------- CREDIT-HOUR PRICING ----------
// One number runs the whole price list:  Admin › Settings › "Price of one credit hour" (ETB).
//   lesson price = creditHours × rate           (e.g. 1.4 × 40 = 56 ETB, or 56 tokens — 1 token = 1 ETB)
//   course price = sum of its lesson prices     (so buying every lesson one by one costs exactly the course price)
//   group  price = sum of the prices of every paid, published course below it (sub-groups included, free sub-groups skipped)
// Each lesson is rounded on its own, so every total is a whole number and the sums always agree.
// Lessons with no content yet (an empty text lesson) are not sold and add nothing to a price — the price grows as lessons are written.
// A lesson with no creditHours uses Settings › "Default credit hours".
// While the rate is 0 the old stored prices (Course.priceEtb / Category.priceEtb) work exactly as before.
export const DEFAULT_CREDIT_HOURS = 1;
export const MIN_CREDIT_HOURS = 0.1;
export const MAX_CREDIT_HOURS = 10;

/**
 * Validate the creditHours an admin typed in a form.
 *   undefined → { skip: true }   (field not sent: leave the lesson alone)
 *   '' / null → { value: null }  (clear it: the lesson uses the default credit hours)
 *   bad       → { error: 'creditHoursInvalid' }
 */
export function creditHoursInput(v) {
  if (v === undefined) return { skip: true };
  if (v === '' || v === null) return { value: null };
  const n = Number(typeof v === 'string' ? v.replace(',', '.') : v);
  if (!Number.isFinite(n) || n < MIN_CREDIT_HOURS || n > MAX_CREDIT_HOURS) return { error: 'creditHoursInvalid' };
  return { value: Math.round(n * 100) / 100 };
}

/** Admin / AI input → a number with at most 2 decimals, between 0.01 and 10; anything else → null (= use the default). */
export function cleanCreditHours(v) {
  if (v === '' || v == null) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(MAX_CREDIT_HOURS, Math.round(n * 100) / 100);
}

export async function creditConfig() {
  const rate = Math.max(0, Number(await getSetting('creditHourRateEtb', 0)) || 0);
  const dh = Number(await getSetting('defaultCreditHours', DEFAULT_CREDIT_HOURS));
  return { rate, defaultHours: dh > 0 ? dh : DEFAULT_CREDIT_HOURS, active: rate > 0 };
}

export const lessonHours = (l, cfg) => (Number(l?.creditHours) > 0 ? Number(l.creditHours) : cfg.defaultHours);
export const creditPrice = (hours, cfg) => Math.round(Number((hours * cfg.rate).toFixed(6)));
const r2 = (n) => Math.round(n * 100) / 100;

// A lesson is "sellable" once it has something to read or watch.
const SELLABLE = { $or: [{ $ne: ['$kind', 'blocks'] }, { $gt: [{ $size: { $ifNull: ['$blocks', []] } }, 0] }] };

/**
 * Every price in the app, computed together in 3 small queries.
 *   p.cfg     { rate, defaultHours, active }
 *   p.lesson  Map lessonId → { course, hours, price }     (sellable lessons only)
 *   p.course  Map courseId → { price, hours, lessons }
 *   p.group   Map groupId  → { price, hours, lessons }
 * When the rate is 0 the maps stay empty and the helpers below fall back to the old stored prices.
 */
export async function getPrices() {
  const cfg = await creditConfig();
  const p = { cfg, lesson: new Map(), course: new Map(), group: new Map() };
  if (!cfg.active) return p;

  const [{ list }, courses, rows] = await Promise.all([
    getCategories(),
    Course.find({}, 'category isFree isPublished').lean(),
    Lesson.aggregate([
      { $project: { course: 1, creditHours: 1, sellable: SELLABLE } },
      { $match: { sellable: true } },
    ]),
  ]);

  for (const r of rows) {
    const hours = lessonHours(r, cfg);
    const price = creditPrice(hours, cfg);
    const cid = String(r.course);
    p.lesson.set(String(r._id), { course: cid, hours, price });
    const m = p.course.get(cid) || { price: 0, hours: 0, lessons: 0 };
    m.price += price; m.hours += hours; m.lessons += 1;
    p.course.set(cid, m);
  }
  for (const m of p.course.values()) m.hours = r2(m.hours);

  const byId = new Map(list.map((c) => [String(c._id), c]));
  const kids = new Map();
  for (const c of list) {
    const par = c.parent && byId.has(String(c.parent)) ? String(c.parent) : null;
    if (!kids.has(par)) kids.set(par, []);
    kids.get(par).push(String(c._id));
  }
  const coursesIn = new Map();
  for (const c of courses) {
    if (!c.isPublished || c.isFree) continue;
    const k = String(c.category);
    if (!coursesIn.has(k)) coursesIn.set(k, []);
    coursesIn.get(k).push(String(c._id));
  }
  const visit = (id) => {
    if (p.group.has(id)) return p.group.get(id);
    const total = { price: 0, hours: 0, lessons: 0 };
    p.group.set(id, total);                       // set first: protects against a (broken) parent loop
    if (!byId.get(id)?.isFree) {                  // a free sub-group adds nothing to the group above it
      const parts = [
        ...(coursesIn.get(id) || []).map((cid) => p.course.get(cid)).filter(Boolean),
        ...(kids.get(id) || []).map(visit),
      ];
      for (const x of parts) { total.price += x.price; total.hours += x.hours; total.lessons += x.lessons; }
      total.hours = r2(total.hours);
    }
    return total;
  };
  for (const c of list) visit(String(c._id));
  return p;
}

const legacyCoursePrice = (c) => (c?.isFree ? 0 : Math.max(0, Math.round(Number(c?.priceEtb) || 0)));
/** Price (ETB) of one course: credit-hour price when the rate is set, otherwise the stored price. */
export const coursePriceOf = (p, c) => (p.cfg.active
  ? (c.isFree ? 0 : p.course.get(String(c._id ?? c.id))?.price || 0)
  : legacyCoursePrice(c));
/** Price (ETB) of a whole group. */
export const groupPriceOf = (p, cat) => (p.cfg.active
  ? (cat.isFree ? 0 : p.group.get(String(cat._id ?? cat.id))?.price || 0)
  : groupPrice(cat));
/** Token price of one lesson before the "never pay twice" cap. 0 = this lesson cannot be bought on its own. */
export const lessonBaseOf = (p, lessonId, coursePrice, lessonCount) => (p.cfg.active
  ? p.lesson.get(String(lessonId))?.price || 0
  : (lessonCount > 0 ? Math.ceil(coursePrice / lessonCount) : 0));

// ---------- Tokens (1 token = 1 ETB; balance = User.creditEtb) ----------
export const TOPUP_MIN = 100;
export const TOPUP_MAX = 200000;

/**
 * Token prices for one course for one user.
 * lesson price = creditHours × rate (see CREDIT-HOUR PRICING above; before the rate is set: ceil(course price / lessons)),
 * but never more than what is still unpaid on the course, so buying every lesson one by one costs exactly the course price.
 * Unlocking the whole course later costs the course price minus the tokens already spent on its lessons.
 * Pass `p` (from getPrices()) when you already have it, and `lessonId` to get that lesson's price.
 */
export async function courseTokenInfo(userId, course, lessonCount, p = null, lessonId = null) {
  const prices = p || await getPrices();
  const price = coursePriceOf(prices, course);
  const base = lessonId ? lessonBaseOf(prices, lessonId, price, lessonCount) : 0;
  let spent = 0;
  const unlockedIds = new Set();
  if (userId) {
    const rows = await LessonUnlock.find({ user: userId, course: course._id || course.id }, 'lesson paidEtb').lean();
    for (const r of rows) { spent += r.paidEtb || 0; unlockedIds.add(String(r.lesson)); }
  }
  const courseRemaining = Math.max(0, price - spent);
  return { price, base, spent, unlockedIds, courseRemaining, lessonPrice: Math.min(base, courseRemaining), prices };
}

/**
 * Spend tokens safely:
 *  1) deduct atomically (only if the balance is enough, so it can never go negative)
 *  2) write the ledger row  3) grant() gives the access and returns true only if it was newly granted
 * If anything fails, the tokens are given back and the ledger row is removed.
 * Returns { balance } or { error: 'notEnoughCredit' | 'alreadyUnlocked' }.
 */
export async function spendTokens(userId, price, entry, grant) {
  const amount = Math.round(price);
  if (!(amount > 0)) return { error: 'nothingToPay' };
  const u = await User.findOneAndUpdate({ _id: userId, creditEtb: { $gte: amount } }, { $inc: { creditEtb: -amount } }, { new: true });
  if (!u) return { error: 'notEnoughCredit' };
  let row;
  try {
    row = await CreditTransaction.create({ user: u._id, amountEtb: -amount, balanceAfter: u.creditEtb, ...entry });
    if (!(await grant())) {
      await CreditTransaction.deleteOne({ _id: row._id });
      await User.updateOne({ _id: u._id }, { $inc: { creditEtb: amount } });
      return { error: 'alreadyUnlocked' };
    }
  } catch (e) {
    if (row) await CreditTransaction.deleteOne({ _id: row._id }).catch(() => {});
    await User.updateOne({ _id: u._id }, { $inc: { creditEtb: amount } });
    throw e;
  }
  return { balance: u.creditEtb };
}

/** Does the user already own this group (or one of its ancestors)? */
export async function hasGroupAccess(user, categoryId) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const chainIds = await ancestorIds(categoryId);
  const groups = await unlockedGroupIds(user.id);
  return chainIds.some((id) => groups.has(id));
}

// ---------- Subscription discount tiers (Admin › Settings) ----------
export const DEFAULT_TIERS = [
  { minLessons: 10, maxLessons: 25, percent: 10 },
  { minLessons: 26, maxLessons: 50, percent: 25 },
  { minLessons: 51, maxLessons: 0, percent: 35 }, // maxLessons 0 = no upper limit
];

export function cleanTiers(list) {
  return (Array.isArray(list) ? list : [])
    .map((t) => ({
      minLessons: Math.max(0, Math.round(Number(t.minLessons) || 0)),
      maxLessons: Math.max(0, Math.round(Number(t.maxLessons) || 0)),
      percent: Math.min(100, Math.max(0, Number(t.percent) || 0)),
    }))
    .filter((t) => t.percent > 0)
    .sort((a, b) => a.minLessons - b.minLessons);
}

export const tierFor = (tiers, lessons) =>
  tiers.find((t) => lessons >= t.minLessons && (!t.maxLessons || lessons <= t.maxLessons)) || null;

async function lessonCountsByCourse(courseIds) {
  const rows = await Lesson.aggregate([{ $match: { course: { $in: courseIds } } }, { $group: { _id: '$course', n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
}

/** Price of a group when bought as a whole (0 = not sold as a group). */
export const groupPrice = (cat) => (cat?.isFree ? 0 : Math.max(0, Number(cat?.priceEtb) || 0));

/**
 * Live quote for a modular monthly plan built from selected groups.
 * base = Σ monthly price of each selected group (monthlyPriceEtb, else the group price [credit-hour price when the rate is set], else Σ its paid course prices)
 * discount = admin tier matching the total number of lessons inside the selection.
 */
export async function groupSubscriptionQuote(selectedIds) {
  const ids = await normalizeSelection(selectedIds || []);
  const { byId } = await getCategories();
  const tiers = cleanTiers(await getSetting('subscriptionTiers', DEFAULT_TIERS));
  const prices = await getPrices();
  const items = [];
  const allCourseIds = new Set();
  for (const id of ids) {
    const cat = byId.get(id);
    const sub = await descendantIds(id);
    const courses = await Course.find({ category: { $in: sub }, isPublished: true, isFree: { $ne: true } }, 'priceEtb isFree').lean();
    const counts = await lessonCountsByCourse(courses.map((c) => c._id));
    const lessons = courses.reduce((s, c) => s + (counts[String(c._id)] || 0), 0);
    courses.forEach((c) => allCourseIds.add(String(c._id)));
    const coursesTotal = courses.reduce((s, c) => s + coursePriceOf(prices, c), 0);
    const monthly = Number(cat.monthlyPriceEtb) || groupPriceOf(prices, cat) || coursesTotal;
    items.push({ id, title: cat.title, titleAm: cat.titleAm, lessons, courses: courses.length, monthlyEtb: monthly });
  }
  const lessonCount = items.reduce((s, i) => s + i.lessons, 0);
  const baseEtb = items.reduce((s, i) => s + i.monthlyEtb, 0);
  const tier = tierFor(tiers, lessonCount);
  const discountPercent = tier?.percent || 0;
  const discountEtb = Math.round(baseEtb * (discountPercent / 100));
  return { groups: ids, items, lessonCount, baseEtb, discountPercent, discountEtb, totalEtb: baseEtb - discountEtb, tier, tiers };
}

// ---------- 1-on-1 tutoring: hourly rate + fixed duration discounts ----------
// Price = rate x hours x (1 - discount). Discounts are fixed here; admin only edits the per-hour rates in Settings.
export const TUTORING_OPTIONS = [
  { hours: 1, discountPercent: 0 },
  { hours: 1.5, discountPercent: 10 },
  { hours: 2, discountPercent: 15 },
  { hours: 2.5, discountPercent: 20 },
  { hours: 3, discountPercent: 25 },
];
export const TUTORING_CONTENT = ['theory', 'practical', 'both'];

/** Per-hour rate (ETB) for a mode, from Settings. */
export async function tutoringRate(mode) {
  return Math.max(0, Number(await getSetting(mode === 'online' ? 'sessionPriceOnlineEtb' : 'sessionPriceInPersonEtb', 0)) || 0);
}

/**
 * Validate the inputs and compute the full quote. Returns { error } (a message key) or { quote }.
 * `hours` may arrive as a number or a string; it must match one of the allowed options exactly.
 */
export async function tutoringQuote({ mode, hours, contentType, theoryPercent }) {
  if (!['online', 'in_person'].includes(mode)) return { error: 'bookingFields' };
  const opt = TUTORING_OPTIONS.find((o) => o.hours === Number(hours));
  if (!opt) return { error: 'bookingDuration' };
  if (!TUTORING_CONTENT.includes(contentType)) return { error: 'bookingContent' };
  let theory;
  if (contentType === 'theory') theory = 100;
  else if (contentType === 'practical') theory = 0;
  else {
    theory = Number(theoryPercent);
    if (!Number.isInteger(theory) || theory < 10 || theory > 90 || theory % 10 !== 0) return { error: 'bookingSplit' };
  }
  const rate = await tutoringRate(mode);
  const listPriceEtb = Math.round(rate * opt.hours);
  const priceEtb = Math.round(rate * opt.hours * (1 - opt.discountPercent / 100));
  return {
    quote: {
      mode, durationHours: opt.hours, contentType, theoryPercent: theory, practicalPercent: 100 - theory,
      rateUsed: rate, discountPercent: opt.discountPercent, listPriceEtb, priceEtb, savingsEtb: listPriceEtb - priceEtb,
    },
  };
}

/** Legacy pricing (all paid courses monthly) + session prices + discount tiers. */
export async function pricing() {
  const prices = await getPrices();
  let total = 0;
  if (prices.cfg.active) {
    const paid = await Course.find({ isPublished: true, isFree: { $ne: true } }, 'isFree').lean();
    total = paid.reduce((sum, c) => sum + coursePriceOf(prices, c), 0);
  } else {
    const [agg] = await Course.aggregate([
      { $match: { isPublished: true, isFree: { $ne: true } } },
      { $group: { _id: null, total: { $sum: '$priceEtb' } } },
    ]);
    total = agg?.total || 0;
  }
  const discount = Number(await getSetting('subscriptionDiscountPercent', 40));
  const fixed = Number(await getSetting('subscriptionFixedPriceEtb', 0));
  const monthly = fixed > 0 ? fixed : Math.round(total * (1 - discount / 100));
  return {
    allCoursesTotal: total,
    discountPercent: discount,
    monthlyPrice: monthly,
    savingsPercent: total > 0 ? Math.max(0, Math.round((1 - monthly / total) * 100)) : 0,
    usesFixedPrice: fixed > 0,
    sessionPriceOnline: Number(await getSetting('sessionPriceOnlineEtb', 0)),
    sessionPriceInPerson: Number(await getSetting('sessionPriceInPersonEtb', 0)),
    // Both session prices above are PER HOUR. Duration discounts are fixed:
    tutoringOptions: TUTORING_OPTIONS,
    topup: { min: TOPUP_MIN, max: TOPUP_MAX },
    credit: { active: prices.cfg.active, rate: prices.cfg.rate, defaultHours: prices.cfg.defaultHours },
    tiers: cleanTiers(await getSetting('subscriptionTiers', DEFAULT_TIERS)),
  };
}

/** Wrap async route handlers so errors reach the error middleware. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';

/** Accepts youtube.com/watch?v=, youtu.be/, /shorts/, /embed/ — returns the 11-char id or ''. */
export function youtubeId(url) {
  const m = String(url || '').match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}
