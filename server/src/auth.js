import jwt from 'jsonwebtoken';
import { config } from './config.js';

export const signUser = (user) =>
  jwt.sign({ sub: user.id, role: user.role, name: user.name }, config.jwtSecret, { expiresIn: '7d' });

/** Short-lived token for <video>/<iframe>/EventSource, which cannot send headers. */
export const signScoped = (payload, expiresIn) => jwt.sign(payload, config.jwtSecret, { expiresIn });

export function verify(token) {
  try { return jwt.verify(token, config.jwtSecret); } catch { return null; }
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const claims = verify(header.startsWith('Bearer ') ? header.slice(7) : '');
  if (!claims || claims.scope) return res.status(401).json({ error: 'Please sign in.' });
  req.user = { id: claims.sub, role: claims.role, name: claims.name };
  next();
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admins only.' });
    next();
  });
}
