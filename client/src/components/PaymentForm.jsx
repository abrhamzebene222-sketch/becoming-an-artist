import { useState } from 'react';
import { api, etb, useApi } from '../api.js';

/**
 * CBE / Telebirr manual payment: pick method → see amount & account → upload screenshot + reference ID.
 * purpose: 'course' | 'subscription' | 'session'
 */
export default function PaymentForm({ purpose, amount, courseId, bookingId, onDone }) {
  const accounts = useApi('/payment-accounts');
  const [method, setMethod] = useState('CBE');
  const [ref, setRef] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const acct = accounts.data?.[method];

  const pickFile = (f) => { setFile(f); setPreview(f ? URL.createObjectURL(f) : null); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const form = new FormData();
    form.append('purpose', purpose);
    form.append('method', method);
    form.append('referenceId', ref);
    if (courseId) form.append('courseId', courseId);
    if (bookingId) form.append('bookingId', bookingId);
    form.append('screenshot', file);
    try {
      await api('/payments', { method: 'POST', form });
      setMsg({ ok: true, text: 'Submitted! The instructor will verify your payment and you will be notified.' });
      onDone?.();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
    setBusy(false);
  };

  if (!amount) return <p className="text-sm text-muted">Price coming soon — contact the instructor.</p>;
  if (msg?.ok) return <p className="rounded-xl bg-teal-active p-4 text-mint text-sm" role="status">{msg.text}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-sm text-muted mb-2">Payment method</legend>
        <div className="grid grid-cols-2 gap-3">
          {[['CBE', 'CBE'], ['TELEBIRR', 'Telebirr']].map(([v, l]) => (
            <label key={v} className={`flex items-center gap-2.5 p-3.5 rounded-xl cursor-pointer border ${method === v ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
              <input type="radio" name="method" value={v} checked={method === v} onChange={() => setMethod(v)} className="accent-teal" />{l}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="rounded-xl bg-ink p-4 text-sm leading-7">
        <span className="text-muted">Transfer exactly</span> <strong className="text-white">{etb(amount)}</strong><br />
        <span className="text-muted">Account name:</span> {acct?.name || '—'}<br />
        <span className="text-muted">{method === 'CBE' ? 'CBE account no.' : 'Telebirr number'}:</span> {acct?.number || '—'}
      </div>
      <label className="label">Transaction reference ID
        <input className="input" required value={ref} onChange={(e) => setRef(e.target.value)} placeholder={method === 'CBE' ? 'e.g. FT26315XXXXX' : 'e.g. CJ81XXXXXX'} />
      </label>
      <label className="label">Payment screenshot
        <input type="file" accept="image/png,image/jpeg,image/webp" required onChange={(e) => pickFile(e.target.files[0])}
          className="text-sm text-muted-soft file:btn-ghost file:mr-3 file:py-2" />
      </label>
      {preview && <img src={preview} alt="Receipt preview" className="max-h-48 rounded-xl border border-line object-contain self-start" />}
      {msg && !msg.ok && <p className="text-sm text-[#F2A7A0]" role="alert">{msg.text}</p>}
      <button className="btn-primary" disabled={busy || !file || !ref}>{busy ? 'Uploading…' : 'Submit for verification'}</button>
      <p className="text-xs text-muted-dim">The instructor checks your receipt and unlocks access. You'll get a notification once it's approved.</p>
    </form>
  );
}
