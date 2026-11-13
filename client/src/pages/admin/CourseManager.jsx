import { useState } from 'react';
import { api, useApi, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import Icon from '../../components/Icon.jsx';

const EMPTY = {
  title: '', titleAm: '', summary: '', summaryAm: '', learningOutcomes: '', deliverables: '',
  evaluationCriteria: [{ criterion: '', weight: 25 }], isFree: false, priceEtb: 0, isPublished: false, submissionLink: '',
};

export default function CourseManager() {
  const { t, loc } = useI18n();
  const tree = useApi('/admin/curriculum');
  const contact = useApi('/contact');
  const [sel, setSel] = useState(null);
  const [newCat, setNewCat] = useState({ title: '', titleAm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  const pick = (course) => { setSel(structuredClone(course)); setMsg(''); setErr(''); };
  const set = (patch) => setSel({ ...sel, ...patch });

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.title.trim()) return;
    await api('/admin/categories', { method: 'POST', body: newCat });
    setNewCat({ title: '', titleAm: '' }); tree.reload();
  };

  const save = async () => {
    setErr(''); setMsg('');
    try {
      if (sel.id) await api(`/admin/courses/${sel.id}`, { method: 'PUT', body: sel });
      else { const { id, slug } = await api('/admin/courses', { method: 'POST', body: sel }); setSel({ ...sel, id, slug }); }
      setMsg(t('common.saved')); tree.reload();
    } catch (e) { setErr(e.message); }
  };

  const remove = async () => {
    if (!window.confirm(t('admin.courses.deleteConfirm', { title: sel.title }))) return;
    await api(`/admin/courses/${sel.id}`, { method: 'DELETE' });
    setSel(null); tree.reload();
  };

  const crit = sel?.evaluationCriteria || [];
  const weightTotal = crit.reduce((s, k) => s + Number(k.weight || 0), 0);
  const current = sel?.id && tree.data?.flatMap((c) => c.courses).find((c) => c.id === sel.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">{t('admin.courses.title')}</h1>
      <div className="grid xl:grid-cols-[340px_1fr] gap-6 items-start">
        <aside className="card p-4 flex flex-col gap-4">
          {tree.data?.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between gap-2">
                <span className="eyebrow">{loc(cat, 'title')}</span>
                <button className="text-xs text-teal-soft hover:text-mint shrink-0" onClick={() => pick({ ...EMPTY, category: cat.id })}>{t('admin.courses.addCourse')}</button>
              </div>
              <ul className="mt-1.5">
                {cat.courses.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => pick(c)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between gap-2 ${sel?.id === c.id ? 'bg-teal-active text-white' : 'hover:bg-ink text-muted-soft'}`}>
                      <span>
                        {loc(c, 'title')}
                        {c.isFree && <span className="text-xs text-teal-soft"> · {t('common.free')}</span>}
                        {!c.isPublished && <span className="text-xs text-muted-dim"> · {t('admin.courses.draft')}</span>}
                      </span>
                      <span className="text-xs text-muted">{c.lessons.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <form onSubmit={addCategory} className="flex flex-col gap-2 border-t border-line pt-4">
            <input className="input py-2 text-sm" placeholder={t('admin.courses.newGroup')} aria-label={t('admin.courses.newGroup')} value={newCat.title} onChange={(e) => setNewCat({ ...newCat, title: e.target.value })} />
            <input className="input py-2 text-sm" placeholder={t('admin.courses.newGroupAm')} aria-label={t('admin.courses.newGroupAm')} value={newCat.titleAm} onChange={(e) => setNewCat({ ...newCat, titleAm: e.target.value })} />
            <button className="btn-ghost py-2">{t('common.add')}</button>
          </form>
        </aside>

        {!sel ? <p className="text-muted">{t('admin.courses.selectHint')}</p> : (
          <div className="flex flex-col gap-6 min-w-0">
            <section className="card p-6 flex flex-col gap-4">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-lg font-semibold">{sel.id ? t('admin.courses.editCourse') : t('admin.courses.newCourseTitle')}</h2>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal w-4 h-4" checked={!!sel.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} />{t('admin.courses.published')}</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="label">{t('admin.courses.titleEn')}<input className="input" value={sel.title} onChange={(e) => set({ title: e.target.value })} /></label>
                <label className="label">{t('admin.courses.titleAm')}<input className="input" lang="am" value={sel.titleAm || ''} onChange={(e) => set({ titleAm: e.target.value })} /></label>
                <label className="label">{t('admin.courses.group')}
                  <select className="input" value={sel.category} onChange={(e) => set({ category: e.target.value })}>
                    {tree.data?.map((c) => <option key={c.id} value={c.id}>{loc(c, 'title')}</option>)}
                  </select>
                </label>
                <label className="label">{t('admin.courses.submissionLink')}
                  <select className="input" value={sel.submissionLink || ''} onChange={(e) => set({ submissionLink: e.target.value })}>
                    <option value="">{t('admin.courses.useDefault')}</option>
                    {contact.data?.submissionLinks.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </label>
              </div>

              <div className="rounded-xl bg-ink p-4 flex flex-wrap items-end gap-4">
                <label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" className="accent-teal w-4 h-4" checked={!!sel.isFree} onChange={(e) => set({ isFree: e.target.checked })} />{t('admin.courses.free')}</label>
                {!sel.isFree && (
                  <label className="label w-48">{t('admin.courses.price')}<input type="number" min="0" className="input" value={sel.priceEtb} onChange={(e) => set({ priceEtb: Number(e.target.value) })} /></label>
                )}
                <span className="text-sm text-muted">{t('admin.courses.studentsSee', { price: sel.isFree ? t('common.free') : sel.priceEtb ? etb(sel.priceEtb) : t('common.priceSoon') })}</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="label">{t('admin.courses.summaryEn')}<textarea className="input min-h-20" value={sel.summary || ''} onChange={(e) => set({ summary: e.target.value })} /></label>
                <label className="label">{t('admin.courses.summaryAm')}<textarea className="input min-h-20" lang="am" value={sel.summaryAm || ''} onChange={(e) => set({ summaryAm: e.target.value })} /></label>
              </div>
              <label className="label">{t('admin.courses.outcomes')}<textarea className="input min-h-20" value={sel.learningOutcomes || ''} onChange={(e) => set({ learningOutcomes: e.target.value })} /></label>
              <label className="label">{t('admin.courses.deliverables')}<textarea className="input min-h-20" value={sel.deliverables || ''} onChange={(e) => set({ deliverables: e.target.value })} /></label>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm text-muted mb-2">{t('admin.courses.criteria')} <span className={weightTotal === 100 ? 'text-teal-soft' : 'text-[#F2D98A]'}>({t('admin.courses.total', { n: weightTotal })})</span></legend>
                {crit.map((k, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px_44px] gap-2">
                    <input aria-label={t('admin.courses.criterion')} placeholder={t('admin.courses.criterion')} className="input py-2" value={k.criterion}
                      onChange={(e) => set({ evaluationCriteria: crit.map((x, j) => (j === i ? { ...x, criterion: e.target.value } : x)) })} />
                    <input aria-label={t('admin.courses.weight')} type="number" className="input py-2" value={k.weight}
                      onChange={(e) => set({ evaluationCriteria: crit.map((x, j) => (j === i ? { ...x, weight: Number(e.target.value) } : x)) })} />
                    <button type="button" aria-label={t('common.remove')} className="btn-ghost p-0" onClick={() => set({ evaluationCriteria: crit.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="text-sm text-teal-soft self-start" onClick={() => set({ evaluationCriteria: [...crit, { criterion: '', weight: 0 }] })}>{t('admin.courses.addCriterion')}</button>
              </fieldset>
              {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn-primary" onClick={save}>{t('admin.courses.saveCourse')}</button>
                {sel.id && <button className="btn-danger" onClick={remove}>{t('common.delete')}</button>}
                {msg && <span className="text-sm text-mint" role="status">{msg}</span>}
              </div>
            </section>
            {sel.id && current && <Lessons course={current} onChange={tree.reload} />}
          </div>
        )}
      </div>
    </div>
  );
}

const CHUNK = 20 * 1024 * 1024; // 20 MB pieces: large videos upload reliably and show progress

/** Upload a file straight from this browser to Cloudinary, in chunks, using a signature from our server. */
async function uploadToCloudinary(file, kind, onProgress) {
  const sig = await api('/admin/cloudinary/sign', { method: 'POST', body: { kind } });
  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/${sig.resourceType}/upload`;
  const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let result;
  for (let start = 0; start < file.size; start += CHUNK) {
    const end = Math.min(start + CHUNK, file.size);
    const fd = new FormData();
    fd.append('file', file.slice(start, end), file.name);
    fd.append('api_key', sig.apiKey);
    fd.append('signature', sig.signature);
    Object.entries(sig.params).forEach(([k, v]) => fd.append(k, v));
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'X-Unique-Upload-Id': uploadId, 'Content-Range': `bytes ${start}-${end - 1}/${file.size}` },
      body: fd,
    });
    result = await res.json();
    if (!res.ok || result.error) throw new Error(result.error?.message || 'Upload failed');
    onProgress(Math.round((end / file.size) * 100));
  }
  return result;
}

const mb = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '');
const mins = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');

function Lessons({ course, onChange }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ title: '', publicId: '', kind: 'video', isPreview: false });
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState(null);

  const pickFile = async (file) => {
    if (!file) return;
    const kind = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'video';
    setErr(''); setProgress(0);
    try {
      const r = await uploadToCloudinary(file, kind, setProgress);
      setForm((f) => ({ ...f, kind, publicId: r.public_id, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch (e) { setErr(`${t('admin.courses.uploadFailed')} ${e.message}`); }
    setProgress(null);
  };

  const add = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/admin/lessons', { method: 'POST', body: { ...form, course: course.id } });
      setForm({ title: '', publicId: '', kind: 'video', isPreview: false }); onChange();
    } catch (e2) { setErr(e2.message); }
  };
  const del = async (id) => { await api(`/admin/lessons/${id}`, { method: 'DELETE' }); onChange(); };
  const togglePreview = async (l) => { await api(`/admin/lessons/${l.id}`, { method: 'PUT', body: { title: l.title, isPreview: !l.isPreview } }); onChange(); };

  return (
    <section className="card p-6 flex flex-col gap-5">
      <h2 className="text-lg font-semibold">{t('admin.courses.lessons')}</h2>
      <ul className="flex flex-col">
        {course.lessons.map((l, i) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-line last:border-0 text-sm">
            <span className="flex flex-wrap items-center gap-2 min-w-0"><Icon name={l.kind === 'pdf' ? 'file' : 'play'} size={15} />{i + 1}. {l.title}
              <span className="text-xs text-muted-dim">{[mins(l.durationSec), mb(l.bytes)].filter(Boolean).join(' · ')}</span>
              {l.cloudDeliveryType === 'upload' && <span className="text-xs text-[#F2D98A]" title={t('admin.courses.publicFileTip')}>{t('admin.courses.publicFile')}</span>}
            </span>
            <span className="flex gap-2">
              <button className={`px-3 py-2 rounded-lg text-xs border ${l.isPreview ? 'border-teal text-mint' : 'border-line-strong text-muted'}`} onClick={() => togglePreview(l)}>
                {l.isPreview ? t('admin.courses.freePreview') : t('admin.courses.locked')}
              </button>
              <button className="px-3 py-2 rounded-lg text-xs border border-[#5A3A37] text-[#F2A7A0]" onClick={() => del(l.id)}>{t('common.remove')}</button>
            </span>
          </li>
        ))}
        {course.lessons.length === 0 && <li className="text-sm text-muted">{t('admin.courses.noLessons')}</li>}
      </ul>

      <form onSubmit={add} className="grid lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-3">
          <label className="label">{t('admin.courses.uploadLabel')}
            <span className="border border-dashed border-[#3A5550] rounded-xl p-5 flex flex-col gap-2 items-start">
              <input type="file" accept="video/*,application/pdf" disabled={progress !== null} onChange={(e) => pickFile(e.target.files[0])} className="text-sm text-muted-soft" />
              <span className="text-xs text-muted-dim">{t('admin.courses.uploadNote')}</span>
            </span>
          </label>
          {progress !== null && (
            <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-2 bg-line rounded-full"><div className="h-2 bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="text-xs text-muted mt-1">{t('admin.courses.uploading', { p: progress })}</p>
            </div>
          )}
          <label className="label">{t('admin.courses.pasteId')}
            <input className="input font-mono text-sm" value={form.publicId} onChange={(e) => setForm({ ...form, publicId: e.target.value })} placeholder="becoming-an-artist/lessons/abc123" />
          </label>
        </div>
        <div className="flex flex-col gap-3">
          <label className="label">{t('admin.courses.lessonTitle')}<input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="label">{t('admin.courses.type')}
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="video">{t('admin.courses.video')}</option><option value="pdf">{t('admin.courses.pdf')}</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal w-4 h-4" checked={form.isPreview} onChange={(e) => setForm({ ...form, isPreview: e.target.checked })} />{t('admin.courses.previewForAll')}</label>
          {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
          <button className="btn-primary self-start" disabled={!form.publicId || progress !== null}>{t('admin.courses.addLesson')}</button>
        </div>
      </form>
    </section>
  );
}
