// Lesson content.
// Free courses and admin-marked FREE PREVIEW lessons: anyone (no login). Paid courses: logged-in students with access.
// • /media/token/:id  — signed Cloudinary URL for video/PDF lessons (unchanged contract)
// • /media/lesson/:id — full lesson: modular blocks (text / image / YouTube) + signed file URL when there is one.
//   The service worker caches this response and the images, so unlocked lessons open offline.
import { Router } from 'express';
import mongoose from 'mongoose';
import { Lesson, Course } from '../models/index.js';
import { optionalAuth } from '../auth.js';
import { fail } from '../i18n.js';
import { ah, hasLessonAccess, youtubeId } from '../lib.js';
import { lessonUrl, posterUrl, accountFor } from '../cloudinary.js';
import { labelBases } from '../imageLabels.js';

const router = Router();

async function openLesson(req, res) {
  if (!mongoose.isValidObjectId(req.params.lessonId)) { fail(req, res, 404, 'lessonNotFound'); return null; }
  const lesson = await Lesson.findById(req.params.lessonId).lean();
  if (!lesson) { fail(req, res, 404, 'lessonNotFound'); return null; }
  const course = await Course.findById(lesson.course).lean();
  // course access, free preview, or this lesson unlocked with tokens
  const open = await hasLessonAccess(req.user, lesson, course);
  if (!open) { fail(req, res, req.user ? 403 : 401, req.user ? 'unlockToWatch' : 'loginToWatch'); return null; }
  return lesson;
}

async function fileUrls(lesson) {
  if (lesson.kind === 'blocks' || !lesson.cloudPublicId) return {};
  const acc = await accountFor(lesson.cloudAccount);
  if (!acc) return { error: 'videoNotConfigured' };
  return { url: lessonUrl(lesson, acc), poster: posterUrl(lesson, acc) };
}

router.get('/token/:lessonId', optionalAuth, ah(async (req, res) => {
  const lesson = await openLesson(req, res);
  if (!lesson) return;
  if (lesson.kind === 'blocks') return res.json({ kind: 'blocks', url: null, poster: null });
  const f = await fileUrls(lesson);
  if (f.error) return fail(req, res, 503, f.error);
  res.json({ url: f.url, poster: f.poster, kind: lesson.kind });
}));

router.get('/lesson/:lessonId', optionalAuth, ah(async (req, res) => {
  const lesson = await openLesson(req, res);
  if (!lesson) return;
  const f = await fileUrls(lesson);
  const labels = await labelBases(lesson);
  res.set('Cache-Control', 'private, no-cache'); // the service worker keeps its own offline copy
  res.json({
    id: String(lesson._id),
    title: lesson.title,
    subtitle: lesson.subtitle || '',
    subtitleAm: lesson.subtitleAm || '',
    kind: lesson.kind,
    isPreview: !!lesson.isPreview,
    labelBase: labels.labelBase,       // picture name = labelBase + number (see client lib/imageLabel.js)
    labelBaseAm: labels.labelBaseAm,
    url: f.url || null,
    poster: f.poster || null,
    blocks: (lesson.blocks || []).filter((b) => b.type !== 'imageHint').map((b) => ({
      id: String(b._id),
      type: b.type,
      text: b.text || '',
      textAm: b.textAm || '',
      caption: b.caption || '',
      imageUrl: b.image?.url || '',
      variant: b.variant || '',
      youtubeId: b.type === 'youtube' ? youtubeId(b.youtubeUrl) : '',
    })),
  });
}));

export default router;
