import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, API_BASE, getToken, useApi, etb, fmtDate } from '../../api.js';
import { StatusPill } from '../student/Enrolled.jsx';

/** Receipt images require the admin token, so load them as blobs. */
function Receipt({ id }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let u;
    fetch(`${API_BASE}/api/admin/payments/${id}/screenshot`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.blob()).then((b) => { u = URL.createObjectURL(b); setUrl(u); });
    return () => u && URL.revokeObjectURL(u);
  }, [id]);
  if (!url) return <div className="w-full h-40 bg-ink-deep rounded-xl" />;
  return <a href={url} target="_blank" rel="noreferrer"><img src={url} alt="Payment screenshot" className="w-full max-h-72 object-contain bg-ink-deep rounded-xl border border-line" /></a>;
}

export default function Payments() {
  const [status, setStatus] = useState('pending');
  const list = useApi(`/admin/payments?status=${status}`, [status]);
  const { refreshOverview } = useOutletContext();
  const [notes, setNotes] = useState({});

  const review = async (id, decision) => {
    await api(`/admin/payments/${id}/review`, { method: 'POST', body: { decision, note: notes[id] } });
    list.reload(); refreshOverview?.();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">Payment verification</h1>
        <div className="flex gap-2" role="tablist">
          {['pending', 'approved', 'rejected'].map((s) => (
            <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)}
              className={`px-4 py-2.5 rounded-xl capitalize text-sm ${status === s ? 'bg-teal text-[#0B1312] font-semibold' : 'border border-line-strong text-muted-soft'}`}>{s}</button>
          ))}
        </div>
      </div>
      {list.data?.length === 0 && <p className="text-muted">No {status} payments.</p>}
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-5">
        {list.data?.map((p) => (
          <article key={p.id} className="card p-5 flex flex-col gap-3">
            <Receipt id={p.id} />
            <div className="flex justify-between gap-3">
              <div>
                <p className="font-semibold">{p.student_name}</p>
                <p className="text-xs text-muted">{p.student_email}</p>
              </div>
              <StatusPill status={p.status} />
            </div>
            <dl className="text-sm grid grid-cols-[110px_1fr] gap-y-1.5">
              <dt className="text-muted">For</dt><dd className="capitalize">{p.purpose}{p.course_title ? ` · ${p.course_title}` : ''}</dd>
              <dt className="text-muted">Amount</dt><dd className="font-semibold">{etb(p.amount_etb)}</dd>
              <dt className="text-muted">Method</dt><dd>{p.method === 'TELEBIRR' ? 'Telebirr' : 'CBE'}</dd>
              <dt className="text-muted">Reference</dt><dd className="font-mono break-all">{p.reference_id}</dd>
              <dt className="text-muted">Submitted</dt><dd>{fmtDate(p.created_at)}</dd>
            </dl>
            {p.status === 'pending' ? (
              <>
                <label className="label">Note to student (optional)
                  <input className="input text-sm" value={notes[p.id] || ''} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} />
                </label>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" onClick={() => review(p.id, 'approved')}>Approve &amp; unlock</button>
                  <button className="btn-danger" onClick={() => review(p.id, 'rejected')}>Reject</button>
                </div>
              </>
            ) : p.admin_note && <p className="text-sm text-muted-soft">Note: {p.admin_note}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
