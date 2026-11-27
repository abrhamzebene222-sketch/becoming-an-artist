import { createContext, createElement, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { getLang, translate } from './i18n/index.jsx';
import { getDeviceId } from './lib/device.js';
import { cacheRule, isInstant, normalizeUrl } from './lib/cachePolicy.js';

const TOKEN_KEY = 'baa_token';
// Empty for the website (same server). For the Android app: your Render URL, set in client/.env.android
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setToken(t) {
  const before = cacheScope();
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  // Sign-out, an expired/revoked login or a different account: nothing private may stay on the phone
  if (!t || cacheScope() !== before) forgetPrivate();
}

// ---------- Saved data (stale-while-revalidate) ----------
// The service worker keeps the answers on the phone (client/public/sw.js); this file keeps a small in-memory copy
// so a page you already visited opens with no loading flash, and listens for "this answer changed" messages.
export const SYNC_PREFIX = 'baa_sync:'; // pre-sync bookkeeping (lib/presync.js) — private, removed with the rest

/** Whose answers these are: the user id inside the login token (same rule as the service worker), or 'guest'. */
let scopeMemo = { token: null, scope: 'guest' };
export function cacheScope() {
  const t = getToken();
  if (!t) return 'guest';
  if (scopeMemo.token === t) return scopeMemo.scope;
  let scope = 'guest';
  try {
    const b = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const sub = JSON.parse(atob(b + '==='.slice((b.length + 3) % 4))).sub;
    if (/^[0-9a-zA-Z]{8,40}$/.test(String(sub))) scope = String(sub);
  } catch { /* not a token we understand → treated like a guest */ }
  scopeMemo = { token: t, scope };
  return scope;
}

export function tellServiceWorker(message) {
  try { navigator.serviceWorker?.controller?.postMessage(message); } catch { /* no service worker */ }
}

const MEM_MAX = 80;
const mem = new Map(); // `${scope}|${address}` → { data, json }   (shared answers use the scope "public")
const addressOf = (path) => normalizeUrl(`${API_BASE}/api${path}`);
const memKey = (path) => `${cacheRule(path)?.kind === 'public' ? 'public' : cacheScope()}|${addressOf(path)}`;
const memGet = (key) => { const hit = mem.get(key); if (hit) { mem.delete(key); mem.set(key, hit); } return hit || null; };
function memSet(key, data, json) {
  mem.delete(key); mem.set(key, { data, json });
  while (mem.size > MEM_MAX) mem.delete(mem.keys().next().value);
}
const memDropAddress = (address) => { for (const k of [...mem.keys()]) if (k.endsWith(`|${address}`)) mem.delete(k); };

/** Everything private that was saved for the signed-in user: memory, pre-sync notes and the service worker's per-user caches. */
function forgetPrivate() {
  for (const k of [...mem.keys()]) if (!k.startsWith('public|')) mem.delete(k);
  try { Object.keys(localStorage).filter((k) => k.startsWith(SYNC_PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
  tellServiceWorker({ type: 'clear-private' });
}

// Messages from the service worker: { type: 'baa-api', event: 'updated' | 'invalid', url }
const apiListeners = new Set();
let swBound = false;
function bindServiceWorker() {
  if (swBound || typeof navigator === 'undefined' || !navigator.serviceWorker) return;
  swBound = true;
  navigator.serviceWorker.addEventListener('message', (e) => {
    if (e.data?.type !== 'baa-api') return;
    memDropAddress(e.data.url);
    apiListeners.forEach((fn) => fn(e.data));
  });
}
function onApiEvent(fn) { bindServiceWorker(); apiListeners.add(fn); return () => apiListeners.delete(fn); }

// cache: 'no-cache' = ask the server first (after a purchase…); 'force-cache' = the saved copy only (used right after the service worker says it changed)
export async function api(path, { method = 'GET', body, form, cache } = {}) {
  const headers = { 'Accept-Language': getLang() };
  headers['X-Device-Id'] = await getDeviceId();
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined), ...(cache ? { cache } : {}) });
  } catch {
    throw new Error(translate('course.connection'));
  }
  const ct = res.headers.get('content-type') || '';
  if (res.ok && ct.includes('text/html')) throw new Error(translate('course.connection'));
  const data = ct.includes('json') ? await res.json() : null;
  if (!res.ok) {
    const err = new Error(data?.error || `Error ${res.status}`);
    err.status = res.status; err.code = data?.code; err.data = data;
    throw err;
  }
  return data;
}

/**
 * Small hook for GET requests. Pass null as path to skip.
 * Catalog, courses, lessons, news… (see lib/cachePolicy.js) open INSTANTLY from the copy saved on the phone, then refresh
 * in the background and change the screen only if something is different (stale-while-revalidate).
 * reload() always asks the server first (use it after a purchase). Other paths behave exactly as before.
 */
export function useApi(path, deps = []) {
  const instant = !!path && isInstant(path);
  const [state, setState] = useState(() => {
    const hit = instant ? memGet(memKey(path)) : null;
    return { data: hit ? hit.data : null, error: null, loading: !!path && !hit };
  });
  const shown = useRef({ path: null, json: '' }); // what is on screen right now
  const seq = useRef(0);                           // only the newest answer may change the screen

  const pull = useCallback((fresh, cache) => {
    const key = memKey(path);
    const id = ++seq.current;
    return api(path, cache ? { cache } : fresh ? { cache: 'no-cache' } : {}).then((data) => {
      if (id !== seq.current) return;
      const json = JSON.stringify(data);
      if (instant && (key.startsWith('public|') || key.startsWith(`${cacheScope()}|`))) memSet(key, data, json); // never store after the login changed
      if (shown.current.path === path && shown.current.json === json) { // nothing new → leave the screen alone
        setState((s) => (s.loading || s.error ? { data: s.data, error: null, loading: false } : s));
        return;
      }
      shown.current = { path, json };
      setState({ data, error: null, loading: false });
    }).catch((error) => {
      if (id !== seq.current) return;
      setState((s) => {
        // Offline or a server hiccup behind a saved copy → keep showing the copy. Access lost (401/403/404) → show the error.
        if (instant && s.data !== null && shown.current.path === path && ![401, 403, 404].includes(error.status)) return s.loading ? { ...s, loading: false } : s;
        mem.delete(key);
        shown.current = { path: null, json: '' };
        return { data: null, error, loading: false };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, instant]);

  const load = useCallback((fresh = false) => {
    if (!path) { shown.current = { path: null, json: '' }; setState({ data: null, error: null, loading: false }); return; }
    const hit = instant && !fresh ? memGet(memKey(path)) : null;
    if (hit) {
      if (!(shown.current.path === path && shown.current.json === hit.json)) {
        shown.current = { path, json: hit.json };
        setState({ data: hit.data, error: null, loading: false });
      }
    } else {
      // with a copy of THIS page already on screen, a reload refreshes quietly instead of flashing "loading"
      setState((s) => ({ ...s, error: null, loading: !(instant && s.data !== null && shown.current.path === path) }));
    }
    pull(fresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, instant, pull, ...deps]);
  useEffect(() => { load(false); }, [load]);

  // The service worker finished refreshing this answer in the background: read the new copy, update only if it differs
  useEffect(() => {
    if (!instant) return undefined;
    const address = addressOf(path);
    return onApiEvent((ev) => {
      if (ev.url !== address) return;
      if (ev.event === 'updated') pull(false, 'force-cache');
      else pull(true); // 'invalid': the server no longer allows it (or it was removed) → ask and show the real answer
    });
  }, [path, instant, pull]);

  const reload = useCallback(() => load(true), [load]);
  return { ...state, reload };
}

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = guest
  const refresh = useCallback(() => {
    if (!getToken()) { tellServiceWorker({ type: 'clear-private' }); setUser(null); return Promise.resolve(null); } // a guest: nothing private may be left from an earlier user
    // Role always comes fresh from the server, so a role changed in MongoDB applies on reload
    return api('/auth/me').then((u) => { setUser(u); return u; })
      .catch((e) => { if (e.status === 401) { setToken(null); setUser(null); } else setUser(null); return null; });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const signIn = async (mode, payload) => {
    // Sign-ups that came through a shared referral link (?ref=CODE&c=CAMPAIGN) count toward the sharer's milestone
    const ref = mode === 'register' ? readReferral() : null;
    const body = { ...(ref ? { ...payload, ref: ref.ref, refCampaign: ref.c } : payload), deviceId: await getDeviceId() };
    const { token, user: u } = await api(`/auth/${mode}`, { method: 'POST', body });
    if (ref) clearReferral();
    setToken(token);
    setUser(u);
    return u;
  };
  /** Device lock: ask for an email code to move the account to this device (step 1), then confirm it (step 2). */
  const requestDeviceChange = async ({ email, password }) =>
    api('/auth/device/request-change', { method: 'POST', body: { email, password, deviceId: await getDeviceId() } });
  const confirmDeviceChange = async ({ email, password, code }) => {
    const { token, user: u } = await api('/auth/device/verify-change', { method: 'POST', body: { email, password, code, deviceId: await getDeviceId() } });
    setToken(token); setUser(u);
    return u;
  };
  const signOut = () => {
    // setToken(null) also forgets this user's saved lessons/answers (memory + service worker) on a shared device; public images stay cached
    setToken(null); setUser(null);
  };
  return createElement(AuthCtx.Provider, { value: { user, signIn, requestDeviceChange, confirmDeviceChange, signOut, refresh, isAdmin: user?.role === 'admin' } }, children);
}

export const etb = (n) => `${Number(n || 0).toLocaleString('en-US')} ${translate('common.birr')}`;

export function fmtDate(d, withTime = true) {
  if (!d) return '';
  const date = new Date(d);
  const locale = getLang() === 'am' ? 'am-ET' : 'en-GB';
  return date.toLocaleString(locale, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}

// ---------- Referral link capture (?ref=CODE&c=CAMPAIGN) ----------
const REF_KEY = 'baa_ref';
export function captureReferral() {
  try {
    const p = new URLSearchParams(window.location.search);
    const ref = p.get('ref');
    const c = p.get('c');
    if (ref && c && /^[A-Za-z0-9]{4,16}$/.test(ref) && /^[A-Za-z0-9]{4,16}$/.test(c)) {
      localStorage.setItem(REF_KEY, JSON.stringify({ ref, c, at: Date.now() }));
    }
  } catch { /* ignore */ }
}
function readReferral() {
  try {
    const v = JSON.parse(localStorage.getItem(REF_KEY) || 'null');
    return v && Date.now() - v.at < 30 * 864e5 ? v : null;
  } catch { return null; }
}
function clearReferral() { try { localStorage.removeItem(REF_KEY); } catch { /* ignore */ } }

/**
 * Upload an image through our server to the chosen Cloudinary account.
 * replace = the old media object → overwritten (same account) or deleted (other account) automatically.
 */
export function uploadImage(file, { account = 'primary', folder = 'misc', replace } = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('account', account);
  form.append('folder', folder);
  if (replace?.publicId) {
    form.append('replacePublicId', replace.publicId);
    form.append('replaceAccount', replace.account || 'env');
  }
  return api('/admin/media/upload', { method: 'POST', form });
}

/** Optimised Cloudinary delivery URL (adds f_auto,q_auto and a width limit). Leaves other URLs untouched. */
export function cdn(url, width = 1600) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}
