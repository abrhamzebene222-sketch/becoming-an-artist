// Real-time in-app notifications over Server-Sent Events, stored in MongoDB.
// Each notification has a `type` + `params`; the app shows it in the reader's language.
import { Notification, User } from './models/index.js';

const streams = new Map(); // userId -> Set<res>

export function addStream(userId, res) {
  if (!streams.has(userId)) streams.set(userId, new Set());
  streams.get(userId).add(res);
  res.on('close', () => streams.get(userId)?.delete(res));
}

function push(userId, notification) {
  for (const res of streams.get(String(userId)) || []) {
    res.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
  }
}

/** notifyUser(id, { type, params, title, body, link }) — title/body are an English fallback. */
export async function notifyUser(userId, n) {
  try {
    const doc = await Notification.create({ user: userId, ...n });
    push(userId, doc.toJSON());
  } catch (e) { console.error('notification failed', e.message); }
}

export async function notifyAdmins(n) {
  const admins = await User.find({ role: /^admin$/i }, '_id').lean();
  await Promise.all(admins.map((a) => notifyUser(a._id, n)));
}

export async function notifyAllStudents(n) {
  const students = await User.find({ role: { $not: /^admin$/i } }, '_id').lean();
  await Promise.all(students.map((s) => notifyUser(s._id, n)));
}

// Keep proxies (Render, Cloudflare) from closing idle connections
setInterval(() => {
  for (const set of streams.values()) for (const res of set) res.write(': ping\n\n');
}, 25_000).unref();
