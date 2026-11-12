import { useEffect, useState } from 'react';
import { api, useApi, etb } from '../../api.js';

const KINDS = ['email', 'phone', 'telegram', 'address', 'website', 'other'];
const LINK_KINDS = [['telegram', 'Telegram'], ['email', 'Email'], ['google_form', 'Google Form'], ['other', 'Other']];

export default function Settings() {
  const data = useApi('/admin/settings');
  const [s, setS] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [links, setLinks] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!data.data) return;
    setS(data.data.settings); setContacts(data.data.contacts); setLinks(data.data.submissionLinks);
  }, [data.data]);

  if (!s) return <p className="text-muted">Loading…</p>;
  const p = data.data.pricing;
  const previewMonthly = Number(s.subscription_fixed_price_etb) > 0
    ? Number(s.subscription_fixed_price_etb)
    : Math.round(p.allCoursesTotal * (1 - Number(s.subscription_discount_percent || 0) / 100));

  const saveAll = async () => {
    await api('/admin/settings', { method: 'PUT', body: s });
    await api('/admin/contacts', { method: 'PUT', body: contacts });
    await api('/admin/submission-links', { method: 'PUT', body: links });
    setMsg('All changes saved.'); data.reload();
    setTimeout(() => setMsg(''), 3000);
  };
  const field = (k, label, type = 'text', ph = '') => (
    <label className="label">{label}<input type={type} className="input" value={s[k] ?? ''} placeholder={ph} onChange={(e) => setS({ ...s, [k]: e.target.value })} /></label>
  );
  const upd = (arr, setArr, i, patch) => setArr(arr.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-semibold">Settings &amp; pricing</h1><p className="text-sm text-muted mt-1">Shown to students on the dashboard, course pages and payment instructions.</p></div>
        <div className="flex items-center gap-3">{msg && <span className="text-sm text-mint" role="status">{msg}</span>}<button className="btn-primary" onClick={saveAll}>Save changes</button></div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Contact details &amp; addresses</h2>
          {contacts.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_44px] sm:grid-cols-[110px_110px_1fr_44px] gap-2">
              <select aria-label="Type" className="input py-2 hidden sm:block" value={c.kind} onChange={(e) => upd(contacts, setContacts, i, { kind: e.target.value })}>{KINDS.map((k) => <option key={k} value={k}>{k}</option>)}</select>
              <input aria-label="Label" className="input py-2" value={c.label} onChange={(e) => upd(contacts, setContacts, i, { label: e.target.value })} />
              <input aria-label="Value" className="input py-2" value={c.value} onChange={(e) => upd(contacts, setContacts, i, { value: e.target.value })} />
              <button aria-label="Remove" className="btn-ghost p-0" onClick={() => setContacts(contacts.filter((_, j) => j !== i))}>×</button>
            </div>
          ))}
          <button className="btn-ghost self-start border-dashed" onClick={() => setContacts([...contacts, { kind: 'address', label: 'Studio address', value: '' }])}>+ Add contact or address</button>
        </section>

        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Assignment submission links</h2>
          <p className="text-sm text-muted-soft">Where students send finished work for critique. Choose a default; override per course in Courses &amp; Media.</p>
          {links.map((l, i) => (
            <div key={l.id || `n${i}`} className="grid grid-cols-[120px_1fr_auto_44px] gap-2 items-center pb-3 border-b border-line last:border-0">
              <select aria-label="Kind" className="input py-2" value={l.kind} onChange={(e) => upd(links, setLinks, i, { kind: e.target.value })}>{LINK_KINDS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select>
              <input aria-label="Label" className="input py-2" value={l.label} onChange={(e) => upd(links, setLinks, i, { label: e.target.value })} />
                            <label className="flex items-center gap-1.5 text-xs text-muted"><input type="radio" name="default-link" className="accent-teal" checked={!!l.is_default} onChange={() => setLinks(links.map((x, j) => ({ ...x, is_default: j === i ? 1 : 0 })))} />Default</label>
              <button aria-label="Remove" className="btn-ghost p-0" onClick={() => setLinks(links.filter((_, j) => j !== i))}>×</button>
              <input aria-label="URL" className="input py-2 col-span-4 font-mono text-sm" value={l.url} placeholder="https://…" onChange={(e) => upd(links, setLinks, i, { url: e.target.value })} />
            </div>
          ))}
          <button className="btn-ghost self-start" onClick={() => setLinks([...links, { kind: 'google_form', label: 'Google Form', url: '', is_default: 0 }])}>+ Add link</button>
        </section>

        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Payment accounts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {field('cbe_account_name', 'CBE account name')}
            {field('cbe_account_number', 'CBE account number', 'text', '1000XXXXXXXXX')}
            {field('telebirr_name', 'Telebirr name')}
            {field('telebirr_number', 'Telebirr number')}
          </div>
        </section>

        <section className="card p-6 flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Subscription &amp; session pricing</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {field('subscription_discount_percent', 'Subscription discount %', 'number')}
            {field('subscription_fixed_price_etb', 'Fixed monthly price (0 = auto)', 'number')}
            {field('session_price_online_etb', '1-on-1 online (ETB)', 'number')}
            {field('session_price_in_person_etb', '1-on-1 in person (ETB)', 'number')}
          </div>
          <div className="bg-ink rounded-xl p-4 text-sm leading-7">
            <span className="text-muted">All published courses bought separately:</span> {etb(p.allCoursesTotal)}<br />
            <span className="text-muted">Monthly price students will see:</span> <strong className="text-teal-soft">{etb(previewMonthly)}</strong>
          </div>
        </section>
      </div>
    </div>
  );
}
