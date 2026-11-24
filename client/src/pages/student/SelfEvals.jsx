import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import Icon from '../../components/Icon.jsx';

const n = (v) => Number(v || 0).toLocaleString('en-US');

// Menu › Self-Evaluation: search lessons, tick one or many, pay with tokens. No minimum quantity.
export default function SelfEvals() {
  const { t, loc } = useI18n();
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [picked, setPicked] = useState({});          // lessonId → { title, price }
  const [step, setStep] = useState('idle');          // idle | confirm | working
  const [err, setErr] = useState('');
  const [done, setDone] = useState('');
  useEffect(() => { const id = setTimeout(() => setTerm(q.trim()), 300); return () => clearTimeout(id); }, [q]);

  const list = useApi(`/self-evals?q=${encodeURIComponent(term)}`);
  const mine = useApi('/self-evals/mine');
  const items = list.data?.items || [];
  const balance = list.data?.balance ?? 0;
  const ids = Object.keys(picked);
  const total = ids.reduce((s, id) => s + picked[id].price, 0);
  const short = Math.max(0, total - balance);

  const toggle = (it) => {
    setDone(''); setErr(''); setStep('idle');
    setPicked((p) => {
      const next = { ...p };
      if (next[it.lessonId]) delete next[it.lessonId];
      else next[it.lessonId] = { title: loc(it, 'title'), price: it.priceEtb };
      return next;
    });
  };

  const buy = async () => {
    setStep('working'); setErr('');
    try {
      const r = await api('/self-evals/buy', { method: 'POST', body: { lessonIds: ids } });
      setPicked({}); setStep('idle');
      setDone(r.stopped ? t('selfEval.partial', { count: r.bought }) : t('selfEval.success', { count: r.bought }));
      list.reload(); mine.reload();
    } catch (e) { setErr(e.message); setStep('confirm'); list.reload(); }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl w-full mx-auto pb-28">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">{t('selfEval.title')}</h1>
        <p className="text-muted-soft">{t('selfEval.intro')}</p>
        <div className="flex items-center gap-3 flex-wrap text-sm">
          <span className="rounded-full border border-line-strong px-3 py-1.5">{t('tokens.balance')}: <strong>{t('tokens.count', { n: n(balance) })}</strong></span>
          <Link to="/rewards" className="underline text-teal-soft">{t('tokens.buyMore')}</Link>
        </div>
      </header>

      <section className="card p-4 flex flex-col gap-3">
        <label className="label">{t('selfEval.searchLabel')}
          <input type="search" className="input" value={q} placeholder={t('selfEval.searchPlaceholder')} onChange={(e) => setQ(e.target.value)} />
        </label>
        {!term && <p className="text-xs text-muted">{t('selfEval.hintEmpty')}</p>}
        {list.error && <p className="text-sm text-muted" role="alert">{list.error.message}</p>}
        {!list.error && list.data && items.length === 0 && <p className="text-sm text-muted">{term ? t('selfEval.noResults') : t('selfEval.noneYet')}</p>}
        <ul className="flex flex-col">
          {items.map((it) => {
            const ready = !!it.evalId;
            const on = !!picked[it.lessonId];
            return (
              <li key={it.lessonId} className="border-b border-line last:border-0">
                {ready && !it.owned ? (
                  <label className="flex items-start gap-3 py-3 min-h-11 cursor-pointer">
                    <input type="checkbox" className="mt-1 w-5 h-5 accent-teal shrink-0" checked={on} onChange={() => toggle(it)} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{loc(it, 'title')}</span>
                      <span className="block text-xs text-muted truncate">{loc({ title: it.courseTitle, titleAm: it.courseTitleAm }, 'title')}</span>
                    </span>
                    <span className="text-sm text-teal-soft shrink-0">{it.priceEtb > 0 ? t('tokens.count', { n: n(it.priceEtb) }) : t('common.free')}</span>
                  </label>
                ) : (
                  <div className="flex items-start gap-3 py-3 min-h-11">
                    <Icon name={it.owned ? 'check' : 'lock'} size={16} className="mt-1 shrink-0 text-muted" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{loc(it, 'title')}</span>
                      <span className="block text-xs text-muted truncate">{loc({ title: it.courseTitle, titleAm: it.courseTitleAm }, 'title')}</span>
                      {!ready && <span className="block text-xs text-[#F2D98A] mt-1">{t('selfEval.notPrepared')}</span>}
                    </span>
                    {it.owned && <Link to={`/self-evals/${it.evalId}`} className="btn-ghost py-2 px-3 text-xs shrink-0">{t('selfEval.open')}</Link>}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {done && <p className="rounded-xl border border-teal/50 bg-teal-active/30 text-mint p-3.5 text-sm" role="status">{done}</p>}

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('selfEval.mine')}</h2>
        {mine.data?.length === 0 && <p className="text-sm text-muted">{t('selfEval.mineEmpty')}</p>}
        {mine.data?.map((m) => (
          <Link key={m.id} to={`/self-evals/${m.id}`} className="flex items-start gap-3 rounded-xl px-3 py-2.5 min-h-11 hover:bg-ink">
            <Icon name="file" size={16} className="mt-1 text-teal-soft shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{loc(m, 'title')}</span>
              <span className="block text-xs text-muted truncate">{loc({ title: m.courseTitle, titleAm: m.courseTitleAm }, 'title')}</span>
            </span>
          </Link>
        ))}
      </section>

      {ids.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 bg-ink-deep border-t border-line-strong px-4 py-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="max-w-3xl mx-auto flex flex-col gap-2.5">
            {step === 'idle' ? (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm">{t('selfEval.selected', { n: ids.length })} · {t('selfEval.total', { n: n(total) })}</span>
                <button type="button" className="btn-primary" onClick={() => { setErr(''); setStep('confirm'); list.reload(); }}>{t('selfEval.buy')}</button>
              </div>
            ) : (
              <>
                <p className="text-sm">{t('selfEval.confirm', { n: n(total), count: ids.length, have: t('tokens.count', { n: n(balance) }) })}</p>
                {short > 0 && (
                  <p className="text-sm text-[#F2D98A]">{t('tokens.notEnough', { n: n(short) })} <Link to="/rewards" className="underline text-teal-soft">{t('tokens.buyMore')}</Link></p>
                )}
                {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button type="button" className="btn-primary" disabled={step === 'working' || short > 0} onClick={buy}>{step === 'working' ? t('tokens.working') : t('selfEval.yes')}</button>
                  <button type="button" className="btn-ghost" disabled={step === 'working'} onClick={() => setStep('idle')}>{t('tokens.no')}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
