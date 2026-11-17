import { useI18n } from '../i18n/index.jsx';
import { youtubeId, youtubeThumb } from '../lib/youtube.js';
import ImageUploader from './ImageUploader.jsx';
import Icon from './Icon.jsx';

let seq = 0;
const key = () => `b${Date.now().toString(36)}${(seq += 1)}`;
export const withKeys = (blocks = []) => blocks.map((b) => ({ ...b, _k: b._k || b._id || b.id || key() }));
export const stripKeys = (blocks = []) => blocks.map(({ _k, ...b }) => b);

/**
 * Modular lesson builder: alternating Text boxes, Images and YouTube videos in any order.
 * value: [{ type: 'text', text, textAm } | { type: 'image', image, caption } | { type: 'youtube', youtubeUrl, caption }]
 */
export default function BlockEditor({ value, onChange }) {
  const { t } = useI18n();
  const blocks = value || [];
  const upd = (i, patch) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= blocks.length) return;
    const next = blocks.slice();
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (type) => onChange([...blocks, { _k: key(), type, ...(type === 'text' ? { text: '', textAm: '' } : type === 'image' ? { image: null, caption: '' } : { youtubeUrl: '', caption: '' }) }]);
  const icon = { text: 'text', image: 'image', youtube: 'youtube' };

  return (
    <div className="flex flex-col gap-3">
      {blocks.length === 0 && <p className="text-sm text-muted">{t('blocks.empty')}</p>}
      {blocks.map((b, i) => {
        const yt = b.type === 'youtube' ? youtubeId(b.youtubeUrl) : '';
        return (
          <div key={b._k} className="rounded-xl border border-line-strong bg-ink p-3.5 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm text-teal-soft"><Icon name={icon[b.type]} size={16} />{i + 1}</span>
              <span className="flex gap-1">
                <button type="button" aria-label={t('blocks.up')} disabled={i === 0} onClick={() => move(i, -1)} className="w-9 h-9 grid place-items-center rounded-lg border border-line-strong disabled:opacity-30"><Icon name="chevronUp" size={16} /></button>
                <button type="button" aria-label={t('blocks.down')} disabled={i === blocks.length - 1} onClick={() => move(i, 1)} className="w-9 h-9 grid place-items-center rounded-lg border border-line-strong disabled:opacity-30"><Icon name="chevronDown" size={16} /></button>
                <button type="button" aria-label={t('common.remove')} onClick={() => onChange(blocks.filter((_, j) => j !== i))} className="w-9 h-9 grid place-items-center rounded-lg border border-[#5A3A37] text-[#F2A7A0]"><Icon name="trash" size={16} /></button>
              </span>
            </div>
            {b.type === 'text' && (
              <div className="grid md:grid-cols-2 gap-3">
                <label className="label">{t('blocks.textEn')}<textarea className="input min-h-28" value={b.text || ''} onChange={(e) => upd(i, { text: e.target.value })} /></label>
                <label className="label">{t('blocks.textAm')}<textarea className="input min-h-28" lang="am" value={b.textAm || ''} onChange={(e) => upd(i, { textAm: e.target.value })} /></label>
              </div>
            )}
            {b.type === 'image' && (
              <>
                <ImageUploader value={b.image} folder="blocks" onChange={(image) => upd(i, { image })} />
                <label className="label">{t('blocks.caption')}<input className="input py-2" value={b.caption || ''} onChange={(e) => upd(i, { caption: e.target.value })} /></label>
              </>
            )}
            {b.type === 'youtube' && (
              <div className="grid sm:grid-cols-[1fr_160px] gap-3 items-start">
                <div className="flex flex-col gap-2">
                  <label className="label">{t('blocks.youtubeUrl')}
                    <input className="input py-2 font-mono text-sm" value={b.youtubeUrl || ''} placeholder="https://youtu.be/…" onChange={(e) => upd(i, { youtubeUrl: e.target.value })} />
                  </label>
                  {b.youtubeUrl && !yt && <p className="text-xs text-[#F2D98A]">{t('blocks.invalidYoutube')}</p>}
                  <label className="label">{t('blocks.caption')}<input className="input py-2" value={b.caption || ''} onChange={(e) => upd(i, { caption: e.target.value })} /></label>
                </div>
                {yt && <img src={youtubeThumb(yt)} alt="" className="rounded-lg border border-line aspect-video object-cover w-full" />}
              </div>
            )}
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-ghost py-2 text-sm" onClick={() => add('text')}><Icon name="text" size={15} />{t('blocks.addText')}</button>
        <button type="button" className="btn-ghost py-2 text-sm" onClick={() => add('image')}><Icon name="image" size={15} />{t('blocks.addImage')}</button>
        <button type="button" className="btn-ghost py-2 text-sm" onClick={() => add('youtube')}><Icon name="youtube" size={15} />{t('blocks.addYoutube')}</button>
      </div>
    </div>
  );
}
