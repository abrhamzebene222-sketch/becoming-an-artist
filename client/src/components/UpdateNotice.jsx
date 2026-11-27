import { useEffect, useState } from 'react';
import { App as CapApp } from '@capacitor/app';
import { api } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';
import { installedVersion, dismissedCode, dismissCode } from '../lib/appVersion.js';

/**
 * "New update available" card for the student pages (mounted once in Layout).
 *  • Shown only in the installed app, when the server's newest version code is higher than the installed one.
 *  • Update opens the Telegram post with the APK. Normal updates can be dismissed (remembered until a newer version);
 *    a mandatory update has no dismiss button.
 *  • Offline or any error: nothing is shown and nothing is reported.
 */
export default function UpdateNotice() {
  const { t, loc } = useI18n();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let off = false;
    let handle;
    const check = async () => {
      try {
        const me = await installedVersion();
        if (!me || off) return;
        const v = await api(`/app-version?code=${me.code}`, { cache: 'no-cache' });
        if (off) return;
        if (!v?.versionCode || !v.url || v.versionCode <= me.code) { setInfo(null); return; }
        if (!v.mandatory && dismissedCode() >= v.versionCode) { setInfo(null); return; }
        setInfo(v);
      } catch { /* offline or server hiccup: stay silent */ }
    };
    check();
    window.addEventListener('online', check);
    CapApp.addListener('appStateChange', (s) => { if (s.isActive) check(); })
      .then((h) => { if (off) h.remove(); else handle = h; }).catch(() => {});
    return () => { off = true; window.removeEventListener('online', check); if (handle) handle.remove(); };
  }, []);

  if (!info) return null;
  const notes = loc(info, 'notes');
  return (
    <section className="card p-4 mb-4 flex flex-col gap-3 border-teal" role="status" aria-label={t('update.title')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">{info.mandatory ? t('update.required') : t('update.new')}</span>
          <h2 className="text-lg font-semibold mt-0.5">{t('update.title')} · {info.versionName}</h2>
        </div>
        {!info.mandatory && (
          <button type="button" aria-label={t('update.dismiss')} onClick={() => { dismissCode(info.versionCode); setInfo(null); }}
            className="w-11 h-11 -m-2 shrink-0 grid place-items-center text-muted"><Icon name="x" /></button>
        )}
      </div>
      {notes && <p className="text-sm text-muted-soft leading-relaxed whitespace-pre-line">{notes}</p>}
      <div>
        <a href={info.url} target="_blank" rel="noreferrer" className="btn-primary py-2.5 px-4 text-sm">{t('update.button')}</a>
      </div>
    </section>
  );
}
