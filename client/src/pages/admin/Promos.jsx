import { useEffect, useState } from 'react';
import { api, useApi } from '../../api.js';
import { useI18n } from '../../i18n/index.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';

// 3 boards × 2 flipping units — all text, links and images editable.
export default function Promos() {
  const { t } = useI18n();
  const data = useApi('/admin/promos');
  const [list, setList] = useState([]);
  const [status, setStatus] = useState({});
  useEffect(() => { if (data.data) setList(data.data); }, [data.data]);

  const upd = (id, patch) => setList((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const save = async (p) => {
    setStatus((s) => ({ ...s, [p.id]: '…' }));
    try { await api(`/admin/promos/${p.id}`, { method: 'PUT', body: p }); setStatus((s) => ({ ...s, [p.id]: t('common.saved') })); }
    catch (e) { setStatus((s) => ({ ...s, [p.id]: e.message })); }
  };
  // New image → saved right away; the previous news/promo image is overwritten or deleted on Cloudinary
  const setImage = (p, image) => { const next = { ...p, image }; upd(p.id, { image }); save(next); };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-semibold">{t('promoAdmin.title')}</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">{t('promoAdmin.text')}</p>
      </div>
      {[1, 2, 3].map((b) => (
        <section key={b} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2"><span aria-hidden="true" className="w-1.5 h-6 rounded-full bg-cyan-300" />{t(`promoAdmin.board${b}`)}</h2>
          <div className="grid xl:grid-cols-2 gap-4">
            {list.filter((p) => p.board === b).map((p) => {
              const f = (k) => ({ value: p[k] || '', onChange: (e) => upd(p.id, { [k]: e.target.value }) });
              return (
                <article key={p.id} className="card p-5 flex flex-col gap-3 border-cyan-300/20">
                  <div className="flex items-center justify-between gap-3">
                    <span className="eyebrow text-cyan-200">{t('promoAdmin.unit', { n: p.slot + 1 })}</span>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-teal w-4 h-4" checked={p.isActive} onChange={(e) => upd(p.id, { isActive: e.target.checked })} />{t('promoAdmin.active')}</label>
                  </div>
                  <ImageUploader value={p.image} folder={b === 1 ? 'news' : 'promos'} replaceOnUpload onChange={(img) => setImage(p, img)} />
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="label">{t('promoAdmin.titleEn')}<input className="input py-2" {...f('title')} /></label>
                    <label className="label">{t('promoAdmin.titleAm')}<input className="input py-2" lang="am" {...f('titleAm')} /></label>
                    <label className="label">{t('promoAdmin.descEn')}<textarea className="input py-2 min-h-16" {...f('description')} /></label>
                    <label className="label">{t('promoAdmin.descAm')}<textarea className="input py-2 min-h-16" lang="am" {...f('descriptionAm')} /></label>
                    <label className="label sm:col-span-2">{t('promoAdmin.link')}<input className="input py-2 font-mono text-sm" placeholder="https://…" {...f('linkUrl')} /></label>
                    <label className="label">{t('promoAdmin.linkLabel')}<input className="input py-2" {...f('linkLabel')} /></label>
                    <label className="label">{t('promoAdmin.linkLabelAm')}<input className="input py-2" lang="am" {...f('linkLabelAm')} /></label>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="btn-primary py-2" onClick={() => save(p)}>{t('promoAdmin.save')}</button>
                    {status[p.id] && <span className="text-sm text-mint" role="status">{status[p.id]}</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
