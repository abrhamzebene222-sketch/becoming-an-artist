// Shared business rules: settings, course access, subscription pricing.
import { Setting, Enrollment, Subscription, Course } from './models/index.js';

export async function getSetting(key, fallback = null) {
  const s = await Setting.findOne({ key }).lean();
  return s?.value ?? fallback;
}

export const setSetting = (key, value) =>
  Setting.updateOne({ key }, { $set: { value } }, { upsert: true });

export const isAdmin = (user) => String(user?.role || '').toLowerCase() === 'admin';

export const activeSubscription = (userId) =>
  Subscription.findOne({ user: userId, endsAt: { $gt: new Date() } }).sort({ endsAt: -1 }).lean();

/**
 * Can this visitor open lessons of this course?
 * - Free courses: everyone, even without logging in.
 * - Paid courses: admins, buyers of the course, or active subscribers.
 */
export async function hasCourseAccess(user, course) {
  if (!course) return false;
  if (course.isFree) return true;
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (await Enrollment.exists({ user: user.id, course: course._id || course.id })) return true;
  return !!(await activeSubscription(user.id));
}

/** Monthly price = (sum of all published PAID course prices) × (1 − discount %), unless a fixed price is set. */
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
  };
}

/** Wrap async route handlers so errors reach the error middleware. */
export const ah = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item';
