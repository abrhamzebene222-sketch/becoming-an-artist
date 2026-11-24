// Admin: manage the news feed, and publish a lesson to it with one click ("Add to news").
import { Router } from 'express';
import mongoose from 'mongoose';
import { NewsItem, Lesson, Course } from '../models/index.js';
import { requireAdmin } from '../auth.js';
import { fail } from '../i18n.js';
import { ah } from '../lib.js';
import { syncMedia } from '../cloudinary.js';
import { notifyAllStudents } from '../notify.js';
import { serializeNews } from '../newsLib.js';

const router = Router();
router.use(requireAdmin);
const validId = (id) => mongoose.isValidObjectId(id);

const cleanMedia = (m) => (m?.url && m?.publicId
  ? { url: String(m.url), publicId: String(m.publicId), account: String(m.account || 'env'), resourceType: 'image' } : null);

const textFields = (b) => ({
  title: String(b.title || '').trim().slice(0, 200),
  titleAm: String(b.titleAm || '').trim().slice(0, 200),
  summary: String(b.summary || '').slice(0, 600),
  summaryAm: String(b.summaryAm || '').slice(0, 600),
  body: String(b.body || '').slice(0, 20000),
  bodyAm: String(b.bodyAm || '').slice(0, 20000),
  isActive: b.isActive !== false,
});

/** Link for items the admin writes by hand (lesson links come only from "Add to news"). */
function linkFields(b) {
  if (b.linkKind === 'course' && validId(b.course)) return { linkKind: 'course', course: b.course, lesson: undefined, linkUrl: '' };
  if (b.linkKind === 'url' && /^https?:\/\//i.test(String(b.linkUrl || ''))) return { linkKind: 'url', linkUrl: String(b.linkUrl).trim().slice(0, 500), lesson: undefined, course: undefined };
  return { linkKind: 'none', lesson: undefined, course: undefined, linkUrl: '' };
}

router.get('/news', ah(async (_req, res) => {
  const items = await NewsItem.find().sort({ createdAt: -1 }).lean();
  res.json(await serializeNews(items));
}));

router.post('/news', ah(async (req, res) => {
  const data = textFields(req.body || {});
  if (!data.title) return fail(req, res, 400, 'newsFields');
  const item = await NewsItem.create({ ...data, ...linkFields(req.body || {}), image: cleanMedia(req.body?.image) });
  res.json({ id: item.id });
}));

router.put('/news/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'newsNotFound');
  const item = await NewsItem.findById(req.params.id);
  if (!item) return fail(req, res, 404, 'newsNotFound');
  const data = textFields(req.body || {});
  if (!data.title) return fail(req, res, 400, 'newsFields');
  const before = item.image?.url ? [item.image.toObject()] : [];
  Object.assign(item, data);
  if (item.linkKind !== 'lesson') Object.assign(item, linkFields(req.body || {})); // a lesson link stays as it is
  item.image = cleanMedia(req.body?.image);
  await item.save();
  await syncMedia(before, item.image?.url ? [item.image.toObject()] : []); // replaced/removed picture is deleted from Cloudinary
  res.json({ ok: true });
}));

router.delete('/news/:id', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'newsNotFound');
  const item = await NewsItem.findById(req.params.id);
  if (item) {
    await syncMedia(item.image?.url ? [item.image.toObject()] : [], []);
    await NewsItem.deleteOne({ _id: item._id });
  }
  res.json({ ok: true });
}));

// "Add to news" on a lesson: publishes it to the news feed (title + one-sentence subtitle) and tells every student;
// tapping the notification or the news button opens the lesson page directly.
router.post('/lessons/:id/news', ah(async (req, res) => {
  if (!validId(req.params.id)) return fail(req, res, 404, 'lessonNotFound');
  const lesson = await Lesson.findById(req.params.id).lean();
  if (!lesson) return fail(req, res, 404, 'lessonNotFound');
  const course = await Course.findById(lesson.course).lean();
  if (!course) return fail(req, res, 404, 'courseNotFound');
  if (!course.isPublished) return fail(req, res, 400, 'courseNotPublished');
  if (await NewsItem.exists({ lesson: lesson._id })) return fail(req, res, 409, 'newsExists');
  const item = await NewsItem.create({
    title: lesson.title, titleAm: lesson.titleAm || '', summary: lesson.subtitle || '', summaryAm: lesson.subtitleAm || '',
    linkKind: 'lesson', lesson: lesson._id,
  });
  await notifyAllStudents({
    type: 'lesson_new',
    params: { title: lesson.title, titleAm: lesson.titleAm || '', courseTitle: course.title, courseTitleAm: course.titleAm || '' },
    title: 'New lesson', body: `${lesson.title} · ${course.title}`, link: `/courses/${course.slug}/lessons/${lesson._id}`,
  });
  res.json({ id: item.id });
}));

export default router;
