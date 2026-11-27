// Silent pre-sync. Right after the app opens online (and whenever the phone gets its connection back) the shared lists and
// the student's own courses and lessons are refreshed in the background, so everything opens instantly and works offline.
// Every request goes through the service worker, which saves the answers (public ones shared, private ones per user).
// Small on purpose: a few requests at a time, a cap per run, nothing at all offline, and it stops the moment the login changes.
import { api, cacheScope, SYNC_PREFIX } from '../api.js';

const START_GAP = 10 * 60 * 1000;    // the app merely reopened / came back to the front: at most every 10 minutes
const RECONNECT_GAP = 30 * 1000;     // connection came back
const MAX_COURSES = 12;              // course pages refreshed per run (the longest-unsynced first)
const MAX_LESSONS = 30;              // lessons downloaded for the first time per run (the rest follow on the next runs)
const MAX_NEWS = 5;                  // newest news items opened in full
const MAX_NOTES = 800;               // bound on the bookkeeping below

const SHARED = ['/catalog', '/promos', '/news?limit=3', '/pricing', '/contact', '/payment-accounts'];

let running = false;
let lastRun = 0;
let lastScope = null;

// What was already synced for this user (private → removed on sign-out with the rest, see api.js › forgetPrivate)
const notesKey = (scope) => `${SYNC_PREFIX}${scope}`;
function readNotes(scope) {
  try { const v = JSON.parse(localStorage.getItem(notesKey(scope)) || 'null'); return { c: v?.c || {}, l: v?.l || {} }; } catch { return { c: {}, l: {} }; }
}
function writeNotes(scope, notes) {
  const newest = (o) => Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, MAX_NOTES / 2));
  try { localStorage.setItem(notesKey(scope), JSON.stringify({ c: newest(notes.c), l: newest(notes.l) })); } catch { /* storage full */ }
}

/** Ask the server (through the service worker, which saves the answer). Never throws. */
const pull = (path) => api(path, { cache: 'no-cache' }).catch(() => null);

async function pool(items, size, still, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: Math.min(size, queue.length) }, async () => {
    while (queue.length && still()) await fn(queue.shift());
  }));
}

/**
 * @param {{id: string, role: string}|null} user  null = guest (shared lists only)
 * @param {'start'|'online'} reason
 */
export async function presync(user, reason = 'start') {
  if (running || typeof navigator === 'undefined' || navigator.onLine === false) return;
  const scope = cacheScope();
  const gap = lastScope !== scope ? 0 : reason === 'online' ? RECONNECT_GAP : START_GAP; // a new login syncs right away
  if (Date.now() - lastRun < gap) return;
  const still = () => cacheScope() === scope && navigator.onLine !== false;               // signed out / offline → stop quietly
  running = true; lastRun = Date.now(); lastScope = scope;
  try {
    await pool(SHARED, 3, still, pull);
    const news = still() ? await pull('/news') : null;
    await pool((Array.isArray(news) ? news : []).slice(0, MAX_NEWS).map((n) => n.id), 2, still, (id) => pull(`/news/${id}`));
    if (user && still()) await syncPrivate(user, scope, still);
  } catch { /* silent */ } finally {
    running = false;
  }
}

async function syncPrivate(user, scope, still) {
  const summary = await pull('/me/summary');
  if (!summary || user.role === 'admin') return;                    // admins: no bulk download of every course
  const notes = readNotes(scope);
  const now = Date.now();
  const slugs = (summary.enrolled || []).map((c) => c.slug).filter(Boolean)
    .sort((a, b) => (notes.c[a] || 0) - (notes.c[b] || 0)).slice(0, MAX_COURSES);
  const lessons = [];
  await pool(slugs, 2, still, async (slug) => {
    const c = await pull(`/courses/${slug}`);
    if (!c) return;
    notes.c[slug] = now;
    for (const l of c.lessons || []) if ((c.hasAccess || c.isFree || l.isPreview || l.unlocked) && !notes.l[l.id]) lessons.push(l.id);
  });
  await pool(lessons.slice(0, MAX_LESSONS), 2, still, async (id) => { if (await pull(`/media/lesson/${id}`)) notes.l[id] = now; });
  if (still()) writeNotes(scope, notes);
}
