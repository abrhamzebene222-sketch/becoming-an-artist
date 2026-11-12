import { useState } from 'react';
import { api, useApi, fmtDate, etb } from '../../api.js';
import PaymentForm from '../../components/PaymentForm.jsx';
import { StatusPill } from './Enrolled.jsx';

export default function Sessions() {
  const bookings = useApi('/bookings');
  const [f, setF] = useState({ mode: 'online', preferredAt: '', topic: '', notes: '' });
  const [msg, setMsg] = useState(null);
  const [payFor, setPayFor] = useState(null);

  const submit = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      await api('/bookings', { method: 'POST', body: f });
      setMsg({ ok: true, text: 'Request sent. You will be notified when the instructor approves it.' });
      setF({ mode: 'online', preferredAt: '', topic: '', notes: '' });
      bookings.reload();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold">1-on-1 Sessions</h1>
      <div className="grid xl:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Request a private session</h2>
          <fieldset>
            <legend className="text-sm text-muted mb-2">Format</legend>
            <div className="grid grid-cols-2 gap-3">
              {[['online', 'Online'], ['in_person', 'In person']].map(([v, l]) => (
                <label key={v} className={`flex items-center gap-2.5 p-3.5 rounded-xl cursor-pointer border ${f.mode === v ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                  <input type="radio" name="mode" checked={f.mode === v} onChange={() => setF({ ...f, mode: v })} className="accent-teal" />{l}
                </label>
              ))}
            </div>
          </fieldset>
          <label className="label">Preferred date &amp; time
            <input type="datetime-local" className="input [color-scheme:dark]" required value={f.preferredAt} onChange={(e) => setF({ ...f, preferredAt: e.target.value })} />
          </label>
          <label className="label">What do you want to work on?
            <input className="input" required value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder="e.g. Portfolio review, figure gesture" />
          </label>
          <label className="label">Notes (optional)
            <textarea className="input min-h-24" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </label>
          {msg && <p className={`text-sm ${msg.ok ? 'text-mint' : 'text-[#F2A7A0]'}`} role="status">{msg.text}</p>}
          <button className="btn-primary">Send request</button>
        </form>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Your requests</h2>
          {bookings.data?.length === 0 && <p className="text-muted text-sm">No sessions requested yet.</p>}
          {bookings.data?.map((b) => (
            <div key={b.id} className="card p-5 flex flex-col gap-2">
              <div className="flex justify-between gap-3 flex-wrap">
                <span className="font-semibold">{b.topic}</span><StatusPill status={b.status} />
              </div>
              <span className="text-sm text-muted-soft">{b.mode === 'online' ? 'Online' : 'In person'} · {fmtDate(b.preferred_at)}</span>
              {b.admin_message && <p className="text-sm bg-ink rounded-xl p-3">{b.admin_message}</p>}
              {b.status === 'approved' && (payFor === b.id
                ? <PaymentForm purpose="session" bookingId={b.id} amount={b.price_etb} onDone={bookings.reload} />
                : <button type="button" className="btn-primary self-start" onClick={() => setPayFor(b.id)}>Pay {etb(b.price_etb)} to confirm</button>)}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
