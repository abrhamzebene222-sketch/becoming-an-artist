// Instructor / Admin API — every route requires role "admin" (read live from MongoDB).
import { Router } from 'express';
import mongoose from 'mongoose';
import {
  User, Category, Course, Lesson, Enrollment, Subscription, Payment, Booking, CourseRequest,
  TeacherApplication, Notification, ContactInfo, SubmissionLink,
} from '../models/index.js';
import { requireAdmin } from '../auth.js';
import { notifyUser, notifyAllStudents } from '../notify.js';
import { fail } from '../i18n.js';
import { ah, pricing, getSetting, setSetting, slugify } from '../lib.js';
import { signUpload, findAsset, isConfigured, receiptUrl } from '../cloudinary.js';

const router = Router();
router.use(requireAdmin);
const validId = (id) => mongoose.isValidObjectId(id);

// ---------- Overview ----------
router.get('/overview', ah(async (_req, res) => res.json({
  pendingPayments: await Payment.countDocuments({ status: 'pending' }),
  bookingRequests: await Booking.countDocuments({ status: 'requested' }),
  openCourseRequests: await CourseRequest.countDocuments({ status: 'open' }),
  newTeacherApplications: await TeacherApplication.countDocuments({ status: 'new' }),
  activeSubscribers: (await Subscription.distinct('user', { endsAt: { $gt: new Date() } })).length,
  students: await User.countDocuments({ role: { $not: /^admin$/i } }),
})));

// ---------- Users & roles (same effect as editing `role` in Atlas Data Explorer) ----------
router.get('/users', ah(async (req, res) => {
  const q = String(req.query.q || '').trim();
  const filter = q ? { $or: [{ name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }, { email: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }] } : {};
  res.json(await User.find(filter).sort({ createdAt: -1 }).limit(200));
}));

router.patch('/users/:id/role', ah(async (req, res) => {
  const role = req.body?.role === 'admin' ? 'admin' : 'student';
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  if (req.params.id === req.user.id && role !== 'admin') return fail(req, res, 400, 'invalidDecision'); // can't demote yourself
  await User.updateOne({ _id: req.params.id }, { role });
  res.json({ ok: true });
}));

// ---------- Payments ----------
router.get('/payments', ah(async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : 'pending';
  const list = await Payment.find({ status }).sort({ createdAt: -1 }).limit(200)
    .populate('user', 'name email phone').populate('course', 'title titleAm');
  res.json(list.map((p) => ({ ...p.toJSON(), receiptUrl: receiptUrl(p.receiptPublicId) })));
}));

router.post('/payments/:id/review', ah(async (req, res) => {
  const { decision, note } = req.body || {};
  if (!['approved', 'rejected'].includes(decision)) return fail(req, res, 400, 'invalidDecision');
  if (!validId(req.params.id)) return fail(req, res, 404, 'paymentReviewed');
  const p = await Payment.findOneAndUpdate(
    { _id: req.params.id, status: 'pending' },
    { status: decision, adminNote: note || undefined, reviewedAt: new Date() },
    { new: true },
  );
  if (!p) return fail(req, res, 404, 'paymentReviewed');

  if (decision === 'approved') {
    if (p.purpose === 'course') {
      await Enrollment.updateOne({ user: p.user, course: p.course }, { $setOnInsert: { user: p.user, course: p.course, payment: p._id } }, { upsert: true });
    } else if (p.purpose === 'subscription') {
      const current = await Subscription.findOne({ user: p.user, endsAt: { $gt: new Date() } }).sort({ endsAt: -1 });
      const start = current ? current.endsAt : new Date();
      const end = new Date(start); end.setMonth(end.getMonth() + 1);
      await Subscription.create({ user: p.user, payment: p._id, startsAt: start, endsAt: end });
    } else if (p.purpose === 'session') {
      await Booking.updateOne({ _id: p.booking }, { status: 'paid' });
    }
    await notifyUser(p.user, {
      type: 'payment_approved', params: { purpose: p.purpose },
      title: 'Payment approved', body: 'Your access is unlocked.', link: p.purpose === 'session' ? '/sessions' : '/enrolled',
    });
  } else {
    await notifyUser(p.user, {
      type: 'payment_rejected', params: { note: note || '' },
      title: 'Payment could not be verified', body: note || '', link: '/enrolled#payments',
    });
  }
  res.json({ ok: true });
}));

// ---------- 1-on-1 bookings ----------
router.get('/bookings', ah(async (_req, res) => {
  const list = await Booking.find().sort({ preferredAt: 1 }).populate('user', 'name email phone');
  const order = { requested: 0, approved: 1, paid: 2, completed: 3, rejected: 4 };
  res.json(list.sort((a, b) => order[a.status] - order[b.status]));
}));

router.post('/bookings/:id/review', ah(async (req, res) => {
  const { decision, priceEtb, message } = req.body || {};
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  const b = await Booking.findById(req.params.id);
  if (!b) return fail(req, res, 404, 'notFound');
  if (decision === 'approved') {
    const p = await pricing();
    const price = Number(priceEtb ?? (b.mode === 'online' ? p.sessionPriceOnline : p.sessionPriceInPerson)) || 0;
    Object.assign(b, { status: 'approved', priceEtb: price, adminMessage: message || undefined });
    await b.save();
    await notifyUser(b.user, { type: 'booking_approved', params: { price }, title: '1-on-1 session approved', body: `${price} ETB`, link: '/sessions' });
  } else if (['rejected', 'completed'].includes(decision)) {
    Object.assign(b, { status: decision, adminMessage: message || b.adminMessage });
    await b.save();
    if (decision === 'rejected') await notifyUser(b.user, { type: 'booking_rejected', params: { note: message || '' }, title: '1-on-1 request declined', body: message || '', link: '/sessions' });
  } else return fail(req, res, 400, 'invalidDecision');
  res.json({ ok: true });
}));

// ---------- Course requests ----------
router.get('/course-requests', ah(async (_req, res) =>
  res.json(await CourseRequest.find().sort({ createdAt: -1 }).populate('user', 'name email'))));

router.patch('/course-requests/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  await CourseRequest.updateOne({ _id: req.params.id }, { status: req.body.status }, { runValidators: true });
  res.json({ ok: true });
}));

// ---------- Teacher applications ----------
router.get('/teacher-applications', ah(async (req, res) => {
  const filter = req.query.status ? { status: req.query.status } : {};
  res.json(await TeacherApplication.find(filter).sort({ createdAt: -1 }));
}));

router.patch('/teacher-applications/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'notFound');
  const { status, adminNote } = req.body || {};
  await TeacherApplication.updateOne({ _id: req.params.id }, { ...(status ? { status } : {}), ...(adminNote !== undefined ? { adminNote } : {}) }, { runValidators: true });
  res.json({ ok: true });
}));

// ---------- Curriculum ----------
router.get('/curriculum', ah(async (_req, res) => {
  const [cats, courses, lessons] = await Promise.all([
    Category.find().sort({ sortOrder: 1, createdAt: 1 }),
    Course.find().sort({ sortOrder: 1, createdAt: 1 }),
    Lesson.find().sort({ sortOrder: 1, createdAt: 1 }),
  ]);
  res.json(cats.map((cat) => ({
    ...cat.toJSON(),
    courses: courses.filter((c) => String(c.category) === String(cat._id)).map((c) => ({
      ...c.toJSON(), category: String(c.category), submissionLink: c.submissionLink ? String(c.submissionLink) : '',
      lessons: lessons.filter((l) => String(l.course) === String(c._id)),
    })),
  })));
}));

router.post('/categories', ah(async (req, res) => {
  const { title, titleAm, description } = req.body || {};
  if (!title?.trim()) return fail(req, res, 400, 'applicationFields');
  const last = await Category.findOne().sort({ sortOrder: -1 });
  const cat = await Category.create({ title: title.trim(), titleAm, description, slug: `${slugify(title)}-${Date.now().toString(36)}`, sortOrder: (last?.sortOrder ?? 0) + 1 });
  res.json({ id: cat.id });
}));

router.put('/categories/:id', ah(async (req, res) => {
  const { title, titleAm, description, sortOrder } = req.body || {};
  await Category.updateOne({ _id: req.params.id }, { title, titleAm, description, ...(sortOrder != null ? { sortOrder } : {}) });
  res.json({ ok: true });
}));

router.delete('/categories/:id', ah(async (req, res) => {
  const courses = await Course.find({ category: req.params.id }, '_id');
  await Lesson.deleteMany({ course: { $in: courses.map((c) => c._id) } });
  await Course.deleteMany({ category: req.params.id });
  await Category.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
}));

const courseFields = (b) => ({
  category: b.category,
  title: String(b.title || '').trim(),
  titleAm: b.titleAm || '',
  summary: b.summary || '',
  summaryAm: b.summaryAm || '',
  learningOutcomes: b.learningOutcomes || '',
  deliverables: b.deliverables || '',
  evaluationCriteria: (b.evaluationCriteria || []).filter((k) => k.criterion).map((k) => ({ criterion: k.criterion, weight: Number(k.weight) || 0 })),
  isFree: !!b.isFree,
  priceEtb: b.isFree ? 0 : Math.max(0, Number(b.priceEtb) || 0),
  submissionLink: validId(b.submissionLink) ? b.submissionLink : null,
  isPublished: !!b.isPublished,
});

const announce = (course) => notifyAllStudents({
  type: 'course_new', params: { title: course.title, titleAm: course.titleAm, slug: course.slug, isFree: course.isFree },
  title: 'New course added', body: course.title, link: `/courses/${course.slug}`,
});

router.post('/courses', ah(async (req, res) => {
  const data = courseFields(req.body || {});
  if (!data.title || !validId(data.category)) return fail(req, res, 400, 'applicationFields');
  const last = await Course.findOne({ category: data.category }).sort({ sortOrder: -1 });
  const course = await Course.create({ ...data, slug: `${slugify(data.title)}-${Date.now().toString(36)}`, sortOrder: (last?.sortOrder ?? 0) + 1 });
  if (course.isPublished) await announce(course);
  res.json({ id: course.id, slug: course.slug });
}));

router.put('/courses/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'courseNotFound');
  const before = await Course.findById(req.params.id);
  if (!before) return fail(req, res, 404, 'courseNotFound');
  const data = courseFields(req.body || {});
  const wasPublished = before.isPublished;
  Object.assign(before, data);
  await before.save();
  if (data.isPublished && !wasPublished) await announce(before); // notify students only when first published
  res.json({ ok: true });
}));

router.delete('/courses/:id', ah(async (req, res) => {
  await Lesson.deleteMany({ course: req.params.id });
  await Enrollment.deleteMany({ course: req.params.id });
  await Course.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
}));

// ---------- Lessons on Cloudinary ----------
router.post('/cloudinary/sign', (req, res) => {
  if (!isConfigured()) return fail(req, res, 503, 'cloudinaryKeys');
  res.json(signUpload(req.body?.kind === 'pdf' ? 'pdf' : 'video'));
});

router.post('/lessons', ah(async (req, res) => {
  const { course, title, publicId, kind, isPreview } = req.body || {};
  if (!validId(course) || !title?.trim() || !publicId?.trim() || !['video', 'pdf'].includes(kind)) return fail(req, res, 400, 'lessonFields');
  const resourceType = kind === 'video' ? 'video' : 'image';
  const asset = await findAsset(publicId.trim(), resourceType);
  if (!asset) return fail(req, res, 400, 'assetMissing');
  const last = await Lesson.findOne({ course }).sort({ sortOrder: -1 });
  const lesson = await Lesson.create({
    course, title: title.trim(), kind, cloudPublicId: publicId.trim(), cloudResourceType: resourceType,
    cloudDeliveryType: asset.deliveryType, bytes: asset.bytes, durationSec: asset.duration, isPreview: !!isPreview,
    sortOrder: (last?.sortOrder ?? 0) + 1,
  });
  res.json({ id: lesson.id, deliveryType: asset.deliveryType });
}));

router.put('/lessons/:id', ah(async (req, res) => {
  const { title, isPreview, sortOrder } = req.body || {};
  await Lesson.updateOne({ _id: req.params.id }, { ...(title ? { title } : {}), isPreview: !!isPreview, ...(sortOrder != null ? { sortOrder } : {}) });
  res.json({ ok: true });
}));

// Removes the lesson from the course; the file stays in your Cloudinary Media Library.
router.delete('/lessons/:id', ah(async (req, res) => { await Lesson.deleteOne({ _id: req.params.id }); res.json({ ok: true }); }));

// ---------- Settings, contacts, submission links ----------
const SETTING_KEYS = ['subscriptionDiscountPercent', 'subscriptionFixedPriceEtb', 'sessionPriceOnlineEtb', 'sessionPriceInPersonEtb',
  'cbeAccountName', 'cbeAccountNumber', 'telebirrName', 'telebirrNumber'];
const NUMERIC = new Set(['subscriptionDiscountPercent', 'subscriptionFixedPriceEtb', 'sessionPriceOnlineEtb', 'sessionPriceInPersonEtb']);

router.get('/settings', ah(async (_req, res) => {
  const settings = {};
  for (const k of SETTING_KEYS) settings[k] = await getSetting(k, NUMERIC.has(k) ? 0 : '');
  res.json({
    settings,
    pricing: await pricing(),
    contacts: await ContactInfo.find().sort({ sortOrder: 1 }),
    submissionLinks: await SubmissionLink.find().sort({ createdAt: 1 }),
  });
}));

router.put('/settings', ah(async (req, res) => {
  for (const k of SETTING_KEYS) {
    if (k in (req.body || {})) await setSetting(k, NUMERIC.has(k) ? Number(req.body[k]) || 0 : String(req.body[k] ?? ''));
  }
  res.json({ ok: true, pricing: await pricing() });
}));

router.put('/contacts', ah(async (req, res) => {
  const list = (Array.isArray(req.body) ? req.body : []).filter((c) => c.value?.trim());
  await ContactInfo.deleteMany({});
  await ContactInfo.insertMany(list.map((c, i) => ({ kind: c.kind || 'other', label: c.label || c.kind, value: c.value.trim(), sortOrder: i })));
  res.json({ ok: true });
}));

router.put('/submission-links', ah(async (req, res) => {
  const list = (Array.isArray(req.body) ? req.body : []).filter((l) => l.url?.trim());
  const keep = list.filter((l) => validId(l.id)).map((l) => l.id);
  await SubmissionLink.deleteMany({ _id: { $nin: keep } });
  for (const l of list) {
    const data = { kind: l.kind || 'other', label: l.label || l.kind, url: l.url.trim(), isDefault: !!l.isDefault };
    if (validId(l.id)) await SubmissionLink.updateOne({ _id: l.id }, data);
    else await SubmissionLink.create(data);
  }
  res.json({ ok: true });
}));

// Clean up old notifications (older than 120 days) when admins load the dashboard
router.post('/maintenance/cleanup', ah(async (_req, res) => {
  const r = await Notification.deleteMany({ createdAt: { $lt: new Date(Date.now() - 120 * 864e5) } });
  res.json({ deleted: r.deletedCount });
}));

export default router;
