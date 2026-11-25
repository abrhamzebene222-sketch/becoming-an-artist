import { useState } from 'react';
import { useI18n } from '../i18n/index.jsx';
import { youtubeId, youtubeThumb } from '../lib/youtube.js';
import ImageUploader from './ImageUploader.jsx';
import Icon from './Icon.jsx';

let seq = 0;
const key = () => `b${Date.now().toString(36)}${(seq += 1)}`;
export const withKeys = (blocks = []) => blocks.map((b) => ({ ...b, _k: b._k || b._id || b.id || key() }));
export const stripKeys = (blocks = []) => blocks.map(({ _k, _hint, _img, ...b }) => b);

// "[Image to add: ...]" placeholder text written by the content importer
const PLACEHOLDER = /^\s*\[Image to add:\s*([\s\S]*?)\]\s*$/i;
const placeholderHint = (b) => {
  if (b.type !== 'text') return null;
  const m = PLACEHOLDER.exec(b.text || '') || PLACEHOLDER.exec(b.textAm || '');
  return m ? m[1].trim() : null;
};
const NEW_FIELDS = {
  text: { text: '', textAm: '' },
  heading: { text: '', textAm: '' },
  step: { text: '', textAm: '', image: null, caption: '' },
  callout: { variant: 'tip', text: '', textAm: '' },
  image: { image: null, caption: '' },
  youtube: { youtubeUrl: '', caption: '' },
  imageHint: { text: '', textAm: '' },
};
const newBlock = (type) => ({ _k: key(), type, ...NEW_FIELDS[type] });
// Order of the "add" buttons; the label key is blocks.add<Name>
const ADD_TYPES = [['text', 'Text', 'text'], ['heading', 'Heading', 'text'], ['step', 'Step', 'check'], ['image', 'Image', 'image'], ['imageHint', 'ImageHint', 'image'], ['youtube', 'Youtube', 'youtube'], ['callout', 'Callout', 'bell']];

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
  const add = (type) => onChange([...blocks, newBlock(type)]);
  const icon = { text: 'text', imageHint: 'image', image: 'image', youtube: 'youtube', heading: 'text', step: 'check', callout: 'bell' };
  // Step numbers: count steps, restart after each heading
  const stepNo = {};
  let counter = 0;
  blocks.forEach((b) => { if (b.type === 'heading') counter = 0; if (b.type === 'step') { counter += 1; stepNo[b._k] = counter; } });
  const [openAt, setOpenAt] = useState(null); // which "insert here" bar is open (position number)
  const insertAt = (at, type) => {
    const next = blocks.slice();
    next.splice(at, 0, newBlock(type));
    onChange(next);
    setOpenAt(null);
  };
  // Replace a "[Image to add: ...]" text block by an empty image block in the same position
  const toImage = (i, hint) => onChange(blocks.map((b, j) => (j === i ? { _k: b._k, type: 'image', image: null, caption: '', _hint: hint } : b)));

  const Inserter = ({ at }) => (openAt === at ? (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-dashed border-teal/60 bg-teal-active/20 p-2">
      <span className="text-xs text-muted px-1">{t('blocks.insertHere')}:</span>
      {ADD_TYPES.map(([type, name, ic]) => (
        <button key={type} type="button" className="btn-ghost py-1.5 text-sm" onClick={() => insertAt(at, type)}><Icon name={ic} size={15} />{t(`blocks.add${name}`)}</button>
      ))}
      <button type="button" aria-label={t('common.cancel')} className="ml-auto w-8 h-8 grid place-items-center rounded-lg text-muted" onClick={() => setOpenAt(null)}><Icon name="x" size={15} /></button>
    </div>
  ) : (
    <button type="button" aria-label={t('blocks.insertHere')} onClick={() => setOpenAt(at)}
      className="group flex items-center gap-2 w-full h-6 text-muted-dim hover:text-teal-soft focus-visible:text-teal-soft">
      <span className="flex-1 border-t border-dashed border-line-strong group-hover:border-teal/60" />
      <span className="flex items-center gap-1 text-xs"><Icon name="plus" size={13} />{t('blocks.insertHere')}</span>
      <span className="flex-1 border-t border-dashed border-line-strong group-hover:border-teal/60" />
    </button>
  ));

  return (
    <div className="flex flex-col gap-1">
      {blocks.length === 0 && <p className="text-sm text-muted">{t('blocks.empty')}</p>}
      {blocks.map((b, i) => {
        const yt = b.type === 'youtube' ? youtubeId(b.youtubeUrl) : '';
        const hint = placeholderHint(b);
        return (
          <div key={b._k} className="flex flex-col gap-1">
          {i === 0 && <Inserter at={0} />}
          <div className={`rounded-xl border p-3.5 flex flex-col gap-3 ${b.type === 'imageHint' ? 'border-cyan-400/70 bg-cyan-950/30' : 'border-line-strong bg-ink'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm text-teal-soft"><Icon name={icon[b.type]} size={16} />{i + 1} · {b.type === 'step' ? t('blocks.stepNo', { n: stepNo[b._k] }) : t(`blocks.type.${b.type}`)}</span>
              <span className="flex gap-1">
                <button type="button" aria-label={t('blocks.up')} disabled={i === 0} onClick={() => move(i, -1)} className="w-9 h-9 grid place-items-center rounded-lg border border-line-strong disabled:opacity-30"><Icon name="chevronUp" size={16} /></button>
                <button type="button" aria-label={t('blocks.down')} disabled={i === blocks.length - 1} onClick={() => move(i, 1)} className="w-9 h-9 grid place-items-center rounded-lg border border-line-strong disabled:opacity-30"><Icon name="chevronDown" size={16} /></button>
                <button type="button" aria-label={t('common.remove')} onClick={() => onChange(blocks.filter((_, j) => j !== i))} className="w-9 h-9 grid place-items-center rounded-lg border border-[#5A3A37] text-[#F2A7A0]"><Icon name="trash" size={16} /></button>
              </span>
            </div>
            {hint && (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#3A3420] text-[#F2D98A] text-sm p-2.5">
                <span className="min-w-0 break-words">{t('blocks.placeholderFound', { hint })}</span>
                <button type="button" className="btn-ghost py-1.5 text-sm" onClick={() => toImage(i, hint)}><Icon name="image" size={15} />{t('blocks.toImage')}</button>
              </div>
            )}
            {b.type === 'text' && (
              <div className="grid md:grid-cols-2 gap-3">
                <label className="label">{t('blocks.textEn')}<textarea className="input min-h-28" value={b.text || ''} onChange={(e) => upd(i, { text: e.target.value })} /></label>
                <label className="label">{t('blocks.textAm')}<textarea className="input min-h-28" lang="am" value={b.textAm || ''} onChange={(e) => upd(i, { textAm: e.target.value })} /></label>
              </div>
            )}
            {b.type === 'imageHint' && (
              <>
                <p className="text-xs italic text-cyan-300">{t('blocks.hintAdminOnly')}</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="label text-cyan-300">{t('blocks.hintEn')}<textarea className="input min-h-20 italic !border-cyan-400/60 !text-cyan-200" value={b.text || ''} onChange={(e) => upd(i, { text: e.target.value })} /></label>
                  <label className="label text-cyan-300">{t('blocks.hintAm')}<textarea className="input min-h-20 italic !border-cyan-400/60 !text-cyan-200" lang="am" value={b.textAm || ''} onChange={(e) => upd(i, { textAm: e.target.value })} /></label>
                </div>
                <button type="button" className="btn-ghost py-1.5 text-sm self-start" onClick={() => toImage(i, b.text || b.textAm || '')}><Icon name="image" size={15} />{t('blocks.hintToImage')}</button>
              </>
            )}
            {b.type === 'heading' && (
              <div className="grid md:grid-cols-2 gap-3">
                <label className="label">{t('blocks.headingEn')}<input className="input py-2" value={b.text || ''} onChange={(e) => upd(i, { text: e.target.value })} /></label>
                <label className="label">{t('blocks.headingAm')}<input className="input py-2" lang="am" value={b.textAm || ''} onChange={(e) => upd(i, { textAm: e.target.value })} /></label>
              </div>
            )}
            {b.type === 'callout' && (
              <>
                <div className="flex gap-2" role="radiogroup" aria-label={t('blocks.calloutKind')}>
                  {['tip', 'warning'].map((v) => (
                    <label key={v} className={`px-3 py-2 rounded-xl text-sm cursor-pointer border ${(b.variant || 'tip') === v ? 'border-2 border-teal bg-teal-active/50' : 'border-line-strong'}`}>
                      <input type="radio" className="sr-only" name={`variant-${b._k}`} checked={(b.variant || 'tip') === v} onChange={() => upd(i, { variant: v })} />{t(`blocks.${v}`)}
                    </label>
                  ))}
                </div>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="label">{t('blocks.textEn')}<textarea className="input min-h-20" value={b.text || ''} onChange={(e) => upd(i, { text: e.target.value })} /></label>
                  <label className="label">{t('blocks.textAm')}<textarea className="input min-h-20" lang="am" value={b.textAm || ''} onChange={(e) => upd(i, { textAm: e.target.value })} /></label>
                </div>
              </>
            )}
            {b.type === 'step' && (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  <label className="label">{t('blocks.textEn')}<textarea className="input min-h-24" value={b.text || ''} onChange={(e) => upd(i, { text: e.target.value })} /></label>
                  <label className="label">{t('blocks.textAm')}<textarea className="input min-h-24" lang="am" value={b.textAm || ''} onChange={(e) => upd(i, { textAm: e.target.value })} /></label>
                </div>
                {b.image || b._img ? (
                  <>
                    <ImageUploader value={b.image} folder="blocks" onChange={(image) => upd(i, { image })} />
                    <label className="label">{t('blocks.caption')}<input className="input py-2" value={b.caption || ''} onChange={(e) => upd(i, { caption: e.target.value })} /></label>
                    <button type="button" className="btn-ghost py-1.5 text-sm self-start text-[#F2A7A0]" onClick={() => upd(i, { image: null, caption: '', _img: false })}>{t('blocks.removeStepImage')}</button>
                  </>
                ) : (
                  <button type="button" className="btn-ghost py-1.5 text-sm self-start border-dashed" onClick={() => upd(i, { _img: true })}><Icon name="image" size={15} />{t('blocks.stepImage')}</button>
                )}
              </>
            )}
            {b.type === 'image' && (
              <>
                {b._hint && !b.image && <p className="text-xs text-[#F2D98A] break-words">{t('blocks.suggested', { hint: b._hint })}</p>}
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
          <Inserter at={i + 1} />
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2 mt-2">
        {ADD_TYPES.map(([type, name, ic]) => (
          <button key={type} type="button" className="btn-ghost py-2 text-sm" onClick={() => add(type)}><Icon name={ic} size={15} />{t(`blocks.add${name}`)}</button>
        ))}
      </div>
    </div>
  );
}
