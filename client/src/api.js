import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import { getLang, translate } from './i18n/index.jsx';

const TOKEN_KEY = 'baa_token';

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://becoming-an-artist.onrender.com';
  }
  return '';
};

export const API_BASE = getApiBase();

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

export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const load = useCallback(() => {
    if (!path) { setState({ data: null, error: null, loading: false }); return; }
    setState((s) => ({ ...s, loading: true }));
    api(path).then((data) => setState({ data, error: null, loading: false }))
      .catch((error) => setState({ data: null, error, loading: false }));
  }, [path, ...deps]);
  useEffect(load, [load]);
  return { ...state, reload: load };
}

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const refresh = useCallback(() => {
    if (!getToken()) { setUser(null); return Promise.resolve(null); }
    return api('/auth/me').then((u) => { setUser(u); return u; })
      .catch((e) => { if (e.status === 401) { setToken(null); setUser(null); } else setUser(null); return null; });
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  const signIn = async (mode, payload) => {
    const ref = mode === 'register' ? readReferral() : null;
    const body = ref ? { ...payload, ref: ref.ref, refCampaign: ref.c } : payload;
    const res = await api(`/auth/${mode}`, { method: 'POST', body });
    if (!res || !res.token) {
      throw new Error('ሰርቨሩ ትክክለኛ ምላሽ አልሰጠም');
    }
    const { token, user: u } = res;
    if (ref) clearReferral();
    setToken(token);
    setUser(u);
    return u;
  };
  const signOut = () => {
    setToken(null); setUser(null);
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

export function cdn(url, width = 1600) {
  if (!url || !url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,c_limit,w_${width}/`);
}