// Instructor / Admin API
import { Router } from 'express';
import path from 'node:path';
import { db, pricing, getSetting, setSetting } from '../db.js';
import { config } from '../config.js';
import { requireAdmin } from '../auth.js';
import { notifyUser, notifyAllStudents } from '../notify.js';
import { signUpload, findAsset, isConfigured } from '../cloudinary.js';

const router = Router();
router.use(requireAdmin);

// ---------- Overview ----------
router.get('/overview', (_req, res) => res.json({
  pendingPayments: db.prepare("SELECT COUNT(*) n FROM payments WHERE status = 'pending'").get().n,
  bookingRequests: db.prepare("SELECT COUNT(*) n FROM bookings WHERE status = 'requested'").get().n,
  openCourseRequests: db.prepare("SELECT COUNT(*) n FROM course_requests WHERE status = 'open'").get().n,
  activeSubscribers: db.prepare("SELECT COUNT(DISTINCT user_id) n FROM subscriptions WHERE datetime(ends_at) > datetime('now')").get().n,
  students: db.prepare("SELECT COUNT(*) n FROM users WHERE role = 'student'").get().n,
}));

// ---------- Payments ----------
router.get('/payments', (req, res) => {
  const status = req.query.status || 'pending';
  res.json(db.prepare(`SELECT p.*, u.name AS student_name, u.email AS student_email, c.title AS course_title
    FROM payments p JOIN users u ON u.id = p.user_id LEFT JOIN courses c ON c.id = p.course_id
    WHERE p.status = ? ORDER BY p.id DESC`).all(status));
});

// Receipt images are only ever served to admins
router.get('/payments/:id/screenshot', (req, res) => {
  const p = db.prepare('SELECT screenshot_file FROM payments WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).end();
  res.sendFile(path.join(config.receiptsDir, path.basename(p.screenshot_file)));
});

router.post('/payments/:id/review', (req, res) => {
  const { decision, note } = req.body || {};
  const p = db.prepare("SELECT * FROM payments WHERE id = ? AND status = 'pending'").get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Payment not found or already reviewed.' });
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ error: 'Invalid decision.' });

  db.transaction(() => {
    db.prepare("UPDATE payments SET status = ?, admin_note = ?, reviewed_at = datetime('now') WHERE id = ?").run(decision, note || null, p.id);
    if (decision !== 'approved') return;
    if (p.purpose === 'course') {
      db.prepare('INSERT OR IGNORE INTO enrollments (user_id, course_id, payment_id) VALUES (?,?,?)').run(p.user_id, p.course_id, p.id);
    } else if (p.purpose === 'subscription') {
      const last = db.prepare("SELECT MAX(ends_at) e FROM subscriptions WHERE user_id = ? AND datetime(ends_at) > datetime('now')").get(p.user_id).e;
      const start = last || new Date().toISOString();
      db.prepare("INSERT INTO subscriptions (user_id, payment_id, starts_at, ends_at) VALUES (?,?,?, datetime(?, '+1 month'))").run(p.user_id, p.id, start, start);
    } else if (p.purpose === 'session') {
      db.prepare("UPDATE bookings SET status = 'paid' WHERE id = ?").run(p.booking_id);
    }
  })();

  const what = p.purpose === 'course' ? 'Your course is now unlocked.' : p.purpose === 'subscription' ? 'All courses are unlocked for one month.' : 'Your 1-on-1 session is confirmed.';
  notifyUser(p.user_id, decision === 'approved'
    ? { type: 'payment_approved', title: 'Payment approved', body: what, link: p.purpose === 'session' ? '/sessions' : '/enrolled' }
    : { type: 'payment_rejected', title: 'Payment could not be verified', body: note || 'Please check the reference ID and try again.', link: '/enrolled#payments' });
  res.json({ ok: true });
});

// ---------- 1-on-1 bookings ----------
router.get('/bookings', (_req, res) => res.json(db.prepare(`SELECT b.*, u.name AS student_name, u.email AS student_email, u.phone AS student_phone
  FROM bookings b JOIN users u ON u.id = b.user_id ORDER BY CASE b.status WHEN 'requested' THEN 0 ELSE 1 END, b.preferred_at`).all()));

router.post('/bookings/:id/review', (req, res) => {
  const { decision, priceEtb, message } = req.body || {};
  const b = db.prepare('SELECT * FROM bookings WHERE id = ?').get(req.params.id);
  if (!b) return res.status(404).json({ error: 'Booking not found.' });
  if (decision === 'approved') {
    const price = Number(priceEtb ?? (b.mode === 'online' ? pricing().sessionPriceOnline : pricing().sessionPriceInPerson));
    db.prepare("UPDATE bookings SET status = 'approved', price_etb = ?, admin_message = ? WHERE id = ?").run(price, message || null, b.id);
    notifyUser(b.user_id, { type: 'booking_approved', title: '1-on-1 session approved', body: `Pay ${price} ETB to confirm your slot.`, link: '/sessions' });
  } else if (['rejected', 'completed'].includes(decision)) {
    db.prepare('UPDATE bookings SET status = ?, admin_message = ? WHERE id = ?').run(decision, message || null, b.id);
    if (decision === 'rejected') notifyUser(b.user_id, { type: 'booking_rejected', title: '1-on-1 request declined', body: message || 'Please pick another time.', link: '/sessions' });
  } else return res.status(400).json({ error: 'Invalid decision.' });
  res.json({ ok: true });
});

// ---------- Course requests ----------
router.get('/course-requests', (_req, res) => res.json(db.prepare(`SELECT r.*, u.name AS student_name, u.email AS student_email
  FROM course_requests r JOIN users u ON u.id = r.user_id ORDER BY r.id DESC`).all()));
router.patch('/course-requests/:id', (req, res) => {
  db.prepare('UPDATE course_requests SET status = ? WHERE id = ?').run(req.body.status, req.params.id);
  res.json({ ok: true });
});

// ---------- Curriculum: categories, courses, lessons ----------
router.get('/curriculum', (_req, res) => {
  const cats = db.prepare('SELECT * FROM categories ORDER BY sort_order, id').all();
  const courses = db.prepare('SELECT * FROM courses ORDER BY sort_order, id').all();
  const lessons = db.prepare('SELECT * FROM lessons ORDER BY sort_order, id').all();
  res.json(cats.map((cat) => ({
    ...cat,
    courses: courses.filter((c) => c.category_id === cat.id).map((c) => ({
      ...c, evaluation_criteria: JSON.parse(c.evaluation_criteria || '[]'),
      lessons: lessons.filter((l) => l.course_id === c.id),
    })),
  })));
});

const slugify = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

router.post('/categories', (req, res) => {
  const { title, description } = req.body;
  const info = db.prepare('INSERT INTO categories (title, slug, description, sort_order) VALUES (?,?,?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM categories))')
    .run(title, slugify(title), description || null);
  res.json({ id: info.lastInsertRowid });
});

router.put('/categories/:id', (req, res) => {
  const { title, description, sort_order } = req.body;
  db.prepare('UPDATE categories SET title = ?, description = ?, sort_order = COALESCE(?, sort_order) WHERE id = ?').run(title, description, sort_order ?? null, req.params.id);
  res.json({ ok: true });
});

router.delete('/categories/:id', (req, res) => { db.prepare('DELETE FROM categories WHERE id = ?').run(req.params.id); res.json({ ok: true }); });

const courseFields = (b) => [b.category_id, b.title, b.summary || '', b.learning_outcomes || '', b.deliverables || '',
  JSON.stringify(b.evaluation_criteria || []), Number(b.price_etb) || 0, b.submission_link_id || null, b.is_published ? 1 : 0];

router.post('/courses', (req, res) => {
  const b = req.body;
  const info = db.prepare(`INSERT INTO courses (category_id, title, summary, learning_outcomes, deliverables, evaluation_criteria, price_etb, submission_link_id, is_published, slug, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?,?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM courses WHERE category_id = ?))`)
    .run(...courseFields(b), `${slugify(b.title)}-${Date.now().toString(36)}`, b.category_id);
  if (b.is_published) {
    notifyAllStudents({ type: 'new_course', title: 'New course added', body: b.title, link: '/catalog' });
  }
  res.json({ id: info.lastInsertRowid });
});

router.put('/courses/:id', (req, res) => {
  const before = db.prepare('SELECT is_published, title FROM courses WHERE id = ?').get(req.params.id);
  if (!before) return res.status(404).json({ error: 'Course not found.' });
  db.prepare(`UPDATE courses SET category_id=?, title=?, summary=?, learning_outcomes=?, deliverables=?, evaluation_criteria=?,
    price_etb=?, submission_link_id=?, is_published=? WHERE id = ?`).run(...courseFields(req.body), req.params.id);
  if (!before.is_published && req.body.is_published) {
    notifyAllStudents({ type: 'new_course', title: 'New course added', body: req.body.title, link: '/catalog' });
  }
  res.json({ ok: true });
});

router.delete('/courses/:id', (req, res) => { db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id); res.json({ ok: true }); });

// ---------- Lessons on Cloudinary ----------
// 1) Browser asks for an upload signature, 2) uploads the file straight to Cloudinary,
// 3) registers the resulting public ID here as a lesson.
router.post('/cloudinary/sign', (req, res) => {
  if (!isConfigured()) return res.status(503).json({ error: 'Add your Cloudinary keys to server/.env first.' });
  res.json(signUpload(req.body?.kind === 'pdf' ? 'pdf' : 'video'));
});

router.post('/lessons', async (req, res) => {
  const { course_id, title, public_id, kind, is_preview } = req.body || {};
  if (!course_id || !title?.trim() || !public_id?.trim() || !['video', 'pdf'].includes(kind)) {
    return res.status(400).json({ error: 'Course, title, file and type are required.' });
  }
  const resourceType = kind === 'video' ? 'video' : 'image';
  const asset = await findAsset(public_id.trim(), resourceType);
  if (!asset) return res.status(400).json({ error: `No ${kind} with that public ID was found in your Cloudinary account.` });
  const info = db.prepare(`INSERT INTO lessons (course_id, title, kind, cloud_public_id, cloud_resource_type, cloud_delivery_type, bytes, duration_sec, is_preview, sort_order)
    VALUES (?,?,?,?,?,?,?,?,?, (SELECT COALESCE(MAX(sort_order),0)+1 FROM lessons WHERE course_id = ?))`)
    .run(course_id, title.trim(), kind, public_id.trim(), resourceType, asset.deliveryType, asset.bytes, asset.duration, is_preview ? 1 : 0, course_id);
  res.json({ id: info.lastInsertRowid, deliveryType: asset.deliveryType });
});

router.put('/lessons/:id', (req, res) => {
  const { title, is_preview, sort_order } = req.body;
  db.prepare('UPDATE lessons SET title = ?, is_preview = ?, sort_order = COALESCE(?, sort_order) WHERE id = ?').run(title, is_preview ? 1 : 0, sort_order ?? null, req.params.id);
  res.json({ ok: true });
});

// Removes the lesson from the course. The file stays in your Cloudinary Media Library (delete it there if you want).
router.delete('/lessons/:id', (req, res) => { db.prepare('DELETE FROM lessons WHERE id = ?').run(req.params.id); res.json({ ok: true }); });

// ---------- Pricing & settings ----------
const SETTING_KEYS = ['subscription_discount_percent', 'subscription_fixed_price_etb', 'session_price_online_etb',
  'session_price_in_person_etb', 'cbe_account_name', 'cbe_account_number', 'telebirr_name', 'telebirr_number'];

router.get('/settings', (_req, res) => {
  res.json({
    settings: Object.fromEntries(SETTING_KEYS.map((k) => [k, getSetting(k, '')])),
    pricing: pricing(),
    contacts: db.prepare('SELECT * FROM contact_info ORDER BY sort_order, id').all(),
    submissionLinks: db.prepare('SELECT * FROM submission_links ORDER BY id').all(),
  });
});

router.put('/settings', (req, res) => {
  for (const k of SETTING_KEYS) if (k in req.body) setSetting(k, req.body[k]);
  res.json({ ok: true, pricing: pricing() });
});

// Contacts (replace the whole list — simplest for an editable form)
router.put('/contacts', (req, res) => {
  const list = Array.isArray(req.body) ? req.body : [];
  db.transaction(() => {
    db.prepare('DELETE FROM contact_info').run();
    const ins = db.prepare('INSERT INTO contact_info (kind, label, value, sort_order) VALUES (?,?,?,?)');
    list.filter((c) => c.value?.trim()).forEach((c, i) => ins.run(c.kind || 'other', c.label || c.kind, c.value.trim(), i));
  })();
  res.json({ ok: true });
});

router.put('/submission-links', (req, res) => {
  const list = Array.isArray(req.body) ? req.body : [];
  db.transaction(() => {
    const keep = list.filter((l) => l.id).map((l) => l.id);
    db.prepare(`DELETE FROM submission_links WHERE id NOT IN (${keep.map(() => '?').join(',') || 'NULL'})`).run(...keep);
    const upd = db.prepare('UPDATE submission_links SET kind=?, label=?, url=?, is_default=? WHERE id=?');
    const ins = db.prepare('INSERT INTO submission_links (kind, label, url, is_default) VALUES (?,?,?,?)');
    list.filter((l) => l.url?.trim()).forEach((l) =>
      l.id ? upd.run(l.kind, l.label, l.url.trim(), l.is_default ? 1 : 0, l.id) : ins.run(l.kind, l.label, l.url.trim(), l.is_default ? 1 : 0));
  })();
  res.json({ ok: true });
});

export default router;
