// Lightweight built-in translation system (no external packages).
// Amharic is the default; the choice is remembered on this device.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import en from './en.js';
import am from './am.js';
import { en as tutoringEn, am as tutoringAm } from './tutoring.js';
import { en as blocksEn, am as blocksAm } from './blocksExtra.js';
import { en as tokensEn, am as tokensAm } from './tokensExtra.js';
import { en as stepsEn, am as stepsAm } from './stepsExtra.js';
import { en as selfEvalEn, am as selfEvalAm } from './selfEvalExtra.js';
import { en as newsEn, am as newsAm } from './newsExtra.js';
import { en as exportEn, am as exportAm } from './exportExtra.js';
import { en as creditEn, am as creditAm } from './creditExtra.js';
import { en as deviceEn, am as deviceAm } from './deviceExtra.js';
import { en as deleteEn, am as deleteAm } from './deleteExtra.js';
import { en as updateEn, am as updateAm } from './updateExtra.js';

// Merge extra string files on top of the main dictionaries (nested objects are merged, not replaced).
function merge(base, extra) {
  const out = { ...base };
  for (const k of Object.keys(extra)) {
    out[k] = out[k] && typeof out[k] === 'object' && typeof extra[k] === 'object' ? merge(out[k], extra[k]) : extra[k];
  }
  return out;
}

const DICTS = {
  en: [tutoringEn, blocksEn, tokensEn, stepsEn, selfEvalEn, newsEn, exportEn, creditEn, deviceEn, deleteEn, updateEn].reduce(merge, en),
  am: [tutoringAm, blocksAm, tokensAm, stepsAm, selfEvalAm, newsAm, exportAm, creditAm, deviceAm, deleteAm, updateAm].reduce(merge, am),
};
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
