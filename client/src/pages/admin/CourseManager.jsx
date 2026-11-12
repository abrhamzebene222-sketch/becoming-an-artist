import { useState } from 'react';
import { api, useApi, etb } from '../../api.js';
import Icon from '../../components/Icon.jsx';

const EMPTY = { title: '', summary: '', learning_outcomes: '', deliverables: '', evaluation_criteria: [{ criterion: '', weight: 25 }], price_etb: 0, is_published: false, submission_link_id: '' };

export default function CourseManager() {
  const tree = useApi('/admin/curriculum');
  const contact = useApi('/contact');
  const [sel, setSel] = useState(null);        // course being edited (object) or {new:true, category_id}
  const [newCat, setNewCat] = useState('');
  const [msg, setMsg] = useState('');

  const pick = (course) => { setSel(structuredClone(course)); setMsg(''); };
  const addCategory = async (e) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    await api('/admin/categories', { method: 'POST', body: { title: newCat } });
    setNewCat(''); tree.reload();
  };

  const save = async () => {
    const body = { ...sel, submission_link_id: sel.submission_link_id || null };
    if (sel.id) await api(`/admin/courses/${sel.id}`, { method: 'PUT', body });
    else { const { id } = await api('/admin/courses', { method: 'POST', body }); sel.id = id; }
    setMsg('Saved.'); tree.reload();
  };

  const remove = async () => {
    if (!confirm(`Delete "${sel.title}" and its lessons? Media files on your PC are not touched.`)) return;
    await api(`/admin/courses/${sel.id}`, { method: 'DELETE' });
    setSel(null); tree.reload();
  };

  const weightTotal = sel?.evaluation_criteria.reduce((s, k) => s + Number(k.weight || 0), 0);
  const current = sel?.id && tree.data?.flatMap((c) => c.courses).find((c) => c.id === sel.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold">Courses &amp; media</h1>
      <div className="grid xl:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Hierarchy */}
        <aside className="card p-4 flex flex-col gap-4">
          {tree.data?.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between">
                <span className="eyebrow">{cat.title}</span>
                <button className="text-xs text-teal-soft hover:text-mint" onClick={() => pick({ ...EMPTY, category_id: cat.id })}>+ course</button>
              </div>
              <ul className="mt-1.5">
                {cat.courses.map((c) => (
                  <li key={c.id}>
                    <button onClick={() => pick(c)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm flex justify-between gap-2 ${sel?.id === c.id ? 'bg-teal-active text-white' : 'hover:bg-ink text-muted-soft'}`}>
                      <span>{c.title}{!c.is_published && <span className="text-xs text-muted-dim"> · draft</span>}</span>
                      <span className="text-xs text-muted">{c.lessons.length}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <form onSubmit={addCategory} className="flex gap-2 border-t border-line pt-4">
            <input className="input py-2 text-sm" placeholder="New major group" value={newCat} onChange={(e) => setNewCat(e.target.value)} aria-label="New major group name" />
            <button className="btn-ghost py-2">Add</button>
          </form>
        </aside>

        {/* Editor */}
        {!sel ? <p className="text-muted">Select a course to edit, or add a new one.</p> : (
          <div className="flex flex-col gap-6 min-w-0">
            <section className="card p-6 flex flex-col gap-4">
              <div className="flex flex-wrap justify-between gap-3">
                <h2 className="text-lg font-semibold">{sel.id ? 'Edit course' : 'New course'}</h2>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal w-4 h-4" checked={!!sel.is_published} onChange={(e) => setSel({ ...sel, is_published: e.target.checked })} />Published (students are notified when first published)</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <label className="label">Title<input className="input" value={sel.title} onChange={(e) => setSel({ ...sel, title: e.target.value })} /></label>
                <label className="label">Major group
                  <select className="input" value={sel.category_id} onChange={(e) => setSel({ ...sel, category_id: Number(e.target.value) })}>
                    {tree.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </label>
                <label className="label">Price per course (ETB)<input type="number" min="0" className="input" value={sel.price_etb} onChange={(e) => setSel({ ...sel, price_etb: Number(e.target.value) })} /></label>
                <label className="label">Assignment submission link
                  <select className="input" value={sel.submission_link_id || ''} onChange={(e) => setSel({ ...sel, submission_link_id: e.target.value ? Number(e.target.value) : '' })}>
                    <option value="">Use default link</option>
                    {contact.data?.submissionLinks.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="label">Summary<textarea className="input min-h-20" value={sel.summary} onChange={(e) => setSel({ ...sel, summary: e.target.value })} /></label>
              <label className="label">Learning outcomes<textarea className="input min-h-20" value={sel.learning_outcomes} onChange={(e) => setSel({ ...sel, learning_outcomes: e.target.value })} /></label>
              <label className="label">Expected deliverables<textarea className="input min-h-20" value={sel.deliverables} onChange={(e) => setSel({ ...sel, deliverables: e.target.value })} /></label>

              <fieldset className="flex flex-col gap-2">
                <legend className="text-sm text-muted mb-2">Evaluation criteria <span className={weightTotal === 100 ? 'text-teal-soft' : 'text-[#F2D98A]'}>(total {weightTotal}%)</span></legend>
                {sel.evaluation_criteria.map((k, i) => (
                  <div key={i} className="grid grid-cols-[1fr_90px_44px] gap-2">
                    <input aria-label="Criterion" className="input py-2" value={k.criterion} onChange={(e) => { const a = [...sel.evaluation_criteria]; a[i] = { ...k, criterion: e.target.value }; setSel({ ...sel, evaluation_criteria: a }); }} />
                    <input aria-label="Weight %" type="number" className="input py-2" value={k.weight} onChange={(e) => { const a = [...sel.evaluation_criteria]; a[i] = { ...k, weight: Number(e.target.value) }; setSel({ ...sel, evaluation_criteria: a }); }} />
                    <button type="button" aria-label="Remove criterion" className="btn-ghost p-0" onClick={() => setSel({ ...sel, evaluation_criteria: sel.evaluation_criteria.filter((_, j) => j !== i) })}>×</button>
                  </div>
                ))}
                <button type="button" className="text-sm text-teal-soft self-start" onClick={() => setSel({ ...sel, evaluation_criteria: [...sel.evaluation_criteria, { criterion: '', weight: 0 }] })}>+ Add criterion</button>
              </fieldset>
              <div className="flex flex-wrap gap-3 items-center">
                <button className="btn-primary" onClick={save}>Save course</button>
                {sel.id && <button className="btn-danger" onClick={remove}>Delete</button>}
                {msg && <span className="text-sm text-mint" role="status">{msg}</span>}
                {sel.price_etb > 0 && <span className="text-sm text-muted">Students see: {etb(sel.price_etb)}</span>}
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
    if (!res.ok || result.error) throw new Error(result.error?.message || 'Upload to Cloudinary failed.');
    onProgress(Math.round((end / file.size) * 100));
  }
  return result; // contains public_id
}

const mb = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '');
const mins = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');

function Lessons({ course, onChange }) {
  const [form, setForm] = useState({ title: '', public_id: '', kind: 'video', is_preview: false });
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState(null);

  const pickFile = async (file) => {
    if (!file) return;
    const kind = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'video';
    setErr(''); setProgress(0);
    try {
      const r = await uploadToCloudinary(file, kind, setProgress);
      setForm((f) => ({ ...f, kind, public_id: r.public_id, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch (e) { setErr(e.message); }
    setProgress(null);
  };

  const add = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/admin/lessons', { method: 'POST', body: { ...form, course_id: course.id } });
      setForm({ title: '', public_id: '', kind: 'video', is_preview: false }); onChange();
    } catch (e2) { setErr(e2.message); }
  };
  const del = async (id) => { await api(`/admin/lessons/${id}`, { method: 'DELETE' }); onChange(); };
  const togglePreview = async (l) => { await api(`/admin/lessons/${l.id}`, { method: 'PUT', body: { title: l.title, is_preview: !l.is_preview } }); onChange(); };

  return (
    <section className="card p-6 flex flex-col gap-5">
      <h2 className="text-lg font-semibold">Lessons</h2>
      <ul className="flex flex-col">
        {course.lessons.map((l, i) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 border-b border-line last:border-0 text-sm">
            <span className="flex items-center gap-2 min-w-0"><Icon name={l.kind === 'pdf' ? 'file' : 'play'} size={15} />{i + 1}. {l.title}
              <span className="text-xs text-muted-dim">{[mins(l.duration_sec), mb(l.bytes)].filter(Boolean).join(' · ')}</span>
              {l.cloud_delivery_type === 'upload' && <span className="text-xs text-[#F2D98A]" title="Uploaded as a public asset in Cloudinary: anyone with the link can open it">public file</span>}
            </span>
            <span className="flex gap-2">
              <button className={`px-3 py-1.5 rounded-lg text-xs border ${l.is_preview ? 'border-teal text-mint' : 'border-line-strong text-muted'}`} onClick={() => togglePreview(l)}>{l.is_preview ? 'Free preview' : 'Locked'}</button>
              <button className="px-3 py-1.5 rounded-lg text-xs border border-[#5A3A37] text-[#F2A7A0]" onClick={() => del(l.id)}>Remove</button>
            </span>
          </li>
        ))}
        {course.lessons.length === 0 && <li className="text-sm text-muted">No lessons yet.</li>}
      </ul>

      <form onSubmit={add} className="grid lg:grid-cols-2 gap-5">
        <div className="flex flex-col gap-3">
          <label className="label">1. Upload a video (MP4/MOV/WEBM) or PDF to Cloudinary
            <span className="border border-dashed border-[#3A5550] rounded-xl p-5 flex flex-col gap-2 items-start">
              <input type="file" accept="video/*,application/pdf" disabled={progress !== null}
                onChange={(e) => pickFile(e.target.files[0])} className="text-sm text-muted-soft" />
              <span className="text-xs text-muted-dim">Uploaded privately: students can only open it through the app after paying.</span>
            </span>
          </label>
          {progress !== null && (
            <div role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Upload progress">
              <div className="h-2 bg-line rounded-full"><div className="h-2 bg-teal rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
              <p className="text-xs text-muted mt-1">Uploading… {progress}% (keep this page open)</p>
            </div>
          )}
          <label className="label">…or paste the public ID of a file already in your Cloudinary Media Library
            <input className="input font-mono text-sm" value={form.public_id} onChange={(e) => setForm({ ...form, public_id: e.target.value })} placeholder="becoming-an-artist/lessons/abc123" />
          </label>
        </div>
        <div className="flex flex-col gap-3">
          <label className="label">2. Lesson title<input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <label className="label">Type
            <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="video">Video</option><option value="pdf">PDF document</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal w-4 h-4" checked={form.is_preview} onChange={(e) => setForm({ ...form, is_preview: e.target.checked })} />Free preview for everyone</label>
          {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
          <button className="btn-primary self-start" disabled={!form.public_id || progress !== null}>3. Add lesson</button>
        </div>
      </form>
    </section>
  );
}
