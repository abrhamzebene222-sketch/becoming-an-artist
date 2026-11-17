import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api, etb, useAuth } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import PaymentForm from './PaymentForm.jsx';
import Icon from './Icon.jsx';

/** Buy a whole group (sub-group or major group) — CBE/Telebirr receipt, or instantly with referral credit. */
export default function GroupPurchase({ group, credit = 0, onClose, onDone }) {
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const location = useLocation();
  const [msg, setMsg] = useState(null);
  const price = group.groupPriceEtb ?? group.priceEtb ?? 0;

  const redeem = async () => {
    setMsg(null);
    try { await api('/credits/redeem', { method: 'POST', body: { type: 'group', id: group.id } }); setMsg({ ok: true, text: t('detail.creditDone') }); onDone?.(); }
    catch (e) { setMsg({ ok: false, text: e.message }); }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="gp-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}>
      <div className="card w-full max-w-md max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="eyebrow">{t('detail.buyGroup')}</span>
            <h2 id="gp-title" className="text-lg font-semibold mt-1">{loc(group, 'title')}</h2>
            <p className="text-2xl font-semibold mt-1 text-teal-soft">{etb(price)}</p>
          </div>
          <button type="button" aria-label={t('guard.cancel')} onClick={onClose} className="w-11 h-11 -m-2 grid place-items-center text-muted"><Icon name="x" /></button>
        </div>
        {!user ? (
          <Link to="/login" state={{ from: location.pathname }} className="btn-primary">{t('nav.signIn')}</Link>
        ) : msg?.ok ? (
          <p className="rounded-xl bg-teal-active p-4 text-mint text-sm" role="status">{msg.text}</p>
        ) : (
          <>
            {credit >= price && price > 0 && (
              <button type="button" className="btn-ghost border-cyan-300/50" onClick={redeem}><Icon name="gift" />{t('detail.useCredit')} · {etb(credit)}</button>
            )}
            {msg && !msg.ok && <p className="text-sm text-[#F2A7A0]" role="alert">{msg.text}</p>}
            <PaymentForm purpose="group" categoryId={group.id} amount={price} onDone={onDone} />
          </>
        )}
      </div>
    </div>
  );
}
