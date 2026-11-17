import { useEffect, useState } from 'react';
import { api, cdn } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import Icon from './Icon.jsx';

/**
 * In-app lesson view (web-view style): video / PDF from Cloudinary + modular text, image and YouTube blocks.
 * Loaded when the accordion opens. The service worker keeps a copy of the JSON and every image,
 * so a lesson opened once online also opens offline.
 */
export default function LessonContent({ lessonId }) {
  const { t, lang } = useI18n();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    let alive = true;
    setData(null); setErr('');
    api(`/media/lesson/${lessonId}`).then((d) => alive && setData(d)).catch((e) => alive && setErr(e.message));
    const on = () => setOffline(false); const off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { alive = false; window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [lessonId]);

  if (err) return <p className="text-sm text-muted p-4">{err}</p>;
  if (!data) return <p className="text-sm text-muted p-4">{t('detail.loadingLesson')}</p>;

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
      {data.blocks.map((b) => {
        if (b.type === 'text') {
          const text = (lang === 'am' && b.textAm) || b.text || b.textAm;
          return <div key={b.id} className="text-[15px] leading-relaxed text-[#DCEBE8] whitespace-pre-line" lang={lang === 'am' && b.textAm ? 'am' : undefined}>{text}</div>;
        }
        if (b.type === 'image') {
          return (
            <figure key={b.id} className="flex flex-col gap-1.5">
              <img src={cdn(b.imageUrl, 1600)} alt={b.caption || ''} loading="lazy" className="w-full rounded-xl border border-line object-contain bg-ink-deep" />
              {b.caption && <figcaption className="text-xs text-muted text-center">{b.caption}</figcaption>}
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
