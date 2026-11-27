import { useEffect, useState } from 'react';
import { cdn, useApi } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';
import { imageNumbers, imageLabel } from '../lib/imageLabel.js';

/**
 * In-app lesson view (web-view style): video / PDF from Cloudinary + modular text, image and YouTube blocks.
 * Loaded when the accordion opens. The service worker keeps a copy of the JSON and every image, so a lesson opened once
 * online also opens offline. A saved lesson opens instantly and refreshes behind the scenes (see api.js › useApi).
 */
export default function LessonContent({ lessonId }) {
  const { t, lang } = useI18n();
  const lesson = useApi(`/media/lesson/${lessonId}`);
  const data = lesson.data?.id === lessonId ? lesson.data : null; // never show the previous lesson while the next one loads
  const err = !data && lesson.error ? lesson.error.message : '';
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false); const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  if (err) return <p className="text-sm text-muted p-4">{err}</p>;
  if (!data) return <p className="text-sm text-muted p-4">{t('detail.loadingLesson')}</p>;

  let stepNumber = 0;
  const picNo = imageNumbers(data.blocks);
  const picLabel = (b) => imageLabel(data.labelBase, data.labelBaseAm, lang, picNo[b.id]);
  return (
    <div className="flex flex-col gap-4 p-4 pt-1">
      {offline && <p className="text-xs text-[#F2D98A] flex items-center gap-2"><Icon name="wifiOff" size={14} />{t('detail.offline')}</p>}
      {data.url && data.kind === 'video' && (
        <video src={data.url} poster={data.poster || undefined} controls playsInline preload="metadata" controlsList="nodownload"
          disablePictureInPicture onContextMenu={(e) => e.preventDefault()} className="w-full aspect-video rounded-xl bg-black" />
      )}
      {data.url && data.kind === 'pdf' && (
        <>
          <iframe src={`${data.url}#toolbar=0`} title={data.title} className="w-full aspect-[3/4] sm:aspect-video rounded-xl bg-white" />
          <a href={data.url} target="_blank" rel="noreferrer" className="text-sm self-start">{t('course.pdf')} ↗</a>
        </>
      )}
      {!(data.blocks || []).length && (
        <p className="text-sm text-muted p-4" role="note">{t('detail.comingSoon')}</p>
      )}
      {(data.blocks || []).map((b, bi) => {
        const pick = (field) => (lang === 'am' && b[`${field}Am`]) || b[field] || b[`${field}Am`] || '';
        const amLang = lang === 'am' && b.textAm ? 'am' : undefined;
        if (b.type === 'heading') {
          stepNumber = 0; // numbering restarts after each section heading
          return <h3 key={b.id} className="text-lg font-semibold text-white mt-3 first:mt-0" lang={amLang}>{pick('text')}</h3>;
        }
        if (b.type === 'step') {
          stepNumber += 1;
          return (
            <section key={b.id} className="flex gap-3" aria-label={t('lessonBlocks.step', { n: stepNumber })}>
              <span aria-hidden="true" className="shrink-0 w-8 h-8 rounded-full bg-teal-active text-mint grid place-items-center text-sm font-semibold mt-0.5">{stepNumber}</span>
              <div className="min-w-0 flex-1 flex flex-col gap-2.5">
                {pick('text') && <div className="text-[15px] leading-relaxed text-[#DCEBE8] whitespace-pre-line" lang={amLang}>{pick('text')}</div>}
                {b.imageUrl && (
                  <figure className="flex flex-col gap-1.5">
                    <img src={cdn(b.imageUrl, 1600)} alt={b.caption || t('lessonBlocks.step', { n: stepNumber })} loading="lazy" className="w-full rounded-xl border border-line object-contain bg-ink-deep" />
                    {b.caption && <figcaption className="text-xs text-muted text-center">{b.caption}</figcaption>}
                    {picLabel(b) && <figcaption className="text-[10px] leading-snug text-muted-dim text-center break-words">{picLabel(b)}</figcaption>}
                  </figure>
                )}
              </div>
            </section>
          );
        }
        if (b.type === 'callout') {
          const warn = b.variant === 'warning';
          return (
            <aside key={b.id} role="note" lang={amLang}
              className={`rounded-xl border p-3.5 text-[15px] leading-relaxed whitespace-pre-line ${warn ? 'border-[#6B5A1E] bg-[#3A3420] text-[#F2D98A]' : 'border-teal/50 bg-teal-active/30 text-mint'}`}>
              <strong className="block text-xs uppercase tracking-wide mb-1">{warn ? t('lessonBlocks.warning') : t('lessonBlocks.tip')}</strong>
              {pick('text')}
            </aside>
          );
        }
        if (b.type === 'text') {
          const text = (lang === 'am' && b.textAm) || b.text || b.textAm;
          return <div key={b.id} className="text-[15px] leading-relaxed text-[#DCEBE8] whitespace-pre-line" lang={lang === 'am' && b.textAm ? 'am' : undefined}>{text}</div>;
        }
        if (b.type === 'image') {
          return (
            <figure key={b.id} className="flex flex-col gap-1.5">
              <img src={cdn(b.imageUrl, 1600)} alt={b.caption || ''} loading="lazy" className="w-full rounded-xl border border-line object-contain bg-ink-deep" />
              {b.caption && <figcaption className="text-xs text-muted text-center">{b.caption}</figcaption>}
              {picLabel(b) && <figcaption className="text-[10px] leading-snug text-muted-dim text-center break-words">{picLabel(b)}</figcaption>}
            </figure>
          );
        }
        if (b.type === 'youtube' && b.youtubeId) {
          return (
            <figure key={b.id} className="flex flex-col gap-1.5">
              <div className="aspect-video rounded-xl overflow-hidden border border-line bg-black">
                <iframe src={`https://www.youtube-nocookie.com/embed/${b.youtubeId}?rel=0&modestbranding=1&playsinline=1`}
                  title={b.caption || data.title} className="w-full h-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
              </div>
              {b.caption && <figcaption className="text-xs text-muted text-center">{b.caption}</figcaption>}
            </figure>
          );
        }
        return null;
      })}
    </div>
  );
}
