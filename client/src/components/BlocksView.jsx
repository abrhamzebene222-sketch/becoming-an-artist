import { cdn } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import { imageNumbers, imageLabel } from '../lib/imageLabel.js';

/**
 * Read-only view of modular blocks (text, heading, numbered step, tip/warning, image, YouTube).
 * Same look as a lesson (LessonContent.jsx). Used by the self-evaluation document page.
 * blocks: the list returned by the server: { id, type, text, textAm, caption, imageUrl, variant, youtubeId }
 */
export default function BlocksView({ blocks = [], title = '', labelBase = '', labelBaseAm = '' }) {
  const { t, lang } = useI18n();
  let stepNumber = 0;
  const picNo = imageNumbers(blocks);
  const picLabel = (b) => imageLabel(labelBase, labelBaseAm, lang, picNo[b.id]);
  return (
    <div className="flex flex-col gap-4">
      {blocks.map((b) => {
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
          return <div key={b.id} className="text-[15px] leading-relaxed text-[#DCEBE8] whitespace-pre-line" lang={amLang}>{pick('text')}</div>;
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
                  title={b.caption || title} className="w-full h-full" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
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
