import { useState } from 'react';
import { useApi, etb } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import PaymentForm from './PaymentForm.jsx';

const PRESETS = [500, 1000, 2000, 5000];

/** Buy tokens: choose an amount (1 ETB = 1 token), then the usual CBE / Telebirr receipt form. */
export default function TokenTopUp({ onDone }) {
  const { t } = useI18n();
  const pricing = useApi('/pricing');
  const min = pricing.data?.topup?.min || 100;
  const max = pricing.data?.topup?.max || 200000;
  const [raw, setRaw] = useState('');
  const [step, setStep] = useState('choose');
  const n = Number(raw);
  const valid = Number.isInteger(n) && n >= min && n <= max;

  return (
    <section className="card p-5 flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{t('tokens.buyTitle')}</h2>
      <p className="text-sm text-muted-soft">{t('tokens.buyText')}</p>
      {step === 'choose' ? (
        <>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button key={p} type="button" onClick={() => setRaw(String(p))}
                className={`px-3.5 py-2 rounded-xl text-sm border ${n === p ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>{etb(p)}</button>
            ))}
          </div>
          <label className="label">{t('tokens.amount')}
            <input type="number" inputMode="numeric" min={min} max={max} step="1" className="input" value={raw} onChange={(e) => setRaw(e.target.value)} />
          </label>
          <p className={`text-xs ${raw && !valid ? 'text-[#F2A7A0]' : 'text-muted-dim'}`}>
            {raw && !valid ? t('tokens.invalid', { min, max }) : t('tokens.range', { min, max })}
          </p>
          <button type="button" className="btn-primary self-start" disabled={!valid} onClick={() => setStep('pay')}>{t('tokens.continue')}</button>
        </>
      ) : (
        <>
          <p className="text-sm text-mint">{t('tokens.youGet', { n: n.toLocaleString('en-US') })}</p>
          <PaymentForm purpose="topup" amount={n} onDone={onDone} />
          <button type="button" className="btn-ghost self-start text-sm" onClick={() => setStep('choose')}>{t('tokens.change')}</button>
        </>
      )}
    </section>
  );
}
