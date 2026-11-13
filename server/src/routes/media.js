// Lesson playback via Cloudinary.
// Free courses and preview lessons: anyone (no login). Paid courses: logged-in students with access.
import { Router } from 'express';
import mongoose from 'mongoose';
import { Lesson, Course } from '../models/index.js';
import { optionalAuth } from '../auth.js';
import { fail } from '../i18n.js';
import { ah, hasCourseAccess } from '../lib.js';
import { lessonUrl, posterUrl, isConfigured } from '../cloudinary.js';

const router = Router();

router.get('/token/:lessonId', optionalAuth, ah(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.lessonId)) return fail(req, res, 404, 'lessonNotFound');
  const lesson = await Lesson.findById(req.params.lessonId).lean();
  if (!lesson) return fail(req, res, 404, 'lessonNotFound');
  const course = await Course.findById(lesson.course).lean();
  const open = lesson.isPreview || (await hasCourseAccess(req.user, course));
  if (!open) return fail(req, res, req.user ? 403 : 401, req.user ? 'unlockToWatch' : 'loginToWatch');
  if (!isConfigured()) return fail(req, res, 503, 'videoNotConfigured');
  res.json({ url: lessonUrl(lesson), poster: posterUrl(lesson), kind: lesson.kind });
}));

export default router;
