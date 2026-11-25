import { Link } from 'react-router-dom';
import { cdn } from '../api.js';
import { useI18n } from '../i18n/index.jsx';
import useRotator from '../lib/useRotator.js';
import Icon from './Icon.jsx';

// Slightly faster than the course slideshows (9 s) to catch the eye, still comfortable to read.
const INTERVAL = 5500;
const FLIP_MS = 900;

const BOARDS = {
  1: { key: 'news', icon: 'megaphone' },
  2: { key: 'community', icon: 'send' },
  3: { key: 'referral', icon: 'gift' },
};

/**
 * One promo/announcement board: 2 units that flip as a single block (image + text together).
 * Cold cyan/blue graduated overlay behind the text and a vertical cyan bar on the left, in front of the image,
 * so promos are instantly distinguishable from course groups while scrolling.
 */
export default function PromoBoard({ board, items, telegram, onShare }) {
  const { t, loc } = useI18n();
  const [current, setCurrent, pause] = useRotator(items.length, INTERVAL);
  if (!items.length && board !== 3) return null;
  const meta = BOARDS[board];
  const units = items.length ? items : [{ id: 'placeholder', title: t('boards.referral') }];

  return (
    <aside aria-label={t(`boards.${meta.key}`)} className="relative rounded-2xl overflow-hidden border border-cyan-300/25 bg-[#0E1A20]" {...pause}>
      <div className="ba-frame relative h-52 sm:h-48">
        {units.map((p, i) => {
          const linkUrl = p.linkUrl || (board === 2 ? telegram?.channelUrl : '');
          return (
            <div key={p.id} aria-hidden={i !== current}
              className="absolute inset-0 transition-all ease-out motion-reduce:transition-none"
              style={{
                opacity: i === current ? 1 : 0,
                transform: i === current ? 'perspective(900px) rotateX(0deg)' : 'perspective(900px) rotateX(-8deg) translateY(6px)',
                transitionDuration: `${FLIP_MS}ms`,
                pointerEvents: i === current ? 'auto' : 'none',
              }}>
              {p.image?.url && (
                    <img src={cdn(p.image.url, 1400)} alt="" loading="lazy" className={`ba-frame-image absolute inset-y-0 left-0 w-full sm:w-3/5 h-full object-cover ${i === current ? '' : 'ba-frame-image-idle'}`} style={{ '--ba-pan-duration': `${INTERVAL}ms` }} onLoad={(e) => { const img = e.currentTarget; img.dataset.imageShape = img.naturalWidth >= img.naturalHeight ? 'landscape' : 'portrait'; }} />
              )}
              {/* Phones: the image fills the board, so add a soft cold wash under the text for readability */}
              <div aria-hidden="true" className="absolute inset-0 sm:hidden bg-gradient-to-t from-[#0E1A20]/90 via-[#0E1A20]/55 to-[#0E1A20]/10" />
              {/* Cold cyan → transparent graduated fade behind the text */}
              <div aria-hidden="true" className="absolute inset-0"
                style={{ background: 'linear-gradient(270deg, rgba(14,26,32,0.92) 0%, rgba(14,40,52,0.70) 35%, rgba(34,211,238,0.22) 62%, rgba(56,189,248,0) 85%)' }} />
              <div className="absolute inset-y-0 right-0 w-full sm:w-3/5 flex items-center p-5 pl-8 sm:pl-6">
                <div className="relative">
                  <div aria-hidden="true" className="absolute -inset-8 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at 40% 50%, rgba(34,211,238,0.40) 0%, rgba(56,189,248,0.16) 45%, rgba(56,189,248,0) 75%)' }} />
                  <div className="relative [text-shadow:0_1px_10px_rgba(0,0,0,0.6)]">
                    <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-cyan-200">
                      <Icon name={meta.icon} size={13} />{t(`boards.${meta.key}`)}
                    </span>
                    {p.newsId
                      ? <Link to={`/news/${p.newsId}`} tabIndex={-1} className="block text-lg sm:text-xl font-semibold text-white mt-1 line-clamp-2 no-underline hover:text-cyan-100">{loc(p, 'title')}</Link>
                      : <p className="text-lg sm:text-xl font-semibold text-white mt-1 line-clamp-2">{loc(p, 'title')}</p>}
                    {loc(p, 'description') && <p className="text-sm text-cyan-50/90 mt-1 line-clamp-2">{loc(p, 'description')}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {p.newsId && (
                        <Link to={`/news/${p.newsId}`} tabIndex={i === current ? 0 : -1}
                          className="btn py-2 px-3.5 text-sm bg-cyan-300 text-[#062027] hover:bg-cyan-200">
                          {t('news.readMore')} →
                        </Link>
                      )}
                      {board === 3 && (
                        <button type="button" onClick={onShare} tabIndex={i === current ? 0 : -1}
                          className="btn py-2 px-3.5 text-sm bg-cyan-300 text-[#062027] hover:bg-cyan-200">
                          <Icon name="send" size={15} />{t('boards.shareTelegram')}
                        </button>
                      )}
                      {linkUrl && (
                        <a href={linkUrl} target="_blank" rel="noreferrer" tabIndex={i === current ? 0 : -1}
                          className="btn py-2 px-3.5 text-sm border border-cyan-200/60 text-cyan-50 hover:border-cyan-100">
                          {loc(p, 'linkLabel') || (board === 2 ? t('boards.join') : t('boards.open'))} ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {/* Vertical cyan indicator bar — in front of the image */}
        <span aria-hidden="true" className="absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.75)] z-10" />
        {units.length > 1 && (
          <div className="absolute bottom-2 right-3 flex gap-1 z-10">
            {units.map((p, i) => (
              <button key={p.id} type="button" onClick={() => setCurrent(i)} aria-label={`${i + 1} / ${units.length}`} aria-current={i === current}
                className="w-6 h-6 grid place-items-center">
                <span className={`block h-1.5 rounded-full transition-all duration-500 ${i === current ? 'w-4 bg-cyan-200' : 'w-1.5 bg-white/40'}`} />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}

