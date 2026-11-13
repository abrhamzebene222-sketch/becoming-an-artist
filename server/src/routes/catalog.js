// Public pages: curriculum, course details, pricing, payment accounts, contacts. No login required.
import { Router } from 'express';
import { Category, Course, Lesson, SubmissionLink, ContactInfo } from '../models/index.js';
import { optionalAuth } from '../auth.js';
import { fail } from '../i18n.js';
import { ah, pricing, getSetting, hasCourseAccess } from '../lib.js';

const router = Router();

async function lessonCounts() {
  const rows = await Lesson.aggregate([{ $group: { _id: '$course', n: { $sum: 1 } } }]);
  return Object.fromEntries(rows.map((r) => [String(r._id), r.n]));
}

router.get('/catalog', ah(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const [cats, courses, counts] = await Promise.all([
    Category.find().sort({ sortOrder: 1, createdAt: 1 }),
    Course.find({ isPublished: true }).sort({ sortOrder: 1, createdAt: 1 }),
    lessonCounts(),
  ]);
  const catText = Object.fromEntries(cats.map((c) => [String(c._id), `${c.title} ${c.titleAm}`.toLowerCase()]));
  const list = courses
    .map((c) => ({ ...c.toJSON(), category: String(c.category), lessonCount: counts[String(c._id)] || 0 }))
    .filter((c) => !q || [c.title, c.titleAm, c.summary, c.summaryAm, c.learningOutcomes, catText[c.category]]
      .join(' ').toLowerCase().includes(q));
  res.json(cats
    .map((cat) => ({ ...cat.toJSON(), courses: list.filter((c) => c.category === String(cat._id)) }))
    .filter((cat) => !q || cat.courses.length));
}));

router.get('/courses/:slug', optionalAuth, ah(async (req, res) => {
  const course = await Course.findOne({ slug: req.params.slug, isPublished: true }).populate('category');
  if (!course) return fail(req, res, 404, 'courseNotFound');
  const [lessons, link, access] = await Promise.all([
    Lesson.find({ course: course._id }, 'title kind isPreview durationSec sortOrder').sort({ sortOrder: 1, createdAt: 1 }),
    course.submissionLink ? SubmissionLink.findById(course.submissionLink) : SubmissionLink.findOne({ isDefault: true }),
    hasCourseAccess(req.user, course),
  ]);
  const json = course.toJSON();
  res.json({
    ...json,
    category: course.category ? { id: String(course.category._id), title: course.category.title, titleAm: course.category.titleAm } : null,
    lessons,
    submissionLink: access ? link : null,
    hasAccess: access,
    loggedIn: !!req.user,
  });
}));

router.get('/pricing', ah(async (_req, res) => res.json(await pricing())));

router.get('/payment-accounts', ah(async (_req, res) => res.json({
  CBE: { name: await getSetting('cbeAccountName', ''), number: await getSetting('cbeAccountNumber', '') },
  TELEBIRR: { name: await getSetting('telebirrName', ''), number: await getSetting('telebirrNumber', '') },
})));

router.get('/contact', ah(async (_req, res) => res.json({
  contacts: await ContactInfo.find().sort({ sortOrder: 1 }),
  submissionLinks: await SubmissionLink.find().sort({ isDefault: -1, createdAt: 1 }),
})));

export default router;
