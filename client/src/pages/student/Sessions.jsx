import { useState } from 'react';
import { api, useApi, fmtDate, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import PaymentForm from '../../components/PaymentForm.jsx';
import StatusPill from '../../components/StatusPill.jsx';

// Fallback only (the real list comes from /pricing). The server recomputes every price itself.
const DEFAULT_OPTIONS = [
  { hours: 1, discountPercent: 0 }, { hours: 1.5, discountPercent: 10 }, { hours: 2, discountPercent: 15 },
  { hours: 2.5, discountPercent: 20 }, { hours: 3, discountPercent: 25 },
];
const EMPTY = { mode: 'online', preferredAt: '', topic: '', notes: '', durationHours: 1, contentType: 'both', theoryPercent: 50 };

export default function Sessions() {
  const { t } = useI18n();
  const bookings = useApi('/bookings');
  const pricing = useApi('/pricing');
  const [f, setF] = useState(EMPTY);
  const [msg, setMsg] = useState(null);
  const [payFor, setPayFor] = useState(null);

  const options = pricing.data?.tutoringOptions || DEFAULT_OPTIONS;
  const rate = Number((f.mode === 'online' ? pricing.data?.sessionPriceOnline : pricing.data?.sessionPriceInPerson) || 0);
  const maxDiscount = Math.max(...options.map((o) => o.discountPercent));
  const quoteFor = (o) => {
    const list = Math.round(rate * o.hours);
    const price = Math.round(rate * o.hours * (1 - o.discountPercent / 100));
    return { list, price, save: list - price };
  };
  const current = options.find((o) => o.hours === f.durationHours) || options[0];
  const q = quoteFor(current);
  const theory = f.contentType === 'theory' ? 100 : f.contentType === 'practical' ? 0 : f.theoryPercent;
  const hoursText = (h) => t('common.hours', { h });
  const contentText = (type, th) => (type === 'theory' ? t('sessions.theory')
    : type === 'practical' ? t('sessions.practical')
      : t('sessions.split', { t: th, p: 100 - th }));

  const submit = async (e) => {
    e.preventDefault(); setMsg(null);
    try {
      // datetime-local has no timezone: convert from the user's local time to an exact moment.
      // Only choices are sent; the server works out the price itself.
      await api('/bookings', {
        method: 'POST',
        body: {
          mode: f.mode, topic: f.topic, notes: f.notes, preferredAt: new Date(f.preferredAt).toISOString(),
          durationHours: f.durationHours, contentType: f.contentType, theoryPercent: theory,
        },
      });
      setMsg({ ok: true, text: t('sessions.sent') });
      setF(EMPTY);
      bookings.reload();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
  };

  return (
    <div className="flex flex-col gap-8">
      <h1 className="text-3xl font-semibold">{t('sessions.title')}</h1>
      <div className="grid xl:grid-cols-[1fr_1.2fr] gap-6 items-start">
        <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t('sessions.requestTitle')}</h2>
          <fieldset>
            <legend className="text-sm text-muted mb-2">{t('sessions.format')}</legend>
            <div className="grid grid-cols-2 gap-3">
              {[['online', t('common.online')], ['in_person', t('common.inPerson')]].map(([v, l]) => (
                <label key={v} className={`flex items-center gap-2.5 p-3.5 rounded-xl cursor-pointer border ${f.mode === v ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                  <input type="radio" name="mode" checked={f.mode === v} onChange={() => setF({ ...f, mode: v })} className="accent-teal" />{l}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm text-muted mb-1">{t('sessions.duration')}</legend>
            <p className="text-xs text-muted-soft mb-2">{t('sessions.durationHelp')}</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {options.map((o) => (
                <label key={o.hours} className={`flex flex-col items-center gap-0.5 py-2.5 rounded-xl cursor-pointer border text-center ${f.durationHours === o.hours ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                  <input type="radio" name="duration" className="sr-only" checked={f.durationHours === o.hours} onChange={() => setF({ ...f, durationHours: o.hours })} />
                  <span className="font-semibold text-sm">{hoursText(o.hours)}</span>
                  <span className={`text-xs ${o.discountPercent ? 'text-mint' : 'text-muted-dim'}`}>{o.discountPercent ? `−${o.discountPercent}%` : '—'}</span>
                </label>
              ))}
            </div>
            <div className="bg-ink rounded-xl p-4 mt-3 text-sm leading-7" aria-live="polite">
              {rate > 0 ? (
                <>
                  <span className="text-muted">{t('sessions.rate', { amount: etb(rate) })}</span><br />
                  <span className="text-muted">{t('sessions.price')}:</span> <strong className="text-teal-soft text-base">{etb(q.price)}</strong>
                  {current.discountPercent > 0 && <span className="text-muted-dim line-through ml-2">{etb(q.list)}</span>}<br />
                  {q.save > 0
                    ? <span className="text-mint">{t('sessions.youSave', { amount: etb(q.save) })}</span>
                    : <span className="text-muted-soft">{t('sessions.noDiscount')}</span>}
                  {maxDiscount > 0 && <span className="text-muted-soft"> · {t('sessions.saveUpTo', { p: maxDiscount })}</span>}
                </>
              ) : <span className="text-muted-soft">{t('sessions.rateNotSet')}</span>}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm text-muted mb-2">{t('sessions.content')}</legend>
            <div className="grid grid-cols-3 gap-2">
              {['theory', 'practical', 'both'].map((v) => (
                <label key={v} className={`flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer border text-sm ${f.contentType === v ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                  <input type="radio" name="content" className="accent-teal" checked={f.contentType === v} onChange={() => setF({ ...f, contentType: v })} />{t(`sessions.${v}`)}
                </label>
              ))}
            </div>
            {f.contentType === 'both' && (
              <div className="mt-3">
                <input type="range" min="10" max="90" step="10" className="w-full accent-teal" aria-label={t('sessions.split', { t: f.theoryPercent, p: 100 - f.theoryPercent })}
                  value={f.theoryPercent} onChange={(e) => setF({ ...f, theoryPercent: Number(e.target.value) })} />
                <p className="text-sm text-center mt-1" aria-live="polite">{t('sessions.split', { t: f.theoryPercent, p: 100 - f.theoryPercent })}</p>
                <p className="text-xs text-muted-soft text-center">{t('sessions.splitHint')}</p>
              </div>
            )}
          </fieldset>

          <label className="label">{t('sessions.when')}
            <input type="datetime-local" className="input [color-scheme:dark]" required value={f.preferredAt} onChange={(e) => setF({ ...f, preferredAt: e.target.value })} />
          </label>
          <label className="label">{t('sessions.topic')}
            <input className="input" required value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder={t('sessions.topicPh')} />
          </label>
          <label className="label">{t('sessions.notes')}
            <textarea className="input min-h-24" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
          </label>
          {msg && <p className={`text-sm ${msg.ok ? 'text-mint' : 'text-[#F2A7A0]'}`} role="status">{msg.text}</p>}
          <button className="btn-primary">{t('sessions.send')}</button>
        </form>

        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('sessions.yours')}</h2>
          {bookings.data?.length === 0 && <p className="text-muted text-sm">{t('sessions.none')}</p>}
          {bookings.data?.map((b) => (
            <div key={b.id} className="card p-5 flex flex-col gap-2">
              <div className="flex justify-between gap-3 flex-wrap">
                <span className="font-semibold">{b.topic}</span><StatusPill status={b.status} />
              </div>
              <span className="text-sm text-muted-soft">{b.mode === 'online' ? t('common.online') : t('common.inPerson')} · {fmtDate(b.preferredAt)}</span>
              {b.durationHours && (
                <span className="text-sm text-muted-soft">
                  {t('sessions.cardLine', { h: hoursText(b.durationHours), content: contentText(b.contentType, b.theoryPercent) })}
                  {b.discountPercent > 0 && ` · −${b.discountPercent}%`}
                </span>
              )}
              {b.adminMessage && <p className="text-sm bg-ink rounded-xl p-3 break-words">{b.adminMessage}</p>}
              {b.status === 'approved' && (payFor === b.id
                ? <PaymentForm purpose="session" bookingId={b.id} amount={b.priceEtb} onDone={bookings.reload} />
                : <button type="button" className="btn-primary self-start" onClick={() => setPayFor(b.id)}>{t('sessions.payToConfirm', { amount: etb(b.priceEtb) })}</button>)}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
