/** Brand palette taken from the "Becoming an Artist" logo.
 *  Every colour is a CSS variable (RGB channels) so a whole screen can be re-themed by adding a class —
 *  see `.theme-kids` in src/index.css (Young Artists Club). Opacity modifiers like bg-ink/60 still work. */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: v('ink'), deep: v('ink-deep'), panel: v('ink-panel'), field: v('ink') },
        line: { DEFAULT: v('line'), strong: v('line-strong') },
        teal: { DEFAULT: v('teal'), dark: v('teal-dark'), active: v('teal-active'), soft: v('teal-soft') },
        mint: { DEFAULT: v('mint'), pale: v('mint-pale') },
        muted: { DEFAULT: v('muted'), soft: v('muted-soft'), dim: v('muted-dim') },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Ethiopic"', 'Nyala', 'system-ui', 'sans-serif'],
        script: ['"Great Vibes"', 'cursive'],
        kids: ['Fredoka', '"Noto Sans Ethiopic"', 'Nyala', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
