// Real-time in-app notifications over Server-Sent Events (no extra services needed).
import { db } from './db.js';

const streams = new Map(); // userId -> Set<res>

export function addStream(userId, res) {
  if (!streams.has(userId)) streams.set(userId, new Set());
  streams.get(userId).add(res);
  res.on('close', () => streams.get(userId)?.delete(res));
}

function push(userId, notification) {
  for (const res of streams.get(userId) || []) {
    res.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
  }
}

/** Save a notification for one user and push it live if they're online. */
export function notifyUser(userId, { type, title, body = '', link = '' }) {
  const info = db.prepare('INSERT INTO notifications (user_id, type, title, body, link) VALUES (?,?,?,?,?)')
    .run(userId, type, title, body, link);
  push(userId, db.prepare('SELECT * FROM notifications WHERE id = ?').get(info.lastInsertRowid));
}

export const notifyAdmins = (n) =>
  db.prepare("SELECT id FROM users WHERE role = 'admin'").all().forEach((a) => notifyUser(a.id, n));

export const notifyAllStudents = (n) =>
  db.prepare("SELECT id FROM users WHERE role = 'student'").all().forEach((s) => notifyUser(s.id, n));

// Keep proxies/tunnels from closing idle SSE connections
setInterval(() => {
  for (const set of streams.values()) for (const res of set) res.write(': ping\n\n');
}, 25_000).unref();
