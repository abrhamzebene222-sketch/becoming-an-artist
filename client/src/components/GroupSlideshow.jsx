import { cdn } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import useRotator from '../lib/useRotator.js';
import Icon from './Icon.jsx';
import { KidsBannerShapes } from './KidsDecor.jsx';

const INTERVAL = 9000;
const FADE_MS = 2400;

export default function GroupSlideshow({ group, index, children, expanded, onToggle, kids = false }) {
  const { loc } = useI18n();
  const slides = group.slides || [];
  const [current, setCurrent, pause] = useRotator(slides.length, INTERVAL);

  // Young Artists Club: bright, playful banner (rainbow frame, floating shapes, candy "Explore" button)
  if (kids) {
    return (
      <div className="relative rounded-[2rem] p-[5px] shadow-[0_7px_0_rgb(var(--c-teal-dark)),0_22px_40px_rgba(10,4,30,0.45)]"
        style={{ background: 'linear-gradient(120deg,#FF7A59 0%,#FFD166 25%,#9BE564 50%,#4CC9F0 75%,#FF8FB8 100%)' }}>
        <div className="ba-frame relative h-72 sm:h-72 lg:h-80 rounded-[1.7rem] overflow-hidden" {...pause}
          style={{ background: 'radial-gradient(circle at 85% 15%, rgba(255,209,102,0.55), transparent 38%), radial-gradient(circle at 10% 100%, rgba(76,201,240,0.45), transparent 45%), linear-gradient(135deg,#3A1C8F 0%,#6B2FBF 48%,#E8449A 100%)' }}>
          {slides.map((s, i) => (
            <div key={s.publicId || s.url} aria-hidden={i !== current}
              className="absolute inset-0 transition-opacity ease-in-out motion-reduce:transition-none"
              style={{ opacity: i === current ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}>
              <img src={cdn(s.url, 1600)} alt="" loading={i === 0 ? 'eager' : 'lazy'}
                className={`ba-frame-image relative w-full h-full object-cover ${i === current ? '' : 'ba-frame-image-idle'}`}
                style={{ '--ba-pan-duration': `${INTERVAL}ms` }}
                onLoad={(e) => { const img = e.currentTarget; img.dataset.imageShape = img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait'; }} />
            </div>
          ))}
          {/* colour wash so the text stays readable on top of any picture */}
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
            style={{ background: slides.length ? 'linear-gradient(90deg, rgba(58,28,143,0.82) 0%, rgba(107,47,191,0.55) 45%, rgba(232,68,154,0.12) 100%)' : 'transparent' }} />
          <KidsBannerShapes />

          <div onClick={onToggle} className="absolute inset-0 w-full h-full text-left flex items-end p-5 sm:p-8 cursor-pointer group z-10">
            <div className="relative w-full flex flex-col items-start sm:flex-row sm:items-end sm:justify-between gap-4 pointer-events-auto">
              <div className="relative max-w-xl">
                <span className="kids-sticker">Chapter {index + 1}</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 leading-tight [text-shadow:0_3px_0_rgba(42,20,88,0.55)]">{loc(group, 'title')}</h2>
                <svg aria-hidden="true" viewBox="0 0 120 12" className="w-28 h-3 mt-1.5"><path d="M2 6c8-8 14 8 22 0s14 8 22 0 14 8 22 0 14 8 22 0 14 8 22 0" fill="none" stroke="#FFD166" strokeWidth="3.5" strokeLinecap="round" /></svg>
                {loc(group, 'description') && <p className="text-[#FFF4D9] text-sm sm:text-base mt-2 line-clamp-3 [text-shadow:0_1px_8px_rgba(42,20,88,0.6)]">{loc(group, 'description')}</p>}
                {children && <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>{children}</div>}
              </div>

              <span className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#FFD166] text-[#2A1458] pl-4 pr-1.5 py-1.5 text-sm font-bold shadow-[0_4px_0_#E0A100] transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-1 group-active:shadow-none">
                Explore Courses
                <span className={`w-8 h-8 rounded-full bg-[#2A1458] text-[#FFD166] grid place-items-center ${expanded ? '' : 'kids-nudge'}`}>
                  <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={18} />
                </span>
              </span>
            </div>
          </div>

          {slides.length > 1 && (
            <div className="absolute top-3 right-4 flex gap-1.5 z-20" onClick={(e) => e.stopPropagation()}>
              {slides.map((s, i) => (
                <button key={s.publicId || i} type="button" onClick={() => setCurrent(i)} aria-label={`${i + 1} / ${slides.length}`}
                  aria-current={i === current} className="w-6 h-6 grid place-items-center">
                  <span className={`block h-2 rounded-full transition-all duration-700 ${i === current ? 'w-6 bg-[#FFD166]' : 'w-2 bg-white/60'}`} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-3xl border border-line bg-ink-deep p-2.5 sm:p-3.5 shadow-[0_0_0_1px_rgba(31,166,155,0.08)]">
      <div className="ba-frame relative h-60 sm:h-72 lg:h-80 rounded-2xl overflow-hidden ring-1 ring-line-strong bg-ink-panel" {...pause}>
        {slides.length === 0 && (
          <div aria-hidden="true" className="absolute inset-0"
            style={{ background: 'radial-gradient(circle at 80% 20%, rgba(31,166,155,0.35), transparent 55%), radial-gradient(circle at 20% 90%, rgba(127,227,217,0.18), transparent 50%)' }} />
        )}
        {slides.map((s, i) => (
          <div key={s.publicId || s.url} aria-hidden={i !== current}
            className="absolute inset-0 transition-opacity ease-in-out motion-reduce:transition-none"
            style={{ opacity: i === current ? 1 : 0, transitionDuration: `${FADE_MS}ms` }}>
            <img src={cdn(s.url, 480)} alt="" aria-hidden="true" loading="lazy"
              className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-35" />
            <img src={cdn(s.url, 1600)} alt="" loading={i === 0 ? 'eager' : 'lazy'}
              className={`ba-frame-image relative w-full h-full object-cover p-3 sm:p-5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)] ${i === current ? '' : 'ba-frame-image-idle'}`}
              style={{ '--ba-pan-duration': `${INTERVAL}ms` }}
              onLoad={(e) => { const img = e.currentTarget; img.dataset.imageShape = img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait'; }} />
          </div>
        ))}

        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, rgba(17,27,26,0.40) 0%, rgba(22,48,45,0.28) 28%, rgba(31,166,155,0.10) 55%, rgba(31,166,155,0) 78%)' }} />

        {/* ባነሩን ሙሉ በሙሉ ሲጫኑት expand/collapse እንዲያደርግ በግልጽ የተስተካከለ ክሊክ ሎጂክ */}
        <div 
          onClick={onToggle}
          className="absolute inset-0 w-full h-full text-left flex items-end p-5 sm:p-8 cursor-pointer group z-10"
        >
          <div className="relative w-full flex items-end justify-between gap-4 pointer-events-auto">
            <div className="relative max-w-xl">
              <div aria-hidden="true" className="absolute -inset-10 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 35% 60%, rgba(17,27,26,0.40) 0%, rgba(22,48,45,0.25) 40%, rgba(17,27,26,0) 72%)' }} />
              <div className="relative [text-shadow:0_1px_12px_rgba(0,0,0,0.55)]">
                <span className="eyebrow">Chapter {index + 1}</span>
                <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1">{loc(group, 'title')}</h2>
                {loc(group, 'description') && <p className="text-mint-pale/90 text-sm sm:text-base mt-1.5 line-clamp-3">{loc(group, 'description')}</p>}
                {children && <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>{children}</div>}
              </div>
            </div>

            {/* "Explore Courses" ቴክስት እና አሮው (ክሊክ ሲደረግ በቀጥታ እንዲከፈት/እንዲዘጋ) */}
            <div className="relative z-20 pb-2 pr-2 flex items-center gap-2 text-mint-pale/70 group-hover:text-mint transition-colors">
              <span className="text-xs sm:text-sm font-medium tracking-wide">
                Explore Courses
              </span>
              <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={20} />
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-3 right-44 flex gap-1.5 z-20" onClick={(e) => e.stopPropagation()}>
            {slides.map((s, i) => (
              <button key={s.publicId || i} type="button" onClick={() => setCurrent(i)} aria-label={`${i + 1} / ${slides.length}`}
                aria-current={i === current} className="w-6 h-6 grid place-items-center">
                <span className={`block h-1.5 rounded-full transition-all duration-700 ${i === current ? 'w-5 bg-teal-soft' : 'w-1.5 bg-white/50'}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
