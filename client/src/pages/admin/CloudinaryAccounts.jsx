import { useState } from 'react';
import { api, useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import { refreshCloudAccounts } from '../../components/ImageUploader.jsx';
import Icon from '../../components/Icon.jsx';

const EMPTY = { label: '', cloudName: '', apiKey: '', apiSecret: '', folder: '', role: 'extra', isActive: true };

// Add / update / remove Cloudinary accounts after deployment — no code changes. Secrets are encrypted on the server.
export default function CloudinaryAccounts() {
  const { t } = useI18n();
  const list = useApi('/admin/cloudinary-accounts');
  const [form, setForm] = useState(null); // EMPTY or account being edited
  const [msg, setMsg] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const reload = () => { refreshCloudAccounts(); list.reload(); };
  const save = async (e) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (form.id) await api(`/admin/cloudinary-accounts/${form.id}`, { method: 'PUT', body: form });
      else await api('/admin/cloudinary-accounts', { method: 'POST', body: form });
      setForm(null); reload();
    } catch (e2) { setErr(e2.message); }
    setBusy(false);
  };
  const test = async (a) => {
    setMsg((m) => ({ ...m, [a.id]: '…' }));
    const r = await api(`/admin/cloudinary-accounts/${a.id}/test`, { method: 'POST' }).catch((e) => ({ ok: false, error: e.message }));
    setMsg((m) => ({ ...m, [a.id]: r.ok ? `✓ ${t('cloud.testOk')}` : `✕ ${r.error}` }));
  };
  const remove = async (a) => {
    if (!window.confirm(t('cloud.deleteConfirm', { name: a.label }))) return;
    try { await api(`/admin/cloudinary-accounts/${a.id}`, { method: 'DELETE' }); reload(); } catch (e) { setMsg((m) => ({ ...m, [a.id]: e.message })); }
  };
  const quick = async (a, patch) => { await api(`/admin/cloudinary-accounts/${a.id}`, { method: 'PUT', body: patch }); reload(); };
  const f = (k) => ({ value: form[k] ?? '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{t('cloud.title')}</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">{t('cloud.text')}</p>
        </div>
        {!form && <button className="btn-primary" onClick={() => { setErr(''); setForm(EMPTY); }}><Icon name="plus" size={16} />{t('cloud.add')}</button>}
      </div>

      {form && (
        <form onSubmit={save} className="card p-6 grid md:grid-cols-2 gap-4">
          <label className="label">{t('cloud.label')}<input className="input" required {...f('label')} /></label>
          <label className="label">{t('cloud.cloudName')}<input className="input font-mono" required {...f('cloudName')} autoComplete="off" /></label>
          <label className="label">{t('cloud.apiKey')}<input className="input font-mono" required {...f('apiKey')} autoComplete="off" /></label>
          <label className="label">{t('cloud.apiSecret')}
            <input className="input font-mono" type="password" required={!form.id} {...f('apiSecret')} autoComplete="new-password" placeholder={form.id ? t('cloud.keepSecret') : ''} />
          </label>
          <label className="label">{t('cloud.folder')}<input className="input font-mono" {...f('folder')} placeholder="becoming-an-artist" /></label>
          <label className="label">{t('cloud.role')}
            <select className="input" {...f('role')}>
              {['primary', 'secondary', 'extra'].map((r) => <option key={r} value={r}>{t(`cloud.roles.${r}`)}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" className="accent-teal w-4 h-4" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />{t('cloud.active')}</label>
          {err && <p className="text-sm text-[#F2A7A0] md:col-span-2" role="alert">{err}</p>}
          <div className="flex gap-3 md:col-span-2">
            <button className="btn-primary" disabled={busy}>{busy ? t('common.sending') : t('cloud.save')}</button>
            <button type="button" className="btn-ghost" onClick={() => setForm(null)}>{t('cloud.cancel')}</button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        {list.data?.map((a) => (
          <article key={a.id} className={`card p-5 flex flex-col gap-3 ${a.role === 'primary' ? 'border-teal' : ''} ${!a.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-semibold flex items-center gap-2"><Icon name="cloud" />{a.label}</h2>
                <p className="text-xs text-muted font-mono mt-1 break-all">{a.cloudName} · {a.apiKey} · {a.apiSecret}</p>
                {a.fromEnv && <p className="text-xs text-muted-dim mt-1">{t('cloud.fromEnv')}</p>}
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${a.role === 'primary' ? 'bg-teal text-[#0B1312]' : a.role === 'secondary' ? 'bg-teal-active text-mint' : 'bg-line text-muted-soft'}`}>{t(`cloud.roles.${a.role}`)}</span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <button className="btn-ghost py-2 px-3 text-xs" onClick={() => test(a)}>{t('cloud.test')}</button>
              {!a.fromEnv && (
                <>
                  {a.role !== 'primary' && <button className="btn-ghost py-2 px-3 text-xs" onClick={() => quick(a, { role: 'primary' })}>→ {t('cloud.roles.primary')}</button>}
                  {a.role !== 'secondary' && <button className="btn-ghost py-2 px-3 text-xs" onClick={() => quick(a, { role: 'secondary' })}>→ {t('cloud.roles.secondary')}</button>}
                  <button className="btn-ghost py-2 px-3 text-xs" onClick={() => { setErr(''); setForm({ ...a, apiSecret: '' }); }}>{t('cloud.edit')}</button>
                  <button className="btn-danger py-2 px-3 text-xs" onClick={() => remove(a)}>{t('common.remove')}</button>
                </>
              )}
            </div>
            {msg[a.id] && <p className="text-xs text-muted-soft" role="status">{msg[a.id]}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
