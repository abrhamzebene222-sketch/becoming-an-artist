// Device lock helpers. We never store the raw device id: only a salted SHA-256 hash of it.
import crypto from 'node:crypto';
import { config } from './config.js';

const ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;

/** Returns a clean device id string, or '' if the app sent nothing usable. */
export const cleanDeviceId = (v) => (ID_RE.test(String(v || '').trim()) ? String(v).trim() : '');

export const hashDevice = (id) => crypto.createHash('sha256').update(`device:${config.jwtSecret}:${id}`).digest('hex');

export const hashOtp = (userId, code) => crypto.createHash('sha256').update(`otp:${config.jwtSecret}:${userId}:${code}`).digest('hex');

export const newOtp = () => String(crypto.randomInt(100000, 1000000));

export const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const isLockedRole = (user) => String(user?.role || 'student').toLowerCase() !== 'admin';
