import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, useAuth } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

const USERNAME = /^@?[A-Za-z][A-Za-z0-9_]{4,31}$/;

/**
 * "Share via Telegram" with a mandatory username guard:
 *   not signed in → login page; no Telegram username on the profile → modal asks for it first;
 *   then the server returns a one-time bot link that also connects the account (two-way sync).
 * Usage: const share = useTelegramShare(); <button onClick={share.start}/> {share.modal}
 */
export default function useTelegramShare() {
  const { user, refresh } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const goToBot = async (win) => {
    const { url } = await api('/telegram/link', { method: 'POST' });
    if (win && !win.closed) win.location.href = url; else window.location.href = url;
  };

  const start = async () => {
    setErr('');
    if (!user) { navigate('/login', { state: { from: location.pathname } }); return; }
    if (!user.telegramUsername) { setName(''); setOpen(true); return; }
    const win = window.open('', '_blank'); // opened during the click, so pop-up blockers allow it
    try { await goToBot(win); } catch (e) { win?.close(); setErr(e.message); setOpen(true); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!USERNAME.test(name.trim())) { setErr(t('guard.label')); return; }
    setBusy(true); setErr('');
    const win = window.open('', '_blank');
    try {
      await api('/me/telegram', { method: 'PUT', body: { telegramUsername: name.trim() } });
      await refresh();
      await goToBot(win);
      setOpen(false);
    } catch (e2) { win?.close(); setErr(e2.message); }
    setBusy(false);
  };

  const modal = open ? (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="tg-guard-title"
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <form onSubmit={save} className="card w-full max-w-md p-6 flex flex-col gap-4 border-cyan-300/40">
        <div className="flex items-start justify-between gap-3">
          <h2 id="tg-guard-title" className="text-lg font-semibold flex items-center gap-2"><Icon name="send" />{t('guard.title')}</h2>
          <button type="button" aria-label={t('guard.cancel')} onClick={() => setOpen(false)} className="w-11 h-11 -m-2 grid place-items-center text-muted"><Icon name="x" /></button>
        </div>
        <p className="text-sm text-muted-soft">{t('guard.text')}</p>
        {user?.telegramUsername ? null : (
          <label className="label">{t('guard.label')}
            <input className="input" autoFocus required value={name} placeholder={t('guard.placeholder')} autoComplete="off"
              onChange={(e) => setName(e.target.value)} pattern="@?[A-Za-z][A-Za-z0-9_]{4,31}" />
          </label>
        )}
        {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
        <div className="flex gap-3 justify-end">
          <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>{t('guard.cancel')}</button>
          {!user?.telegramUsername && <button className="btn-primary" disabled={busy}>{busy ? t('guard.opening') : t('guard.continue')}</button>}
        </div>
      </form>
    </div>
  ) : null;

  return { start, modal };
}
