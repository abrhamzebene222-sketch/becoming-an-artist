// Lesson playback via Cloudinary.
// The student's app asks this server for a lesson; the server checks access and returns a
// signed Cloudinary URL. The browser/app then loads the video or PDF directly from Cloudinary's CDN.
import { Router } from 'express';
import { db, hasCourseAccess } from '../db.js';
import { requireAuth } from '../auth.js';
import { lessonUrl, posterUrl, isConfigured } from '../cloudinary.js';

const router = Router();

const canOpen = (user, lesson) =>
  user.role === 'admin' || lesson.is_preview || hasCourseAccess(user.id, lesson.course_id);

router.get('/token/:lessonId', requireAuth, (req, res) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE id = ?').get(req.params.lessonId);
  if (!lesson) return res.status(404).json({ error: 'Lesson not found.' });
  if (!canOpen(req.user, lesson)) return res.status(403).json({ error: 'Unlock this course to watch.' });
  if (!isConfigured()) return res.status(503).json({ error: 'Video hosting is not configured yet.' });
  res.json({ url: lessonUrl(lesson), poster: posterUrl(lesson), kind: lesson.kind });
});

export default router;
