import { createContext, createElement, useCallback, useContext, useEffect, useState } from 'react';
import { getLang, translate } from './i18n/index.jsx';

const TOKEN_KEY = 'baa_token';
// Set directly to the Render backend URL for the Android app and website
export const API_BASE = 'https://becoming-an-artist.onrender.com';

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
    const { token, user: u } = await api(`/auth/${mode}`, { method: 'POST', body: payload });
    setToken(token);
    setUser(u);
    return u;
  };
  const signOut = () => { setToken(null); setUser(null); };
  return createElement(AuthCtx.Provider, { value: { user, signIn, signOut, refresh, isAdmin: user?.role === 'admin' } }, children);
}

export const etb = (n) => `${Number(n || 0).toLocaleString('en-US')} ${translate('common.birr')}`;

export function fmtDate(d, withTime = true) {
  if (!d) return '';
  const date = new Date(d);
  const locale = getLang() === 'am' ? 'am-ET' : 'en-GB';
  return date.toLocaleString(locale, withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
}