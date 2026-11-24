/* Becoming an Artist — service worker (offline app shell, lesson text & every Cloudinary image).
 *
 *  • App shell + built JS/CSS: cached, so the app opens without internet.
 *  • API answers students need offline (catalog, course pages, lesson content, promos…): network-first,
 *    falling back to the last saved copy.
 *  • Cloudinary / YouTube-thumbnail images: cache-first. When a lesson's JSON is fetched, all of its block
 *    images are downloaded in the background too, so the WHOLE lesson (text + images) works offline.
 *  • Signed video/PDF links and live notifications are never cached.
 *  The API and image caches are not tied to the app version, so saved lessons survive app updates.
 */
const VERSION = 'v5';
const SHELL = `baa-shell-${VERSION}`;
const ASSETS = `baa-assets-${VERSION}`;
const API = 'baa-api';
const IMAGES = 'baa-images';
const FONTS = 'baa-fonts';
const MAX_IMAGES = 600;
const MAX_API = 300;
const SHELL_URLS = ['/', '/index.html', '/manifest.json', '/icons/icon-192.png', '/icons/icon-512.png'];
const CACHEABLE_API = /\/api\/(catalog|news|courses\/|media\/lesson\/|promos|pricing|contact|me\/summary|auth\/me|payment-accounts|self-evals\/[0-9a-f]{24})/;
const MATCH = { ignoreVary: true };

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((c) => c.addAll(SHELL_URLS)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if ((key.startsWith('baa-shell-') && key !== SHELL) || (key.startsWith('baa-assets-') && key !== ASSETS)) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

// Sign-out on a shared device: forget the previous user's API answers (images are public and stay)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'clear-private') event.waitUntil(caches.delete(API));
  if (event.data?.type === 'skip-waiting') self.skipWaiting();
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i += 1) await cache.delete(keys[i]);
}

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

async function networkFirst(request, cacheName, ms = 7000) {
  const cache = await caches.open(cacheName);
  try {
    const res = await Promise.race([fetch(request), timeout(ms)]);
    if (res.ok && (cacheName !== API || (res.headers.get('content-type') || '').includes('json'))) {
      cache.put(request, res.clone()).then(() => (cacheName === API ? trim(API, MAX_API) : null)).catch(() => {});
      if (/\/api\/(media\/lesson|self-evals)\//.test(request.url)) res.clone().json().then(warmLessonImages).catch(() => {});
    }
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
    if (CACHEABLE_API.test(url.pathname)) event.respondWith(networkFirst(request, API));
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
