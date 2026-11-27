// Which API answers are saved on the phone, and for whom.
// KEEP IN SYNC with client/public/sw.js (the service worker cannot import this file, so it holds the same rules).
//
//  public   → the same for everybody (catalog, news, promos…): one shared copy.
//  private  → depends on who asks (a course page shows what THIS student unlocked, lessons, balances…):
//             kept per user, wiped on sign-out / when the login changes.
//  network-first → /auth/me: the role must always come fresh from the server (see api.js › AuthProvider).
//
// Searches (?q=text) are never saved, only the plain lists.

const PUBLIC = /^(catalog|news|news\/[0-9a-f]{24}|promos|pricing|contact|payment-accounts)$/;
const PRIVATE = /^(courses\/[^/]+|media\/lesson\/[0-9a-f]{24}|me\/summary|me\/referrals|me\/credits|self-evals|self-evals\/mine|self-evals\/[0-9a-f]{24})$/;

/** @param {string} path e.g. "/catalog?q=" or "/courses/drawing-basics" → { kind, mode } or null (never saved) */
export function cacheRule(path) {
  let url;
  try { url = new URL(path, 'http://x'); } catch { return null; }
  if ((url.searchParams.get('q') || '').trim()) return null;
  const p = url.pathname.replace(/^\/+|\/+$/g, '');
  if (PUBLIC.test(p)) return { kind: 'public', mode: 'swr' };
  if (PRIVATE.test(p)) return { kind: 'private', mode: 'swr' };
  if (p === 'auth/me') return { kind: 'private', mode: 'network-first' };
  return null;
}

/** Saved-copy-first (stale-while-revalidate) applies only to these. */
export const isInstant = (path) => cacheRule(path)?.mode === 'swr';

/** One address per answer: an empty ?q= is the same list as no ?q= at all. */
export function normalizeUrl(href, base) {
  try {
    const u = new URL(href, base || (typeof location !== 'undefined' ? location.href : 'http://x'));
    if (u.searchParams.has('q') && !u.searchParams.get('q')) u.searchParams.delete('q');
    u.hash = '';
    return u.href;
  } catch { return String(href); }
}
