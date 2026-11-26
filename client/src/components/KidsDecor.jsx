/** Playful floating shapes (stars, blobs, squiggles…) for the Young Artists Club — purely decorative. */

function Shape({ kind, color }) {
  const common = { viewBox: '0 0 24 24', className: 'w-full h-full block', 'aria-hidden': 'true', focusable: 'false' };
  switch (kind) {
    case 'star':
      return <svg {...common}><path fill={color} d="M12 1.5l3 6.6 7.2.8-5.4 4.9 1.5 7.1L12 17.2 5.7 20.9l1.5-7.1L1.8 8.9 9 8.1z" /></svg>;
    case 'circle':
      return <svg {...common}><circle cx="12" cy="12" r="10" fill={color} /></svg>;
    case 'ring':
      return <svg {...common}><circle cx="12" cy="12" r="8.5" fill="none" stroke={color} strokeWidth="4" /></svg>;
    case 'triangle':
      return <svg {...common}><path fill={color} d="M12 3l10 17H2z" strokeLinejoin="round" stroke={color} strokeWidth="2" /></svg>;
    case 'plus':
      return <svg {...common}><path d="M12 3v18M3 12h18" stroke={color} strokeWidth="5" strokeLinecap="round" /></svg>;
    case 'squiggle':
      return <svg viewBox="0 0 48 14" className="w-full h-full block" aria-hidden="true" focusable="false"><path d="M2 7c4-8 8 8 12 0s8 8 12 0 8 8 12 0 6 4 8 0" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" /></svg>;
    case 'heart':
      return <svg {...common}><path fill={color} d="M12 21s-8.5-5.2-8.5-11A4.8 4.8 0 0 1 12 7.2 4.8 4.8 0 0 1 20.5 10c0 5.8-8.5 11-8.5 11z" /></svg>;
    default:
      return null;
  }
}

const C = { coral: '#FF7A59', sun: '#FFD166', sky: '#4CC9F0', pink: '#FF8FB8', lime: '#9BE564', violet: '#A78BFA' };

// x / y are percentages of the container, s is the size in px, r the starting rotation, d the animation delay
const BANNER = [
  { k: 'star', x: 70, y: 9, s: 34, c: C.sun, a: 'kids-twinkle', r: 12, d: 0 },
  { k: 'star', x: 90, y: 30, s: 22, c: C.pink, a: 'kids-twinkle', r: -10, d: 0.9 },
  { k: 'star', x: 54, y: 24, s: 15, c: C.lime, a: 'kids-twinkle', r: 20, d: 1.6 },
  { k: 'circle', x: 82, y: 58, s: 44, c: C.sky, a: 'kids-float', r: 0, d: 0.4 },
  { k: 'ring', x: 4, y: 10, s: 38, c: C.sun, a: 'kids-float', r: 0, d: 1.2 },
  { k: 'squiggle', x: 60, y: 74, s: 96, c: C.coral, a: 'kids-float', r: -6, d: 0.2 },
  { k: 'triangle', x: 93, y: 78, s: 28, c: C.lime, a: 'kids-float', r: 15, d: 2 },
  { k: 'plus', x: 44, y: 8, s: 20, c: C.sky, a: 'kids-twinkle', r: 0, d: 0.5 },
  { k: 'heart', x: 3, y: 60, s: 24, c: C.pink, a: 'kids-float', r: -12, d: 1 },
];

const PAGE = [
  { k: 'star', x: 6, y: 12, s: 34, c: C.sun, a: 'kids-twinkle', r: 10, d: 0 },
  { k: 'circle', x: 92, y: 18, s: 54, c: C.sky, a: 'kids-float', r: 0, d: 0.6 },
  { k: 'squiggle', x: 80, y: 44, s: 110, c: C.pink, a: 'kids-float', r: -8, d: 0.3 },
  { k: 'ring', x: 3, y: 48, s: 46, c: C.lime, a: 'kids-float', r: 0, d: 1.4 },
  { k: 'triangle', x: 90, y: 74, s: 36, c: C.coral, a: 'kids-float', r: 14, d: 0.9 },
  { k: 'star', x: 14, y: 82, s: 26, c: C.pink, a: 'kids-twinkle', r: -14, d: 1.8 },
  { k: 'plus', x: 48, y: 90, s: 24, c: C.sun, a: 'kids-twinkle', r: 0, d: 0.7 },
  { k: 'heart', x: 66, y: 8, s: 26, c: C.coral, a: 'kids-float', r: -10, d: 2.2 },
];

function Shapes({ list, opacity = 1 }) {
  return list.map((s, i) => (
    <span key={i} aria-hidden="true" className={`absolute ${s.a}`}
      style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.k === 'squiggle' ? s.s * 0.3 : s.s, opacity, animationDelay: `${s.d}s`, '--r': `${s.r}deg`, transform: `rotate(${s.r}deg)` }}>
      <Shape kind={s.k} color={s.c} />
    </span>
  ));
}

/** Shapes drawn on top of the chapter banner (parent must be `relative overflow-hidden`). */
export function KidsBannerShapes() {
  return <div aria-hidden="true" className="absolute inset-0 pointer-events-none"><Shapes list={BANNER} opacity={0.9} /></div>;
}

/** Soft, fixed background for kids pages: coloured glows + faint floating shapes that stay behind the content. */
export function KidsBackdrop() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
      style={{
        background: 'radial-gradient(circle at 12% 8%, rgba(255,122,89,.20), transparent 38%), radial-gradient(circle at 92% 14%, rgba(76,201,240,.18), transparent 36%), radial-gradient(circle at 80% 92%, rgba(255,143,184,.18), transparent 40%), radial-gradient(circle at 8% 90%, rgba(155,229,100,.12), transparent 34%)',
      }}>
      <Shapes list={PAGE} opacity={0.22} />
    </div>
  );
}
