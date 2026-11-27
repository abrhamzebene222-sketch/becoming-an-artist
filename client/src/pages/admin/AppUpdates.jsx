import { useState } from 'react';
import { api, useApi, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';

const EMPTY = { versionName: '', versionCode: '', notes: '', notesAm: '', mandatory: false, telegramUrl: '', sendToChannel: false };
const BOT_LIMIT = 50 * 1000 * 1000; // Telegram Bot API upload limit (keep in sync with server/src/upload.js)
const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;

/** Admin: publish a new app version → students on an older app see "New update available". */
export default function AppUpdates() {
  const { t } = useI18n();
  const list = useApi('/admin/app-versions');
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [editId, setEditId] = useState(null);
  const [editUrl, setEditUrl] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const tooBig = !!file && file.size > BOT_LIMIT;
  const last = list.data?.[0];

  const pick = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    set({ sendToChannel: !!f && f.size <= BOT_LIMIT });
  };

  const publish = async (e) => {
    e.preventDefault(); setErr(''); setMsg(''); setBusy(true);
    try {
      const fd = new FormData();
      for (const k of ['versionName', 'versionCode', 'notes', 'notesAm', 'telegramUrl']) fd.append(k, form[k]);
      fd.append('mandatory', String(form.mandatory));
      if (file && !tooBig) { fd.append('apk', file); fd.append('sendToChannel', String(form.sendToChannel)); }
      await api('/admin/app-versions', { method: 'POST', form: fd });
      setForm(EMPTY); setFile(null); e.target.reset();
      setMsg(t('admin.appUpdates.published'));
      list.reload();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };

  const patch = async (v, body) => { await api(`/admin/app-versions/${v.id}`, { method: 'PUT', body }).catch((e2) => setErr(e2.message)); list.reload(); };
  const remove = async (v) => {
    if (!window.confirm(t('admin.appUpdates.confirmRemove'))) return;
    await api(`/admin/app-versions/${v.id}`, { method: 'DELETE' }).catch(() => {});
    list.reload();
  };
  const saveLink = async (v) => { await patch(v, { telegramUrl: editUrl }); setEditId(null); };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold">{t('admin.appUpdates.title')}</h1>
        <p className="text-sm text-muted mt-1">{t('admin.appUpdates.hint')}</p>
      </div>

      <form onSubmit={publish} className="card p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{t('admin.appUpdates.newVersion')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="label">{t('admin.appUpdates.versionName')}<input className="input" required maxLength={40} value={form.versionName} onChange={(e) => set({ versionName: e.target.value })} /></label>
          <label className="label">{t('admin.appUpdates.versionCode')}<input className="input" required type="number" min="1" step="1" inputMode="numeric" placeholder={last ? String(last.versionCode + 1) : '1'} value={form.versionCode} onChange={(e) => set({ versionCode: e.target.value })} /></label>
          <label className="label">{t('admin.appUpdates.notesEn')}<textarea className="input min-h-24" maxLength={2000} value={form.notes} onChange={(e) => set({ notes: e.target.value })} /></label>
          <label className="label">{t('admin.appUpdates.notesAm')}<textarea className="input min-h-24" lang="am" maxLength={2000} value={form.notesAm} onChange={(e) => set({ notesAm: e.target.value })} /></label>
        </div>

        <label className="label">{t('admin.appUpdates.link')}
          <input className="input" type="url" placeholder="https://t.me/…" value={form.telegramUrl} onChange={(e) => set({ telegramUrl: e.target.value })} />
          <span className="text-xs text-muted-dim font-normal">{t('admin.appUpdates.linkHint')}</span>
        </label>

        <div className="flex flex-col gap-2">
          <label className="label">{t('admin.appUpdates.apk')}
            <input className="input" type="file" accept=".apk,application/vnd.android.package-archive" onChange={pick} />
          </label>
          {file && <p className="text-xs text-muted-dim">{file.name} · {mb(file.size)}</p>}
          {tooBig && <p className="text-sm text-[#F2A7A0]" role="alert">{t('admin.appUpdates.apkTooBig')}</p>}
          {file && !tooBig && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.sendToChannel} onChange={(e) => set({ sendToChannel: e.target.checked })} /> {t('admin.appUpdates.sendToChannel')}
            </label>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.mandatory} onChange={(e) => set({ mandatory: e.target.checked })} /> {t('admin.appUpdates.mandatory')}
        </label>

        {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
        {msg && <p className="text-sm text-mint" role="status">{msg}</p>}
        <div><button className="btn-primary py-2.5" disabled={busy}>{busy ? t('admin.appUpdates.publishing') : t('admin.appUpdates.publish')}</button></div>
      </form>

      <section className="flex flex-col gap-3" aria-label={t('admin.appUpdates.list')}>
        <h2 className="text-lg font-semibold">{t('admin.appUpdates.list')}</h2>
        {list.data?.length === 0 && <div className="card p-5 text-muted-soft">{t('admin.appUpdates.empty')}</div>}
        {list.data?.map((v) => (
          <article key={v.id} className="card p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium break-words">{v.versionName} <span className="text-muted font-normal">· #{v.versionCode}</span>{v.mandatory && <span className="ml-2 text-xs text-[#F2A7A0]">{t('admin.appUpdates.required')}</span>}</p>
                <p className="text-xs text-muted-dim mt-0.5">
                  {fmtDate(v.createdAt, false)}
                  {v.apkName ? ` · ${v.apkName} (${mb(v.apkSize)})` : ''}
                  {v.channelStatus === 'sent' ? ` · ${t('admin.appUpdates.sent')}` : ''}
                  {v.channelStatus === 'failed' ? ` · ${t('admin.appUpdates.failed')}${v.channelError ? `: ${v.channelError}` : ''}` : ''}
                  {v.channelStatus === 'too_big' ? ` · ${t('admin.appUpdates.tooBig')}` : ''}
                </p>
                {v.telegramUrl && <a href={v.telegramUrl} target="_blank" rel="noreferrer" className="text-xs break-all">{v.telegramUrl}</a>}
                {v.needsLink && <p className="text-xs text-[#F2A7A0] mt-1">{t('admin.appUpdates.needsLink')}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className="px-3 py-2 rounded-lg text-xs border border-line-strong text-muted" aria-pressed={v.isActive} onClick={() => patch(v, { isActive: !v.isActive })}>{v.isActive ? t('admin.appUpdates.visible') : t('admin.appUpdates.hidden')}</button>
                <button type="button" className="px-3 py-2 rounded-lg text-xs border border-line-strong text-mint" onClick={() => { setEditId(v.id); setEditUrl(v.telegramUrl); }}>{t('admin.appUpdates.edit')}</button>
                <button type="button" className="px-3 py-2 rounded-lg text-xs border border-[#5A3A37] text-[#F2A7A0]" onClick={() => remove(v)}>{t('admin.appUpdates.remove')}</button>
              </div>
            </div>
            {editId === v.id && (
              <div className="flex flex-wrap gap-2 items-center">
                <input className="input flex-1 min-w-48" type="url" placeholder="https://t.me/…" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} />
                <button type="button" className="btn-primary py-2 px-3 text-sm" onClick={() => saveLink(v)}>{t('admin.appUpdates.saveLink')}</button>
                <button type="button" className="btn-ghost py-2 px-3 text-sm" onClick={() => setEditId(null)}>{t('admin.appUpdates.cancel')}</button>
              </div>
            )}
          </article>
        ))}
      </section>
    </div>
  );
}
