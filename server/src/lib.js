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

// ---------- Tokens (1 token = 1 ETB; balance = User.creditEtb) ----------
export const TOPUP_MIN = 100;
export const TOPUP_MAX = 200000;

/**
 * Token prices for one course for one user.
 * lesson price = ceil(course price / number of lessons), but never more than what is still unpaid on the course,
 * so buying every lesson one by one costs exactly the course price (never more).
 * Unlocking the whole course later costs the course price minus the tokens already spent on its lessons.
 */
export async function courseTokenInfo(userId, course, lessonCount) {
  const price = course.isFree ? 0 : Math.max(0, Math.round(Number(course.priceEtb) || 0));
  const base = lessonCount > 0 ? Math.ceil(price / lessonCount) : 0;
  let spent = 0;
  const unlockedIds = new Set();
  if (userId) {
    const rows = await LessonUnlock.find({ user: userId, course: course._id || course.id }, 'lesson paidEtb').lean();
    for (const r of rows) { spent += r.paidEtb || 0; unlockedIds.add(String(r.lesson)); }
  }
  const courseRemaining = Math.max(0, price - spent);
  return { price, base, spent, unlockedIds, courseRemaining, lessonPrice: Math.min(base, courseRemaining) };
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
 * base = Σ monthly price of each selected group (monthlyPriceEtb, else priceEtb, else Σ its paid course prices)
 * discount = admin tier matching the total number of lessons inside the selection.
 */
export async function groupSubscriptionQuote(selectedIds) {
  const ids = await normalizeSelection(selectedIds || []);
  const { byId } = await getCategories();
  const tiers = cleanTiers(await getSetting('subscriptionTiers', DEFAULT_TIERS));
  const items = [];
  const allCourseIds = new Set();
  for (const id of ids) {
    const cat = byId.get(id);
    const sub = await descendantIds(id);
    const courses = await Course.find({ category: { $in: sub }, isPublished: true, isFree: { $ne: true } }, 'priceEtb').lean();
    const counts = await lessonCountsByCourse(courses.map((c) => c._id));
    const lessons = courses.reduce((s, c) => s + (counts[String(c._id)] || 0), 0);
    courses.forEach((c) => allCourseIds.add(String(c._id)));
    const coursesTotal = courses.reduce((s, c) => s + (c.priceEtb || 0), 0);
    const monthly = Number(cat.monthlyPriceEtb) || Number(cat.priceEtb) || coursesTotal;
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
  const [agg] = await Course.aggregate([
    { $match: { isPublished: true, isFree: { $ne: true } } },
    { $group: { _id: null, total: { $sum: '$priceEtb' } } },
  ]);
  const total = agg?.total || 0;
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
