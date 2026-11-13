import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/index.js';
import { signUser, requireAuth } from '../auth.js';
import { fail, msg } from '../i18n.js';
import { ah } from '../lib.js';

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true, legacyHeaders: false,
  handler: (req, res) => res.status(429).json({ error: msg(req, 'tooMany') }),
});

const publicUser = (u) => ({ id: String(u._id), name: u.name, email: u.email, phone: u.phone, role: String(u.role || 'student').toLowerCase() });

router.post('/register', limiter, ah(async (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name?.trim() || !email?.trim() || !password || password.length < 8) return fail(req, res, 400, 'registerFields');
  if (await User.exists({ email: email.trim().toLowerCase() })) return fail(req, res, 409, 'emailTaken');
  const user = await User.create({
    name: name.trim(), email: email.trim(), phone: phone?.trim() || undefined,
    passwordHash: await bcrypt.hash(password, 12), role: 'student', // new sign-ups are always students
  });
  res.json({ token: signUser(user), user: publicUser(user) });
}));

router.post('/login', limiter, ah(async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: String(email || '').trim().toLowerCase() });
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return fail(req, res, 401, 'badLogin');
  res.json({ token: signUser(user), user: publicUser(user) });
}));

// Always returns the CURRENT role from the database
router.get('/me', requireAuth, ah(async (req, res) => {
  const user = await User.findById(req.user.id).lean();
  if (!user) return fail(req, res, 401, 'accountMissing');
  res.json(publicUser(user));
}));

export default router;
