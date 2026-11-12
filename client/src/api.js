import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createElement } from 'react';

const TOKEN_KEY = 'baa_token';
// Set your live Render backend URL here for production/Android builds
export const API_BASE = (import.meta.env.VITE_API_URL || 'https://becoming-an-artist.onrender.com').replace(/\/$/, '');
export const getToken = () => localStorage.getItem(TOKEN_KEY);

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !form) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API_BASE}/api${path}`, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json() : null;
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`);
  return data;
}

/** Small hook for GET requests */
export function useApi(path, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const load = useCallback(() => {
    if (!path) return;
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
  const [user, setUser] = useState(undefined); // undefined = loading
  useEffect(() => {
    if (!getToken()) return setUser(null);
    api('/auth/me').then(setUser).catch(() => { localStorage.removeItem(TOKEN_KEY); setUser(null); });
  }, []);
  const signIn = async (mode, payload) => {
    const { token, user } = await api(`/auth/${mode}`, { method: 'POST', body: payload });
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);
    return user;
  };
  const signOut = () => { localStorage.removeItem(TOKEN_KEY); setUser(null); };
  return createElement(AuthCtx.Provider, { value: { user, signIn, signOut } }, children);
}

export const etb = (n) => `${Number(n || 0).toLocaleString('en-US')} ETB`;
export const fmtDate = (s) => new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z').toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });