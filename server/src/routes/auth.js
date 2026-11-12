import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { signUser, requireAuth } from '../auth.js';

const router = Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });
const publicUser = ({ id, name, email, phone, role }) => ({ id, name, email, phone, role });

router.post('/register', limiter, (req, res) => {
  const { name, email, phone, password } = req.body || {};
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Name, email and a password of at least 8 characters are required.' });
  }
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }
  const info = db.prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?,?,?,?)')
    .run(name.trim(), email.trim(), phone || null, bcrypt.hashSync(password, 12));
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.json({ token: signUser(user), user: publicUser(user) });
});

router.post('/login', limiter, (req, res) => {
  const { email, password } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email || '');
  if (!user || !bcrypt.compareSync(password || '', user.password_hash)) {
    return res.status(401).json({ error: 'Wrong email or password.' });
  }
  res.json({ token: signUser(user), user: publicUser(user) });
});

router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(401).json({ error: 'Account not found.' });
  res.json(publicUser(user));
});

export default router;
