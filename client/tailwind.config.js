/** Brand palette taken from the "Becoming an Artist" logo */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#111B1A', deep: '#0D1514', panel: '#16221F', field: '#111B1A' },
        line: { DEFAULT: '#243431', strong: '#2C3F3B' },
        teal: { DEFAULT: '#1FA69B', dark: '#168078', active: '#16302D', soft: '#7FE3D9' },
        mint: { DEFAULT: '#BFF5F0', pale: '#DFFBF8' },
        muted: { DEFAULT: '#9DB3AF', soft: '#B9CCC9', dim: '#8AA29E' },
      },
      fontFamily: {
        sans: ['Inter', '"Noto Sans Ethiopic"', 'Nyala', 'system-ui', 'sans-serif'],
        script: ['"Great Vibes"', 'cursive'],
      },
    },
  },
  plugins: [],
};
