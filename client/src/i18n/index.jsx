// Lightweight built-in translation system (no external packages).
// Amharic is the default; the choice is remembered on this device.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';
import am from './am.js';

const DICTS = { en, am };
const KEY = 'baa_lang';

function readStored() {
  try { const v = localStorage.getItem(KEY); return v === 'en' || v === 'am' ? v : null; } catch { return null; }
}

let current = readStored() || 'am';
export const getLang = () => current;

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), dict);

/** translate('dash.greeting', { name: 'Selam' }) — works outside React too (uses the current language). */
export function translate(key, params, lang = current) {
  let s = lookup(DICTS[lang], key);
  if (typeof s !== 'string') s = lookup(DICTS.en, key);
  if (typeof s !== 'string') return key;
  return params ? s.replace(/\{(\w+)\}/g, (m, p) => (params[p] ?? m)) : s;
}

/** Pick the Amharic version of a field when available: loc(course, 'title') → course.titleAm or course.title */
export const loc = (obj, field, lang = current) => (lang === 'am' && obj?.[`${field}Am`]) || obj?.[field] || '';

const LangCtx = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(current);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const setLang = useCallback((l) => {
    current = l;
    try { localStorage.setItem(KEY, l); } catch { /* private mode */ }
    setLangState(l);
  }, []);
  const value = useMemo(() => ({
    lang,
    setLang,
    toggle: () => setLang(lang === 'am' ? 'en' : 'am'),
    t: (key, params) => translate(key, params, lang),
    loc: (obj, field) => loc(obj, field, lang),
  }), [lang, setLang]);
  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useI18n = () => useContext(LangCtx);
