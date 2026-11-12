// Public catalog: curriculum tree, course details, pricing, contact info.
import { Router } from 'express';
import { db, pricing, getSetting } from '../db.js';

const router = Router();

const parseCourse = (c) => c && { ...c, evaluation_criteria: JSON.parse(c.evaluation_criteria || '[]') };

router.get('/catalog', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all();
  let courses = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id) AS lesson_count
    FROM courses c WHERE is_published = 1 ORDER BY sort_order, id`).all().map(parseCourse);
  if (q) {
    const catTitle = Object.fromEntries(cats.map((c) => [c.id, c.title.toLowerCase()]));
    courses = courses.filter((c) =>
      [c.title, c.summary, c.learning_outcomes, catTitle[c.category_id]].join(' ').toLowerCase().includes(q));
  }
  res.json(cats
    .map((cat) => ({ ...cat, courses: courses.filter((c) => c.category_id === cat.id) }))
    .filter((cat) => !q || cat.courses.length));
});

router.get('/courses/:slug', (req, res) => {
  const course = parseCourse(db.prepare(`SELECT c.*, cat.title AS category_title FROM courses c
    JOIN categories cat ON cat.id = c.category_id WHERE c.slug = ? AND c.is_published = 1`).get(req.params.slug));
  if (!course) return res.status(404).json({ error: 'Course not found.' });
  course.lessons = db.prepare('SELECT id, title, kind, is_preview, sort_order FROM lessons WHERE course_id = ? ORDER BY sort_order, id')
    .all(course.id);
  course.submission_link = course.submission_link_id
    ? db.prepare('SELECT * FROM submission_links WHERE id = ?').get(course.submission_link_id)
    : db.prepare('SELECT * FROM submission_links WHERE is_default = 1').get();
  res.json(course);
});

router.get('/pricing', (_req, res) => res.json(pricing()));

router.get('/payment-accounts', (_req, res) => res.json({
  CBE: { name: getSetting('cbe_account_name', ''), number: getSetting('cbe_account_number', '') },
  TELEBIRR: { name: getSetting('telebirr_name', ''), number: getSetting('telebirr_number', '') },
}));

router.get('/contact', (_req, res) => res.json({
  contacts: db.prepare('SELECT * FROM contact_info ORDER BY sort_order, id').all(),
  submissionLinks: db.prepare('SELECT * FROM submission_links ORDER BY is_default DESC, id').all(),
}));

export default router;
