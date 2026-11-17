// Shared business rules: settings, course access, pricing (single course, whole groups, modular monthly plans).
import {
  Setting, Enrollment, GroupEnrollment, Subscription, Course, Lesson,
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
