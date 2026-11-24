import { useState } from 'react';
import { api, useApi, fmtDate } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

const EMPTY = { title: '', titleAm: '', summary: '', summaryAm: '', body: '', bodyAm: '', image: null, linkKind: 'none', course: '', linkUrl: '', isActive: true };

/** Admin: write and manage news items. A lesson announcement is made from the lesson itself ("Add to news"). */
export default function AdminNews() {
  const { t, loc } = useI18n();
  const news = useApi('/admin/news');
  const curriculum = useApi('/admin/curriculum');
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const fromLesson = form.linkKind === 'lesson';
  const courses = (curriculum.data || []).flatMap((c) => c.courses || []);

  const reset = () => { setForm(EMPTY); setEditingId(null); setErr(''); };
  const edit = (n) => {
    setEditingId(n.id); setErr('');
    setForm({ ...EMPTY, ...n, course: n.courseId || '', image: n.image || null });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const save = async (e) => {
    e.preventDefault(); setErr(''); setSaving(true);
    try {
      await api(editingId ? `/admin/news/${editingId}` : '/admin/news', { method: editingId ? 'PUT' : 'POST', body: form });
      reset(); news.reload();
    } catch (e2) { setErr(e2.message); }
    setSaving(false);
  };
  const remove = async (n) => {
    if (!window.confirm(t('admin.news.confirmRemove'))) return;
    await api(`/admin/news/${n.id}`, { method: 'DELETE' }).catch(() => {});
    if (editingId === n.id) reset();
    news.reload();
  };
  const toggle = async (n) => {
    await api(`/admin/news/${n.id}`, { method: 'PUT', body: { ...n, course: n.courseId, isActive: !n.isActive } }).catch(() => {});
    news.reload();
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-semibold">{t('admin.news.title')}</h1>
        <p className="text-sm text-muted mt-1">{t('admin.news.hint')}</p>
      </div>

      <form onSubmit={save} className="card p-5 flex flex-col gap-4">
        <h2 className="text-lg font-semibold">{editingId ? t('admin.news.editItem') : t('admin.news.newItem')}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <label className="label">{t('admin.news.titleEn')}<input className="input" required maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} /></label>
          <label className="label">{t('admin.news.titleAm')}<input className="input" lang="am" maxLength={200} value={form.titleAm} onChange={(e) => set({ titleAm: e.target.value })} /></label>
          <label className="label">{t('admin.news.summaryEn')}<textarea className="input min-h-20" maxLength={600} value={form.summary} onChange={(e) => set({ summary: e.target.value })} /></label>
          <label className="label">{t('admin.news.summaryAm')}<textarea className="input min-h-20" lang="am" maxLength={600} value={form.summaryAm} onChange={(e) => set({ summaryAm: e.target.value })} /></label>
          <label className="label">{t('admin.news.bodyEn')}<textarea className="input min-h-32" value={form.body} onChange={(e) => set({ body: e.target.value })} /></label>
          <label className="label">{t('admin.news.bodyAm')}<textarea className="input min-h-32" lang="am" value={form.bodyAm} onChange={(e) => set({ bodyAm: e.target.value })} /></label>
        </div>

        <div className="flex flex-col gap-2">
          <span className="label">{t('admin.news.image')}</span>
          <ImageUploader value={form.image} folder="news" replaceOnUpload onChange={(img) => set({ image: img })} />
        </div>

        {fromLesson ? (
          <p className="text-sm text-muted-soft">{t('admin.news.lessonLinked')}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            <label className="label">{t('admin.news.linkTo')}
              <select className="input" value={form.linkKind} onChange={(e) => set({ linkKind: e.target.value })}>
                <option value="none">{t('admin.news.linkNone')}</option>
                <option value="course">{t('admin.news.linkCourse')}</option>
                <option value="url">{t('admin.news.linkUrl')}</option>
              </select>
            </label>
            {form.linkKind === 'course' && (
              <label className="label">{t('admin.news.linkCourse')}
                <select className="input" required value={form.course} onChange={(e) => set({ course: e.target.value })}>
                  <option value="">{t('admin.news.chooseCourse')}</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{loc(c, 'title')}</option>)}
                </select>
              </label>
            )}
            {form.linkKind === 'url' && (
              <label className="label">{t('admin.news.url')}<input className="input" type="url" required placeholder="https://" value={form.linkUrl} onChange={(e) => set({ linkUrl: e.target.value })} /></label>
            )}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set({ isActive: e.target.checked })} /> {t('admin.news.visible')}
        </label>

        {err && <p className="text-sm text-[#F2A7A0]" role="alert">{err}</p>}
        <div className="flex gap-2">
          <button className="btn-primary py-2.5" disabled={saving}>{saving ? t('admin.news.saving') : t('admin.news.save')}</button>
          {editingId && <button type="button" className="btn-ghost py-2.5" onClick={reset}>{t('admin.news.cancel')}</button>}
        </div>
      </form>

      <section className="flex flex-col gap-3" aria-label={t('admin.news.list')}>
        <h2 className="text-lg font-semibold">{t('admin.news.list')}</h2>
        {news.data?.length === 0 && <div className="card p-5 text-muted-soft">{t('admin.news.empty')}</div>}
        {news.data?.map((n) => (
          <article key={n.id} className="card p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium break-words">{loc(n, 'title')}</p>
              <p className="text-xs text-muted-dim mt-0.5">{fmtDate(n.createdAt, false)} · {n.isActive ? t('admin.news.visible') : t('admin.news.hidden')}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="px-3 py-2 rounded-lg text-xs border border-line-strong text-muted" onClick={() => toggle(n)} aria-pressed={n.isActive}>{n.isActive ? t('admin.news.visible') : t('admin.news.hidden')}</button>
              <button type="button" className="px-3 py-2 rounded-lg text-xs border border-line-strong text-mint" onClick={() => edit(n)}>{t('admin.news.edit')}</button>
              <button type="button" className="px-3 py-2 rounded-lg text-xs border border-[#5A3A37] text-[#F2A7A0]" onClick={() => remove(n)}>{t('admin.news.remove')}</button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
