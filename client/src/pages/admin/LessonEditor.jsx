import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import BlockEditor, { withKeys, stripKeys } from '../../components/BlockEditor.jsx';

// Lesson editor on its own page (opens in a new window from Admin > Courses): /admin/lessons/:id/edit
export default function LessonEditor() {
  const { id } = useParams();
  const { t } = useI18n();
  const curriculum = useApi('/admin/curriculum');
  const labels = useApi(`/admin/lessons/${id}/label-base`, [id]);
  const [form, setForm] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [msg, setMsg] = useState({ text: '', error: false });

  useEffect(() => {
    if (!curriculum.data || form) return;
    for (const cat of curriculum.data) for (const c of cat.courses) {
      const l = c.lessons.find((x) => String(x.id) === id);
      if (l) {
        setLessonTitle(`${c.title} › ${l.title}`);
        setForm({ blocks: withKeys(l.blocks), keywords: l.keywords || '', keywordsAm: l.keywordsAm || '', subtitle: l.subtitle || '', subtitleAm: l.subtitleAm || '' });
        return;
      }
    }
  }, [curriculum.data, form, id]);

  if (curriculum.error || (curriculum.data && !form)) return <p className="text-muted">{t('blocks.lessonMissing')}</p>;
  if (!form) return <p className="text-muted">{t('common.loading')}</p>;

  const save = async () => {
    setMsg({ text: '', error: false });
    try {
      await api(`/admin/lessons/${id}`, { method: 'PUT', body: { blocks: stripKeys(form.blocks), keywords: form.keywords, keywordsAm: form.keywordsAm, subtitle: form.subtitle, subtitleAm: form.subtitleAm } });
      setMsg({ text: t('common.saved'), error: false });
    } catch (e) { setMsg({ text: e.message, error: true }); }
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <span className="eyebrow">{t('blocks.editorTitle')}</span>
        <h1 className="text-2xl font-semibold mt-1">{lessonTitle}</h1>
      </div>
      <div className="card p-5 flex flex-col gap-4">
        <div className="grid md:grid-cols-2 gap-3">
          <label className="label">{t('admin.courses.subtitle')}<input className="input" maxLength={300} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></label>
          <label className="label">{t('admin.courses.subtitleAm')}<input className="input" lang="am" maxLength={300} value={form.subtitleAm} onChange={(e) => setForm({ ...form, subtitleAm: e.target.value })} /></label>
          <label className="label">{t('admin.courses.keywords')}<input className="input" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></label>
          <label className="label">{t('admin.courses.keywordsAm')}<input className="input" lang="am" value={form.keywordsAm} onChange={(e) => setForm({ ...form, keywordsAm: e.target.value })} /></label>
          <p className="text-xs text-muted md:col-span-2">{t('admin.courses.keywordsHint')}</p>
        </div>
        <BlockEditor value={form.blocks} onChange={(blocks) => setForm({ ...form, blocks })} labelBase={labels.data?.labelBase} labelBaseAm={labels.data?.labelBaseAm} />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-primary py-2" onClick={save}>{t('blocks.saveContent')}</button>
          <button className="btn-ghost py-2" onClick={() => window.close()}>{t('blocks.closeWindow')}</button>
          {msg.text && <span role="status" className={`text-sm ${msg.error ? 'text-[#F2A7A0]' : 'text-mint'}`}>{msg.text}</span>}
        </div>
      </div>
    </div>
  );
}
