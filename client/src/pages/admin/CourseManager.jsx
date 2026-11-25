import { useEffect, useMemo, useState } from 'react';
import { api, useApi, etb } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import Icon from '../../components/Icon.jsx';
import CategoryTree from '../../components/CategoryTree.jsx';
import ImageUploader, { AccountSelect } from '../../components/ImageUploader.jsx';
import BlockEditor, { withKeys, stripKeys } from '../../components/BlockEditor.jsx';
import { useConfirmDelete } from '../../components/ConfirmDelete.jsx';
import { buildTree, flatten, subtreeIds, indexTree } from '../../lib/tree.js';

const EMPTY_COURSE = {
  title: '', titleAm: '', summary: '', summaryAm: '', learningOutcomes: '', deliverables: '', keywords: '', keywordsAm: '',
  evaluationCriteria: [{ criterion: '', weight: 25 }], isFree: false, priceEtb: 0, isPublished: false, submissionLink: '',
};
const EMPTY_GROUP = { title: '', titleAm: '', description: '', descriptionAm: '', parent: null, isFree: false, priceEtb: 0, monthlyPriceEtb: 0, slides: [] };

export default function CourseManager() {
  const { t, loc } = useI18n();
  const flat = useApi('/admin/curriculum');
  const contact = useApi('/contact');
  const pricing = useApi('/pricing');
  const credit = pricing.data?.credit || { active: false, rate: 0, defaultHours: 1 };
  const roots = useMemo(() => buildTree(flat.data || []), [flat.data]);
  const index = useMemo(() => indexTree(roots), [roots]);
  const [expanded, setExpanded] = useState(() => new Set());
  const [sel, setSel] = useState(null);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (flat.data && expanded.size === 0) setExpanded(new Set(roots.map((r) => r.id)));
  }, [flat.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (id) => setExpanded((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const expandPath = (id) => setExpanded((s) => {
    const n = new Set(s);
    let cur = id;
    while (cur) { n.add(cur); cur = index.get(cur)?.parent; }
    return n;
  });
  const clear = () => { setMsg(''); setErr(''); };
  const pickGroup = (g) => { clear(); setSel({ type: 'group', data: { ...EMPTY_GROUP, ...structuredClone({ ...g, children: undefined, courses: undefined }) } }); };
  const pickCourse = (c) => { clear(); setSel({ type: 'course', data: structuredClone(c) }); };
  const newSub = (parent) => { clear(); expandPath(parent?.id); setSel({ type: 'group', data: { ...EMPTY_GROUP, parent: parent?.id || null } }); };
  const newCourse = (g) => { clear(); expandPath(g.id); setSel({ type: 'course', data: { ...EMPTY_COURSE, category: g.id } }); };

  const { ask: askDelete, dialog: deleteDialog } = useConfirmDelete();
  const deleteGroup = (g) => askDelete(t('explorer.deleteGroupConfirm', { name: loc(g, 'title') }), async (password) => {
    await api(`/admin/categories/${g.id}`, { method: 'DELETE', body: { password } });
    if (sel && (sel.data.id === g.id || subtreeIds(g).has(sel.data.category))) setSel(null);
    flat.reload();
  });

  const allCourses = (flat.data || []).flatMap((c) => c.courses);
  const currentCourse = sel?.type === 'course' && sel.data.id && allCourses.find((c) => c.id === sel.data.id);

  return (
    <div className="flex flex-col gap-6">
      {deleteDialog}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">{t('admin.courses.title')}</h1>
          <p className="text-sm text-muted mt-1">{t('explorer.hint')}</p>
        </div>
        <button className="btn-primary" onClick={() => newSub(null)}><Icon name="folderPlus" size={16} />{t('explorer.newMajor')}</button>
      </div>
      <div className="grid xl:grid-cols-[380px_1fr] gap-6 items-start">
        <aside className="card p-3 flex flex-col gap-2 xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)] xl:overflow-y-auto">
          <div className="flex items-center justify-between gap-2 px-1">
            <span className="eyebrow">{t('explorer.title')}</span>
            <span className="flex gap-1">
              <button type="button" className="text-xs text-teal-soft px-2 py-2" onClick={() => setExpanded(new Set((flat.data || []).map((c) => c.id)))}>{t('explorer.expandAll')}</button>
              <button type="button" className="text-xs text-muted px-2 py-2" onClick={() => setExpanded(new Set())}>{t('explorer.collapseAll')}</button>
            </span>
          </div>
          {roots.length === 0 && flat.data && <p className="text-sm text-muted p-2">{t('explorer.empty')}</p>}
          <CategoryTree roots={roots} expanded={expanded} onToggle={toggle} selected={sel ? { type: sel.type, id: sel.data.id } : null}
            onSelectGroup={pickGroup} onSelectCourse={pickCourse} onAddSub={newSub} onAddCourse={newCourse} onDelete={deleteGroup} />
        </aside>

        {!sel ? <p className="text-muted">{t('admin.courses.selectHint')}</p> : sel.type === 'group' ? (
          <GroupEditor key={sel.data.id || `new-${sel.data.parent}`} group={sel.data} roots={roots} index={index} credit={credit}
            onSaved={(id) => { flat.reload(); expandPath(id); }} msg={msg} setMsg={setMsg} err={err} setErr={setErr}
            onDelete={() => deleteGroup(index.get(sel.data.id).node)} />
        ) : (
          <div className="flex flex-col gap-6 min-w-0">
            <CourseEditor key={sel.data.id || `new-${sel.data.category}`} course={sel.data} roots={roots} links={contact.data?.submissionLinks || []} credit={credit}
              onSaved={(c) => { setSel({ type: 'course', data: c }); flat.reload(); expandPath(c.category); }}
              onDeleted={() => { setSel(null); flat.reload(); }} />
            {currentCourse && <Lessons course={currentCourse} onChange={flat.reload} credit={credit} />}
          </div>
        )}
      </div>
    </div>
  );
}

function TreeOptions({ roots, exclude = new Set() }) {
  const { loc } = useI18n();
  return flatten(roots).map((n) => (
    <option key={n.id} value={n.id} disabled={exclude.has(n.id)}>{`${'   '.repeat(n.depth)}${n.depth ? '└ ' : ''}${loc(n, 'title')}`}</option>
  ));
}

function GroupEditor({ group, roots, index, credit, onSaved, onDelete, msg, setMsg, err, setErr }) {
  const { t, loc } = useI18n();
  const [g, setG] = useState(group);
  const set = (patch) => setG((x) => ({ ...x, ...patch }));
  const exclude = g.id && index.get(g.id) ? subtreeIds(index.get(g.id).node) : new Set();
  const parentName = g.parent && index.get(g.parent) ? loc(index.get(g.parent).node, 'title') : '';

  const save = async (data = g) => {
    setErr(''); setMsg('');
    try {
      if (data.id) await api(`/admin/categories/${data.id}`, { method: 'PUT', body: data });
      else { const { id } = await api('/admin/categories', { method: 'POST', body: data }); data = { ...data, id }; setG(data); }
      setMsg(t('common.saved')); onSaved(data.id);
      return data;
    } catch (e) { setErr(e.message); return null; }
  };

  const setSlide = (i, media) => {
    const slides = media ? g.slides.map((s, j) => (j === i ? media : s)) : g.slides.filter((_, j) => j !== i);
    const next = { ...g, slides };
    setG(next);
    if (g.id) save(next);
  };
  const addSlide = (media) => { const next = { ...g, slides: [...g.slides, media] }; setG(next); if (g.id) save(next); };

  return (
    <section className="card p-6 flex flex-col gap-5 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold flex items-center gap-2"><Icon name="folder" />
          {g.id ? `${t('explorer.groupTitle')}: ${loc(g, 'title')}` : parentName ? t('explorer.newSubIn', { name: parentName }) : t('explorer.newGroup')}
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="label">{t('explorer.titleEn')}<input className="input" value={g.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <label className="label">{t('explorer.titleAm')}<input className="input" lang="am" value={g.titleAm || ''} onChange={(e) => set({ titleAm: e.target.value })} /></label>
        <label className="label">{t('explorer.descEn')}<textarea className="input min-h-20" value={g.description || ''} onChange={(e) => set({ description: e.target.value })} /></label>
        <label className="label">{t('explorer.descAm')}<textarea className="input min-h-20" lang="am" value={g.descriptionAm || ''} onChange={(e) => set({ descriptionAm: e.target.value })} /></label>
        <label className="label md:col-span-2">{t('explorer.parent')}
          <select className="input" value={g.parent || ''} onChange={(e) => set({ parent: e.target.value || null })}>
            <option value="">{t('explorer.topLevel')}</option>
            <TreeOptions roots={roots} exclude={exclude} />
          </select>
        </label>
      </div>

      <fieldset className="rounded-xl bg-ink p-4 flex flex-col gap-3">
        <legend className="text-sm text-muted px-1">{t('explorer.pricing')}</legend>
        <label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" className="accent-teal w-4 h-4" checked={!!g.isFree} onChange={(e) => set({ isFree: e.target.checked })} />{t('explorer.freeGroup')}</label>
        {!g.isFree && (
          <div className="grid sm:grid-cols-2 gap-3">
            {credit?.active ? (
              <div className="label">{t('explorer.groupPrice')}
                <div className="rounded-xl border border-teal/40 bg-teal-active/20 p-3 text-sm">
                  <strong className="text-teal-soft">{etb(g.creditPriceEtb || 0)}</strong>
                  <span className="block text-muted-soft mt-1">{t('credit.calcGroup', { hours: g.creditHours || 0 })}</span>
                  <span className="block text-xs text-muted mt-1">{t('credit.calcNote')}</span>
                </div>
              </div>
            ) : (
              <label className="label">{t('explorer.groupPrice')}<input type="number" min="0" className="input" value={g.priceEtb} onChange={(e) => set({ priceEtb: Number(e.target.value) })} /></label>
            )}
            <label className="label">{t('explorer.monthlyPrice')}<input type="number" min="0" className="input" value={g.monthlyPriceEtb} onChange={(e) => set({ monthlyPriceEtb: Number(e.target.value) })} /></label>
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-3">
        <h3 className="font-semibold">{t('explorer.slides')}</h3>
        <p className="text-xs text-muted-dim">{t('explorer.slidesHint')}</p>
        {g.slides.map((s, i) => (
          <ImageUploader key={s.publicId || i} value={s} folder="slides" replaceOnUpload={!!g.id} onChange={(m) => setSlide(i, m)} />
        ))}
        {g.slides.length < 12 && (
          <div className="rounded-xl border border-dashed border-line-strong p-3">
            <span className="text-sm text-muted block mb-2">{t('media.addSlide')}</span>
            <ImageUploader key={`add-${g.slides.length}`} value={null} folder="slides" onChange={(m) => m && addSlide(m)} />
          </div>
        )}
      </div>

      {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
      <div className="flex flex-wrap gap-3 items-center">
        <button className="btn-primary" onClick={() => save()}>{t('explorer.saveGroup')}</button>
        {g.id && <button className="btn-danger" onClick={onDelete}>{t('common.delete')}</button>}
        {msg && <span className="text-sm text-mint" role="status">{msg}</span>}
      </div>
    </section>
  );
}

function CourseEditor({ course, roots, links, credit, onSaved, onDeleted }) {
  const { t } = useI18n();
  const [sel, setSel] = useState(course);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const set = (patch) => setSel((x) => ({ ...x, ...patch }));

  const save = async () => {
    setErr(''); setMsg('');
    try {
      let next = sel;
      if (sel.id) await api(`/admin/courses/${sel.id}`, { method: 'PUT', body: sel });
      else { const { id, slug } = await api('/admin/courses', { method: 'POST', body: sel }); next = { ...sel, id, slug }; setSel(next); }
      setMsg(t('common.saved')); onSaved(next);
    } catch (e) { setErr(e.message); }
  };
  const { ask: askDelete, dialog: deleteDialog } = useConfirmDelete();
  const remove = () => askDelete(t('admin.courses.deleteConfirm', { title: sel.title }), async (password) => {
    await api(`/admin/courses/${sel.id}`, { method: 'DELETE', body: { password } });
    onDeleted();
  });
  const crit = sel.evaluationCriteria || [];
  const weightTotal = crit.reduce((s, k) => s + Number(k.weight || 0), 0);

  return (
    <section className="card p-6 flex flex-col gap-4">
      {deleteDialog}
      <div className="flex flex-wrap justify-between gap-3">
        <h2 className="text-lg font-semibold">{sel.id ? t('admin.courses.editCourse') : t('admin.courses.newCourseTitle')}</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal w-4 h-4" checked={!!sel.isPublished} onChange={(e) => set({ isPublished: e.target.checked })} />{t('admin.courses.published')}</label>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="label">{t('admin.courses.titleEn')}<input className="input" value={sel.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <label className="label">{t('admin.courses.titleAm')}<input className="input" lang="am" value={sel.titleAm || ''} onChange={(e) => set({ titleAm: e.target.value })} /></label>
        <label className="label">{t('explorer.groupTitle')}
          <select className="input" value={sel.category} onChange={(e) => set({ category: e.target.value })}><TreeOptions roots={roots} /></select>
        </label>
        <label className="label">{t('admin.courses.submissionLink')}
          <select className="input" value={sel.submissionLink || ''} onChange={(e) => set({ submissionLink: e.target.value })}>
            <option value="">{t('admin.courses.useDefault')}</option>
            {links.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </label>
      </div>

      <div className="rounded-xl bg-ink p-4 flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm min-h-11"><input type="checkbox" className="accent-teal w-4 h-4" checked={!!sel.isFree} onChange={(e) => set({ isFree: e.target.checked })} />{t('admin.courses.free')}</label>
        {!sel.isFree && !credit?.active && (
          <label className="label w-48">{t('admin.courses.price')}<input type="number" min="0" className="input" value={sel.priceEtb} onChange={(e) => set({ priceEtb: Number(e.target.value) })} /></label>
        )}
        {!sel.isFree && credit?.active && (
          <div className="text-sm">
            <strong className="text-teal-soft">{etb(sel.creditPriceEtb || 0)}</strong>
            <span className="block text-muted-soft">{t('credit.calcCourse', { price: etb(sel.creditPriceEtb || 0), hours: sel.creditHoursTotal || 0 })}</span>
            <span className="block text-xs text-muted">{t('credit.calcNote')}</span>
          </div>
        )}
        <span className="text-sm text-muted">{t('admin.courses.studentsSee', { price: sel.isFree ? t('common.free') : (credit?.active ? sel.creditPriceEtb : sel.priceEtb) ? etb(credit?.active ? sel.creditPriceEtb : sel.priceEtb) : t('common.priceSoon') })}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="label">{t('admin.courses.summaryEn')}<textarea className="input min-h-20" value={sel.summary || ''} onChange={(e) => set({ summary: e.target.value })} /></label>
        <label className="label">{t('admin.courses.summaryAm')}<textarea className="input min-h-20" lang="am" value={sel.summaryAm || ''} onChange={(e) => set({ summaryAm: e.target.value })} /></label>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="label">{t('admin.courses.keywords')}<input className="input" value={sel.keywords || ''} onChange={(e) => set({ keywords: e.target.value })} /></label>
        <label className="label">{t('admin.courses.keywordsAm')}<input className="input" lang="am" value={sel.keywordsAm || ''} onChange={(e) => set({ keywordsAm: e.target.value })} /></label>
        <p className="text-xs text-muted md:col-span-2">{t('admin.courses.keywordsHint')}</p>
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
  );
}

const CHUNK = 20 * 1024 * 1024;
async function uploadToCloudinary(file, kind, account, onProgress) {
  const sig = await api('/admin/cloudinary/sign', { method: 'POST', body: { kind, account } });
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
  return { ...result, account: sig.account };
}

const mb = (b) => (b ? `${(b / 1048576).toFixed(1)} MB` : '');
const mins = (s) => (s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : '');
/** Credit-hours box used when adding a lesson and when editing one. Shows the price it makes once the rate is set. */
function CreditHoursField({ value, onChange, credit }) {
  const { t } = useI18n();
  const n = Number(String(value).replace(',', '.'));
  const hours = value === '' || value == null ? Number(credit?.defaultHours) || 1 : n;
  const price = credit?.active && hours > 0 ? Math.round(hours * credit.rate) : null;
  return (
    <label className="label">{t('credit.hoursLabel')}
      <input type="number" min="0.1" max="10" step="0.1" className="input" value={value ?? ''} placeholder={String(credit?.defaultHours ?? 1)}
        onChange={(e) => onChange(e.target.value)} />
      <span className="text-xs text-muted-dim">{t('credit.hoursHint', { n: credit?.defaultHours ?? 1 })}</span>
      {price != null && <span className="text-xs text-teal-soft">{t('credit.example', { h: hours, rate: credit.rate, price })}</span>}
    </label>
  );
}

const EMPTY_LESSON = { title: '', creditHours: '', subtitle: '', subtitleAm: '', keywords: '', keywordsAm: '', publicId: '', kind: 'blocks', isPreview: false, account: 'env', blocks: [] };

function Lessons({ course, onChange, credit }) {
  const { t } = useI18n();
  const [form, setForm] = useState(EMPTY_LESSON);
  const [uploadAccount, setUploadAccount] = useState('primary');
  const [err, setErr] = useState('');
  const [progress, setProgress] = useState(null);
  const [editing, setEditing] = useState(null);
  const [newsMsg, setNewsMsg] = useState({ id: '', text: '', error: false });
  const [fmt, setFmt] = useState('pdf');
  const [exp, setExp] = useState({ id: '', busy: false, text: '', error: false });
  const fileMode = form.kind !== 'blocks';

  const pickFile = async (file) => {
    if (!file) return;
    const kind = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'video';
    setErr(''); setProgress(0);
    try {
      const r = await uploadToCloudinary(file, kind, uploadAccount, setProgress);
      setForm((f) => ({ ...f, kind, publicId: r.public_id, account: r.account, title: f.title || file.name.replace(/\.[^.]+$/, '') }));
    } catch (e) { setErr(`${t('admin.courses.uploadFailed')} ${e.message}`); }
    setProgress(null);
  };

  const add = async (e) => {
    e.preventDefault(); setErr('');
    try {
      await api('/admin/lessons', { method: 'POST', body: { ...form, blocks: stripKeys(form.blocks), course: course.id } });
      setForm(EMPTY_LESSON); onChange();
    } catch (e2) { setErr(e2.message); }
  };
  const { ask: askDelete, dialog: deleteDialog } = useConfirmDelete();
  const del = (l) => askDelete(`${t('admin.courses.deleteLessonConfirm')}\n"${l.title}"`, async (password) => {
    await api(`/admin/lessons/${l.id}`, { method: 'DELETE', body: { password } });
    onChange();
  });
  const togglePreview = async (l) => { await api(`/admin/lessons/${l.id}`, { method: 'PUT', body: { isPreview: !l.isPreview } }); onChange(); };
  const saveBlocks = async () => {
    setErr('');
    try {
      await api(`/admin/lessons/${editing.id}`, { method: 'PUT', body: { blocks: stripKeys(editing.blocks), creditHours: editing.creditHours, keywords: editing.keywords, keywordsAm: editing.keywordsAm, subtitle: editing.subtitle, subtitleAm: editing.subtitleAm } });
      setEditing(null); onChange();
    }
    catch (e) { setErr(e.message); }
  };
  const addToNews = async (l) => {
    setNewsMsg({ id: l.id, text: '', error: false });
    try { await api(`/admin/lessons/${l.id}/news`, { method: 'POST' }); setNewsMsg({ id: l.id, text: t('admin.courses.addedToNews'), error: false }); }
    catch (e) { setNewsMsg({ id: l.id, text: e.message, error: true }); }
  };
  const sendTelegram = async (l) => {
    setExp({ id: l.id, busy: true, text: '', error: false });
    try {
      const r = await api(`/admin/lessons/${l.id}/export`, { method: 'POST', body: { format: fmt } });
      setExp({ id: l.id, busy: false, error: false, text: t('admin.export.sent', { file: r.filename }) + (r.missingImages ? ` ${t('admin.export.missing', { n: r.missingImages })}` : '') });
    } catch (e) { setExp({ id: l.id, busy: false, text: e.message, error: true }); }
  };
  const lessonIcon = (l) => (l.kind === 'pdf' ? 'file' : l.kind === 'video' ? 'play' : 'text');

  return (
    <section className="card p-6 flex flex-col gap-5">
      {deleteDialog}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{t('admin.courses.lessons')}</h2>
        <label className="flex items-center gap-2 text-xs text-muted">{t('admin.export.format')}
          <select className="input py-1.5 text-xs w-auto" value={fmt} onChange={(e) => setFmt(e.target.value)}>
            <option value="pdf">{t('admin.export.pdf')}</option>
            <option value="html">{t('admin.export.html')}</option>
          </select>
        </label>
      </div>
      <p className="text-xs text-muted leading-relaxed">{t('admin.export.hint')}</p>
      <ul className="flex flex-col">
        {course.lessons.map((l, i) => (
          <li key={l.id} className="py-3 border-b border-line last:border-0 text-sm flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="flex flex-wrap items-center gap-2 min-w-0"><Icon name={lessonIcon(l)} size={15} />{i + 1}. {l.title}
                <span className="text-xs text-muted-dim">{[mins(l.durationSec), mb(l.bytes), l.blocks?.length ? `${l.blocks.length} blocks` : ''].filter(Boolean).join(' · ')}</span>
                <span className="text-xs text-teal-soft" title={t('credit.hoursLabel')}>
                  {t('credit.hoursShort', { n: l.creditHours ?? credit?.defaultHours ?? 1 })}
                  {credit?.active && (l.creditPriceEtb > 0 ? ` · ${t('credit.lessonPrice', { n: l.creditPriceEtb })}` : ` · ${t('credit.notSold')}`)}
                </span>
                {l.cloudDeliveryType === 'upload' && l.kind !== 'blocks' && <span className="text-xs text-[#F2D98A]" title={t('admin.courses.publicFileTip')}>{t('admin.courses.publicFile')}</span>}
              </span>
              <span className="flex flex-wrap gap-2">
                <button className={`px-3 py-2 rounded-lg text-xs border ${l.isPreview ? 'border-teal text-mint' : 'border-line-strong text-muted'}`} onClick={() => togglePreview(l)} aria-pressed={l.isPreview}>
                  {l.isPreview ? t('admin.courses.freePreview') : t('admin.courses.locked')}
                </button>
                <button className="px-3 py-2 rounded-lg text-xs border border-line-strong text-mint" onClick={() => setEditing(editing?.id === l.id ? null : { id: l.id, blocks: withKeys(l.blocks), creditHours: l.creditHours ?? '', keywords: l.keywords || '', keywordsAm: l.keywordsAm || '', subtitle: l.subtitle || '', subtitleAm: l.subtitleAm || '' })}>
                  {t('blocks.editContent')}
                </button>
                <button className="px-3 py-2 rounded-lg text-xs border border-line-strong text-mint" onClick={() => addToNews(l)}>{t('admin.courses.addToNews')}</button>
                {l.kind === 'blocks' && (
                  <button className="px-3 py-2 rounded-lg text-xs border border-line-strong text-mint disabled:opacity-60" disabled={exp.busy} onClick={() => sendTelegram(l)}>
                    {exp.busy && exp.id === l.id ? t('admin.export.sending') : t('admin.export.send')}
                  </button>
                )}
                <button className="px-3 py-2 rounded-lg text-xs border border-[#5A3A37] text-[#F2A7A0]" onClick={() => del(l)}>{t('common.remove')}</button>
              </span>
            </div>
            {exp.id === l.id && exp.text && <p className={`text-xs ${exp.error ? 'text-[#F2A7A0]' : 'text-mint'}`} role="status">{exp.text}</p>}
            {newsMsg.id === l.id && newsMsg.text && <p className={`text-xs ${newsMsg.error ? 'text-[#F2A7A0]' : 'text-mint'}`} role="status">{newsMsg.text}</p>}
            {editing?.id === l.id && (
              <div className="rounded-xl border border-line p-4 flex flex-col gap-3">
                <div className="grid md:grid-cols-2 gap-3">
                  <CreditHoursField value={editing.creditHours} credit={credit} onChange={(v) => setEditing({ ...editing, creditHours: v })} />
                  <label className="label">{t('admin.courses.subtitle')}<input className="input" maxLength={300} value={editing.subtitle} onChange={(e) => setEditing({ ...editing, subtitle: e.target.value })} /></label>
                  <label className="label">{t('admin.courses.subtitleAm')}<input className="input" lang="am" maxLength={300} value={editing.subtitleAm} onChange={(e) => setEditing({ ...editing, subtitleAm: e.target.value })} /></label>
                  <label className="label">{t('admin.courses.keywords')}<input className="input" value={editing.keywords} onChange={(e) => setEditing({ ...editing, keywords: e.target.value })} /></label>
                  <label className="label">{t('admin.courses.keywordsAm')}<input className="input" lang="am" value={editing.keywordsAm} onChange={(e) => setEditing({ ...editing, keywordsAm: e.target.value })} /></label>
                  <p className="text-xs text-muted md:col-span-2">{t('admin.courses.keywordsHint')}</p>
                </div>
                <BlockEditor value={editing.blocks} onChange={(blocks) => setEditing({ ...editing, blocks })} />
                <div className="flex gap-2">
                  <button className="btn-primary py-2" onClick={saveBlocks}>{t('blocks.saveContent')}</button>
                  <button className="btn-ghost py-2" onClick={() => setEditing(null)}>{t('blocks.cancel')}</button>
                </div>
              </div>
            )}
          </li>
        ))}
        {course.lessons.length === 0 && <li className="text-sm text-muted">{t('admin.courses.noLessons')}</li>}
      </ul>

      <form onSubmit={add} className="flex flex-col gap-5 border-t border-line pt-5">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="label">{t('admin.courses.lessonTitle')}<input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
          <fieldset>
            <legend className="text-sm text-muted mb-1.5">{t('blocks.type')}</legend>
            <div className="grid grid-cols-2 gap-2">
              {[['blocks', t('blocks.modular')], ['video', t('blocks.file')]].map(([v, label]) => (
                <label key={v} className={`chip justify-center text-center ${(v === 'blocks') === !fileMode ? 'border-teal bg-teal-active/50 text-white' : 'border-line-strong text-muted-soft'}`}>
                  <input type="radio" name="lesson-kind" className="sr-only" checked={(v === 'blocks') === !fileMode}
                    onChange={() => setForm({ ...form, kind: v, publicId: v === 'blocks' ? '' : form.publicId })} />{label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <CreditHoursField value={form.creditHours} credit={credit} onChange={(v) => setForm({ ...form, creditHours: v })} />
          <label className="label">{t('admin.courses.subtitle')}<input className="input" maxLength={300} value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></label>
          <label className="label">{t('admin.courses.subtitleAm')}<input className="input" lang="am" maxLength={300} value={form.subtitleAm} onChange={(e) => setForm({ ...form, subtitleAm: e.target.value })} /></label>
          <label className="label">{t('admin.courses.keywords')}<input className="input" value={form.keywords} onChange={(e) => setForm({ ...form, keywords: e.target.value })} /></label>
          <label className="label">{t('admin.courses.keywordsAm')}<input className="input" lang="am" value={form.keywordsAm} onChange={(e) => setForm({ ...form, keywordsAm: e.target.value })} /></label>
          <p className="text-xs text-muted md:col-span-2">{t('admin.courses.keywordsHint')}</p>
        </div>

        {fileMode && (
          <div className="grid lg:grid-cols-2 gap-5">
            <div className="flex flex-col gap-3">
              <AccountSelect value={uploadAccount} onChange={setUploadAccount} />
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
            </div>
            <div className="flex flex-col gap-3">
              <label className="label">{t('admin.courses.pasteId')}
                <input className="input font-mono text-sm" value={form.publicId} onChange={(e) => setForm({ ...form, publicId: e.target.value })} placeholder="becoming-an-artist/lessons/abc123" />
              </label>
              <label className="label">{t('admin.courses.type')}
                <select className="input" value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
                  <option value="video">{t('admin.courses.video')}</option><option value="pdf">{t('admin.courses.pdf')}</option>
                </select>
              </label>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {fileMode && <span className="text-sm text-muted">{t('blocks.extra')}</span>}
          <BlockEditor value={form.blocks} onChange={(blocks) => setForm({ ...form, blocks })} />
        </div>

        <label className="flex items-center gap-2 text-sm rounded-xl border border-teal/40 bg-teal-active/30 p-3.5 min-h-11">
          <input type="checkbox" className="accent-teal w-4 h-4" checked={form.isPreview} onChange={(e) => setForm({ ...form, isPreview: e.target.checked })} />
          {t('blocks.previewLesson')}
        </label>
        {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
        <button className="btn-primary self-start" disabled={(fileMode && !form.publicId) || progress !== null || (!fileMode && !form.blocks.length)}>{t('admin.courses.addLesson')}</button>
      </form>
    </section>
  );
}