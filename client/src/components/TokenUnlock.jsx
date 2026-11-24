import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useApi } from '../api.js';
import { useI18n } from '../i18n/index.jsx';

/**
 * "Unlock with tokens" button with a confirm step.
 *   type: 'lesson' | 'course' | 'group'     id: the lesson / course / group id     price: tokens (from the server)
 * Show it only to signed-in students. The server decides the real price again when the button is confirmed.
 */
export default function TokenUnlock({ type, id, price, onDone, className = '' }) {
  const { t } = useI18n();
  const me = useApi('/me/summary');
  const [step, setStep] = useState('idle'); // idle | confirm | working
  const [err, setErr] = useState('');
  if (!(price > 0)) return null;
  const have = me.data?.creditEtb ?? null;
  const enough = have != null && have >= price;
  const label = t(`tokens.unlock${type[0].toUpperCase()}${type.slice(1)}`, { n: price.toLocaleString('en-US') });

  const go = async () => {
    setStep('working'); setErr('');
    try {
      await api('/credits/redeem', { method: 'POST', body: { type, id } });
      setStep('idle');
      onDone?.();
    } catch (e) { setErr(e.message); setStep('confirm'); me.reload(); }
  };

  if (step === 'idle') {
    return <button type="button" className={`btn-primary ${className}`} onClick={() => { setErr(''); setStep('confirm'); me.reload(); }}>{label}</button>;
  }
  return (
    <div className={`rounded-xl border border-line-strong bg-ink p-4 flex flex-col gap-3 ${className}`} role="group" aria-label={label}>
      <p className="text-sm">{t('tokens.confirm', { n: price.toLocaleString('en-US'), have: t('tokens.count', { n: (have ?? 0).toLocaleString('en-US') }) })}</p>
      {have != null && !enough && (
        <p className="text-sm text-[#F2D98A]">
          {t('tokens.notEnough', { n: (price - have).toLocaleString('en-US') })}{' '}
          <Link to="/rewards" className="underline text-teal-soft">{t('tokens.buyMore')}</Link>
        </p>
      )}
      {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
      <div className="flex gap-2 flex-wrap">
        <button type="button" className="btn-primary" disabled={step === 'working' || !enough} onClick={go}>{step === 'working' ? t('tokens.working') : t('tokens.yes')}</button>
        <button type="button" className="btn-ghost" disabled={step === 'working'} onClick={() => setStep('idle')}>{t('tokens.no')}</button>
      </div>
    </div>
  );
}
