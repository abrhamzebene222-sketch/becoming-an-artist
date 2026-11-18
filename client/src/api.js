import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import { getLang, translate } from './i18n/index.jsx';

const TOKEN_KEY = 'baa_token';
// Empty for the website (same server). For the Android app: your Render URL, set in client/.env.android
export const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export function getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } }

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { 'Accept-Language': getLang() };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch(`${API_BASE}/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  } catch {
    throw new Error(translate('course.connection'));
  }
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) {
    const err = new Error(data?.error || `Error ${res.status}`);
    err.status = res.status; err.code = data?.code;
    throw err;
  }
  return data;
}

/** Small hook for GET requests. Pass null as path to skip. */
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const load = useCallback(() => {
    if (!path) { setState({ data: null, error: null, loading: false }); return; }
    setState((s) => ({ ...s, loading: true }));
    api(path).then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = guest
  const refresh = useCallback(() => {
    if (!getToken()) { setUser(null); return Promise.resolve(null); }
    // Role always comes fresh from the server, so a role changed in MongoDB applies on reload
    return api('/auth/me').then((u) => { setUser(u); return u; })
      .catch((e) => { if (e.status === 401) { setToken(null); setUser(null); } else setUser(null); return null; });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const signIn = async (mode, payload) => {
    // Sign-ups that came through a shared referral link (?ref=CODE&c=CAMPAIGN) count toward the sharer's milestone
    const ref = mode === 'register' ? readReferral() : null;
    const body = ref ? { ...payload, ref: ref.ref, refCampaign: ref.c } : payload;
    const { token, user: u } = await api(`/auth/${mode}`, { method: 'POST', body });
    if (ref) clearReferral();
    setToken(token);
    setUser(u);
    return u;
  };
  const signOut = () => {
    setToken(null); setUser(null);
    // Forget this user's cached lessons/API answers on a shared device (images stay cached)
    try { navigator.serviceWorker?.controller?.postMessage({ type: 'clear-private' }); } catch { /* no SW */ }
  };
  return createElement(AuthCtx.Provider, { value: { user, signIn, signOut, refresh, isAdmin: user?.role === 'admin' } }, children);
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
