// Logged-in student actions: enrolled courses, payments, 1-on-1 bookings, course requests, notifications.
import { Router } from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { db, pricing, activeSubscription } from '../db.js';
import { config } from '../config.js';
import { requireAuth, signScoped, verify } from '../auth.js';
import { notifyAdmins, addStream } from '../notify.js';

const router = Router();

fs.mkdirSync(config.receiptsDir, { recursive: true });
const upload = multer({
  storage: multer.diskStorage({
    destination: config.receiptsDir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, /^image\/(png|jpe?g|webp)$/.test(file.mimetype)),
});

// ---------- Notifications (SSE stream works without headers via short token) ----------
router.get('/notifications/stream-token', requireAuth, (req, res) =>
  res.json({ token: signScoped({ scope: 'sse', sub: req.user.id }, '12h') }));

router.get('/notifications/stream', (req, res) => {
  const claims = verify(String(req.query.t || ''));
  if (!claims || claims.scope !== 'sse') return res.status(401).end();
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.write(': connected\n\n');
  addStream(claims.sub, res);
});

router.use(requireAuth);

router.get('/notifications', (req, res) =>
  res.json(db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT 50').all(req.user.id)));

router.post('/notifications/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ ok: true });
});

// ---------- Dashboard / enrolled ----------
router.get('/me/summary', (req, res) => {
  const sub = activeSubscription(req.user.id);
  const enrolled = sub
    ? db.prepare('SELECT c.*, cat.title AS category_title FROM courses c JOIN categories cat ON cat.id = c.category_id WHERE c.is_published = 1 ORDER BY cat.sort_order, c.sort_order').all()
    : db.prepare(`SELECT c.*, cat.title AS category_title FROM enrollments e JOIN courses c ON c.id = e.course_id
        JOIN categories cat ON cat.id = c.category_id WHERE e.user_id = ? ORDER BY e.created_at DESC`).all(req.user.id);
  res.json({
    subscription: sub || null,
    enrolled,
    pendingPayments: db.prepare("SELECT COUNT(*) n FROM payments WHERE user_id = ? AND status = 'pending'").get(req.user.id).n,
    nextSession: db.prepare("SELECT * FROM bookings WHERE user_id = ? AND status IN ('approved','paid') AND datetime(preferred_at) > datetime('now') ORDER BY preferred_at LIMIT 1").get(req.user.id) || null,
  });
});

// ---------- Payments ----------
function amountFor(purpose, courseId, bookingId, userId) {
  if (purpose === 'subscription') return pricing().monthlyPrice;
  if (purpose === 'course') return db.prepare('SELECT price_etb FROM courses WHERE id = ? AND is_published = 1').get(courseId)?.price_etb;
  if (purpose === 'session') {
    const b = db.prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = 'approved'").get(bookingId, userId);
    return b?.price_etb;
  }
}

router.post('/payments', upload.single('screenshot'), (req, res) => {
  const { purpose, courseId, bookingId, method, referenceId } = req.body || {};
  if (!req.file) return res.status(400).json({ error: 'Attach the payment screenshot (PNG, JPG or WEBP, max 8 MB).' });
  if (!['course', 'subscription', 'session'].includes(purpose) || !['CBE', 'TELEBIRR'].includes(method) || !referenceId?.trim()) {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: 'Choose a payment method and enter the transaction reference ID.' });
  }
  const amount = amountFor(purpose, courseId, bookingId, req.user.id);
  if (!amount || amount <= 0) { fs.unlink(req.file.path, () => {}); return res.status(400).json({ error: 'Nothing to pay for.' }); }
  try {
    const info = db.prepare(`INSERT INTO payments (user_id, purpose, course_id, booking_id, amount_etb, method, reference_id, screenshot_file)
      VALUES (?,?,?,?,?,?,?,?)`).run(req.user.id, purpose, courseId || null, bookingId || null, amount, method, referenceId.trim(), req.file.filename);
    notifyAdmins({ type: 'payment', title: 'New payment to verify', body: `${req.user.name} · ${method} · ${amount} ETB`, link: '/admin/payments' });
    res.json({ id: info.lastInsertRowid, status: 'pending' });
  } catch (e) {
    fs.unlink(req.file.path, () => {});
    if (String(e.message).includes('UNIQUE')) return res.status(409).json({ error: 'This transaction reference was already submitted.' });
    throw e;
  }
});

router.get('/payments', (req, res) =>
  res.json(db.prepare('SELECT id, purpose, course_id, booking_id, amount_etb, method, reference_id, status, admin_note, created_at FROM payments WHERE user_id = ? ORDER BY id DESC').all(req.user.id)));

// ---------- 1-on-1 bookings ----------
router.post('/bookings', (req, res) => {
  const { mode, preferredAt, topic, notes } = req.body || {};
  if (!['online', 'in_person'].includes(mode) || !preferredAt || !topic) {
    return res.status(400).json({ error: 'Choose online or in-person, a date/time and a topic.' });
  }
  const info = db.prepare('INSERT INTO bookings (user_id, mode, preferred_at, topic, notes) VALUES (?,?,?,?,?)')
    .run(req.user.id, mode, preferredAt, topic, notes || null);
  notifyAdmins({ type: 'booking', title: 'New 1-on-1 request', body: `${req.user.name} · ${mode === 'online' ? 'Online' : 'In person'} · ${preferredAt}`, link: '/admin/bookings' });
  res.json({ id: info.lastInsertRowid });
});

router.get('/bookings', (req, res) =>
  res.json(db.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY id DESC').all(req.user.id)));

// ---------- Custom course requests ----------
router.post('/course-requests', (req, res) => {
  const { topic, description, level } = req.body || {};
  if (!topic?.trim()) return res.status(400).json({ error: 'Tell us the topic you want to learn.' });
  db.prepare('INSERT INTO course_requests (user_id, topic, description, level) VALUES (?,?,?,?)')
    .run(req.user.id, topic.trim(), description || null, level || null);
  notifyAdmins({ type: 'course_request', title: 'New course request', body: `"${topic.trim()}" — ${req.user.name}`, link: '/admin/requests' });
  res.json({ ok: true });
});

router.get('/course-requests', (req, res) =>
  res.json(db.prepare('SELECT * FROM course_requests WHERE user_id = ? ORDER BY id DESC').all(req.user.id)));

export default router;
