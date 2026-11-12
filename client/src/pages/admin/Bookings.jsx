import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, useApi, fmtDate, etb } from '../../api.js';
import { StatusPill } from '../student/Enrolled.jsx';

export default function Bookings() {
  const list = useApi('/admin/bookings');
  const pricing = useApi('/pricing');
  const { refreshOverview } = useOutletContext();
  const [draft, setDraft] = useState({});
  const d = (id) => draft[id] || {};
  const set = (id, k, v) => setDraft({ ...draft, [id]: { ...d(id), [k]: v } });

  const review = async (b, decision) => {
    const def = b.mode === 'online' ? pricing.data?.sessionPriceOnline : pricing.data?.sessionPriceInPerson;
    await api(`/admin/bookings/${b.id}/review`, { method: 'POST', body: { decision, priceEtb: d(b.id).price ?? def, message: d(b.id).message } });
    list.reload(); refreshOverview?.();
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">1-on-1 bookings</h1>
      {list.data?.length === 0 && <p className="text-muted">No booking requests yet.</p>}
      <div className="grid lg:grid-cols-2 gap-5">
        {list.data?.map((b) => {
          const def = b.mode === 'online' ? pricing.data?.sessionPriceOnline : pricing.data?.sessionPriceInPerson;
          return (
            <article key={b.id} className="card p-5 flex flex-col gap-3">
              <div className="flex justify-between gap-3 flex-wrap">
                <div><p className="font-semibold">{b.student_name}</p><p className="text-xs text-muted">{b.student_email}{b.student_phone ? ` · ${b.student_phone}` : ''}</p></div>
                <StatusPill status={b.status} />
              </div>
              <p className="text-sm"><span className="text-muted">{b.mode === 'online' ? 'Online' : 'In person'} · </span>{fmtDate(b.preferred_at)}</p>
              <p className="text-sm"><span className="text-muted">Topic: </span>{b.topic}</p>
              {b.notes && <p className="text-sm text-muted-soft">{b.notes}</p>}
              {b.status === 'requested' && (
                <>
                  <div className="grid sm:grid-cols-[140px_1fr] gap-3">
                    <label className="label">Price (ETB)<input type="number" min="0" className="input" value={d(b.id).price ?? def ?? ''} onChange={(e) => set(b.id, 'price', e.target.value)} /></label>
                    <label className="label">Message / meeting link / address<input className="input" value={d(b.id).message || ''} onChange={(e) => set(b.id, 'message', e.target.value)} placeholder="Google Meet link or studio address" /></label>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1" onClick={() => review(b, 'approved')}>Approve &amp; send payment request</button>
                    <button className="btn-danger" onClick={() => review(b, 'rejected')}>Decline</button>
                  </div>
                </>
              )}
              {b.status !== 'requested' && b.price_etb != null && <p className="text-sm text-muted-soft">Price: {etb(b.price_etb)}{b.admin_message ? ` · ${b.admin_message}` : ''}</p>}
              {b.status === 'paid' && <button className="btn-ghost self-start" onClick={() => review(b, 'completed')}>Mark completed</button>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
