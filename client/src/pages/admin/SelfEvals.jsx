import { useEffect, useState } from 'react';
import { api, useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import useSearch from '../../lib/useSearch.js';
import BlockEditor, { withKeys, stripKeys } from '../../components/BlockEditor.jsx';

// Admin › Self-Evaluation Docs: pick a lesson, write its self-evaluation document (same block editor as lessons),
// set the token price (default 30, editable per document) and choose whether students can see it.
function Editor({ lessonId, onChanged, onClose }) {
  const { t, loc } = useI18n();
  const [data, setData] = useState(null);
  const [price, setPrice] = useState('30');
  const [hours, setHours] = useState('');   // credit hours (same system as lessons); empty = use the fixed price
  const [published, setPublished] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const labels = useApi(`/admin/lessons/${lessonId}/label-base?selfEval=1`, [lessonId]);
  const [msg, setMsg] = useState({ kind: '', text: '' });
  const [busy, setBusy] = useState(false);
  const [askDelete, setAskDelete] = useState(false);

  const fill = (d) => {
    setData(d);
    setPrice(String(d.selfEval ? d.selfEval.priceEtb : d.defaultPriceEtb));
    setHours(d.selfEval?.creditHours != null ? String(d.selfEval.creditHours) : '');
    setPublished(d.selfEval ? d.selfEval.isPublished : true);
    setBlocks(withKeys(d.selfEval?.blocks || []));
  };
  useEffect(() => {
    let alive = true;
    setData(null); setMsg({ kind: '', text: '' }); setAskDelete(false);
    api(`/admin/lessons/${lessonId}/self-eval`).then((d) => alive && fill(d)).catch((e) => alive && setMsg({ kind: 'err', text: e.message }));
    return () => { alive = false; };
  }, [lessonId]);

  const save = async () => {
    setBusy(true); setMsg({ kind: '', text: '' });
    try {
      await api(`/admin/lessons/${lessonId}/self-eval`, {
        method: 'PUT', body: { priceEtb: Number(price), creditHours: hours, isPublished: published, blocks: stripKeys(blocks) },
      });
      fill(await api(`/admin/lessons/${lessonId}/self-eval`)); // reload so the saved images/ids are the server's
      setMsg({ kind: 'ok', text: t('common.saved') });
      onChanged();
    } catch (e) { setMsg({ kind: 'err', text: e.message }); } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true); setMsg({ kind: '', text: '' });
    try {
      await api(`/admin/lessons/${lessonId}/self-eval`, { method: 'DELETE' });
      onChanged(); onClose();
    } catch (e) { setMsg({ kind: 'err', text: e.message }); setAskDelete(false); } finally { setBusy(false); }
  };

  if (!data) return <div className="card p-5 text-muted">{msg.text || t('common.loading')}</div>;
  const l = data.lesson;
  return (
    <section className="card p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="eyebrow">{data.selfEval ? t('selfEvalAdmin.editing') : t('selfEvalAdmin.newDoc')}</span>
          <h2 className="text-lg font-semibold">{loc(l, 'title')}</h2>
          <p className="text-sm text-muted">{loc({ title: l.courseTitle, titleAm: l.courseTitleAm }, 'title')}</p>
          {data.buyers > 0 && <p className="text-xs text-teal-soft mt-1">{t('selfEvalAdmin.buyers', { n: data.buyers })}</p>}
        </div>
        <button type="button" className="btn-ghost py-2 px-3 text-sm shrink-0" onClick={onClose}>{t('selfEvalAdmin.close')}</button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 items-start">
        <label className="label">{t('credit.hoursLabel')}
          <input type="number" min="0.1" max="10" step="0.1" className="input" value={hours} placeholder="—" onChange={(e) => setHours(e.target.value)} />
          <span className="text-xs text-muted-dim">{t('selfEvalAdmin.hoursHint')}</span>
          {data.credit?.active && Number(String(hours).replace(',', '.')) > 0 && (
            <span className="text-xs text-teal-soft">{t('credit.example', { h: Number(String(hours).replace(',', '.')), rate: data.credit.rate, price: Math.round(Number(String(hours).replace(',', '.')) * data.credit.rate) })}</span>
          )}
        </label>
        <label className="label">{t('selfEvalAdmin.price')}
          <input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))} />
          <span className="text-xs text-muted">{t('selfEvalAdmin.priceHint', { n: data.defaultPriceEtb })} {t('selfEvalAdmin.priceFallback')}</span>
        </label>
        <label className="flex items-center gap-3 min-h-11 mt-1 sm:mt-6 cursor-pointer sm:col-span-2">
          <input type="checkbox" className="w-5 h-5 accent-teal" checked={published} onChange={(e) => setPublished(e.target.checked)} />
          <span className="text-sm">{t('selfEvalAdmin.published')}</span>
        </label>
      </div>

      <BlockEditor value={blocks} onChange={setBlocks} labelBase={labels.data?.labelBase} labelBaseAm={labels.data?.labelBaseAm} />

      {msg.text && <p className={`text-sm ${msg.kind === 'err' ? 'text-[#F2A7A0]' : 'text-teal-soft'}`} role={msg.kind === 'err' ? 'alert' : 'status'}>{msg.text}</p>}
      <div className="flex gap-2 flex-wrap items-center">
        <button type="button" className="btn-primary" disabled={busy || price === ''} onClick={save}>{busy ? t('common.loading') : t('common.save')}</button>
        {data.selfEval && !askDelete && data.buyers === 0 && (
          <button type="button" className="btn-ghost text-[#F2A7A0]" disabled={busy} onClick={() => setAskDelete(true)}>{t('common.delete')}</button>
        )}
        {askDelete && (
          <>
            <span className="text-sm">{t('selfEvalAdmin.deleteConfirm')}</span>
            <button type="button" className="btn-ghost text-[#F2A7A0]" disabled={busy} onClick={remove}>{t('selfEvalAdmin.yesDelete')}</button>
            <button type="button" className="btn-ghost" onClick={() => setAskDelete(false)}>{t('tokens.no')}</button>
          </>
        )}
      </div>
      {data.selfEval && data.buyers > 0 && <p className="text-xs text-muted">{t('selfEvalAdmin.noDeleteHint')}</p>}
    </section>
  );
}

export default function SelfEvals() {
  const { t, loc } = useI18n();
  const [q, setQ] = useState('');
  const [lessonId, setLessonId] = useState(null);
  const search = useSearch(q, { courses: 1, lessons: 30 });
  const list = useApi('/admin/self-evals');
  const hits = search.data?.lessons || [];

  return (
    <div className="flex flex-col gap-6 max-w-4xl w-full">
      <header className="flex flex-col gap-1.5">
        <h1 className="text-3xl font-semibold">{t('selfEvalAdmin.title')}</h1>
        <p className="text-muted-soft">{t('selfEvalAdmin.intro')}</p>
      </header>

      {lessonId && <Editor lessonId={lessonId} onChanged={list.reload} onClose={() => setLessonId(null)} />}

      <section className="card p-4 flex flex-col gap-3">
        <label className="label">{t('selfEvalAdmin.findLesson')}
          <input type="search" className="input" value={q} placeholder={t('selfEval.searchPlaceholder')} onChange={(e) => setQ(e.target.value)} />
        </label>
        {search.active && !search.loading && hits.length === 0 && <p className="text-sm text-muted">{t('selfEval.noResults')}</p>}
        <ul className="flex flex-col">
          {hits.map((h) => (
            <li key={h.id} className="border-b border-line last:border-0">
              <button type="button" className="w-full text-left flex items-start gap-3 py-3 min-h-11 hover:bg-ink rounded-lg px-2"
                onClick={() => { setLessonId(h.id); window.scrollTo(0, 0); }}>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm">{loc(h, 'title')}</span>
                  <span className="block text-xs text-muted truncate">{loc({ title: h.courseTitle, titleAm: h.courseTitleAm }, 'title')}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-4 flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{t('selfEvalAdmin.prepared')}</h2>
        {list.data?.length === 0 && <p className="text-sm text-muted">{t('selfEvalAdmin.none')}</p>}
        {list.data?.map((e) => (
          <button key={e.id} type="button" onClick={() => { setLessonId(e.lessonId); window.scrollTo(0, 0); }}
            className="w-full text-left flex items-start gap-3 py-3 min-h-11 border-b border-line last:border-0 hover:bg-ink rounded-lg px-2">
            <span className="min-w-0 flex-1">
              <span className="block text-sm">{loc(e, 'title') || '—'}</span>
              <span className="block text-xs text-muted truncate">{loc({ title: e.courseTitle, titleAm: e.courseTitleAm }, 'title')}</span>
            </span>
            <span className="text-xs text-right shrink-0 flex flex-col gap-0.5">
              <span className="text-teal-soft">{t('tokens.count', { n: Number(e.priceEtb).toLocaleString('en-US') })}</span>
              {!e.isPublished && <span className="text-[#F2D98A]">{t('selfEvalAdmin.hidden')}</span>}
              {e.buyers > 0 && <span className="text-muted">{t('selfEvalAdmin.buyers', { n: e.buyers })}</span>}
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
