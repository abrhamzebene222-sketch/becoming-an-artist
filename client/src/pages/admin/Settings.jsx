import { useEffect, useState } from 'react';
import { api, useApi, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';

const KINDS = ['email', 'phone', 'telegram', 'address', 'website', 'other'];
const LINK_KINDS = ['telegram', 'email', 'google_form', 'other'];

export default function Settings() {
  const { t } = useI18n();
  const data = useApi('/admin/settings');
  const [s, setS] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [links, setLinks] = useState([]);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!data.data) return;
    setS(data.data.settings); setContacts(data.data.contacts); setLinks(data.data.submissionLinks);
  }, [data.data]);

  if (!s) return <p className="text-muted">{t('common.loading')}</p>;
  const p = data.data.pricing;
  const previewMonthly = Number(s.subscriptionFixedPriceEtb) > 0
    ? Number(s.subscriptionFixedPriceEtb)
    : Math.round(p.allCoursesTotal * (1 - Number(s.subscriptionDiscountPercent || 0) / 100));

  const saveAll = async () => {
    setErr('');
    try {
      await api('/admin/settings', { method: 'PUT', body: s });
      await api('/admin/contacts', { method: 'PUT', body: contacts });
      await api('/admin/submission-links', { method: 'PUT', body: links });
      setMsg(t('admin.settings.saved')); data.reload();
      setTimeout(() => setMsg(''), 3000);
    } catch (e) { setErr(e.message); }
  };
  const field = (k, label, type = 'text', ph = '') => (
    <label className="label">{label}<input type={type} className="input" value={s[k] ?? ''} placeholder={ph} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>
  );
  const upd = (arr, setArr, i, patch) => setArr(arr.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold">{t('admin.settings.title')}</h1><p className="text-sm text-muted mt-1">{t('admin.settings.subtitle')}</p></div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-mint" role="status">{msg}</span>}
          {err && <span className="text-sm text-[#F2A7A0]" role="alert">{err}</span>}
          <button className="btn-primary" onClick={saveAll}>{t('admin.settings.save')}</button>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('admin.settings.contacts')}</h2>
          {contacts.map((c, i) => (
            <div key={c.id || `n${i}`} className="grid grid-cols-[1fr_44px] sm:grid-cols-[120px_110px_1fr_44px] gap-2">
              <select aria-label={t('admin.settings.kinds.other')} className="input py-2 hidden sm:block" value={c.kind} onChange={(e) => upd(contacts, setContacts, i, { kind: e.target.value })}>
                {KINDS.map((k) => <option key={k} value={k}>{t(`admin.settings.kinds.${k}`)}</option>)}
              </select>
              <input aria-label={t('admin.settings.label')} className="input py-2 hidden sm:block" value={c.label || ''} onChange={(e) => upd(contacts, setContacts, i, { label: e.target.value })} />
              <input aria-label={t('admin.settings.value')} className="input py-2" value={c.value} onChange={(e) => upd(contacts, setContacts, i, { value: e.target.value })} />
              <button aria-label={t('common.remove')} className="btn-ghost p-0" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="btn-ghost self-start border-dashed" onClick={() => setContacts([...contacts, { kind: 'address', label: 'Address', value: '' }])}>{t('admin.settings.addContact')}</button>
        </section>

        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('admin.settings.links')}</h2>
          <p className="text-sm text-muted-soft">{t('admin.settings.linksText')}</p>
          {links.map((l, i) => (
            <div key={l.id || `n${i}`} className="grid grid-cols-[130px_1fr_auto_44px] gap-2 items-center pb-3 border-b border-line last:border-0">
              <select aria-label={t('admin.settings.label')} className="input py-2" value={l.kind} onChange={(e) => upd(links, setLinks, i, { kind: e.target.value })}>
                {LINK_KINDS.map((k) => <option key={k} value={k}>{t(`admin.settings.linkKinds.${k}`)}</option>)}
              </select>
              <input aria-label={t('admin.settings.label')} className="input py-2" value={l.label || ''} onChange={(e) => upd(links, setLinks, i, { label: e.target.value })} />
              <label className="flex items-center gap-1.5 text-xs text-muted"><input type="radio" name="default-link" className="accent-teal" checked={!!l.isDefault}
                onChange={() => setLinks(links.map((x, j) => ({ ...x, isDefault: j === i })))} />{t('admin.settings.default')}</label>
              <button aria-label={t('common.remove')} className="btn-ghost p-0" onClick={() => setLinks(links.filter((_, j) => j !== i))}>×</button>
              <input aria-label={t('admin.settings.url')} className="input py-2 col-span-4 font-mono text-sm" value={l.url} placeholder="https://…" onChange={(e) => upd(links, setLinks, i, { url: e.target.value })} />
            </div>
          ))}
          <button className="btn-ghost self-start" onClick={() => setLinks([...links, { kind: 'google_form', label: 'Google Form', url: '', isDefault: false }])}>{t('admin.settings.addLink')}</button>
        </section>

        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('admin.settings.accounts')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {field('cbeAccountName', t('admin.settings.cbeName'))}
            {field('cbeAccountNumber', t('admin.settings.cbeNumber'), 'text', '1000XXXXXXXXX')}
            {field('telebirrName', t('admin.settings.tbName'))}
            {field('telebirrNumber', t('admin.settings.tbNumber'))}
          </div>
        </section>

        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('admin.settings.pricingTitle')}</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {field('subscriptionDiscountPercent', t('admin.settings.discount'), 'number')}
            {field('subscriptionFixedPriceEtb', t('admin.settings.fixed'), 'number')}
            {field('sessionPriceOnlineEtb', t('admin.settings.sessionOnline'), 'number')}
            {field('sessionPriceInPersonEtb', t('admin.settings.sessionInPerson'), 'number')}
          </div>
          <div className="bg-ink rounded-xl p-4 text-sm leading-7">
            <span className="text-muted">{t('admin.settings.allSeparately')}</span> {etb(p.allCoursesTotal)}<br />
            <span className="text-muted">{t('admin.settings.monthlyStudents')}</span> <strong className="text-teal-soft">{etb(previewMonthly)}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
