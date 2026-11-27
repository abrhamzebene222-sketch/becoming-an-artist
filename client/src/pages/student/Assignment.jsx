import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api, useApi, useAuth, fmtDate, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import Icon from '../../components/Icon.jsx';

const MAX = 12;

// Pro assignment submission → server builds a PDF report and forwards it to the admin's Telegram.
export default function Assignment() {
  const { t, loc } = useI18n();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const summary = useApi('/me/summary');
  const mine = useApi('/assignments');
  const fees = useApi('/assignments/quote');
  const accounts = useApi('/payment-accounts');
  const [f, setF] = useState({ telegramUsername: '', email: '', notes: '', courseId: params.get('course') || '', reviewType: 'one_on_one', method: 'CBE', referenceId: '' });
  const [files, setFiles] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    setF((x) => ({ ...x, email: x.email || user?.email || '', telegramUsername: x.telegramUsername || summary.data?.telegramUsername || '' }));
  }, [user, summary.data]);
  useEffect(() => () => files.forEach((x) => URL.revokeObjectURL(x.url)), [files]);

  const add = (list) => {
    const next = [...files, ...[...list].map((file) => ({ file, url: URL.createObjectURL(file) }))].slice(0, MAX);
    setFiles(next);
  };
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const form = new FormData();
    Object.entries(f).forEach(([k, v]) => v && form.append(k, v));
    files.forEach((x) => form.append('images', x.file));
    if (receipt) form.append('receipt', receipt);
    try {
      const r = await api('/assignments', { method: 'POST', form });
      setMsg({ ok: true, text: r.telegramStatus === 'sent' ? t('assign.done') : t('assign.saved') });
      setFiles([]); setReceipt(null); setF({ ...f, notes: '', referenceId: '' }); mine.reload();
    } catch (e2) { setMsg({ ok: false, text: e2.message }); }
    setBusy(false);
  };

  const feeOf = (type) => fees.data?.fees.find((x) => x.type === type)?.feeEtb || 0;
  const fee = feeOf(f.reviewType);
  const acct = accounts.data?.[f.method];
  const priceReady = fees.data?.ready && fee > 0;
  const types = [['one_on_one', t('assign.type.one_on_one')], ['video', t('assign.type.video')], ['pdf', t('assign.type.pdf')]];

  return (
    <div className="grid xl:grid-cols-[1.4fr_1fr] gap-7 items-start">
      <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t('assign.title')}</h1>
          <p className="text-sm text-muted-soft mt-1">{t('assign.text')}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="label">{t('assign.telegram')}<input className="input" required placeholder="@username" pattern="@?[A-Za-z][A-Za-z0-9_]{4,31}" value={f.telegramUsername} onChange={set('telegramUsername')} /></label>
          <label className="label">{t('assign.email')}<input type="email" className="input" required value={f.email} onChange={set('email')} /></label>
        </div>
        <label className="label">{t('assign.course')}
          <select className="input" value={f.courseId} onChange={set('courseId')}>
            <option value="">—</option>
            {summary.data?.enrolled.map((c) => <option key={c.id} value={c.id}>{loc(c, 'title')}</option>)}
          </select>
        </label>
        <label className="label">{t('assign.notes')}<textarea className="input min-h-28" value={f.notes} onChange={set('notes')} maxLength={4000} /></label>
        <fieldset>
          <legend className="text-sm text-muted mb-2">{t('assign.reviewType')}</legend>
          <div className="grid sm:grid-cols-3 gap-3">
            {types.map(([v, l]) => (
              <label key={v} className={`flex flex-col gap-1 p-3.5 rounded-xl cursor-pointer border ${f.reviewType === v ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                <span className="flex items-center gap-2"><input type="radio" name="reviewType" value={v} checked={f.reviewType === v} onChange={set('reviewType')} className="accent-teal" />{l}</span>
                <strong className="text-teal-soft">{feeOf(v) > 0 ? etb(feeOf(v)) : '—'}</strong>
              </label>
            ))}
          </div>
          {fees.data && !priceReady && <p className="text-sm text-[#F2D98A] mt-2" role="alert">{t('assign.noPrice')}</p>}
        </fieldset>
        <div className="flex flex-col gap-2">
          <span className="text-sm text-muted">{t('assign.images')}</span>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {files.map((x, i) => (
              <div key={x.url} className="relative">
                <img src={x.url} alt="" className="w-full aspect-square object-cover rounded-lg border border-line" />
                <button type="button" aria-label={t('assign.remove')} onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-8 h-8 grid place-items-center rounded-full bg-black/70 text-white"><Icon name="x" size={14} /></button>
              </div>
            ))}
            {files.length < MAX && (
              <label className="aspect-square rounded-lg border border-dashed border-line-strong grid place-items-center text-muted cursor-pointer hover:border-teal">
                <span className="flex flex-col items-center gap-1 text-xs"><Icon name="upload" />{files.length}/{MAX}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ''; }} />
              </label>
            )}
          </div>
        </div>
        <fieldset className="rounded-xl border border-line-strong p-4 flex flex-col gap-3">
          <legend className="px-2 text-sm text-muted">{t('assign.payTitle')}</legend>
          <div className="grid grid-cols-2 gap-3">
            {[['CBE', t('pay.cbe')], ['TELEBIRR', t('pay.telebirr')]].map(([v, l]) => (
              <label key={v} className={`flex items-center gap-2.5 p-3 rounded-xl cursor-pointer border ${f.method === v ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                <input type="radio" name="method" value={v} checked={f.method === v} onChange={set('method')} className="accent-teal" />{l}
              </label>
            ))}
          </div>
          <div className="rounded-xl bg-ink p-4 text-sm leading-7">
            <span className="text-muted">{t('pay.transferExactly')}</span> <strong className="text-white">{priceReady ? etb(fee) : '—'}</strong><br />
            <span className="text-muted">{t('pay.accountName')}:</span> {acct?.name || '—'}<br />
            <span className="text-muted">{f.method === 'CBE' ? t('pay.cbeAccount') : t('pay.telebirrNumber')}:</span> {acct?.number || '—'}
          </div>
          <label className="label">{t('pay.reference')}
            <input className="input" required minLength={4} maxLength={64} value={f.referenceId} onChange={set('referenceId')}
              placeholder={f.method === 'CBE' ? t('pay.refPlaceholderCbe') : t('pay.refPlaceholderTb')} />
          </label>
          <label className="label">{t('assign.receipt')}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setReceipt(e.target.files[0] || null)}
              className="text-sm text-muted-soft file:mr-3 file:rounded-lg file:border-0 file:bg-teal-active file:px-3 file:py-2 file:text-mint" />
          </label>
          <p className="text-xs text-muted-dim">{t('assign.payNote')}</p>
        </fieldset>
        {msg && <p className={`text-sm ${msg.ok ? 'rounded-xl bg-teal-active p-3 text-mint' : 'text-[#F2A7A0]'}`} role={msg.ok ? 'status' : 'alert'}>{msg.text}</p>}
        <button className="btn-primary self-start" disabled={busy || !files.length || !priceReady || f.referenceId.trim().length < 4 || !f.telegramUsername}><Icon name="send" size={16} />{busy ? t('assign.sending') : t('assign.submit')}</button>
      </form>

      <section className="card p-5 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('assign.mine')}</h2>
        {mine.data?.length === 0 && <p className="text-sm text-muted">{t('assign.none')}</p>}
        {mine.data?.map((a) => (
          <div key={a.id} className="text-sm border-b border-line pb-2.5 last:border-0">
            <p className="flex items-center gap-1.5">{a.course ? loc(a.course, 'title') : '—'} · {a.imageCount} <Icon name="image" size={14} />{a.feeEtb ? ` · ${etb(a.feeEtb)}` : ''}{a.payment?.status ? ` · ${t(`common.status.${a.payment.status}`)}` : ''}</p>
            <p className="text-xs text-muted-dim">{fmtDate(a.createdAt)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
