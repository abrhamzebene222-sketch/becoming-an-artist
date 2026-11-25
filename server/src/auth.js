// Authentication & roles.
// The login token only holds the user id. The ROLE is read from MongoDB on every request,
// so changing `role` to "admin" in Atlas Data Explorer takes effect immediately (after a page refresh).
import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { User } from './models/index.js';
import { fail } from './i18n.js';
import { isAdmin } from './lib.js';
import { cleanDeviceId, hashDevice, isLockedRole, safeEqual } from './device.js';

// `tv` = the user's tokenVersion. Bumping it in MongoDB (or by moving the account to a new device) revokes every older token.
export const signUser = (user) => jwt.sign({ sub: String(user._id || user.id), tv: user.tokenVersion || 0 }, config.jwtSecret, { expiresIn: '30d' });

/** Short-lived token for EventSource (cannot send headers). */
export const signScoped = (payload, expiresIn) => jwt.sign(payload, config.jwtSecret, { expiresIn });

export function verify(token) {
  try { return jwt.verify(token, config.jwtSecret); } catch { return null; }
}

async function loadUser(req) {
  const header = req.headers.authorization || '';
  const claims = verify(header.startsWith('Bearer ') ? header.slice(7) : '');
  if (!claims || claims.scope) return null;
  const user = await User.findById(claims.sub).lean().catch(() => null);
  if (!user) return null;
  if ((claims.tv || 0) !== (user.tokenVersion || 0)) return null; // token was revoked (device changed / admin reset)

  // Device lock: students must send the device id (header X-Device-Id) of the device their account is tied to.
  if (config.deviceLock && isLockedRole(user)) {
    const id = cleanDeviceId(req.headers['x-device-id']);
    if (user.deviceHash) {
      if (!id || !safeEqual(hashDevice(id), user.deviceHash)) { req.deviceBlocked = true; return null; }
    } else if (id) {
      // Accounts created before the lock existed get tied to the first device that makes a request
      await User.updateOne(
        { _id: user._id, $or: [{ deviceHash: '' }, { deviceHash: null }, { deviceHash: { $exists: false } }] },
        { $set: { deviceHash: hashDevice(id), deviceBoundAt: new Date() } },
      );
    }
  }
  return { id: String(user._id), name: user.name, email: user.email, role: String(user.role || 'student').toLowerCase() };
}

/** Sets req.user when a valid token is sent, but lets guests through (free courses). */
export async function optionalAuth(req, _res, next) {
  try { req.user = await loadUser(req); next(); } catch (e) { next(e); }
}

export async function requireAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    if (!req.user) return fail(req, res, 401, req.deviceBlocked ? 'deviceMismatch' : 'signIn');
    next();
  } catch (e) { next(e); }
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (!isAdmin(req.user)) return fail(req, res, 403, 'adminOnly');
    next();
  });
}
