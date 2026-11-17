import { cdn } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import useRotator from '../lib/useRotator.js';

// Relaxed timing for course groups: long stay, slow cross-fade, so students can read peacefully.
const INTERVAL = 9000;
const FADE_MS = 2400;

/**
 * Auto-flipping background slideshow for a MAJOR course group.
 * Images sit inside a matted frame and use object-contain, so each artwork's own outer border stays visible
 * (a blurred copy fills the empty space). Behind the text: a graduated overlay in the theme colours —
 * about 40% near the text, fading to fully transparent towards the edges.
 */
export default function GroupSlideshow({ group, index, children }) {
  const { t, loc } = useI18n();
  const slides = group.slides || [];
  const [current, setCurrent, pause] = useRotator(slides.length, INTERVAL);

  return (
    <div className="relative rounded-3xl border border-line bg-ink-deep p-2.5 sm:p-3.5 shadow-[0_0_0_1px_rgba(31,166,155,0.08)]" {...pause}>
      <div className="relative h-60 sm:h-72 lg:h-80 rounded-2xl overflow-hidden ring-1 ring-line-strong bg-ink-panel">
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
              className="relative w-full h-full object-contain p-3 sm:p-5 drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]" />
          </div>
        ))}

        {/* Edge-wide wash: theme ink/teal, strongest on the text side, transparent at the far edge */}
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(90deg, rgba(17,27,26,0.40) 0%, rgba(22,48,45,0.28) 28%, rgba(31,166,155,0.10) 55%, rgba(31,166,155,0) 78%)' }} />

        <div className="absolute inset-0 flex items-end p-5 sm:p-8">
          <div className="relative max-w-xl">
            {/* Local halo right behind the text: ~40% → 0% */}
            <div aria-hidden="true" className="absolute -inset-10 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at 35% 60%, rgba(17,27,26,0.40) 0%, rgba(22,48,45,0.25) 40%, rgba(17,27,26,0) 72%)' }} />
            <div className="relative [text-shadow:0_1px_12px_rgba(0,0,0,0.55)]">
              {/* Dynamic Chapter numbering instead of Major Group */}
              <span className="eyebrow">CHAPTER {index + 1}</span>
              <h2 className="text-2xl sm:text-3xl font-semibold text-white mt-1">{loc(group, 'title')}</h2>
              {loc(group, 'description') && <p className="text-mint-pale/90 text-sm sm:text-base mt-1.5 line-clamp-3">{loc(group, 'description')}</p>}
              {children && <div className="mt-3 flex flex-wrap gap-2">{children}</div>}
            </div>
          </div>
        </div>

        {slides.length > 1 && (
          <div className="absolute bottom-3 right-4 flex gap-1.5">
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