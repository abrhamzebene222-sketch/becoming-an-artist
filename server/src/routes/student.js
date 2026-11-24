// Logged-in user actions: notifications, dashboard summary, payments, 1-on-1 bookings, course requests.
import { Router } from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import {
  Course, Category, Enrollment, Payment, Booking, CourseRequest, Notification, User,
} from '../models/index.js';
import { requireAuth, signScoped, verify } from '../auth.js';
import { notifyAdmins, addStream } from '../notify.js';
import { fail } from '../i18n.js';
import {
  ah, pricing, tutoringQuote, TOPUP_MIN, TOPUP_MAX, activeSubscription, activeGroupSubscriptions, unlockedGroupIds, groupSubscriptionQuote, groupPrice, hasGroupAccess,
} from '../lib.js';
import { uploadReceipt, deleteReceipt, isConfigured } from '../cloudinary.js';
import { descendantIds } from '../tree.js';

const router = Router();

// Screenshots are kept in memory, then sent to Cloudinary (Render's disk is not permanent)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(png|jpe?g|webp)$/.test(file.mimetype)),
});

// ---------- Live notifications (EventSource can't send headers, so it uses a short token) ----------
router.get('/notifications/stream', (req, res) => {
  const claims = verify(String(req.query.t || ''));
  if (!claims || claims.scope !== 'sse') return res.status(401).end();
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write(': connected\n\n');
  addStream(String(claims.sub), res);
});

// Only this router's own paths require login (so other /api routes still return 404 properly)
const OWN = /^\/(notifications|me|payments|bookings|course-requests)(\/|$)/;
router.use((req, res, next) => (OWN.test(req.path) ? requireAuth(req, res, next) : next('router')));

router.get('/notifications/stream-token', (req, res) => res.json({ token: signScoped({ scope: 'sse', sub: req.user.id }, '12h') }));

router.get('/notifications', ah(async (req, res) =>
  res.json(await Notification.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50))));

router.post('/notifications/read', ah(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  res.json({ ok: true });
}));

// ---------- Dashboard ----------
router.get('/me/summary', ah(async (req, res) => {
  const sub = await activeSubscription(req.user.id);
  let enrolled;
  if (sub) {
    enrolled = await Course.find({ isPublished: true, isFree: { $ne: true } }).populate('category', 'title titleAm').sort({ sortOrder: 1 });
  } else {
    const rows = await Enrollment.find({ user: req.user.id }).sort({ createdAt: -1 })
      .populate({ path: 'course', populate: { path: 'category', select: 'title titleAm' } });
    enrolled = rows.map((r) => r.course).filter(Boolean);
    // + every course inside groups bought as a whole / unlocked with credit / in a modular monthly plan
    const groups = [...(await unlockedGroupIds(req.user.id))];
    if (groups.length) {
      const cats = new Set();
      for (const g of groups) (await descendantIds(g)).forEach((id) => cats.add(id));
      const seen = new Set(enrolled.map((c) => String(c._id)));
      const more = await Course.find({ category: { $in: [...cats] }, isPublished: true }).populate('category', 'title titleAm').sort({ sortOrder: 1 });
      enrolled = [...enrolled, ...more.filter((c) => !seen.has(String(c._id)))];
    }
  }
  const groupSubs = await activeGroupSubscriptions(req.user.id);
  const unlockedGroups = [...(await unlockedGroupIds(req.user.id))];
  const me = await User.findById(req.user.id, 'creditEtb telegramUsername').lean();
  res.json({
    subscription: sub ? { startsAt: sub.startsAt, endsAt: sub.endsAt } : null,
    groupSubscriptions: await Promise.all(groupSubs.map(async (g) => ({
      endsAt: g.endsAt, discountPercent: g.discountPercent, lessonCount: g.lessonCount,
      groups: await Category.find({ _id: { $in: g.groups } }, 'title titleAm').lean().then((l) => l.map((c) => ({ id: String(c._id), title: c.title, titleAm: c.titleAm }))),
    }))),
    unlockedGroups,
    creditEtb: me?.creditEtb || 0,
    telegramUsername: me?.telegramUsername || '',
    enrolled,
    pendingPayments: await Payment.countDocuments({ user: req.user.id, status: 'pending' }),
    nextSession: await Booking.findOne({ user: req.user.id, status: { $in: ['approved', 'paid'] }, preferredAt: { $gt: new Date() } }).sort({ preferredAt: 1 }),
  });
}));

// ---------- Payments ----------
async function amountFor(req, purpose, courseId, bookingId, categoryId, groups) {
  if (purpose === 'topup') {
    // Token purchase: 1 ETB = 1 token. The student chooses the amount; the admin approves the receipt.
    const n = Number(req.body?.amountEtb);
    if (!Number.isInteger(n) || n < TOPUP_MIN || n > TOPUP_MAX) return { error: 'topupAmount' };
    return { amount: n };
  }
  if (purpose === 'subscription') return { amount: (await pricing()).monthlyPrice };
  if (purpose === 'group') {
    if (!mongoose.isValidObjectId(categoryId)) return {};
    const cat = await Category.findById(categoryId).lean();
    if (!cat) return {};
    if (!groupPrice(cat)) return { error: 'noGroupPrice' };
    if (await hasGroupAccess(req.user, categoryId)) return { error: 'alreadyUnlocked' };
    return { amount: groupPrice(cat) };
  }
  if (purpose === 'group_subscription') {
    const quote = await groupSubscriptionQuote(groups);
    if (!quote.groups.length) return { error: 'selectGroups' };
    return { amount: quote.totalEtb, quote };
  }
  if (purpose === 'course') {
    if (!mongoose.isValidObjectId(courseId)) return {};
    const course = await Course.findOne({ _id: courseId, isPublished: true }).lean();
    if (course?.isFree) return { error: 'freeCourse' };
    return { amount: course?.priceEtb, title: course?.title };
  }
  if (purpose === 'session' && mongoose.isValidObjectId(bookingId)) {
    const b = await Booking.findOne({ _id: bookingId, user: req.user.id, status: 'approved' }).lean();
    return { amount: b?.priceEtb };
  }
  return {};
}

router.post('/payments', upload.single('screenshot'), ah(async (req, res) => {
  const { purpose, courseId, bookingId, categoryId, method, referenceId } = req.body || {};
  let groups = [];
  try { groups = JSON.parse(req.body?.groups || '[]'); } catch { groups = []; }
  if (!req.file) return fail(req, res, 400, 'receiptRequired');
  if (!['course', 'subscription', 'session', 'group', 'group_subscription', 'topup'].includes(purpose) || !['CBE', 'TELEBIRR'].includes(method) || !referenceId?.trim()) {
    return fail(req, res, 400, 'paymentFields');
  }
  const { amount, error, quote } = await amountFor(req, purpose, courseId, bookingId, categoryId, Array.isArray(groups) ? groups : []);
  if (error) return fail(req, res, 400, error);
  if (!amount || amount <= 0) return fail(req, res, 400, 'nothingToPay');
  if (await Payment.exists({ method, referenceId: referenceId.trim() })) return fail(req, res, 409, 'duplicateRef');
  if (!(await isConfigured())) return fail(req, res, 503, 'cloudinaryKeys');

  const receipt = await uploadReceipt(req.file.buffer);
  const receiptPublicId = receipt.publicId;
  try {
    const p = await Payment.create({
      user: req.user.id, purpose, method, amountEtb: amount, referenceId: referenceId.trim(), receiptPublicId,
      receiptAccount: receipt.account,
      course: purpose === 'course' ? courseId : undefined,
      booking: purpose === 'session' ? bookingId : undefined,
      category: purpose === 'group' ? categoryId : undefined,
      groups: purpose === 'group_subscription' ? quote.groups : [],
      quote: quote ? { lessonCount: quote.lessonCount, baseEtb: quote.baseEtb, discountPercent: quote.discountPercent, totalEtb: quote.totalEtb } : undefined,
    });
    await notifyAdmins({
      type: 'payment_new', params: { name: req.user.name, method, amount },
      title: 'New payment to verify', body: `${req.user.name} · ${method} · ${amount} ETB`, link: '/admin/payments',
    });
    res.json({ id: p.id, status: 'pending' });
  } catch (e) {
    await deleteReceipt(receiptPublicId, receipt.account);
    if (e.code === 11000) return fail(req, res, 409, 'duplicateRef');
    throw e;
  }
}));

router.get('/payments', ah(async (req, res) =>
  res.json(await Payment.find({ user: req.user.id }, '-receiptPublicId -receiptAccount').sort({ createdAt: -1 })
    .populate('course', 'title titleAm').populate('category', 'title titleAm'))));

// ---------- 1-on-1 bookings ----------
// Live price preview: the server does the maths (same function used when the booking is saved).
router.get('/bookings/quote', ah(async (req, res) => {
  const { error, quote } = await tutoringQuote(req.query);
  if (error) return fail(req, res, 400, error);
  res.json(quote);
}));

router.post('/bookings', ah(async (req, res) => {
  const { mode, preferredAt, topic, notes } = req.body || {};
  const when = new Date(preferredAt);
  if (!['online', 'in_person'].includes(mode) || Number.isNaN(when.getTime()) || !topic?.trim()) return fail(req, res, 400, 'bookingFields');
  // Price, discount and split are always recomputed here; any price sent by the browser is ignored.
  const { error, quote } = await tutoringQuote(req.body);
  if (error) return fail(req, res, 400, error);
  const b = await Booking.create({
    user: req.user.id, mode, preferredAt: when, topic: topic.trim(), notes,
    durationHours: quote.durationHours, contentType: quote.contentType,
    theoryPercent: quote.theoryPercent, practicalPercent: quote.practicalPercent,
    rateUsed: quote.rateUsed, discountPercent: quote.discountPercent, listPriceEtb: quote.listPriceEtb, priceEtb: quote.priceEtb,
  });
  await notifyAdmins({
    type: 'booking_new', params: { name: req.user.name, mode, when: when.toISOString(), hours: quote.durationHours },
    title: 'New 1-on-1 request', body: `${req.user.name} · ${mode} · ${quote.durationHours}h`, link: '/admin/bookings',
  });
  res.json({ id: b.id });
}));

router.get('/bookings', ah(async (req, res) => res.json(await Booking.find({ user: req.user.id }).sort({ createdAt: -1 }))));

// ---------- Custom course requests ----------
router.post('/course-requests', ah(async (req, res) => {
  const { topic, description, level } = req.body || {};
  if (!topic?.trim()) return fail(req, res, 400, 'topicRequired');
  await CourseRequest.create({ user: req.user.id, topic: topic.trim(), description, level });
  await notifyAdmins({
    type: 'course_request_new', params: { name: req.user.name, topic: topic.trim() },
    title: 'New course request', body: `"${topic.trim()}" — ${req.user.name}`, link: '/admin/requests',
  });
  res.json({ ok: true });
}));

router.get('/course-requests', ah(async (req, res) => res.json(await CourseRequest.find({ user: req.user.id }).sort({ createdAt: -1 }))));

export default router;
