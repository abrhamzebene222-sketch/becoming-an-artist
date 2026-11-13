import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, useApi, etb, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import StatusPill from '../../components/StatusPill.jsx';

export default function Payments() {
  const { t, loc } = useI18n();
  const [status, setStatus] = useState('pending');
  const list = useApi(`/admin/payments?status=${status}`, [status]);
  const { refreshOverview } = useOutletContext();
  const [notes, setNotes] = useState({});
  const [busy, setBusy] = useState(null);

  const review = async (id, decision) => {
    setBusy(id);
    try {
      await api(`/admin/payments/${id}/review`, { method: 'POST', body: { decision, note: notes[id] } });
      list.reload(); refreshOverview?.();
    } catch (e) { alert(e.message); }
    setBusy(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold">{t('admin.payments.title')}</h1>
        <div className="flex flex-wrap gap-2" role="tablist">
          {['pending', 'approved', 'rejected'].map((s) => (
            <button key={s} role="tab" aria-selected={status === s} onClick={() => setStatus(s)}
              className={`px-4 py-2.5 rounded-xl text-sm ${status === s ? 'bg-teal text-[#0B1312] font-semibold' : 'border border-line-strong text-muted-soft'}`}>
              {t(`common.status.${s}`)}
            </button>
          ))}
        </div>
      </div>
      {list.data?.length === 0 && <p className="text-muted">{t('admin.payments.none')}</p>}
      <div className="grid md:grid-cols-2 2xl:grid-cols-3 gap-5">
        {list.data?.map((p) => (
          <article key={p.id} className="card p-5 flex flex-col gap-3">
            <a href={p.receiptUrl} target="_blank" rel="noreferrer" title={t('admin.payments.openReceipt')}>
              <img src={p.receiptUrl} alt={t('pay.screenshot')} loading="lazy" className="w-full max-h-72 object-contain bg-ink-deep rounded-xl border border-line" />
            </a>
            <div className="flex justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{p.user?.name}</p>
                <p className="text-xs text-muted break-all">{p.user?.email}{p.user?.phone ? ` · ${p.user.phone}` : ''}</p>
              </div>
              <StatusPill status={p.status} />
            </div>
            <dl className="text-sm grid grid-cols-[110px_1fr] gap-y-1.5">
              <dt className="text-muted">{t('admin.payments.for')}</dt><dd>{t(`enrolled.purpose.${p.purpose}`)}{p.course ? ` · ${loc(p.course, 'title')}` : ''}</dd>
              <dt className="text-muted">{t('admin.payments.amount')}</dt><dd className="font-semibold">{etb(p.amountEtb)}</dd>
              <dt className="text-muted">{t('admin.payments.method')}</dt><dd>{p.method === 'TELEBIRR' ? t('pay.telebirr') : t('pay.cbe')}</dd>
              <dt className="text-muted">{t('admin.payments.reference')}</dt><dd className="font-mono break-all">{p.referenceId}</dd>
              <dt className="text-muted">{t('admin.payments.submitted')}</dt><dd>{fmtDate(p.createdAt)}</dd>
            </dl>
            {p.status === 'pending' ? (
              <>
                <label className="label">{t('admin.payments.noteLabel')}
                  <input className="input text-sm" value={notes[p.id] || ''} onChange={(e) => setNotes({ ...notes, [p.id]: e.target.value })} />
                </label>
                <div className="flex gap-2">
                  <button className="btn-primary flex-1" disabled={busy === p.id} onClick={() => review(p.id, 'approved')}>{t('admin.payments.approve')}</button>
                  <button className="btn-danger" disabled={busy === p.id} onClick={() => review(p.id, 'rejected')}>{t('admin.payments.reject')}</button>
                </div>
              </>
            ) : p.adminNote && <p className="text-sm text-muted-soft">{t('admin.payments.note', { note: p.adminNote })}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
