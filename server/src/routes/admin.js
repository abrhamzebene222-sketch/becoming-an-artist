// Instructor / Admin API — every route requires role "admin" (read live from MongoDB).
import { Router } from 'express';
import mongoose from 'mongoose';
import {
  User, Category, Course, Lesson, Enrollment, GroupEnrollment, Subscription, Payment, Booking, CourseRequest, CreditTransaction,
  TeacherApplication, Notification, ContactInfo, SubmissionLink, RewardTicket, Assignment, SelfEval, SelfEvalPurchase, SELFEVAL_DEFAULT_PRICE,
} from '../models/index.js';
import { requireAdmin } from '../auth.js';
import { notifyUser, notifyAllStudents } from '../notify.js';
import { fail } from '../i18n.js';
import {
  ah, pricing, getSetting, setSetting, slugify, cleanTiers, DEFAULT_TIERS, youtubeId,
} from '../lib.js';
import {
  signUpload, findAsset, isConfigured, receiptUrl, resolveAccount, accountFor, syncMedia, uploadImage,
} from '../cloudinary.js';
import { imageUpload } from '../upload.js';
import { invalidateTree, descendantIds, wouldCycle } from '../tree.js';
import { invalidateSearch } from '../search.js';

const router = Router();
// Any admin change (course, lesson, keywords, group...) refreshes the search index right away
router.use((req, res, next) => { if (req.method !== 'GET') res.on('finish', invalidateSearch); next(); });
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
  pendingRewardTickets: await RewardTicket.countDocuments({ status: 'pending' }),
  newAssignments: await Assignment.countDocuments({ createdAt: { $gt: new Date(Date.now() - 7 * 864e5) } }),
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
    .populate('user', 'name email phone').populate('course', 'title titleAm')
    .populate('category', 'title titleAm').populate('groups', 'title titleAm');
  const out = [];
  for (const p of list) out.push({ ...p.toJSON(), receiptUrl: receiptUrl(p.receiptPublicId, await accountFor(p.receiptAccount)) });
  res.json(out);
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
      const current = await Subscription.findOne({ user: p.user, endsAt: { $gt: new Date() }, 'groups.0': { $exists: false } }).sort({ endsAt: -1 });
      const start = current ? current.endsAt : new Date();
      const end = new Date(start); end.setMonth(end.getMonth() + 1);
      await Subscription.create({ user: p.user, payment: p._id, startsAt: start, endsAt: end });
    } else if (p.purpose === 'group') {
      await GroupEnrollment.updateOne({ user: p.user, category: p.category },
        { $setOnInsert: { user: p.user, category: p.category, payment: p._id, source: 'payment' } }, { upsert: true });
    } else if (p.purpose === 'group_subscription') {
      const start = new Date();
      const end = new Date(start); end.setMonth(end.getMonth() + 1);
      await Subscription.create({
        user: p.user, payment: p._id, groups: p.groups, startsAt: start, endsAt: end,
        lessonCount: p.quote?.lessonCount, discountPercent: p.quote?.discountPercent,
      });
    } else if (p.purpose === 'session') {
      await Booking.updateOne({ _id: p.booking }, { status: 'paid' });
    } else if (p.purpose === 'topup') {
      // Credit tokens exactly once: the ledger row has a unique index on the payment, so a repeat can never add twice.
      let row;
      try {
        row = await CreditTransaction.create({ user: p.user, amountEtb: p.amountEtb, reason: 'topup', payment: p._id });
        const u = await User.findByIdAndUpdate(p.user, { $inc: { creditEtb: p.amountEtb } }, { new: true });
        if (!u) throw new Error('user missing');
        await CreditTransaction.updateOne({ _id: row._id }, { balanceAfter: u.creditEtb });
      } catch (e) {
        // Undo, so the admin can simply press Approve again
        if (row) await CreditTransaction.deleteOne({ _id: row._id }).catch(() => {});
        await Payment.updateOne({ _id: p._id }, { status: 'pending', reviewedAt: null, adminNote: null });
        throw e;
      }
    }
    await notifyUser(p.user, {
      type: 'payment_approved', params: { purpose: p.purpose, amount: p.purpose === 'topup' ? p.amountEtb : undefined },
      title: 'Payment approved', body: 'Your access is unlocked.', link: p.purpose === 'session' ? '/sessions' : p.purpose === 'topup' ? '/rewards' : '/enrolled',
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
    // Default = the price the student saw when requesting (stored on the booking). Old bookings without
    // a duration fall back to the current 1-hour rate. The admin may still type a different price.
    const fallback = b.priceEtb ?? (b.mode === 'online' ? p.sessionPriceOnline : p.sessionPriceInPerson);
    const typed = priceEtb === '' || priceEtb == null ? NaN : Number(priceEtb);
    const price = Math.max(0, Math.round(Number.isFinite(typed) ? typed : Number(fallback) || 0));
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

// ---------- Curriculum (infinitely nested groups, File-Explorer tree in the admin) ----------
// Returns a FLAT list (each category has `parent`) — the admin UI builds the tree, so any depth works.
router.get('/curriculum', ah(async (_req, res) => {
  const [cats, courses, lessons] = await Promise.all([
    Category.find().sort({ sortOrder: 1, createdAt: 1 }),
    Course.find().sort({ sortOrder: 1, createdAt: 1 }),
    Lesson.find().sort({ sortOrder: 1, createdAt: 1 }),
  ]);
  res.json(cats.map((cat) => ({
    ...cat.toJSON(),
    parent: cat.parent ? String(cat.parent) : null,
    courses: courses.filter((c) => String(c.category) === String(cat._id)).map((c) => ({
      ...c.toJSON(), category: String(c.category), submissionLink: c.submissionLink ? String(c.submissionLink) : '',
      lessons: lessons.filter((l) => String(l.course) === String(c._id)),
    })),
  })));
}));

const cleanMedia = (m) => (m?.url && m?.publicId
  ? { url: String(m.url), publicId: String(m.publicId), account: String(m.account || 'env'), resourceType: 'image' } : null);

const categoryFields = (b) => ({
  title: String(b.title || '').trim(),
  titleAm: b.titleAm || '',
  description: b.description || '',
  descriptionAm: b.descriptionAm || '',
  isFree: !!b.isFree,
  priceEtb: b.isFree ? 0 : Math.max(0, Number(b.priceEtb) || 0),
  monthlyPriceEtb: b.isFree ? 0 : Math.max(0, Number(b.monthlyPriceEtb) || 0),
  slides: (Array.isArray(b.slides) ? b.slides : []).map(cleanMedia).filter(Boolean).slice(0, 12),
});

router.post('/categories', ah(async (req, res) => {
  const b = req.body || {};
  const data = categoryFields(b);
  if (!data.title) return fail(req, res, 400, 'applicationFields');
  const parent = validId(b.parent) ? b.parent : null;
  if (parent && !(await Category.exists({ _id: parent }))) return fail(req, res, 404, 'groupNotFound');
  const last = await Category.findOne({ parent }).sort({ sortOrder: -1 });
  const cat = await Category.create({ ...data, parent, slug: `${slugify(data.title)}-${Date.now().toString(36)}`, sortOrder: (last?.sortOrder ?? -1) + 1 });
  invalidateTree();
  res.json({ id: cat.id });
}));

router.put('/categories/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'groupNotFound');
  const cat = await Category.findById(req.params.id);
  if (!cat) return fail(req, res, 404, 'groupNotFound');
  const b = req.body || {};
  const data = categoryFields({ ...cat.toObject(), ...b });
  if (!data.title) return fail(req, res, 400, 'applicationFields');
  if ('parent' in b) {
    const parent = validId(b.parent) ? b.parent : null;
    if (parent && (parent === req.params.id || await wouldCycle(req.params.id, parent))) return fail(req, res, 400, 'groupCycle');
    cat.parent = parent;
  }
  const oldSlides = cat.slides.map((m) => m.toObject());
  Object.assign(cat, data);
  if (b.sortOrder != null) cat.sortOrder = Number(b.sortOrder) || 0;
  await cat.save();
  await syncMedia(oldSlides, data.slides); // removed/replaced slide images are deleted from Cloudinary
  invalidateTree();
  res.json({ ok: true });
}));

// Re-order siblings: body = { ids: [...] } in the new order
router.post('/categories/reorder', ah(async (req, res) => {
  const ids = (req.body?.ids || []).filter(validId);
  await Promise.all(ids.map((id, i) => Category.updateOne({ _id: id }, { sortOrder: i })));
  invalidateTree();
  res.json({ ok: true });
}));

// Deletes the group, ALL its sub-groups, their courses and lessons, and their uploaded images
router.delete('/categories/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'groupNotFound');
  const ids = await descendantIds(req.params.id);
  const cats = await Category.find({ _id: { $in: ids } });
  const courses = await Course.find({ category: { $in: ids } }, '_id');
  const courseIds = courses.map((c) => c._id);
  const lessons = await Lesson.find({ course: { $in: courseIds } }, 'blocks');
  await syncMedia([
    ...cats.flatMap((c) => c.slides.map((m) => m.toObject())),
    ...lessons.flatMap((l) => l.blocks.filter((x) => x.image?.publicId).map((x) => x.image.toObject())),
  ], []);
  await Lesson.deleteMany({ course: { $in: courseIds } });
  await Enrollment.deleteMany({ course: { $in: courseIds } });
  await Course.deleteMany({ _id: { $in: courseIds } });
  await GroupEnrollment.deleteMany({ category: { $in: ids } });
  await Category.deleteMany({ _id: { $in: ids } });
  invalidateTree();
  res.json({ ok: true, deletedGroups: ids.length, deletedCourses: courseIds.length });
}));

// ---------- Image uploads (slides, promo/news images, lesson blocks) ----------
// multipart: file, account ('primary' | 'secondary' | account id), folder, replacePublicId, replaceAccount
router.post('/media/upload', imageUpload.single('file'), ah(async (req, res) => {
  if (!req.file) return fail(req, res, 400, 'imageRequired');
  if (!(await isConfigured())) return fail(req, res, 503, 'cloudinaryKeys');
  const folder = ['slides', 'promos', 'blocks', 'news', 'covers'].includes(req.body.folder) ? req.body.folder : 'misc';
  const replace = req.body.replacePublicId ? { publicId: req.body.replacePublicId, account: req.body.replaceAccount || 'env' } : null;
  const media = await uploadImage(req.file.buffer, { account: req.body.account || 'primary', folder, replace });
  res.json(media);
}));

const courseFields = (b) => ({
  category: b.category,
  title: String(b.title || '').trim(),
  titleAm: b.titleAm || '',
  summary: b.summary || '',
  summaryAm: b.summaryAm || '',
  learningOutcomes: b.learningOutcomes || '',
  deliverables: b.deliverables || '',
  keywords: String(b.keywords || '').slice(0, 500),
  keywordsAm: String(b.keywordsAm || '').slice(0, 500),
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
  const lessons = await Lesson.find({ course: req.params.id }, 'blocks');
  await syncMedia(lessons.flatMap((l) => l.blocks.filter((x) => x.image?.publicId).map((x) => x.image.toObject())), []);
  await Lesson.deleteMany({ course: req.params.id });
  await Enrollment.deleteMany({ course: req.params.id });
  await Course.deleteOne({ _id: req.params.id });
  res.json({ ok: true });
}));

// ---------- Lessons: Cloudinary video/PDF, or modular blocks (text / image / YouTube) ----------
router.post('/cloudinary/sign', ah(async (req, res) => {
  const acc = await resolveAccount(req.body?.account || 'primary');
  if (!acc) return fail(req, res, 503, 'cloudinaryKeys');
  res.json(signUpload(req.body?.kind === 'pdf' ? 'pdf' : 'video', acc));
}));

/** Clean the block list sent by the modular lesson builder. */
function cleanBlocks(list) {
  return (Array.isArray(list) ? list : []).map((b) => {
    if (b.type === 'text') {
      const text = String(b.text || '').slice(0, 20000);
      const textAm = String(b.textAm || '').slice(0, 20000);
      return text.trim() || textAm.trim() ? { type: 'text', text, textAm } : null;
    }
    if (b.type === 'image') {
      const image = cleanMedia(b.image);
      return image ? { type: 'image', image, caption: String(b.caption || '').slice(0, 500) } : null;
    }
    if (b.type === 'heading') {
      const text = String(b.text || '').slice(0, 300);
      const textAm = String(b.textAm || '').slice(0, 300);
      return text.trim() || textAm.trim() ? { type: 'heading', text, textAm } : null;
    }
    if (b.type === 'step') {
      const text = String(b.text || '').slice(0, 20000);
      const textAm = String(b.textAm || '').slice(0, 20000);
      const image = cleanMedia(b.image); // optional
      if (!text.trim() && !textAm.trim() && !image) return null;
      return { type: 'step', text, textAm, ...(image ? { image, caption: String(b.caption || '').slice(0, 500) } : {}) };
    }
    if (b.type === 'callout') {
      const text = String(b.text || '').slice(0, 5000);
      const textAm = String(b.textAm || '').slice(0, 5000);
      return text.trim() || textAm.trim() ? { type: 'callout', variant: b.variant === 'warning' ? 'warning' : 'tip', text, textAm } : null;
    }
    if (b.type === 'youtube') {
      const id = youtubeId(b.youtubeUrl);
      return id ? { type: 'youtube', youtubeUrl: `https://www.youtube.com/watch?v=${id}`, caption: String(b.caption || '').slice(0, 500) } : null;
    }
    return null;
  }).filter(Boolean).slice(0, 200);
}
// image blocks and step pictures
const blockImages = (blocks) => blocks.filter((b) => b.image?.publicId).map((b) => (b.image.toObject ? b.image.toObject() : b.image));

router.post('/lessons', ah(async (req, res) => {
  const { course, title, publicId, kind, isPreview, account } = req.body || {};
  if (!validId(course) || !title?.trim() || !['video', 'pdf', 'blocks'].includes(kind)) return fail(req, res, 400, 'lessonFields');
  const last = await Lesson.findOne({ course }).sort({ sortOrder: -1 });
  const base = { course, title: title.trim(), keywords: String(req.body.keywords || '').slice(0, 500), keywordsAm: String(req.body.keywordsAm || '').slice(0, 500), subtitle: String(req.body.subtitle || '').slice(0, 300), subtitleAm: String(req.body.subtitleAm || '').slice(0, 300), kind, isPreview: !!isPreview, sortOrder: (last?.sortOrder ?? 0) + 1 };

  if (kind === 'blocks') {
    const blocks = cleanBlocks(req.body.blocks);
    if (!blocks.length) return fail(req, res, 400, 'lessonBlocks');
    const lesson = await Lesson.create({ ...base, blocks });
    return res.json({ id: lesson.id });
  }
  if (!publicId?.trim()) return fail(req, res, 400, 'lessonFields');
  const acc = await accountFor(account || 'env');
  if (!acc) return fail(req, res, 503, 'cloudinaryKeys');
  const resourceType = kind === 'video' ? 'video' : 'image';
  const asset = await findAsset(publicId.trim(), resourceType, acc);
  if (!asset) return fail(req, res, 400, 'assetMissing');
  const lesson = await Lesson.create({
    ...base, cloudPublicId: publicId.trim(), cloudResourceType: resourceType, cloudAccount: acc.id,
    cloudDeliveryType: asset.deliveryType, bytes: asset.bytes, durationSec: asset.duration,
    blocks: cleanBlocks(req.body.blocks), // optional extra notes / YouTube under a video
  });
  res.json({ id: lesson.id, deliveryType: asset.deliveryType });
}));

router.put('/lessons/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'lessonNotFound');
  const lesson = await Lesson.findById(req.params.id);
  if (!lesson) return fail(req, res, 404, 'lessonNotFound');
  const { title, isPreview, sortOrder, blocks } = req.body || {};
  if (title?.trim()) lesson.title = title.trim();
  if (req.body.keywords !== undefined) lesson.keywords = String(req.body.keywords || '').slice(0, 500);
  if (req.body.keywordsAm !== undefined) lesson.keywordsAm = String(req.body.keywordsAm || '').slice(0, 500);
  if (req.body.subtitle !== undefined) lesson.subtitle = String(req.body.subtitle || '').slice(0, 300);
  if (req.body.subtitleAm !== undefined) lesson.subtitleAm = String(req.body.subtitleAm || '').slice(0, 300);
  if (isPreview !== undefined) lesson.isPreview = !!isPreview;
  if (sortOrder != null) lesson.sortOrder = Number(sortOrder) || 0;
  let before = [];
  if (Array.isArray(blocks)) {
    const clean = cleanBlocks(blocks);
    if (lesson.kind === 'blocks' && !clean.length) return fail(req, res, 400, 'lessonBlocks');
    before = blockImages(lesson.blocks);
    lesson.blocks = clean;
  }
  await lesson.save();
  if (Array.isArray(blocks)) await syncMedia(before, blockImages(lesson.blocks)); // replaced/removed images → deleted
  res.json({ ok: true });
}));

// ---------- Self-evaluation documents (one per lesson; students buy them with tokens) ----------
const serializeEval = (e) => ({
  id: String(e._id), lessonId: String(e.lesson), priceEtb: e.priceEtb, isPublished: !!e.isPublished,
  blocks: (e.blocks || []).map((b) => ({
    _id: String(b._id), type: b.type, text: b.text || '', textAm: b.textAm || '', caption: b.caption || '',
    image: b.image?.url ? { url: b.image.url, publicId: b.image.publicId, account: b.image.account || 'env', resourceType: 'image' } : null,
    youtubeUrl: b.youtubeUrl || '', variant: b.variant || undefined,
  })),
});

// All prepared documents (for the list in the admin page)
router.get('/self-evals', ah(async (_req, res) => {
  const evals = await SelfEval.find().sort({ updatedAt: -1 }).limit(500).lean();
  const lessons = await Lesson.find({ _id: { $in: evals.map((e) => e.lesson) } }, 'title titleAm course').lean();
  const courses = await Course.find({ _id: { $in: lessons.map((l) => l.course) } }, 'title titleAm').lean();
  const buyers = await SelfEvalPurchase.aggregate([{ $group: { _id: '$selfEval', n: { $sum: 1 } } }]);
  const lessonBy = new Map(lessons.map((l) => [String(l._id), l]));
  const courseBy = new Map(courses.map((c) => [String(c._id), c]));
  const buyerBy = new Map(buyers.map((b) => [String(b._id), b.n]));
  res.json(evals.map((e) => {
    const l = lessonBy.get(String(e.lesson)); const c = l && courseBy.get(String(l.course));
    return {
      id: String(e._id), lessonId: String(e.lesson), title: l?.title || '', titleAm: l?.titleAm || '',
      courseTitle: c?.title || '', courseTitleAm: c?.titleAm || '',
      priceEtb: e.priceEtb, isPublished: !!e.isPublished, blockCount: (e.blocks || []).length, buyers: buyerBy.get(String(e._id)) || 0,
    };
  }));
}));

// One lesson's document (or an empty draft with the default price when none exists yet)
router.get('/lessons/:lessonId/self-eval', ah(async (req, res) => {
  if (!validId(req.params.lessonId)) return fail(req, res, 404, 'lessonNotFound');
  const lesson = await Lesson.findById(req.params.lessonId, 'title titleAm course').lean();
  if (!lesson) return fail(req, res, 404, 'lessonNotFound');
  const course = await Course.findById(lesson.course, 'title titleAm').lean();
  const e = await SelfEval.findOne({ lesson: lesson._id });
  res.json({
    lesson: { id: String(lesson._id), title: lesson.title, titleAm: lesson.titleAm || '', courseTitle: course?.title || '', courseTitleAm: course?.titleAm || '' },
    defaultPriceEtb: SELFEVAL_DEFAULT_PRICE,
    selfEval: e ? serializeEval(e) : null,
    buyers: e ? await SelfEvalPurchase.countDocuments({ selfEval: e._id }) : 0,
  });
}));

router.put('/lessons/:lessonId/self-eval', ah(async (req, res) => {
  if (!validId(req.params.lessonId)) return fail(req, res, 404, 'lessonNotFound');
  const lesson = await Lesson.findById(req.params.lessonId, '_id').lean();
  if (!lesson) return fail(req, res, 404, 'lessonNotFound');
  const price = Number(req.body?.priceEtb);
  if (!Number.isInteger(price) || price < 0 || price > 100000) return fail(req, res, 400, 'selfEvalPrice');
  const blocks = cleanBlocks(req.body?.blocks);
  if (!blocks.length) return fail(req, res, 400, 'lessonBlocks');
  let e = await SelfEval.findOne({ lesson: lesson._id });
  const before = e ? blockImages(e.blocks) : [];
  if (!e) e = new SelfEval({ lesson: lesson._id });
  e.priceEtb = price;
  e.isPublished = req.body?.isPublished !== false;
  e.blocks = blocks;
  await e.save();
  await syncMedia(before, blockImages(e.blocks)); // replaced/removed images are deleted from Cloudinary
  res.json({ ok: true, id: String(e._id) });
}));

// Delete is blocked once a student has bought it (their tokens are spent): hide it instead.
router.delete('/lessons/:lessonId/self-eval', ah(async (req, res) => {
  if (!validId(req.params.lessonId)) return fail(req, res, 404, 'lessonNotFound');
  const e = await SelfEval.findOne({ lesson: req.params.lessonId });
  if (!e) return fail(req, res, 404, 'selfEvalNotFound');
  if (await SelfEvalPurchase.exists({ selfEval: e._id })) return fail(req, res, 400, 'selfEvalHasBuyers');
  const imgs = blockImages(e.blocks);
  await SelfEval.deleteOne({ _id: e._id });
  await syncMedia(imgs, []);
  res.json({ ok: true });
}));

// Removes the lesson; its block images are deleted. Video/PDF files stay in your Cloudinary Media Library.
router.delete('/lessons/:id', ah(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  if (lesson) {
    await syncMedia(blockImages(lesson.blocks), []);
    await lesson.deleteOne();
  }
  res.json({ ok: true });
}));

// ---------- Settings, contacts, submission links ----------
const SETTING_KEYS = ['subscriptionDiscountPercent', 'subscriptionFixedPriceEtb', 'sessionPriceOnlineEtb', 'sessionPriceInPersonEtb',
  'cbeAccountName', 'cbeAccountNumber', 'telebirrName', 'telebirrNumber'];
const NUMERIC = new Set(['subscriptionDiscountPercent', 'subscriptionFixedPriceEtb', 'sessionPriceOnlineEtb', 'sessionPriceInPersonEtb']);

router.get('/settings', ah(async (_req, res) => {
  const settings = {};
  for (const k of SETTING_KEYS) settings[k] = await getSetting(k, NUMERIC.has(k) ? 0 : '');
  settings.subscriptionTiers = cleanTiers(await getSetting('subscriptionTiers', DEFAULT_TIERS));
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
  if (Array.isArray(req.body?.subscriptionTiers)) await setSetting('subscriptionTiers', cleanTiers(req.body.subscriptionTiers));
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
