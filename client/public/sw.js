/* Becoming an Artist — service worker (offline app shell, saved API answers, lesson text & every Cloudinary image).
 *
 *  • App shell + built JS/CSS: cached, so the app opens without internet.
 *  • API answers students need (catalog, course pages, lesson content, news, promos, prices…):
 *    STALE-WHILE-REVALIDATE — the saved copy is returned immediately; the server is asked in the background; if the
 *    answer changed, the copy is replaced and the open page is told ("baa-api" message) so it updates by itself.
 *    No saved copy yet → network. Offline → the saved copy. Same rules as client/src/lib/cachePolicy.js (KEEP IN SYNC).
 *      – Shared answers (catalog, news, promos…) live in one public cache.
 *      – Anything that depends on who is asking (course pages, lessons, balances…) lives in a cache of its OWN PER USER
 *        (the user id is read from the login token). A different login, sign-out, or a 401 wipes it. Never shared.
 *      – /auth/me stays network-first (the role must always be fresh); lessons that carry a signed video/PDF link are
 *        also fetched network-first, because that link expires.
 *    The caches are bounded by number of answers AND by total size (oldest dropped first).
 *  • Cloudinary / YouTube-thumbnail images: cache-first. When a lesson's JSON is fetched, all of its block
 *    images are downloaded in the background too (skipped when the phone is in Data Saver mode),
 *    so the WHOLE lesson (text + images) works offline.
 *  • Signed video/PDF links and live notifications are never cached.
 *  The API and image caches are not tied to the app version, so saved lessons survive app updates.
 */
const VERSION = 'v6';
const SHELL = `baa-shell-${VERSION}`;
const ASSETS = `baa-assets-${VERSION}`;
const API_PUBLIC = 'baa-api-public';      // answers that are the same for everybody
const PRIVATE_PREFIX = 'baa-priv-';       // + user id (or "guest") → answers that depend on the user
const GUEST = 'guest';
const LEGACY_API = 'baa-api';             // old single cache (mixed users) — deleted on activate
const IMAGES = 'baa-images';
const FONTS = 'baa-fonts';
const MAX_IMAGES = 600;
const LIMITS = {
  public: { entries: 120, bytes: 6 * 1024 * 1024 },
  private: { entries: 300, bytes: 12 * 1024 * 1024 },
};
const MAX_ENTRY_BYTES = 3 * 1024 * 1024;  // a single answer bigger than this is not saved
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];
const MATCH = { ignoreVary: true };

// ---------- What is saved, and for whom (mirror of client/src/lib/cachePolicy.js) ----------
const PUBLIC_PATH = /^(catalog|news|news\/[0-9a-f]{24}|promos|pricing|contact|payment-accounts)$/;
const PRIVATE_PATH = /^(courses\/[^/]+|media\/lesson\/[0-9a-f]{24}|me\/summary|me\/referrals|me\/credits|self-evals|self-evals\/mine|self-evals\/[0-9a-f]{24})$/;

function apiRule(url) {
  const i = url.pathname.indexOf('/api/');
  if (i < 0) return null;
  if ((url.searchParams.get('q') || '').trim()) return null;          // searches are never saved
  const p = url.pathname.slice(i + 5).replace(/\/+$/, '');
  if (PUBLIC_PATH.test(p)) return { kind: 'public', mode: 'swr' };
  if (PRIVATE_PATH.test(p)) return { kind: 'private', mode: 'swr' };
  if (p === 'auth/me') return { kind: 'private', mode: 'network-first' };
  return null;
}

/** One address per answer: an empty ?q= is the same list as no ?q= at all. */
function keyOf(url) {
  const u = new URL(url.href);
  if (u.searchParams.has('q') && !u.searchParams.get('q')) u.searchParams.delete('q');
  u.hash = '';
  return u.href;
}

/** The user id inside the login token (same rule as client/src/api.js › cacheScope), or "guest". The token is not verified here — it only names the cache. */
function scopeOf(request) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '');
  if (!m) return GUEST;
  try {
    const b = m[1].split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const sub = JSON.parse(atob(b + '==='.slice((b.length + 3) % 4))).sub;
    if (/^[0-9a-zA-Z]{8,40}$/.test(String(sub))) return String(sub);
  } catch { /* unreadable token → handled like a guest */ }
  return GUEST;
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith('baa-shell-') && key !== SHELL) || (key.startsWith('baa-assets-') && key !== ASSETS) || key === LEGACY_API) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// ---------- Private data: who is "active", and wiping ----------
let activeScope = null;   // the user whose private cache is in use
let epoch = 0;            // bumped on every wipe — an answer that was on its way during a sign-out is thrown away

async function dropOtherUsers(keep) {
  for (const name of await caches.keys()) {
    if (name.startsWith(PRIVATE_PREFIX) && name !== PRIVATE_PREFIX + keep && name !== PRIVATE_PREFIX + GUEST) await caches.delete(name);
  }
}

/** A different user is asking → every other user's saved answers go (guest answers are public by definition and stay). */
async function enterScope(scope) {
  if (activeScope === scope) return;
  activeScope = scope;
  await dropOtherUsers(scope);
}

async function clearPrivate() {
  epoch += 1;
  activeScope = null;
  await dropOtherUsers(GUEST);
  await caches.delete(LEGACY_API);
}

// Sign-out / login changed (sent by the app): forget every user's saved answers (public answers and images stay)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'clear-private') event.waitUntil(clearPrivate());
  if (event.data?.type === 'skip-waiting') self.skipWaiting();
});

async function notify(event, url) {
  try {
    for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) client.postMessage({ type: 'baa-api', event, url });
  } catch { /* no open window */ }
}

// ---------- Size bounds ----------
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}

const trimming = {};
/** Oldest answers first, until both the number of answers and their total size are within the limit. One pass at a time per cache; a request that arrives meanwhile triggers one more pass. */
async function trimApi(cacheName, limit) {
  if (trimming[cacheName]) { trimming[cacheName] = 'again'; return; }
  try {
    do {
      trimming[cacheName] = true;
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      const sizes = [];
      let total = 0;
      for (const k of keys) {
        const r = await cache.match(k, MATCH);
        const n = Number(r?.headers.get('x-baa-size')) || 0;
        sizes.push(n); total += n;
      }
      let i = 0;
      while (i < keys.length - 1 && (keys.length - i > limit.entries || total > limit.bytes)) {
        await cache.delete(keys[i]); total -= sizes[i]; i += 1;
      }
    } while (trimming[cacheName] === 'again');
  } finally { delete trimming[cacheName]; }
}

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

// ---------- API: stale-while-revalidate ----------
const LESSON_JSON = /\/api\/(media\/lesson|self-evals)\//;

async function apiHandler(event, request, rule) {
  const url = new URL(request.url);
  const key = keyOf(url);
  const priv = rule.kind === 'private';
  const scope = priv ? scopeOf(request) : null;
  if (priv) await enterScope(scope);
  const name = priv ? PRIVATE_PREFIX + scope : API_PUBLIC;
  const ctx = { request, key, name, scope, limit: priv ? LIMITS.private : LIMITS.public, born: epoch };
  const cache = await caches.open(name);
  const hit = await cache.match(key, MATCH);

  const mode = request.cache;                                           // how the page asked (see api.js › api())
  const wantsFresh = mode === 'no-cache' || mode === 'reload' || mode === 'no-store';
  if (hit && (mode === 'force-cache' || mode === 'only-if-cached')) return hit;   // "read the copy you just saved"

  const needsServer = wantsFresh || rule.mode === 'network-first' || (hit && hit.headers.has('x-baa-live'));
  if (hit && !needsServer) {
    // Saved copy now; the server is asked behind it
    event.waitUntil(fetchAndSave(ctx).then((r) => r.done).catch(() => {}));
    return hit;
  }

  const pending = fetchAndSave(ctx);
  event.waitUntil(pending.then((r) => r.done).catch(() => {}));
  if (!hit) return (await pending).res;                                // nothing saved → the network answer (or an error when offline)
  try {
    const { res } = await Promise.race([pending, timeout(7000)]);       // saved copy is the fallback when offline / slow / the server is failing
    return res.status >= 500 ? hit : res;
  } catch {
    return hit;
  }
}

/** Ask the server (bypassing the browser's own HTTP cache) and save a good answer. Returns the answer for the page + a promise for the saving. */
async function fetchAndSave(ctx) {
  const res = await fetch(new Request(ctx.request, { cache: 'no-cache' }));
  return { res, done: save(res.clone(), ctx).catch(() => {}) };
}

async function save(res, ctx) {
  const { key, name, scope, limit, born } = ctx;
  const cache = await caches.open(name);
  const prev = await cache.match(key, MATCH);

  // The server says "no longer": the login is dead (wipe this user's saved answers) or this one answer is gone / not allowed any more
  if (res.status === 401 && scope && scope !== GUEST) { await caches.delete(name); await notify('invalid', key); return; }
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    if (prev) { await cache.delete(key, MATCH); await notify('invalid', key); }
    return;
  }
  if (!res.ok || !(res.headers.get('content-type') || '').includes('json')) return;

  const text = await res.text();
  if (born !== epoch) return;                                           // signed out while this was on its way → do not keep it
  const bytes = new TextEncoder().encode(text).length;
  if (bytes > MAX_ENTRY_BYTES) { if (prev) await cache.delete(key, MATCH); return; }

  let lesson = null;
  if (LESSON_JSON.test(key)) { try { lesson = JSON.parse(text); } catch { /* not JSON after all */ } }
  const live = !!(lesson && typeof lesson.url === 'string' && lesson.url);   // signed video/PDF link → always ask the server first next time
  const headers = new Headers({ 'content-type': 'application/json', 'x-baa-size': String(bytes), 'x-baa-ts': String(Date.now()) });
  if (live) headers.set('x-baa-live', '1');
  const changed = !prev || (await prev.text()) !== text;

  await cache.put(key, new Response(text, { status: 200, headers }));
  if (prev && changed && !live) await notify('updated', key);          // only a real difference reaches the screen
  trimApi(name, limit).catch(() => {});
  if (lesson) warmLessonImages(lesson).catch(() => {});
}

async function networkFirst(request, cacheName, ms = 7000) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([fetch(request), timeout(ms)]);
    if (res.ok) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch (e) {
    const hit = await cache.match(request, MATCH);
    if (hit) return hit;
    throw e;
  }
}

/** Same transformation the app uses (api.js › cdn) so the cached URL is exactly the one the <img> asks for. */
const cdn = (url, width = 1600) => (url && url.includes('res.cloudinary.com') && url.includes('/upload/')
  ? url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`) : url);

async function warmLessonImages(lesson) {
  if (self.navigator?.connection?.saveData) return;                    // Data Saver on → images are fetched only when seen
  const urls = (lesson?.blocks || []).filter((b) => (b.type === 'image' || b.type === 'step') && b.imageUrl).map((b) => cdn(b.imageUrl, 1600));
  const cache = await caches.open(IMAGES);
  for (const url of urls) {
    if (await cache.match(url, MATCH)) continue;
    try {
      const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
      if (res.ok) await cache.put(url, res);
    } catch { /* offline again — the next view will retry */ }
  }
  trim(IMAGES, MAX_IMAGES);
}

/** Images: cached copy first; otherwise fetch as CORS (Cloudinary allows it) so the stored response isn't opaque. */
async function imageCacheFirst(request) {
  const cache = await caches.open(IMAGES);
  const hit = await cache.match(request.url, MATCH);
  if (hit) return hit;
  try {
    const res = await fetch(request.url, { mode: 'cors', credentials: 'omit' });
    if (res.ok) cache.put(request.url, res.clone()).then(() => trim(IMAGES, MAX_IMAGES)).catch(() => {});
    return res;
  } catch {
    return fetch(request); // last try with the browser's own request
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, MATCH);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok || res.type === 'opaque') cache.put(request, res.clone()).catch(() => {});
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, MATCH);
  const update = fetch(request).then((res) => { if (res.ok || res.type === 'opaque') cache.put(request, res.clone()).catch(() => {}); return res; }).catch(() => hit);
  return hit || update;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.pathname.includes('/api/')) {
    if (url.pathname.includes('/notifications/stream')) return;           // live SSE
    const rule = apiRule(url);
    if (rule) event.respondWith(apiHandler(event, request, rule));
    return;                                                                 // everything else: straight to network
  }
  if (url.hostname === 'res.cloudinary.com') {
    if (url.pathname.includes('/image/upload/')) event.respondWith(imageCacheFirst(request)); // public images only
    return;                                                                 // signed videos / PDFs: never cached
  }
  if (url.hostname === 'i.ytimg.com') { event.respondWith(imageCacheFirst(request)); return; }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(staleWhileRevalidate(request, FONTS));
    return;
  }
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL, 5000).catch(async () => (await caches.match('/index.html', MATCH)) || Response.error()));
    return;
  }
  if (url.pathname.startsWith('/assets/')) { event.respondWith(cacheFirst(request, ASSETS)); return; }
  event.respondWith(staleWhileRevalidate(request, SHELL));
});
