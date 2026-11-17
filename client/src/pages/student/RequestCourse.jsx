import { useState } from 'react';
import { api, useApi, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import StatusPill from '../../components/StatusPill.jsx';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function RequestCourse() {
  const { t } = useI18n();
  const mine = useApi('/course-requests');
  const [f, setF] = useState({ topic: '', level: 'Beginner', description: '' });
  const [msg, setMsg] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api('/course-requests', { method: 'POST', body: f });
      setMsg({ ok: true, text: t('request.thanks') });
      setF({ topic: '', level: 'Beginner', description: '' });
      mine.reload();
    } catch (err) { setMsg({ ok: false, text: err.message }); }
  };

  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-semibold">{t('request.title')}</h1>
        <p className="text-muted mt-1">{t('request.subtitle')}</p>
      </div>
      <form onSubmit={submit} className="card p-6 flex flex-col gap-4">
        <label className="label">{t('request.topic')}<input className="input" required value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })} placeholder={t('request.topicPh')} /></label>
        <label className="label">{t('request.level')}
          <select className="input" value={f.level} onChange={(e) => setF({ ...f, level: e.target.value })}>
            {LEVELS.map((l) => <option key={l} value={l}>{t(`request.levels.${l}`)}</option>)}
          </select>
        </label>
        <label className="label">{t('request.cover')}<textarea className="input min-h-32" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></label>
        {msg && <p className={`text-sm ${msg.ok ? 'text-mint' : 'text-[#F2A7A0]'}`} role="status">{msg.text}</p>}
        <button className="btn-primary self-start">{t('request.send')}</button>
      </form>
      {mine.data?.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{t('request.yours')}</h2>
          {mine.data.map((r) => (
            <div key={r.id} className="card p-4 flex justify-between gap-3 flex-wrap">
              <span>{r.topic} <span className="text-xs text-muted-dim ml-2">{fmtDate(r.createdAt, false)}</span></span><StatusPill status={r.status} />
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
