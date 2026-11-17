// Small AES-256-GCM helper for secrets stored in MongoDB (Cloudinary API secrets, Telegram bot token).
// The key is derived from JWT_SECRET, so a database dump alone does not reveal the secrets.
import crypto from 'node:crypto';
import { config } from './config.js';

const KEY = crypto.createHash('sha256').update(`baa-secret:${config.jwtSecret}`).digest();

export function encrypt(plain) {
  if (!plain) return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `v1:${iv.toString('base64')}:${cipher.getAuthTag().toString('base64')}:${enc.toString('base64')}`;
}

export function decrypt(value) {
  if (!value) return '';
  if (!String(value).startsWith('v1:')) return String(value); // stored before encryption existed
  try {
    const [, iv, tag, data] = String(value).split(':');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, Buffer.from(iv, 'base64'));
    decipher.setAuthTag(Buffer.from(tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

/** "abcd…wxyz" — safe to show in the admin UI. */
export const mask = (s) => (s ? (s.length <= 8 ? '••••' : `${s.slice(0, 4)}…${s.slice(-4)}`) : '');
