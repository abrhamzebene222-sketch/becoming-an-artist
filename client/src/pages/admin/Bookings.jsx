import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, useApi, fmtDate, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import StatusPill from '../../components/StatusPill.jsx';

export default function Bookings() {
  const { t } = useI18n();
  const list = useApi('/admin/bookings');
  const pricing = useApi('/pricing');
  const { refreshOverview } = useOutletContext();
  const [draft, setDraft] = useState({});
  const d = (id) => draft[id] || {};
  const set = (id, k, v) => setDraft({ ...draft, [id]: { ...d(id), [k]: v } });
  // Default = the price quoted to the student when they requested (older requests: current 1-hour rate)
  const defPrice = (b) => b.priceEtb ?? (b.mode === 'online' ? pricing.data?.sessionPriceOnline : pricing.data?.sessionPriceInPerson);

  const review = async (b, decision) => {
    try {
      await api(`/admin/bookings/${b.id}/review`, { method: 'POST', body: { decision, priceEtb: d(b.id).price ?? defPrice(b), message: d(b.id).message } });
      list.reload(); refreshOverview?.();
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">{t('admin.bookings.title')}</h1>
      {list.data?.length === 0 && <p className="text-muted">{t('admin.bookings.none')}</p>}
      <div className="grid lg:grid-cols-2 gap-5">
        {list.data?.map((b) => (
          <article key={b.id} className="card p-5 flex flex-col gap-3">
            <div className="flex justify-between gap-3 flex-wrap">
              <div className="min-w-0"><p className="font-semibold">{b.user?.name}</p><p className="text-xs text-muted break-all">{b.user?.email}{b.user?.phone ? ` · ${b.user.phone}` : ''}</p></div>
              <StatusPill status={b.status} />
            </div>
            <p className="text-sm"><span className="text-muted">{b.mode === 'online' ? t('common.online') : t('common.inPerson')} · </span>{fmtDate(b.preferredAt)}</p>
            <p className="text-sm"><span className="text-muted">{t('admin.bookings.topic')}: </span>{b.topic}</p>
            {b.durationHours
              ? (
                <p className="text-sm">
                  <span className="text-muted">{t('admin.bookings.duration')}: </span>{t('common.hours', { h: b.durationHours })}
                  <span className="text-muted"> · {t('admin.bookings.content')}: </span>
                  {b.contentType === 'theory' ? t('sessions.theory') : b.contentType === 'practical' ? t('sessions.practical') : t('sessions.split', { t: b.theoryPercent, p: b.practicalPercent })}
                </p>
              )
              : <p className="text-xs text-muted-dim">{t('admin.bookings.oldBooking')}</p>}
            {b.durationHours && b.rateUsed > 0 && (
              <p className="text-sm text-muted-soft">{t('admin.bookings.quoted', { price: etb(b.priceEtb), rate: etb(b.rateUsed), pct: b.discountPercent || 0 })}</p>
            )}
            {b.notes && <p className="text-sm text-muted-soft">{b.notes}</p>}
            {b.status === 'requested' && (
              <>
                <div className="grid sm:grid-cols-[140px_1fr] gap-3">
                  <label className="label">{t('admin.bookings.price')}<input type="number" min="0" className="input" value={d(b.id).price ?? defPrice(b) ?? ''} onChange={(e) => set(b.id, 'price', e.target.value)} /></label>
                  <label className="label">{t('admin.bookings.message')}<input className="input" value={d(b.id).message || ''} onChange={(e) => set(b.id, 'message', e.target.value)} placeholder={t('admin.bookings.messagePh')} /></label>
                </div>
                {b.durationHours && <p className="text-xs text-muted-soft">{t('admin.bookings.priceHint')}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button className="btn-primary flex-1" onClick={() => review(b, 'approved')}>{t('admin.bookings.approve')}</button>
                  <button className="btn-danger" onClick={() => review(b, 'rejected')}>{t('admin.bookings.decline')}</button>
                </div>
              </>
            )}
            {b.status !== 'requested' && b.priceEtb != null && (
              <p className="text-sm text-muted-soft">{t('admin.bookings.priceLine', { price: etb(b.priceEtb) })}{b.adminMessage ? ` · ${b.adminMessage}` : ''}</p>
            )}
            {b.status === 'paid' && <button className="btn-ghost self-start" onClick={() => review(b, 'completed')}>{t('admin.bookings.complete')}</button>}
          </article>
        ))}
      </div>
    </div>
  );
}
